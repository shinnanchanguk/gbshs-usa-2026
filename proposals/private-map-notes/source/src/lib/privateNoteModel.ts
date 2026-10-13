/** 개인 메모의 순수 데이터 규칙. 일정 ID만 저장하고 지도 좌표·공개 제출물과 섞지 않는다. */
export const PRIVATE_NOTE_MAX = 1000
export type PrivateNote = { owner: string; pageKey: string; text: string; updatedAt: string }
export type PrivateNoteBook = { version: 1; entries: PrivateNote[] }

type NoteSession = { token: string; me: { role: string; name: string; studentNumber?: string; expiresAt: string } }

/** 기기 저장용 구분자다. 서버 권한 검증이나 암호화를 대신하지 않는다. */
export function privateNoteOwner(session: NoteSession | null, at = Date.now()): string | null {
  if (!session?.token.trim()) return null
  const until = Date.parse(session.me.expiresAt)
  if (!Number.isFinite(until) || until <= at) return null
  if (session.me.role === 'student' && /^\d{4,12}$/.test(session.me.studentNumber ?? '')) return `student:${session.me.studentNumber}`
  const name = session.me.name.trim().normalize('NFC')
  if (session.me.role === 'teacher' && name && name.length <= 100 && !/[\u0000-\u001f]/.test(name)) return `teacher:${name}`
  return null
}

export const validNotePageKey = (key: string) => key.length <= 128 && /^(?:d\d{1,2}-[a-z0-9-]+|day-\d{1,2})$/.test(key)
const validOwner = (owner: string) => /^student:\d{4,12}$/.test(owner) || /^teacher:[^\u0000-\u001f]{1,100}$/.test(owner)

export function parsePrivateNoteBook(raw: unknown): PrivateNoteBook {
  const empty: PrivateNoteBook = { version: 1, entries: [] }
  if (!raw || typeof raw !== 'object') return empty
  const book = raw as Record<string, unknown>
  if (book.version !== 1 || !Array.isArray(book.entries)) return empty
  const entries: PrivateNote[] = []
  const seen = new Set<string>()
  for (const value of book.entries) {
    if (!value || typeof value !== 'object') continue
    const note = value as Record<string, unknown>
    if (typeof note.owner !== 'string' || !validOwner(note.owner) || typeof note.pageKey !== 'string' || !validNotePageKey(note.pageKey)) continue
    if (typeof note.text !== 'string' || !note.text.length || typeof note.updatedAt !== 'string' || !Number.isFinite(Date.parse(note.updatedAt))) continue
    const key = JSON.stringify([note.owner, note.pageKey])
    if (seen.has(key)) continue
    seen.add(key)
    entries.push({ owner: note.owner, pageKey: note.pageKey, text: note.text.slice(0, PRIVATE_NOTE_MAX), updatedAt: note.updatedAt })
  }
  return { version: 1, entries }
}

export function notesForOwner(raw: unknown, owner: string | null): Map<string, PrivateNote> {
  return new Map(owner ? parsePrivateNoteBook(raw).entries.filter((note) => note.owner === owner).map((note) => [note.pageKey, note]) : [])
}

export function changePrivateNote(raw: unknown, owner: string, pageKey: string, text: string | null, at = new Date().toISOString()): PrivateNoteBook {
  const book = parsePrivateNoteBook(raw)
  if (!validOwner(owner) || !validNotePageKey(pageKey) || !Number.isFinite(Date.parse(at))) return book
  const entries = book.entries.filter((note) => note.owner !== owner || note.pageKey !== pageKey)
  if (text?.length) entries.push({ owner, pageKey, text: text.slice(0, PRIVATE_NOTE_MAX), updatedAt: at })
  return { version: 1, entries }
}

export type NotePlace = { key: string; day: number; title: string; place?: { name: string; coords: [number, number] } }
export type NotePin = { label: string; coords: [number, number]; pageKeys: string[] }

/** 좌표가 같아도 저장은 일정별이다. 지도 표시만 같은 일차·좌표끼리 합친다. */
export function privateNotePins(places: NotePlace[], keys: ReadonlySet<string>, day: number): NotePin[] {
  const pins = new Map<string, NotePin>()
  for (const page of places) {
    if (page.day !== day || !page.place || !keys.has(page.key)) continue
    const { coords, name } = page.place
    if (coords.length !== 2 || !coords.every(Number.isFinite) || Math.abs(coords[0]) > 180 || Math.abs(coords[1]) > 90) continue
    const id = JSON.stringify([day, ...coords])
    const pin = pins.get(id) ?? { label: name, coords, pageKeys: [] }
    pin.pageKeys.push(page.key)
    pins.set(id, pin)
  }
  return [...pins.values()]
}
