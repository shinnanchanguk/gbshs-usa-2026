import { useEffect, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'

/**
 * 버튼을 눌러야 뜨는 창. 휴대폰에서는 아래에서 올라오는 시트, 넓은 화면에서는 오른쪽 패널.
 * Esc·바깥 누르기·닫기 단추로 닫힌다. 열리면 닫기 단추에 초점을 두고, 닫히면 연 단추로 돌아간다.
 */
export function Sheet({ title, onClose, children, wide = false }: { title: ReactNode; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    panelRef.current?.querySelector<HTMLElement>('.sheet__close')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeRef.current()
      }
    }
    window.addEventListener('keydown', onKey, true)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey, true)
      document.body.style.overflow = prev
      opener?.focus?.()
    }
  }, [])

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        ref={panelRef}
        className="sheet"
        data-wide={wide || undefined}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet__grip" aria-hidden="true" />
        <div className="sheet__head">
          <h2 className="sheet__title">{title}</h2>
          <button type="button" className="icon-btn sheet__close" onClick={onClose} aria-label="닫기">
            <Icon name="close" />
          </button>
        </div>
        <div className="sheet__body">{children}</div>
      </div>
    </div>
  )
}
