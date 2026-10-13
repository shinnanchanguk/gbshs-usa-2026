import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useApp } from '../../app/context'
import { pageByKey } from '../../content'
import { GUIDE } from '../../lib/edition'
import { privateNoteOwner, type PrivateNote } from '../../lib/privateNoteModel'
import { usePrivateNotes } from '../../lib/repo'
import { useZudoSession } from '../../lib/zudo'
import PrivateNoteSheet from './PrivateNoteSheet'
import './notes.css'

type NotesState = {
  enabled: boolean
  book: ReadonlyMap<string, PrivateNote>
  open: (pageKeys: string | string[], preferred?: string, trigger?: HTMLElement) => void
}
const NotesContext = createContext<NotesState>({ enabled: false, book: new Map(), open: () => undefined })
export const usePersonalNotes = () => useContext(NotesContext)

export function PrivateNotesProvider({ children }: { children: ReactNode }) {
  if (GUIDE) return <>{children}</>
  return <ParticipantNotesProvider>{children}</ParticipantNotesProvider>
}

function ParticipantNotesProvider({ children }: { children: ReactNode }) {
  const { profile } = useApp()
  const session = useZudoSession()
  const owner = !GUIDE && profile?.fromZudo && profile.role !== 'parent' ? privateNoteOwner(session) : null
  const { book, save, failed } = usePrivateNotes(owner)
  const [selection, setSelection] = useState<{ owner: string; keys: string[]; initial: string } | null>(null)
  const opener = useRef<HTMLElement | null>(null)
  useEffect(() => { setSelection((current) => current?.owner === owner ? current : null) }, [owner])
  const state = useMemo<NotesState>(() => ({
    enabled: !!owner,
    book,
    open(pageKeys, preferred, trigger) {
      if (!owner) return
      const keys = [...new Set(typeof pageKeys === 'string' ? [pageKeys] : pageKeys)].filter((key) => pageByKey.has(key))
      if (keys.length) {
        opener.current = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null)
        setSelection({ owner, keys, initial: preferred && keys.includes(preferred) ? preferred : keys[0] })
      }
    },
  }), [owner, book])
  // 계정이 바뀌거나 로그아웃하면 이전 계정의 열린 창을 즉시 가린다.
  const active = selection?.owner === owner && owner ? selection : null
  return <NotesContext.Provider value={state}>
    {children}
    {active ? <PrivateNoteSheet key={JSON.stringify([active.owner, active.keys])} pageKeys={active.keys} initial={active.initial} book={book} save={save} failed={failed} onClose={() => {
        setSelection(null)
        window.requestAnimationFrame(() => {
          if (opener.current?.isConnected) opener.current.focus()
          else document.querySelector<HTMLElement>('[data-slot="0"] .private-note-entry')?.focus()
        })
      }} /> : null}
  </NotesContext.Provider>
}
