import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { rich } from '../components/Rich'
import { pageAt, pageByKey, pages, trip, type Page } from '../content'
import { Icon } from '../components/Icon'
import { TripMap } from '../features/map/TripMap'
import { Pager } from '../features/pager/Pager'
import { PageView } from '../features/page/PageView'
import { DayStrip } from '../features/strip/DayStrip'
import { ScheduleSheet } from '../features/schedule/ScheduleSheet'
import { MenuSheet } from '../features/menu/MenuSheet'
import { NoticePopup } from '../features/notice/NoticePopup'
import { NoticeEditor } from '../features/notice/NoticeEditor'
import { NoticeManage } from '../features/notice/NoticeManage'
import { goTo, useLocation } from '../lib/router'
import { noticeVersion, useHiddenNotices, useLastPage, useMapTall, useNotices, type Notice } from '../lib/repo'
import { daysUntil } from '../lib/time'
import { useApp } from './context'

export function Shell({ onLock }: { onLock: () => void }) {
  const loc = useLocation()
  const { at, profile, teacher } = useApp()
  const [lastPage, setLastPage] = useLastPage()
  const [mapTall, setMapTall] = useMapTall()
  const [sheet, setSheet] = useState<'schedule' | 'menu' | 'compose' | 'manage' | null>(null)
  const { notices, create: createNotice, update: updateNotice, remove: removeNotice } = useNotices()
  const { hidden, hide } = useHiddenNotices()
  const [editing, setEditing] = useState<Notice | null>(null)
  const [previewing, setPreviewing] = useState(false)
  /** 이번에 사이트를 연 동안 '닫기'로 닫은 공지 판. 다음에 열면 다시 뜬다. */
  const [closedNow, setClosedNow] = useState<string[]>([])

  // 홈 화면에 둔 앱은 다시 켜도 새로 열리지 않는다. 10분 넘게 다른 앱에 가 있다 돌아오면 새로 연 것으로 보고 닫은 공지를 다시 띄운다.
  useEffect(() => {
    let hiddenAt = 0
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') hiddenAt = Date.now()
      else if (hiddenAt && Date.now() - hiddenAt > 10 * 60 * 1000) setClosedNow([])
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])
  const scrollRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<HTMLElement>(null)
  /** 바로 앞 화면의 지도 칸 높이(안내 장은 0). 장이 바뀌며 지도가 생기거나 없어져도 글이 튀지 않게 쓴다. */
  const lastMapH = useRef(0)

  const nowInfo = useMemo(() => pageAt(at), [at])
  const current: Page = (loc.pageKey && pageByKey.get(loc.pageKey)) || pages[0]

  // 주소에 장이 없으면: 마지막으로 본 장 → 여행 중이면 지금 장 → 첫 장
  useEffect(() => {
    if (loc.pageKey && pageByKey.has(loc.pageKey)) return
    const live = nowInfo.page && nowInfo.state === 'live' ? nowInfo.page.key : null
    const fallback = live ?? (lastPage && pageByKey.has(lastPage) ? lastPage : pages[0].key)
    goTo(fallback, { replace: true })
  }, [loc.pageKey, lastPage, nowInfo])

  useEffect(() => {
    setLastPage(current.key)
  }, [current.key, setLastPage])

  // 휴대폰에서는 지도·노선도 띠·내용이 한 번에 스크롤된다(띠는 위에 붙어 남는다).
  // 장이 바뀌면 새 장의 윗부분을 방금 보던 자리에 두고, 지도를 부드럽게 다시 내려 보여 준다.
  useLayoutEffect(() => {
    const box = scrollRef.current
    if (!box || !window.matchMedia('(max-width: 959px)').matches) return
    const mapH = mapRef.current?.offsetHeight ?? 0
    const prevH = lastMapH.current
    // 방금까지 띠 아래 보이던 높이에 새 장 윗부분을 둔다. 지도 칸 높이가 달라졌으면(안내 장과 지도 장 사이) 그만큼 더한다.
    const keep = Math.max(0, Math.min(mapH, mapH - prevH + Math.min(box.scrollTop, prevH)))
    if (keep <= 0 && box.scrollTop <= 0) return
    box.scrollTop = keep
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      box.scrollTop = 0
      return
    }
    // 브라우저의 부드러운 스크롤은 방금 옆으로 민 손짓의 남은 관성에 취소되곤 해서 직접 움직인다. 다시 손대면 멈춘다.
    let frame = 0
    let t0 = -1
    const stop = () => cancelAnimationFrame(frame)
    const step = (t: number) => {
      if (t0 < 0) t0 = t
      const p = Math.max(0, Math.min(1, (t - t0) / 320))
      box.scrollTop = Math.round(keep * (1 - p) ** 3)
      if (p < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    box.addEventListener('touchstart', stop, { once: true, passive: true })
    box.addEventListener('wheel', stop, { once: true, passive: true })
    return () => {
      stop()
      box.removeEventListener('touchstart', stop)
      box.removeEventListener('wheel', stop)
    }
  }, [current.index])

  // 위의 장 바꿈 처리 다음에 돈다: 이번 화면의 지도 칸 높이를 적어 둔다(크게 보기 전환도 반영)
  useLayoutEffect(() => {
    lastMapH.current = mapRef.current?.offsetHeight ?? 0
  })

  /** 넘기는 동안 옆 장의 윗부분을 노선도 띠 바로 아래에 맞추는 기준선 */
  const ceiling = () => scrollRef.current?.querySelector('.strip')?.getBoundingClientRect().bottom ?? 0

  // 처음 들어오면 누구인지 고르게 한다
  useEffect(() => {
    if (!profile) setSheet('menu')
  }, [profile])

  const go = (i: number) => {
    if (i >= 0 && i < pages.length) goTo(pages[i].key, { replace: true })
  }
  const jump = (key: string) => {
    setSheet(null)
    goTo(key)
  }
  const goNow = () => {
    if (nowInfo.page) jump(nowInfo.page.key)
    else jump(nowInfo.state === 'after' ? (pages.find((p) => p.day.n === 10)?.key ?? pages[pages.length - 1].key) : pages[0].key)
  }

  // 출발 전·다녀와서의 장소 없는 안내 장은 휴대폰에서 지도를 접는다(표지·버스·숙소 장은 지도에 보여 줄 것이 있어 남긴다)
  const noMap =
    current.type === 'slide' && !current.slide.place && (current.day.n === 0 || current.day.n === 10) && !['cover', 'bus', 'rooms'].includes(current.slide.widget ?? '')

  // 공지: 새것이 앞. 학생에게는 '다시 보지 않기'·이번에 닫은 것을 뺀 나머지가 팝업으로 뜬다.
  const sortedNotices = useMemo(() => [...notices].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [notices])
  const pendingNotices = profile?.role === 'student' ? sortedNotices.filter((n) => !hidden.includes(noticeVersion(n)) && !closedNow.includes(noticeVersion(n))) : []
  const author = teacher?.name ?? ''

  const saveNotice = (title: string, body: string) => {
    if (editing) updateNotice(editing.id, title, body, author)
    else createNotice(title, body, author)
    setEditing(null)
    setSheet('manage')
  }

  const hideNotice = (n: Notice) => hide(n, notices)

  const prev = pages[current.index - 1]
  const next = pages[current.index + 1]
  const dday = daysUntil(trip.startDate, at)

  return (
    <div className="app" data-map-tall={mapTall || undefined} data-nomap={noMap || undefined}>
      <header className="topbar">
        <button type="button" className="topbar__chapter" onClick={() => setSheet('schedule')} aria-haspopup="dialog">
          <span className="topbar__chapter-label">{current.chapter.label}</span>
          {current.day.date ? <span className="topbar__chapter-date">{dateShort(current.day.date, current.day.weekday)}</span> : null}
          <Icon name="chevronDown" size="1rem" />
        </button>
        <div className="topbar__actions">
          <button type="button" className="now-btn" onClick={goNow} data-live={nowInfo.state === 'live' || undefined}>
            {nowInfo.state === 'before' ? (
              <span className="now-btn__label">{dday > 0 ? `D-${dday}` : '오늘 출발'}</span>
            ) : (
              <>
                <span className="now-btn__dot" aria-hidden="true" />
                <span className="now-btn__label">지금</span>
              </>
            )}
          </button>
          <button type="button" className="icon-btn" onClick={() => setSheet('menu')} aria-label="내 정보와 메뉴">
            <Icon name="user" />
          </button>
        </div>
      </header>

      <div className="app__scroll" ref={scrollRef}>
        <section className="app__map" aria-label="지도" ref={mapRef}>
          <TripMap page={current} onSelect={(key) => goTo(key)} />
          <button type="button" className="map-toggle" onClick={() => setMapTall(!mapTall)} aria-label={mapTall ? '지도 작게' : '지도 크게'}>
            <Icon name={mapTall ? 'collapse' : 'expand'} size="1.1rem" />
          </button>
        </section>

        <DayStrip page={current} nowKey={nowInfo.page?.key ?? null} onSelect={(key) => goTo(key, { replace: true })} />

        <main className="app__content">
          <Pager index={current.index} count={pages.length} onChange={go} ceiling={ceiling} render={(i) => <PageView page={pages[i]} />} />
        </main>
      </div>

      <nav className="bottombar" aria-label="장 넘기기">
        <button type="button" className="bottombar__prev" onClick={() => go(current.index - 1)} disabled={!prev} aria-label={prev ? `이전: ${pageTitle(prev)}` : '처음 장'}>
          <Icon name="chevronLeft" />
        </button>
        <div className="bottombar__pos" aria-live="polite">
          <span className="mono">{String(current.chapter.pages.indexOf(current) + 1).padStart(2, '0')}</span>
          <span className="bottombar__of">/ {String(current.chapter.pages.length).padStart(2, '0')}</span>
        </div>
        <button type="button" className="bottombar__next" onClick={() => go(current.index + 1)} disabled={!next}>
          {next ? (
            <>
              <span className="bottombar__next-text">
                <span className="bottombar__next-kicker">{next.chapter !== current.chapter ? next.chapter.label : nextTime(next) || '다음'}</span>
                <span className="bottombar__next-title">{rich(next.type === 'day' ? next.day.title : next.slide.title)}</span>
              </span>
              <Icon name="chevronRight" />
            </>
          ) : (
            <span className="bottombar__next-text">
              <span className="bottombar__next-title">마지막 장이에요</span>
            </span>
          )}
        </button>
      </nav>

      {sheet === 'schedule' ? <ScheduleSheet current={current} nowKey={nowInfo.page?.key ?? null} onJump={jump} onClose={() => setSheet(null)} /> : null}
      {sheet === 'menu' ? (
        <MenuSheet
          onJump={jump}
          onClose={() => setSheet(null)}
          onLock={onLock}
          noticeCount={notices.length}
          onNotices={(view) => {
            setEditing(null)
            setSheet(view)
          }}
        />
      ) : null}
      {sheet === 'compose' && author ? (
        <NoticeEditor
          key={editing?.id ?? 'new'}
          initial={editing}
          author={author}
          onSave={saveNotice}
          onClose={() => {
            setSheet(editing ? 'manage' : null)
            setEditing(null)
          }}
        />
      ) : null}
      {sheet === 'manage' ? (
        <NoticeManage
          notices={sortedNotices}
          onCompose={() => {
            setEditing(null)
            setSheet('compose')
          }}
          onEdit={(n) => {
            setEditing(n)
            setSheet('compose')
          }}
          onDelete={(n) => removeNotice(n.id)}
          onPreview={() => {
            setSheet(null)
            setPreviewing(true)
          }}
          onClose={() => setSheet(null)}
        />
      ) : null}
      {previewing && sortedNotices.length ? (
        <NoticePopup
          preview
          items={sortedNotices}
          onHide={() => {}}
          onClose={() => {
            setPreviewing(false)
            setSheet('manage')
          }}
        />
      ) : null}
      {!previewing && sheet === null && pendingNotices.length ? (
        <NoticePopup items={pendingNotices} onHide={hideNotice} onClose={() => setClosedNow((c) => [...c, ...pendingNotices.map(noticeVersion)])} />
      ) : null}
      <span className="sr-only" aria-live="polite">
        {current.chapter.label} {pageTitle(current)}
      </span>
    </div>
  )
}

export function pageTitle(p: Page): string {
  return p.type === 'day' ? `${p.chapter.label} ${p.day.title}` : p.slide.title
}

function nextTime(p: Page): string {
  return p.type === 'slide' && p.slide.time ? p.slide.time.start : ''
}

function dateShort(ymd: string, weekday?: string) {
  const [, m, d] = ymd.split('-').map(Number)
  return `${m}/${d}${weekday ? ` ${weekday}` : ''}`
}
