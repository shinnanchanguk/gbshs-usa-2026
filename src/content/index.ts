/**
 * content/ 폴더의 JSON 을 화면에서 쓰기 좋은 한 줄의 "장(page)" 흐름으로 묶는다.
 *
 * 출발 전(day0) → [1일차 표지, 1일차 장들] → … → [9일차 표지, …] → 다녀와서(day10)
 * 넘기는 순서가 곧 시간 순서이고 동선이다. 장소가 있는 장은 바로 앞 장소에서 오는 길(route)을 안다.
 */
import tripJson from '../../content/trip.json'
import seatingJson from '../../content/seating.json'
import photoSourcesJson from '../../content/photo-sources.json'
import routesJson from '../../content/routes.json'
import guideOverridesJson from '../../content/guide-overrides.json'
import { GUIDE, SITE_BASE } from '../lib/edition'
import type { Day, PhotoSources, Seating, Slide, Trip } from './schema'
import { instant, toMin } from '../lib/time'
import { km, type LngLat } from '../lib/geo'

export type { Day, Slide, Trip, SlideKind, PhotoRef, Seating, ThemeId, Widget } from './schema'

const dayModules = import.meta.glob<Day>('../../content/days/day*.json', { eager: true, import: 'default' })

export const trip = tripJson as Trip
export const seating = seatingJson as unknown as Seating
export const days: Day[] = Object.values(dayModules).sort((a, b) => a.n - b.n)

// 학생 사전 안내판: 느낀 점·보고서처럼 빠진 기능을 가리키는 장과 문장을 바꾼다(content/guide-overrides.json)
if (GUIDE) {
  const { hidePages, titles = {}, text } = guideOverridesJson as { hidePages: string[]; titles?: Record<string, string>; text: { from: string; to: string | null }[] }
  const swap = new Map(text.map((t) => [t.from, t.to]))
  const fix = (lines?: string[]) => lines?.flatMap((l) => (swap.has(l) ? (swap.get(l) == null ? [] : [swap.get(l)!]) : [l]))
  for (const day of days) {
    day.slides = day.slides.filter((s) => !hidePages.includes(s.id))
    for (const s of day.slides) {
      if (titles[s.id]) s.title = titles[s.id]
      if (s.summary && swap.has(s.summary)) s.summary = swap.get(s.summary) ?? ''
      s.details = fix(s.details) ?? s.details
      s.notices = fix(s.notices) ?? s.notices
      s.tips = fix(s.tips) ?? s.tips
    }
  }
  for (const d of trip.deadlines) if (d.detail && swap.has(d.detail)) d.detail = swap.get(d.detail) ?? ''
}

const photoSources = photoSourcesJson as PhotoSources

export type Route = { mode: 'bus' | 'walk'; km: number; min: number; coords: LngLat[] }
const routes = routesJson as unknown as Record<string, Route>

export type Chapter = {
  n: number
  /** "출발 전" · "1일차" · "다녀와서" */
  label: string
  day: Day
  pages: Page[]
}

type PageBase = { key: string; index: number; day: Day; chapter: Chapter }

export type DayPage = PageBase & { type: 'day' }

export type SlidePage = PageBase & {
  type: 'slide'
  slide: Slide
  /** 그날 지도에 찍히는 장소 번호 (장소가 없으면 null) */
  pin: number | null
  /** 바로 앞에 장소가 있는 장 (여기까지 오는 길의 출발점) */
  from: SlidePage | null
  /** 앞 장소에서 오는 실제 도로 경로(있으면) */
  route: Route | null
  /** 앞 장소와의 직선 거리(km) */
  crowKm: number | null
  /** 시작·끝 순간 (날짜가 있는 일차만) */
  start: Date | null
  end: Date | null
}

export type Page = DayPage | SlidePage

export const chapterLabel = (n: number) => (n === 0 ? '출발 전' : n === 10 ? '다녀와서' : `${n}일차`)

export const chapters: Chapter[] = []
export const pages: Page[] = []

