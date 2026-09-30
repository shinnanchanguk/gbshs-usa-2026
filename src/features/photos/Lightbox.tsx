import { useEffect, useRef, useState } from 'react'
import { rich } from '../../components/Rich'
import { createPortal } from 'react-dom'
import { photoUrl, videoUrl, type PhotoRef } from '../../content'
import { Icon } from '../../components/Icon'

/** 사진 크게 보기. 옆으로 밀거나 ←/→ 로 넘기고 Esc·닫기로 닫는다. 화면 전체를 덮어 장 넘기기와 겹치지 않는다. */
export function Lightbox({ photos, start, onClose }: { photos: PhotoRef[]; start: number; onClose: () => void }) {
  const [i, setI] = useState(start)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const p = photos[i]

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation()
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setI((v) => Math.min(photos.length - 1, v + 1))
      if (e.key === 'ArrowLeft') setI((v) => Math.max(0, v - 1))
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      opener?.focus?.()
    }
  }, [photos.length, onClose])

  const video = videoUrl(p.id)
  return createPortal(
    <div
      className="lightbox"
      data-noswipe
      role="dialog"
      aria-modal="true"
      aria-label="사진 크게 보기"
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        const t = touch.current
        touch.current = null
        if (!t) return
        const dx = e.changedTouches[0].clientX - t.x
        const dy = e.changedTouches[0].clientY - t.y
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) setI((v) => (dx < 0 ? Math.min(photos.length - 1, v + 1) : Math.max(0, v - 1)))
        else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) onClose()
      }}
    >
      <div className="lightbox__top">
        <span className="mono">
          {i + 1} / {photos.length}
        </span>
        <button ref={closeRef} type="button" className="icon-btn icon-btn--dark" onClick={onClose} aria-label="닫기">
          <Icon name="close" />
        </button>
      </div>
      <div className="lightbox__stage">
        {video ? (
          <video key={p.id} src={video} poster={photoUrl(p.id) ?? undefined} controls playsInline preload="metadata" />
        ) : (
          <img key={p.id} src={photoUrl(p.id) ?? ''} alt={p.caption} />
        )}
      </div>
      <div className="lightbox__bottom">
        <button type="button" className="icon-btn icon-btn--dark" onClick={() => setI((v) => Math.max(0, v - 1))} disabled={i === 0} aria-label="이전 사진">
          <Icon name="chevronLeft" />
        </button>
        <p className="lightbox__caption">{rich(p.caption)}</p>
        <button type="button" className="icon-btn icon-btn--dark" onClick={() => setI((v) => Math.min(photos.length - 1, v + 1))} disabled={i === photos.length - 1} aria-label="다음 사진">
          <Icon name="chevronRight" />
        </button>
      </div>
    </div>,
    document.body,
  )
}
