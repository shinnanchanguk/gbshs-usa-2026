import { useEffect, useRef, useState } from 'react'
import { photoUrl, videoUrl, type PhotoRef } from '../../content'
import { IconChevronLeft, IconChevronRight, IconClose } from '../../components/Icon'

/** 사진 크게 보기. 좌우 화살표·스와이프로 넘기고 Esc 로 닫는다. */
export function PhotoLightbox({ photos, start, onClose }: { photos: PhotoRef[]; start: number; onClose: () => void }) {
  const [i, setI] = useState(start)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const photo = photos[i]
  const count = photos.length
  const go = (d: number) => setI((v) => (v + d + count) % count)
  // 부모가 매번 새 함수를 넘겨도 키 처리기를 다시 달지 않도록 최신 onClose 를 ref 에 둔다.
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const step = (d: number) => setI((v) => (v + d + count) % count)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current()
      else if (e.key === 'ArrowLeft') step(-1)
      else if (e.key === 'ArrowRight') step(1)
      else return
      e.stopPropagation()
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey, true)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey, true)
      document.body.style.overflow = prev
    }
  }, [count])

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="사진 크게 보기"
      onClick={onClose}
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        const t = touch.current
        touch.current = null
        if (!t) return
        const dx = e.changedTouches[0].clientX - t.x
        const dy = e.changedTouches[0].clientY - t.y
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1)
      }}
    >
      <figure className="lightbox__figure" onClick={(e) => e.stopPropagation()}>
        {videoUrl(photo.id) ? (
          <video key={photo.id} src={videoUrl(photo.id) ?? ''} poster={photoUrl(photo.id) ?? undefined} controls playsInline preload="metadata" />
        ) : (
          <img src={photoUrl(photo.id) ?? ''} alt={photo.caption} />
        )}
        <figcaption>
          <span className="lightbox__count">
            {i + 1} / {photos.length}
          </span>
          {photo.caption}
        </figcaption>
      </figure>
      <button type="button" className="lightbox__btn lightbox__close" onClick={onClose} aria-label="닫기">
        <IconClose />
      </button>
      {photos.length > 1 && (
        <>
          <button type="button" className="lightbox__btn lightbox__prev" onClick={(e) => (e.stopPropagation(), go(-1))} aria-label="이전 사진">
            <IconChevronLeft />
          </button>
          <button type="button" className="lightbox__btn lightbox__next" onClick={(e) => (e.stopPropagation(), go(1))} aria-label="다음 사진">
            <IconChevronRight />
          </button>
        </>
      )}
    </div>
  )
}
