/**
 * content/ 폴더의 JSON 을 읽어 화면에서 쓰기 좋은 모양으로 묶는다.
 * 모든 일차의 슬라이드를 한 줄로 이어 붙여 "슬라이드 넘기기" 순서를 만든다.
 */
import tripJson from '../../content/trip.json'
import photoSourcesJson from '../../content/photo-sources.json'
import type { Day, PhotoSources, Slide, Trip } from './schema'

export type { Day, Slide, Trip, SlideKind, PhotoRef } from './schema'

const dayModules = import.meta.glob<Day>('../../content/days/day*.json', { eager: true, import: 'default' })

export const trip = tripJson as Trip
export const days: Day[] = Object.values(dayModules).sort((a, b) => a.n - b.n)

const photoSources = photoSourcesJson as PhotoSources

export type DeckSlide = Slide & {
  /** 전체 넘기기 순서에서 몇 번째인지 (0부터) */
  index: number
  day: Day
  /** 그날 안에서 몇 번째인지 (1부터) */
  order: number
  /** 그날 지도에 찍히는 장소 번호 (장소가 없으면 null) */
  pin: number | null
}

export const deck: DeckSlide[] = []
for (const day of days) {
  let pin = 0
  day.slides.forEach((slide, i) => {
    deck.push({
      ...slide,
      index: deck.length,
      day,
      order: i + 1,
      pin: slide.place ? ++pin : null,
    })
  })
}

export const slideById = new Map(deck.map((s) => [s.id, s]))

const base = import.meta.env.BASE_URL

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

export const dayLabel = (day: Day) => (day.n === 0 ? '공통 안내' : `${day.n}일차`)

export function dayDateLabel(day: Day): string {
  if (!day.date) return ''
  const [, m, d] = day.date.split('-').map(Number)
  return `${m}/${d}(${day.weekday ?? ''})`
}

export function timeLabel(slide: Slide): string {
  if (!slide.time) return ''
  const range = slide.time.end ? `${slide.time.start}–${slide.time.end}` : slide.time.start
  return slide.time.tz === 'KST' ? `${range} 한국시각` : range
}

export const KIND_LABEL: Record<Slide['kind'], string> = {
  info: '안내',
  move: '이동',
  flight: '항공',
  campus: '대학 탐방',
  lecture: '특강',
  culture: '문화 체험',
  meal: '식사',
  hotel: '숙소',
  shopping: '쇼핑',
}
