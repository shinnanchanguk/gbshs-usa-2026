import { useEffect, useRef, type ReactNode } from 'react'
import { IconClose } from './Icon'

/**
 * 버튼을 눌러야 뜨는 창 (galpi2 .sheet).
 * 넓은 화면에서는 가운데, 휴대폰에서는 아래에서 올라오는 시트로 뜬다. Esc·바깥 누르기로 닫힌다.
 */
export function Sheet({ title, onClose, children }: { title: ReactNode; onClose: () => void; children: ReactNode }) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
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
    }
  }, [])

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined} onClick={(e) => e.stopPropagation()}>
        <div className="sheet__head">
          <h2 className="sheet__title">{title}</h2>
          <button type="button" className="sheet__close" onClick={onClose} aria-label="닫기">
            <IconClose size="1.1rem" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
