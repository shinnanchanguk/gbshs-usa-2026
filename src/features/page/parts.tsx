import { useState, type ReactNode } from 'react'
import { rich } from '../../components/Rich'
import { photoSize, photoUrl, videoUrl, type SlidePage } from '../../content'
import { Icon, LEG_ICON, type IconName } from '../../components/Icon'
import { clock, duration } from '../../lib/time'
import { Lightbox } from '../photos/Lightbox'

export function Section({ title, icon, tone, children }: { title: string; icon?: IconName; tone?: 'warn' | 'tip'; children: ReactNode }) {
  return (
    <section className="block" data-tone={tone}>
      <h2 className="block__title">
        {icon ? <Icon name={icon} size="1.05rem" /> : null}
        {title}
      </h2>
      {children}
    </section>
  )
}

/** 시각 줄: "14:30 – 16:30 · 2시간" (한국 시각이면 표시) */
export function timeText(p: SlidePage): { range: string; stay: string | null } {
  const t = p.slide.time
  if (!t) return { range: '', stay: null }
  const stay = p.start && p.end ? duration(Math.round((p.end.getTime() - p.start.getTime()) / 60000)) : null
  // 비행은 출발·도착 시각을 각 나라 시각으로 (예: 한국 10:00 출발 → 현지 11:10 도착)
  if (p.slide.kind === 'flight' && p.start && p.end) {
    const fromTz = t.tz === 'KST' ? 'KST' : 'EDT'
    const toTz = fromTz === 'KST' ? 'EDT' : 'KST'
    const label = (tz: 'KST' | 'EDT') => (tz === 'KST' ? '한국' : '현지')
    return { range: `${label(fromTz)} ${clock(p.start, fromTz).time} 출발 → ${label(toTz)} ${clock(p.end, toTz).time} 도착`, stay }
  }
  const range = t.end ? `${t.start} – ${t.end}` : `${t.start}부터`
  return { range: t.tz === 'KST' ? `${range} 한국 시각` : range, stay }
}

/** 미국 시각 장의 한국 시각 (학부모용) */
export function kstText(p: SlidePage): string | null {
  if (!p.start || p.slide.time?.tz === 'KST') return null
  const k = clock(p.start, 'KST')
  return `한국 ${k.m}/${k.d}(${k.weekday}) ${k.time}`
}

/** 앞 장소에서 여기까지 오는 길 */
export function LegChip({ page }: { page: SlidePage }) {
  const leg = page.slide.leg
  if (!leg) return null
  const km = (v: number) => (v < 1 ? `${Math.round(v * 1000 / 50) * 50}m` : `${Math.round(v)}km`)
  // 앞 장에 장소가 없어 경로가 더 앞 장소에서 계산된 경우(예정 시간과 크게 다름)에는 거리를 내지 않는다
  const sameLeg = !page.route || !leg.minutes || (page.route.min <= leg.minutes * 2 + 10 && page.route.min >= leg.minutes * 0.35)
  const dist = !sameLeg ? null : page.route ? `약 ${km(page.route.km)}` : page.crowKm && page.crowKm > 1.5 && leg.mode !== 'flight' ? `직선 약 ${km(page.crowKm)}` : null
  return (
    <div className="leg">
      <span className="leg__icon" aria-hidden="true">
        <Icon name={LEG_ICON[leg.mode] ?? 'bus'} size="1.1rem" />
      </span>
      <span className="leg__text">
        <span className="leg__label">오는 길</span>
        <span className="leg__main">{rich(leg.text)}</span>
      </span>
      {leg.minutes || dist ? (
        <span className="leg__nums mono">
          {leg.minutes ? <span>{duration(leg.minutes)}</span> : null}
          {dist ? <span>{dist}</span> : null}
        </span>
      ) : null}
    </div>
  )
}

/** 다시 모이는 곳 (탑승권 스텁처럼 시각을 크게) */
export function MeetingPass({ meeting }: { meeting: NonNullable<SlidePage['slide']['meeting']> }) {
  return (
    <div className="pass" role="note" aria-label="다시 모이는 곳">
      <div className="pass__main">
        <span className="pass__label">
          <Icon name="flag" size="1rem" /> 다시 모이는 곳
        </span>
        <strong className="pass__place">{rich(meeting.place)}</strong>
        {meeting.note ? <span className="pass__note">{rich(meeting.note)}</span> : null}
      </div>
      {meeting.time ? (
        <div className="pass__time">
          <span className="pass__time-label">모이는 시각</span>
          <span className="pass__time-value mono">{meeting.time}</span>
        </div>
      ) : null}
    </div>
  )
}

/** 대표 사진 한 장 + 나머지는 눌러서 넘겨 보기 */
export function Photos({ page }: { page: SlidePage }) {
  const [open, setOpen] = useState<number | null>(null)
  const photos = page.slide.photos
  if (!photos.length) return null
  const coverIdx = Math.max(0, photos.findIndex((p) => p.id === page.slide.cover))
  const cover = photos[coverIdx]
  const size = photoSize(cover.id)
  const thumbs = photos.filter((_, i) => i !== coverIdx).slice(0, 3)
  return (
    <figure className="photos">
      <button type="button" className="photos__cover" onClick={() => setOpen(coverIdx)} aria-label={`사진 ${photos.length}장 크게 보기`}>
        <img src={photoUrl(cover.id) ?? ''} alt={cover.caption} width={size?.w} height={size?.h} loading="lazy" decoding="async" />
        {videoUrl(cover.id) ? (
          <span className="photos__play" aria-hidden="true">
            <Icon name="chevronRight" size="1.4rem" />
          </span>
        ) : null}
      </button>
      {thumbs.length ? (
        <div className="photos__row">
          {thumbs.map((t) => {
            const i = photos.indexOf(t)
            return (
              <button key={t.id} type="button" className="photos__thumb" onClick={() => setOpen(i)} aria-label={t.caption}>
                <img src={photoUrl(t.id, 'thumb') ?? ''} alt="" loading="lazy" decoding="async" />
              </button>
            )
          })}
          <button type="button" className="photos__more" onClick={() => setOpen(coverIdx)}>
            <Icon name="photo" size="1.1rem" />
            <span className="mono">{photos.length}</span>
            <span className="sr-only">장 모두 보기</span>
          </button>
        </div>
      ) : null}
      <figcaption className="photos__caption">
        <span>{rich(cover.caption)}</span>
        <span className="photos__credit">사전답사 사진</span>
      </figcaption>
      {open != null ? <Lightbox photos={photos} start={open} onClose={() => setOpen(null)} /> : null}
    </figure>
  )
}

export function mapsLink(p: SlidePage): string | null {
  const place = p.slide.place
  if (!place) return null
  const [lng, lat] = place.coords
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
}
