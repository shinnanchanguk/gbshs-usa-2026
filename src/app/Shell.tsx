import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { dayDateLabel, dayLabel, days, deck, slideById } from '../content'
import { goToSlide, parseHash, slideHref, useRoute } from '../lib/router'
import { useAttendance, type Profile } from './state'
import { Sidebar } from './Sidebar'
import { SlideView } from '../features/slides/SlideView'
import { FeedbackPage } from '../features/feedback/FeedbackPage'
import { ReflectionsPage } from '../features/reflection/ReflectionsPage'
import { RolePicker } from '../features/role/RolePicker'
import { DayTimeline } from '../features/slides/DayTimeline'
import type { SlidePanel } from '../features/slides/SlideActions'
import { AttendancePanel } from '../features/attendance/AttendancePanel'
import { FeedbackBox } from '../features/feedback/FeedbackBox'
import { ReflectionBox } from '../features/reflection/ReflectionBox'
import { Sheet } from '../components/Sheet'
import { IconChevronLeft, IconChevronRight, IconClose, IconMenu } from '../components/Icon'

// 지도 엔진(MapLibre)은 무거워서 입장 화면을 느리게 하지 않도록 따로 불러온다.
const TripMap = lazy(() => import('../features/map/TripMap').then((m) => ({ default: m.TripMap })))

/** 지금 주소의 슬라이드에서 delta 만큼 앞뒤로 간다 (화면이 다시 그려지기 전에 눌려도 정확하도록 주소를 기준으로). */
function step(delta: number) {
  const now = parseHash(window.location.hash)
  const at = now.name === 'slide' && now.slideId ? slideById.get(now.slideId) : undefined
  const target = at ? deck[at.index + delta] : undefined
  if (target) goToSlide(target.id)
  return !!target
}

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))

export function Shell({ profile }: { profile: Profile }) {
  const route = useRoute()
  const { book } = useAttendance()
  const [drawer, setDrawer] = useState(false)
  const [roleSheet, setRoleSheet] = useState(false)
  const [panel, setPanel] = useState<SlidePanel | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const requested = route.name === 'slide' && route.slideId ? slideById.get(route.slideId) : undefined
  const current = requested ?? (route.name === 'slide' ? deck[0] : null)
  const lastSlide = useRef(deck[0])
  if (current) lastSlide.current = current
  const mapSlide = current ?? lastSlide.current

  // 없는 슬라이드 주소로 들어오면 첫 슬라이드로 바꾼다.
  useEffect(() => {
    if (route.name === 'slide' && !requested) window.history.replaceState(null, '', slideHref(deck[0].id))
  }, [route, requested])

  // 슬라이드가 바뀌면 슬라이드 칸을 맨 위로, 열려 있던 창은 닫는다.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
    setPanel(null)
  }, [current?.id, route.name])

  // ← → 키로 넘기기 (입력 중일 때는 제외)
  // 키를 빠르게 연달아 눌러도 정확하도록 지금 위치는 step() 이 주소에서 읽는다.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (panel || isTyping(e.target) || e.altKey || e.metaKey || e.ctrlKey) return
      const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
      if (delta && step(delta)) e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [panel])

  const prev = current ? deck[current.index - 1] : undefined
  const next = current ? deck[current.index + 1] : undefined
  const dayNow = mapSlide.day

  return (
    <div className="shell" data-route={route.name}>
      <aside className="sidebar shell__sidebar">
        <Sidebar current={current} route={route} profile={profile} onRole={() => setRoleSheet(true)} />
      </aside>

      <div className="main">
        <header className="topbar">
          <button type="button" className="topbar__btn" onClick={() => setDrawer(true)} aria-label="일정 목록 열기">
            <IconMenu />
          </button>
          <div className="topbar__title">
            <span className="topbar__brand">USA 2026</span>
            <span className="topbar__day">
              {route.name === 'slide' ? `${dayLabel(dayNow)} ${dayDateLabel(dayNow)}` : route.name === 'feedback' ? '피드백 모아보기' : '내 소감 모아보기'}
            </span>
          </div>
        </header>

        {route.name === 'slide' && current && (
          <div className="mobile-nav">
            <nav className="daychips" aria-label="일차">
              {days.map((d) => (
                <a key={d.n} className="daychip" data-active={d.n === dayNow.n} href={slideHref(d.slides[0].id)}>
                  <strong>{d.n === 0 ? '안내' : `${d.n}일차`}</strong>
                  {d.date && <span>{dayDateLabel(d)}</span>}
                </a>
              ))}
            </nav>
            <DayTimeline current={current} />
          </div>
        )}

        {route.name === 'slide' && current ? (
          <div className="stage">
            <div className="stage__map">
              <Suspense fallback={<p className="trip-map__loading">지도를 불러오는 중…</p>}>
                <TripMap current={current} book={book} showAttendance={profile.role === 'teacher'} />
              </Suspense>
            </div>
            <div className="stage__slide" ref={scrollRef}>
              <SlideView slide={current} profile={profile} onOpen={setPanel} />
            </div>
          </div>
        ) : (
          <div className="stage stage--page">
            <div className="stage__slide" ref={scrollRef}>
              {route.name === 'feedback' ? <FeedbackPage /> : <ReflectionsPage />}
            </div>
          </div>
        )}

        {route.name === 'slide' && current && (
          <nav className="bottombar" aria-label="슬라이드 넘기기">
            <button type="button" className="bottombar__btn" disabled={!prev} onClick={() => step(-1)} aria-label="이전 슬라이드">
              <IconChevronLeft />
            </button>
            <span className="bottombar__count">
              {current.index + 1} <small>/ {deck.length}</small>
            </span>
            <button type="button" className="bottombar__btn bottombar__btn--next" disabled={!next} onClick={() => step(1)} aria-label="다음 슬라이드">
              <IconChevronRight />
            </button>
          </nav>
        )}
      </div>

      {drawer && (
        <div className="drawer-backdrop" onClick={() => setDrawer(false)}>
          <aside className="sidebar drawer" onClick={(e) => e.stopPropagation()} aria-label="일정 목록">
            <button type="button" className="drawer__close sidebar__icon-btn" onClick={() => setDrawer(false)} aria-label="닫기">
              <IconClose size="1.1rem" />
            </button>
            <Sidebar current={current} route={route} profile={profile} onNavigate={() => setDrawer(false)} onRole={() => (setDrawer(false), setRoleSheet(true))} />
          </aside>
        </div>
      )}

      {current && panel === 'attendance' && profile.role === 'teacher' && (
        <Sheet title={`출석 체크 · ${current.title}`} onClose={() => setPanel(null)}>
          <AttendancePanel slide={current} defaultClass={profile.classNo} />
        </Sheet>
      )}
      {current && panel === 'feedback' && (
        <Sheet title={`피드백 · ${current.title}`} onClose={() => setPanel(null)}>
          <FeedbackBox slideId={current.id} title="이 슬라이드 피드백" showTitle={false} />
        </Sheet>
      )}
      {current && panel === 'reflection' && profile.role === 'student' && (
        <Sheet title={`느낀 점 · ${current.title}`} onClose={() => setPanel(null)}>
          <ReflectionBox slide={current} classNo={profile.classNo} studentNo={profile.studentNo} />
        </Sheet>
      )}

      {roleSheet && (
        <Sheet title="역할 바꾸기" onClose={() => setRoleSheet(false)}>
          <RolePicker onDone={() => setRoleSheet(false)} />
        </Sheet>
      )}
    </div>
  )
}
