/**
 * 아침 기상 확인 날짜와 그날 첫 버스 출발 시각(현지 시각).
 * 내용 파일과 맞춘다: content/days/day0.json 「호텔 조식과 아침 출발」 날짜별 목록, 각 일차 아침 출발 장.
 * ZUDO 의 WAKE_DATES(src/lib/trip/config.ts)와 날짜가 같아야 한다.
 * 10/7 회의: 기상 도우미는 출발 30분 전까지 확인을 마치고, 학생은 20분 전까지 버스에 온다.
 */
export const WAKE_DAYS = [
  { date: '2026-10-16', depart: '07:30' },
  { date: '2026-10-17', depart: '08:00' },
  { date: '2026-10-18', depart: '07:00' },
  { date: '2026-10-19', depart: '08:00' },
  { date: '2026-10-20', depart: '07:30' },
  { date: '2026-10-21', depart: '08:30' },
] as const

export const WAKE_LEAD_MIN = 30

export type WakeStatus = 'face' | 'kakao' | 'unreachable'

export const WAKE_LABEL: Record<WakeStatus, string> = {
  face: '얼굴 보고 확인',
  kakao: '카톡으로만 답함',
  unreachable: '연락 안 됨',
}

/** "남1–남7", "남15–20", "여5–여10" → ["남 1", …] */
export function expandRooms(range: string | undefined): string[] {
  const m = range?.match(/^(남|여)\s*(\d+)\s*[–~-]\s*(?:남|여)?\s*(\d+)$/)
  if (!m) return []
  const out: string[] = []
  for (let i = Number(m[2]); i <= Number(m[3]); i++) out.push(`${m[1]} ${i}`)
  return out
}

/** "07:30" 에서 분을 뺀 "07:00" */
export function minus(hhmm: string, min: number): string {
  const t = Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5)) - min
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

/** 오늘(현지 날짜)이 기상 확인 날이면 그날, 아니면 다음 확인 날(다 지났으면 마지막 날) */
export function defaultWakeDate(todayYmd: string): string {
  return (WAKE_DAYS.find((d) => d.date >= todayYmd) ?? WAKE_DAYS[WAKE_DAYS.length - 1]).date
}
