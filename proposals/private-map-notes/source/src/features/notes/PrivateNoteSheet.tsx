import { useId, useState } from 'react'
import { Sheet } from '../../components/Sheet'
import { Icon } from '../../components/Icon'
import { pageByKey } from '../../content'
import { PRIVATE_NOTE_MAX, type PrivateNote } from '../../lib/privateNoteModel'

export default function PrivateNoteSheet({ pageKeys, initial, book, save, failed, onClose }: {
  pageKeys: string[]; initial: string; book: ReadonlyMap<string, PrivateNote>
  save: (key: string, text: string | null) => boolean; failed: (key: string) => boolean; onClose: () => void
}) {
  const [key, setKey] = useState(initial)
  const id = useId()
  const page = pageByKey.get(key)
  if (!page) return null
  const note = book.get(key)
  const title = page.type === 'slide' ? page.slide.title : page.day.title
  const place = page.type === 'slide' ? page.slide.place?.name : undefined
  const error = failed(key)
  return <Sheet title="내 메모" onClose={onClose}>
    <div className="private-note-paper">
      <p className="private-note-kicker">{page.chapter.label}{place ? ` · ${place}` : ''}</p>
      <h3 className="private-note-title">{title}</h3>
      {pageKeys.length > 1 ? <label className="private-note-select">같은 장소의 메모
        <select value={key} onChange={(e) => setKey(e.target.value)} aria-label="메모 일정 선택">
          {pageKeys.map((k) => { const p = pageByKey.get(k); return p ? <option key={k} value={k}>{p.type === 'slide' ? p.slide.title : p.day.title}</option> : null })}
        </select>
      </label> : null}
      <label className="private-note-label" htmlFor={id}>개인 메모</label>
      <textarea id={id} className="private-note-input" value={note?.text ?? ''} maxLength={PRIVATE_NOTE_MAX} rows={7} placeholder="기억할 것, 물어볼 것, 다시 찾아볼 내용을 짧게 적어요." aria-describedby={`${id}-hint`} onChange={(e) => save(key, e.target.value)} />
      <div className="private-note-footer">
        <span className="mono" aria-hidden="true">{note?.text.length ?? 0} / {PRIVATE_NOTE_MAX}</span>
        <button type="button" className="private-note-delete" disabled={!note} onClick={() => { if (window.confirm('이 일정의 개인 메모를 지울까요?')) save(key, null) }}><Icon name="trash" size="1rem" />메모 지우기</button>
      </div>
      <p className="private-note-status" data-error={error || undefined} role={error ? 'alert' : 'status'}>
        {error ? '기기에 저장하지 못했어요. 새로고침하거나 창을 닫으면 변경 내용이 사라질 수 있어요. 저장 공간과 브라우저 설정을 확인해 주세요.' : note ? '이 기기에 자동 저장했어요.' : '입력하면 이 기기에 자동 저장돼요.'}
      </p>
      <p className="private-note-hint" id={`${id}-hint`}>최대 {PRIVATE_NOTE_MAX}자. 게시판·보호자·교사 화면에는 공유되지 않아요. 다른 기기에는 동기화되지 않으니 중요한 개인정보는 적지 마세요.</p>
    </div>
  </Sheet>
}
