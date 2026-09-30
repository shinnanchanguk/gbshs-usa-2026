import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../components/Icon'
import type { Notice } from '../../lib/repo'
import { NoticeCard } from './NoticeCard'

/**
 * 학생 화면에 뜨는 공지 팝업. 여러 건이면 옆으로 밀거나 화살표로 넘긴다.
 * '다시 보지 않기'를 누른 공지는 이 휴대폰에서 다시 뜨지 않고, '닫기'만 누르면 다음에 사이트를 열 때 또 뜬다.
 * 선생님 미리 보기(preview)에서는 '다시 보지 않기'가 없다.
 */
export function NoticePopup({ items, onHide, onClose, preview = false }: { items: Notice[]; onHide: (n: Notice) => void; onClose: () => void; preview?: boolean }) {
  const [at, setAt] = useState(0)
  const i = Math.min(at, items.length - 1)
  const current = items[i]
  const many = items.length > 1
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const swipe = useRef<{ x: number; y: number } | null>(null)

  // 키보드 처리는 처음 한 번만 걸어 두므로, 건수는 늘 최신 값을 ref 로 읽는다
  const countRef = useRef(items.length)
  countRef.current = items.length
  const go = (d: number) =>
    setAt((v) => {
      const last = countRef.current - 1
      return Math.max(0, Math.min(last, Math.min(v, last) + d))
    })

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    // 팝업이 떠 있는 동안 ←/→ 는 공지 넘기기, Esc 는 닫기. 뒤의 장 넘기기로 새지 않게 먼저 받는다.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeRef.current()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.stopPropagation()
        go(e.key === 'ArrowRight' ? 1 : -1)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      opener?.focus?.()
    }
    // 열릴 때 한 번
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!current) return null
  const titleId = `notice-title-${current.id}`

  return (
    <div className="notice-pop" data-noswipe>
      <div ref={panelRef} className="notice-pop__panel" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <div className="notice-pop__head">
          <span className="notice-pop__kicker">
            <Icon name="megaphone" size="1.05rem" />
            {preview ? '공지 미리 보기' : '공지'}
          </span>
          {many ? (
            <span className="notice-pop__pager">
              <button type="button" className="icon-btn" onClick={() => go(-1)} disabled={i === 0} aria-label="앞 공지">
                <Icon name="chevronLeft" />
              </button>
              <span className="mono notice-pop__count" aria-live="polite">
                {i + 1} / {items.length}
              </span>
              <button type="button" className="icon-btn" onClick={() => go(1)} disabled={i === items.length - 1} aria-label="다음 공지">
                <Icon name="chevronRight" />
              </button>
            </span>
          ) : null}
        </div>

        <div
          className="notice-pop__body"
          onPointerDown={(e) => {
            swipe.current = { x: e.clientX, y: e.clientY }
          }}
          onPointerUp={(e) => {
            const s = swipe.current
            swipe.current = null
            if (!s || !many) return
            const dx = e.clientX - s.x
            if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(e.clientY - s.y) * 1.5) go(dx < 0 ? 1 : -1)
          }}
          onPointerCancel={() => (swipe.current = null)}
        >
          <NoticeCard notice={current} titleId={titleId} />
        </div>

        {many ? (
          <div className="notice-pop__dots" aria-hidden="true">
            {items.map((n, k) => (
              <span key={n.id} data-on={k === i || undefined} />
            ))}
          </div>
        ) : null}

        <div className="notice-pop__foot">
          {preview ? null : (
            <button type="button" className="btn btn--ghost" onClick={() => onHide(current)}>
              다시 보지 않기
            </button>
          )}
          <button type="button" className="btn btn--primary" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
