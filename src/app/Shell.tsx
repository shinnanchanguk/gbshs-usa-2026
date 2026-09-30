import { useEffect, useMemo, useState } from 'react'
import { rich } from '../components/Rich'
import { pageAt, pageByKey, pages, trip, type Page } from '../content'
import { Icon } from '../components/Icon'
import { TripMap } from '../features/map/TripMap'
import { Pager } from '../features/pager/Pager'
import { PageView } from '../features/page/PageView'
import { DayStrip } from '../features/strip/DayStrip'
import { ScheduleSheet } from '../features/schedule/ScheduleSheet'
import { MenuSheet } from '../features/menu/MenuSheet'
import { goTo, useLocation } from '../lib/router'
import { useLastPage, useMapTall } from '../lib/repo'
import { daysUntil } from '../lib/time'
import { useApp } from './context'

export function Shell({ onLock }: { onLock: () => void }) {
  const loc = useLocation()
  const { at, profile } = useApp()
  const [lastPage, setLastPage] = useLastPage()
  const [mapTall, setMapTall] = useMapTall()
  const [sheet, setSheet] = useState<'schedule' | 'menu' | null>(null)

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

      <section className="app__map" aria-label="지도">
        <TripMap page={current} onSelect={(key) => goTo(key)} />
        <button type="button" className="map-toggle" onClick={() => setMapTall(!mapTall)} aria-label={mapTall ? '지도 작게' : '지도 크게'}>
          <Icon name={mapTall ? 'collapse' : 'expand'} size="1.1rem" />
        </button>
      </section>

      <DayStrip page={current} nowKey={nowInfo.page?.key ?? null} onSelect={(key) => goTo(key, { replace: true })} />

      <main className="app__content">
        <Pager index={current.index} count={pages.length} onChange={go} render={(i) => <PageView page={pages[i]} />} />
      </main>

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
      {sheet === 'menu' ? <MenuSheet onJump={jump} onClose={() => setSheet(null)} onLock={onLock} /> : null}
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
