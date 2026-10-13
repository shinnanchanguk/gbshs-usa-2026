import { test } from 'node:test'
import assert from 'node:assert/strict'
import { changePrivateNote, notesForOwner, parsePrivateNoteBook, privateNoteOwner, privateNotePins, PRIVATE_NOTE_MAX, validNotePageKey } from '../src/lib/privateNoteModel.ts'

const at = Date.parse('2026-10-13T00:00:00Z')
const session = (extra = {}) => ({ token: 'fixture-token', me: { role: 'student', name: '테스트 학생', studentNumber: '1101', expiresAt: '2026-10-25T00:00:00Z', ...extra } })
const edit = (raw, owner, key, text) => changePrivateNote(raw, owner, key, text, '2026-10-13T00:00:00Z')

test('계정 구분: 학생 학번은 안정적이고 보호자·미로그인·만료·빈 인증은 메모를 읽지 못한다', () => {
  assert.equal(privateNoteOwner(session(), at), 'student:1101')
  assert.equal(privateNoteOwner(session({ name: '바뀐 표시 이름' }), at), 'student:1101')
  assert.equal(privateNoteOwner(session({ role: 'parent', children: ['1101'] }), at), null)
  assert.equal(privateNoteOwner(null, at), null)
  assert.equal(privateNoteOwner({ ...session(), token: '' }, at), null)
  for (const expiresAt of ['', 'invalid', '2026-10-12T00:00:00Z']) assert.equal(privateNoteOwner(session({ expiresAt }), at), null)
  assert.equal(privateNoteOwner(session({ studentNumber: '' }), at), null)
  assert.equal(privateNoteOwner(session({ role: 'teacher', name: '테스트 교사' }), at), 'teacher:테스트 교사')
})

test('일정 ID별 저장·수정·삭제가 다른 계정이나 같은 장소의 다른 일정을 바꾸지 않는다', () => {
  let raw = edit(null, 'student:1101', 'd3-mit-lecture-qa', '질문을 적어요.')
  raw = edit(raw, 'student:1314', 'd3-mit-lecture-qa', '다른 계정 메모')
  raw = edit(raw, 'student:1101', 'd3-mit-campus-mentoring', '멘토에게 물어볼 것')
  raw = edit(raw, 'student:1101', 'd3-mit-lecture-qa', '수정한 메모')
  assert.equal(notesForOwner(raw, 'student:1101').get('d3-mit-lecture-qa').text, '수정한 메모')
  assert.equal(notesForOwner(raw, 'student:1314').size, 1)
  raw = edit(raw, 'student:1101', 'd3-mit-lecture-qa', null)
  assert.equal(notesForOwner(raw, 'student:1101').size, 1)
  assert.equal(notesForOwner(raw, 'student:1314').get('d3-mit-lecture-qa').text, '다른 계정 메모')
  assert.equal(notesForOwner(raw, null).size, 0)
})

test('장소 없는 일정과 일차 메모, 공백·줄바꿈, 글자 수 한도를 보존한다', () => {
  let raw = edit(null, 'student:1101', 'd8-flight-ke086', '  첫 줄\n둘째 줄  ')
  raw = edit(raw, 'student:1101', 'day-8', '나'.repeat(PRIVATE_NOTE_MAX + 10))
  const book = notesForOwner(raw, 'student:1101')
  assert.equal(book.get('d8-flight-ke086').text, '  첫 줄\n둘째 줄  ')
  assert.equal(book.get('day-8').text.length, PRIVATE_NOTE_MAX)
  assert.equal(notesForOwner(edit(raw, 'student:1101', 'day-8', ''), 'student:1101').has('day-8'), false)
})

test('깨진 저장값·중복·프로토타입 키·잘못된 날짜가 화면이나 저장 규칙을 깨뜨리지 않는다', () => {
  for (const raw of [null, [], {}, { version: 2, entries: [] }, { version: 1, entries: [null, {}, 'bad'] }]) assert.equal(parsePrivateNoteBook(raw).entries.length, 0)
  for (const key of ['__proto__', 'constructor', 'day-1|other', 'not-a-page']) assert.equal(validNotePageKey(key), false)
  assert.equal(edit(null, 'student:1101', '__proto__', 'bad').entries.length, 0)
  assert.equal(edit(null, 'parent:1101', 'day-1', 'bad').entries.length, 0)
  const note = edit(null, 'student:1101', 'day-1', '<img src=x onerror=alert(1)>').entries[0]
  assert.equal(parsePrivateNoteBook({ version: 1, entries: [note, note, { ...note, pageKey: 'day-2', updatedAt: 'invalid' }] }).entries.length, 1)
})

test('지도 마커는 같은 일차·좌표만 묶고 같은 좌표의 다른 날·장소 없는 메모는 합치지 않는다', () => {
  const place = { name: '테스트 장소', coords: [-71, 42] }
  const rows = [
    { key: 'd3-first', day: 3, title: '첫 일정', place },
    { key: 'd3-second', day: 3, title: '둘째 일정', place },
    { key: 'd4-again', day: 4, title: '다음 날', place },
    { key: 'd3-flight', day: 3, title: '장소 없음' },
    { key: 'd3-invalid', day: 3, title: '잘못된 좌표', place: { ...place, coords: [NaN, 42] } },
  ]
  const pins = privateNotePins(rows, new Set(rows.map((p) => p.key)), 3)
  assert.equal(pins.length, 1)
  assert.deepEqual(pins[0].pageKeys, ['d3-first', 'd3-second'])
  assert.equal(privateNotePins(rows, new Set(['d3-second']), 3)[0].pageKeys[0], 'd3-second')
  assert.equal(privateNotePins(rows, new Set(), 3).length, 0)
})
