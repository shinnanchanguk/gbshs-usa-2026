import { dayDateLabel, dayLabel, days, type DeckSlide } from '../content'
import { slideHref, type Route } from '../lib/router'
import { writeStored } from '../lib/storage'
import { isComplete, useAttendance, useFeedback, type Profile } from './state'
import { profileLabel } from '../features/role/RolePicker'
import { IconCheck, IconLock, IconMap, IconMessage, IconPen, IconUsers } from '../components/Icon'

/**
 * 일정 사이드 패널. 데스크톱에서는 왼쪽에 늘 떠 있고, 좁은 화면에서는 서랍(drawer)으로 연다.
 * 지금 보고 있는 일차는 펼쳐서 그날 슬라이드 시간표를 보여 준다.
 */
export function Sidebar({
  current,
  route,
  profile,
  onNavigate,
  onRole,
}: {
  current: DeckSlide | null
  route: Route
  profile: Profile
  onNavigate?: () => void
  onRole: () => void
}) {
  const { book } = useAttendance()
  const { items } = useFeedback()
  const teacher = profile.role === 'teacher'

  return (
    <>
      <div className="sidebar__top">
        <a className="sidebar__brand-block" href={slideHref(days[0].slides[0].id)} onClick={onNavigate}>
          <span className="sidebar__brand">USA 2026</span>
          <span className="sidebar__tagline">미국 진로체험학습 안내</span>
        </a>
      </div>
      <nav className="sidebar__list" aria-label="일정">
        {days.map((day) => {
          const active = route.name === 'slide' && current?.day.n === day.n
          const checkable = day.slides.filter((s) => s.attendance)
          const doneCount = teacher ? checkable.filter((s) => isComplete(book, s.id, profile.classNo)).length : 0
          return (
            <div key={day.n} className="day">
              <a className="sidebar__item day__item" data-active={active} aria-current={active ? 'true' : undefined} href={slideHref(day.slides[0].id)} onClick={onNavigate}>
                <span className="day__n" aria-hidden="true">
                  {day.n === 0 ? <IconMap size="1rem" /> : day.n}
                </span>
                <span className="day__text">
                  {day.n > 0 && (
                    <span className="day__label">
                      {dayLabel(day)} {dayDateLabel(day)}
                    </span>
                  )}
                  <span className="day__title">{day.title}</span>
                </span>
                {teacher && checkable.length > 0 && (
                  <span className="day__att" data-done={doneCount === checkable.length} title={`${profile.classNo}반 출석 완료 장소`}>
                    {doneCount}/{checkable.length}
                  </span>
                )}
              </a>
              {active && (
                <ol className="day__slides">
                  {day.slides.map((s) => (
                    <li key={s.id}>
                      <a className="day__slide" data-active={s.id === current?.id} aria-current={s.id === current?.id ? 'page' : undefined} href={slideHref(s.id)} onClick={onNavigate}>
                        <span className="day__time">{s.time?.start ?? ''}</span>
                        <span className="day__slide-title">{s.title}</span>
                        {teacher && s.attendance && isComplete(book, s.id, profile.classNo) && <IconCheck size="0.9rem" className="day__check" />}
                      </a>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )
        })}
      </nav>
      <div className="sidebar__bottom">
        {teacher ? (
          <a className="sidebar__item" href="#/feedback" data-active={route.name === 'feedback'} onClick={onNavigate}>
            <IconMessage size="1.1rem" />
            <span className="sidebar__item-text">피드백 모아보기</span>
            {items.length > 0 && <span className="sidebar__count">{items.length}</span>}
          </a>
        ) : (
          <a className="sidebar__item" href="#/reflections" data-active={route.name === 'reflections'} onClick={onNavigate}>
            <IconPen size="1.1rem" />
            <span className="sidebar__item-text">내 소감 모아보기</span>
          </a>
        )}
        <button type="button" className="sidebar__item" onClick={onRole}>
          <IconUsers size="1.1rem" />
          <span className="sidebar__item-text">{profileLabel(profile)}</span>
        </button>
        <button type="button" className="sidebar__item" onClick={() => writeStored('unlock', null)}>
          <IconLock size="1.1rem" />
          <span className="sidebar__item-text">잠그기</span>
        </button>
      </div>
    </>
  )
}
