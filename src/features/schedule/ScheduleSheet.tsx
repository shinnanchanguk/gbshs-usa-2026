import { useEffect, useRef, useState } from 'react'
import { rich } from '../../components/Rich'
import { chapters, type Page } from '../../content'
import { Icon, KIND_ICON } from '../../components/Icon'
import { Sheet } from '../../components/Sheet'
import { timeText } from '../page/parts'

/** 전체 일정표. 일차를 누르면 펼쳐지고, 줄을 누르면 그 장으로 간다. 지금 보는 장과 실제 지금 장을 표시한다. */
export function ScheduleSheet({ current, nowKey, onJump, onClose }: { current: Page; nowKey: string | null; onJump: (key: string) => void; onClose: () => void }) {
  const [open, setOpen] = useState<number>(current.chapter.n)
  const listRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    listRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'center' })
  }, [])

  return (
    <Sheet title="전체 일정" onClose={onClose}>
      <ol className="sched" ref={listRef}>
        {chapters.map((c) => {
          const isOpen = open === c.n
          return (
            <li key={c.n} className="sched__chapter" data-open={isOpen || undefined} data-current={c === current.chapter || undefined}>
              <button type="button" className="sched__head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : c.n)}>
                <span className="sched__label">{c.label}</span>
                <span className="sched__date mono">{c.day.date ? `${c.day.date.slice(5).replace('-', '/')} ${c.day.weekday}` : ''}</span>
                <span className="sched__title">{rich(c.day.title)}</span>
                <Icon name="chevronDown" size="1rem" />
              </button>
              {isOpen ? (
                <ol className="sched__pages">
                  {c.pages.map((p) => {
                    const here = p.key === current.key
                    return (
                      <li key={p.key}>
                        <button type="button" className="sched__row" aria-current={here ? 'page' : undefined} data-now={p.key === nowKey || undefined} onClick={() => onJump(p.key)}>
                          <span className="sched__time mono">{p.type === 'slide' ? (p.slide.time?.start ?? '') : ''}</span>
                          <span className="sched__icon" aria-hidden="true">
                            <Icon name={p.type === 'day' ? 'calendar' : (KIND_ICON[p.slide.kind] ?? 'info')} size="0.95rem" />
                          </span>
                          <span className="sched__name">
                            {p.type === 'day' ? '하루 한눈에 보기' : rich(p.slide.title)}
                            {p.type === 'slide' && p.slide.optional ? <span className="tag tag--quiet">선택</span> : null}
                            {p.key === nowKey ? <span className="tag tag--live">지금</span> : null}
                          </span>
                          <span className="sched__stay mono">{p.type === 'slide' ? (timeText(p).stay ?? '') : ''}</span>
                        </button>
                      </li>
                    )
                  })}
                </ol>
              ) : null}
            </li>
          )
        })}
      </ol>
    </Sheet>
  )
}
