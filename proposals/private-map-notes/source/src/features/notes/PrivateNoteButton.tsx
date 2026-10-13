import { Icon } from '../../components/Icon'
import { usePersonalNotes } from './NoteContext'

export function PrivateNoteButton({ pageKey }: { pageKey: string }) {
  const { enabled, book, open } = usePersonalNotes()
  if (!enabled) return null
  const exists = book.has(pageKey)
  return <button type="button" className="private-note-entry" data-has-note={exists || undefined} onClick={(e) => open(pageKey, pageKey, e.currentTarget)} aria-label={exists ? '내 메모 열기' : '개인 메모 남기기'}>
    <Icon name="note" size="1.1rem" />
    <span>{exists ? '내 메모' : '메모 남기기'}</span>
    <span className="private-note-entry__hint">공유하지 않는 개인 메모</span>
    <Icon name="chevronRight" size="0.9rem" />
  </button>
}
