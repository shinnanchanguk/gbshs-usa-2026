/**
 * 시각 계산. 일정표 시각은 미국 동부 현지 시각(EDT, UTC-4)이고, 한국(KST)은 UTC+9 라서 13시간 차이다.
 * 한국 시각으로 적힌 장(인천공항 등)은 time.tz = "KST".
 */
const EDT = -4
const KST = 9
const WEEK = ['일', '월', '화', '수', '목', '금', '토']

export const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5))

/** "2026-10-15" + "10:00" (tz) → 실제 순간 */
export function instant(date: string, hhmm: string, tz: 'EDT' | 'KST' = 'EDT'): Date {
  const [y, m, d] = date.split('-').map(Number)
  const offset = tz === 'KST' ? KST : EDT
  return new Date(Date.UTC(y, m - 1, d, Number(hhmm.slice(0, 2)) - offset, Number(hhmm.slice(3, 5))))
}

/** 순간을 어느 시간대의 {날짜, 시각, 요일} 로 */
export function clock(at: Date, tz: 'EDT' | 'KST') {
  const shifted = new Date(at.getTime() + (tz === 'KST' ? KST : EDT) * 3600_000)
  const m = shifted.getUTCMonth() + 1
  const d = shifted.getUTCDate()
  const hh = String(shifted.getUTCHours()).padStart(2, '0')
  const mm = String(shifted.getUTCMinutes()).padStart(2, '0')
  return { m, d, weekday: WEEK[shifted.getUTCDay()], time: `${hh}:${mm}`, ymd: `${shifted.getUTCFullYear()}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` }
}

/** 90 → "1시간 30분", 45 → "45분" */
export function duration(min: number): string {
  if (min <= 0) return ''
  const h = Math.floor(min / 60)
  const m = min % 60
  if (!h) return `${m}분`
  return m ? `${h}시간 ${m}분` : `${h}시간`
}

export function dateLabel(ymd: string, weekday?: string) {
  const [, m, d] = ymd.split('-').map(Number)
  return `${m}/${d}${weekday ? `(${weekday})` : ''}`
}

/**
 * 지금 시각. 주소에 ?now=2026-10-16T10:30-04:00 을 붙이면 그 순간으로 본다(선생님들이 미리 연습할 때).
 */
export function now(): Date {
  try {
    // "+09:00" 의 + 는 주소에서 공백으로 바뀌므로 되돌린다
    const q = new URLSearchParams(window.location.search).get('now')?.replace(' ', '+')
    if (q) {
      const t = new Date(q)
      if (!Number.isNaN(t.getTime())) return t
    }
  } catch {
    /* 주소를 못 읽으면 실제 시각 */
  }
  return new Date()
}

/** 출발까지 남은 날 (한국 날짜 기준). 출발일이면 0 */
export function daysUntil(startYmd: string, at: Date): number {
  const [ty, tm, td] = clock(at, 'KST').ymd.split('-').map(Number)
  const a = Date.UTC(ty, tm - 1, td)
  const [y, m, d] = startYmd.split('-').map(Number)
  const b = Date.UTC(y, m - 1, d)
  return Math.round((b - a) / 86_400_000)
}