let lastPlaced: SlidePage | null = null
for (const day of days) {
  const chapter: Chapter = { n: day.n, label: chapterLabel(day.n), day, pages: [] }
  chapters.push(chapter)
  const push = (p: Page) => {
    pages.push(p)
    chapter.pages.push(p)
  }
  if (day.n >= 1 && day.n <= 9) push({ type: 'day', key: `day-${day.n}`, index: pages.length, day, chapter })
  let pin = 0
  // 같은 좌표의 장은 같은 번호를 이어받는다(지도 핀 번호가 건너뛰지 않게)
  const pinByCoords = new Map<string, number>()
  for (const slide of day.slides) {
    let start: Date | null = null
    let end: Date | null = null
    if (day.date && slide.time) {
      const tz = slide.time.tz ?? 'EDT'
      start = instant(day.date, slide.time.start, tz)
      if (slide.time.end) {
        end = instant(day.date, slide.time.end, tz)
        // 자정을 넘기는 일정(예: 22:00~00:30)
        if (toMin(slide.time.end) < toMin(slide.time.start)) end = new Date(end.getTime() + 86_400_000)
      }
    }
    const page: SlidePage = {
      type: 'slide',
      key: slide.id,
      index: pages.length,
      day,
      chapter,
      slide,
      pin: slide.place ? (pinByCoords.get(slide.place.coords.join(',')) ?? (pinByCoords.set(slide.place.coords.join(','), ++pin), pin)) : null,
      from: slide.place ? lastPlaced : null,
      route: null,
      crowKm: null,
      start,
      end,
    }
    // 오는 길(leg)이 적힌 장만 앞 장소에서 오는 경로를 갖는다(호텔 조식처럼 이동이 없는 장에 가짜 선이 생기지 않게)
    if (slide.place && slide.leg && lastPlaced?.slide.place) {
      page.route = routes[`${lastPlaced.slide.id}>${slide.id}`] ?? null
      page.crowKm = km(lastPlaced.slide.place.coords, slide.place.coords)
    }
    push(page)
    if (slide.place) lastPlaced = page
  }
}

export const pageByKey = new Map(pages.map((p) => [p.key, p]))
export const slidePages = pages.filter((p): p is SlidePage => p.type === 'slide')

/** 같은 일차에서 장소가 있는 장들 */
export function placedIn(day: Day): SlidePage[] {
  return slidePages.filter((p) => p.day === day && p.slide.place)
}

/** 끝 시각이 없으면 다음 장 시작 시각을 끝으로 본다 */
export function effectiveEnd(p: SlidePage): Date | null {
  if (p.end) return p.end
  const next = slidePages.slice(slidePages.indexOf(p) + 1).find((q) => q.start)
  return next?.start ?? null
}

/** 지금 순간에 해당하는 장. 여행 전이면 null, 여행 중이면 진행 중이거나 곧 시작할 장 */
export function pageAt(at: Date): { page: SlidePage; state: 'live' | 'next' } | { page: null; state: 'before' | 'after' } {
  const timed = slidePages.filter((p) => p.start)
  if (!timed.length) return { page: null, state: 'before' }
  if (at < timed[0].start!) return { page: null, state: 'before' }
  for (const p of timed) {
    const end = effectiveEnd(p)
    if (at >= p.start! && end && at < end) return { page: p, state: 'live' }
    if (at < p.start!) return { page: p, state: 'next' }
  }
  return { page: null, state: 'after' }
}

// 사진은 본 사이트에만 올려 두고 사전 안내판도 같은 주소를 쓴다
const base = SITE_BASE

export function photoUrl(id: string, size: 'full' | 'thumb' = 'full'): string | null {
  const entry = photoSources.photos[id]
  if (!entry) return null
  // 파일 이름에 공백이 있는 사진(휴대폰 스크린샷 등)도 있어 주소를 인코딩한다.
  return encodeURI(base + (size === 'thumb' ? entry.thumb : entry.src))
}

/** 동영상이면 MP4 주소, 사진이면 null */
export function videoUrl(id: string): string | null {
  const entry = photoSources.photos[id]
  return entry?.video ? encodeURI(base + entry.video) : null
}

export function photoSize(id: string): { w: number; h: number } | null {
  const entry = photoSources.photos[id]
  return entry ? { w: entry.w, h: entry.h } : null
}

export const KIND_LABEL: Record<Slide['kind'], string> = {
  guide: '안내',
  day: '일차',
  move: '이동',
  flight: '비행',
  campus: '대학',
  lecture: '특강',
  culture: '견학',
  meal: '식사',
  hotel: '숙소',
  shopping: '쇼핑',
}

export const hotelById = new Map(trip.hotels.map((h) => [h.id, h]))
export const themeById = new Map(trip.themes.map((t) => [t.id, t]))

/** 학생이 그 장소에서 사진과 메모(느낀 점)를 남길 수 있는 장: 느낀 점 장, 그리고 대학·특강·견학·식사·쇼핑 장소 */
const RECORD_KINDS: Slide['kind'][] = ['campus', 'lecture', 'culture', 'meal', 'shopping']
export function canRecord(p: SlidePage): boolean {
  return p.slide.reflect || (!!p.slide.place && RECORD_KINDS.includes(p.slide.kind))
}
