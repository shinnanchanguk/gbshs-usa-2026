import { useEffect, useState } from 'react'
import { trip, type DeckSlide } from '../../content'
import { classSize, isComplete, presentList, useAttendance } from '../../app/state'
import { IconCheck, IconUsers } from '../../components/Icon'

/**
 * 담임 출석판. 번호를 누를 때마다 출석/미출석이 바뀌고, 반 전원이 체크되면 "출석 완료"가 된다.
 * 완료 표시는 지도 핀 아래 점과 사이드바에 바로 나타난다.
 */
export function AttendancePanel({ slide, defaultClass }: { slide: DeckSlide; defaultClass: number }) {
  const { book, toggle, setAll } = useAttendance()
  const [classNo, setClassNo] = useState(defaultClass)
  useEffect(() => setClassNo(defaultClass), [defaultClass])

  const size = classSize(classNo)
  const present = presentList(book, slide.id, classNo)
  const done = present.length >= size

  return (
    <section className="pane attendance" aria-label="출석 체크">
      <p className="attendance__note">
        <IconUsers size="1rem" /> 번호를 누르면 출석, 한 번 더 누르면 취소돼요. 이 기기에만 저장돼요.
      </p>
      <div className="tabs" role="tablist" aria-label="반">
        {trip.classes.map((c) => (
          <button
            key={c.no}
            type="button"
            role="tab"
            className="tab"
            aria-selected={c.no === classNo}
            data-done={isComplete(book, slide.id, c.no)}
            onClick={() => setClassNo(c.no)}
          >
            {c.no}반{isComplete(book, slide.id, c.no) && <IconCheck size="0.9rem" />}
          </button>
        ))}
      </div>
      <div className="att-grid" role="group" aria-label={`${classNo}반 번호`}>
        {Array.from({ length: size }, (_, i) => i + 1).map((n) => {
          const on = present.includes(n)
          return (
            <button key={n} type="button" className="att-num" data-done={on} aria-pressed={on} onClick={() => toggle(slide.id, classNo, n)}>
              {n}
            </button>
          )
        })}
      </div>
      <div className="att-progress">
        <span className="att-progress__bar" aria-hidden="true">
          <i style={{ width: `${size ? (present.length / size) * 100 : 0}%` }} />
        </span>
        <span className="att-progress__count">
          {present.length}/{size}
        </span>
      </div>
      {done ? (
        <p className="notice notice--done att-done">
          <IconCheck size="1rem" /> {classNo}반 출석 완료
        </p>
      ) : (
        size - present.length <= 5 &&
        present.length > 0 && <p className="field__help">아직 안 온 번호: {Array.from({ length: size }, (_, i) => i + 1).filter((n) => !present.includes(n)).join(', ')}</p>
      )}
      <div className="att-actions">
        <button type="button" className="btn btn--ghost" onClick={() => setAll(slide.id, classNo, true)} disabled={done}>
          전원 출석
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => setAll(slide.id, classNo, false)} disabled={!present.length}>
          초기화
        </button>
      </div>
    </section>
  )
}
