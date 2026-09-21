import { useEffect, useRef } from 'react'
import type { DeckSlide } from '../../content'
import { slideHref } from '../../lib/router'

/** 좁은 화면에서 그날 일정을 한 줄로 쭉 보여 주는 시간표 (데스크톱은 사이드바가 같은 역할). */
export function DayTimeline({ current }: { current: DeckSlide }) {
  const activeRef = useRef<HTMLAnchorElement>(null)
  useEffect(() => {
    activeRef.current?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [current.id])

  return (
    <nav className="timeline" aria-label={`${current.day.n === 0 ? '공통 안내' : `${current.day.n}일차`} 일정`}>
      <ol>
        {current.day.slides.map((s) => {
          const active = s.id === current.id
          return (
            <li key={s.id}>
              <a ref={active ? activeRef : undefined} className="timeline__item" data-active={active} aria-current={active ? 'page' : undefined} href={slideHref(s.id)}>
                {s.time && <span className="timeline__time">{s.time.start}</span>}
                <span className="timeline__title">{s.title}</span>
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
