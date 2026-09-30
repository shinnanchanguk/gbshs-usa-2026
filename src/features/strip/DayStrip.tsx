import type { Page, SlidePage } from '../../content'
import { useApp } from '../../app/context'

/**
 * 지도 아래 노선도 띠. 그날 일정을 한 줄의 시간 막대로 보여 준다.
 * 막대 길이 = 머무는 시간, 막대 사이 가는 선 = 이동. 지금 보는 장은 오렌지, 실제 지금 시각은 오렌지 세로선.
 * 출발 전·다녀와서처럼 시각이 없는 묶음은 장마다 같은 간격의 점으로 보여 준다.
 */
export function DayStrip({ page, nowKey, onSelect }: { page: Page; nowKey: string | null; onSelect: (key: string) => void }) {
  const { at } = useApp()
  const slides = page.chapter.pages.filter((p): p is SlidePage => p.type === 'slide')
  const timed = slides.filter((p) => p.start)
  const currentKey = page.key

  if (timed.length < 2 || !page.day.date) {
    return (
      <div className="strip strip--dots" aria-label={`${page.chapter.label} 장 목록`}>
        <ol className="strip__dots">
          {page.chapter.pages.map((p) => (
            <li key={p.key}>
              <button type="button" className="strip__dot" data-current={p.key === currentKey || undefined} onClick={() => onSelect(p.key)} aria-label={p.type === 'slide' ? p.slide.title : p.chapter.label} aria-current={p.key === currentKey ? 'step' : undefined} />
            </li>
          ))}
        </ol>
      </div>
    )
  }

  // 시간 축: 실제 순간 기준(1일차처럼 한국 시각과 미국 시각이 섞인 날도 맞게). 짧은 날은 최소 3시간.
  const t0 = timed[0].start!.getTime()
  // 끝 시각이 없으면 그날 다음 일정 시작까지, 마지막 일정이면 1시간으로 본다
  const endOf = (p: SlidePage) => {
    if (p.end) return p.end.getTime()
    const next = timed[timed.indexOf(p) + 1]
    return next ? next.start!.getTime() : p.start!.getTime() + 60 * 60000
  }
  const lastEnd = timed[timed.length - 1]
  const span = Math.max(180, (endOf(lastEnd) - t0) / 60000)
  const pos = (ms: number) => ((ms - t0) / 60000 / span) * 100

  // 1일차처럼 한국 시각과 현지 시각이 섞인 날은 양 끝 시각에 어느 나라 시각인지 붙인다
  const mixedTz = new Set(timed.map((p) => p.slide.time!.tz ?? 'EDT')).size > 1

  // 실제 지금 시각 표시 (그날 일정 안일 때만)
  const fromStart = (at.getTime() - t0) / 60000
  const nowPos = fromStart >= 0 && fromStart <= span ? (fromStart / span) * 100 : null

  return (
    <div className="strip" aria-label={`${page.chapter.label} 시간표 띠`}>
      <span className="strip__edge mono">{edgeLabel(timed[0], mixedTz, timed[0].slide.time!.start)}</span>
      <div className="strip__rail">
        <div className="strip__line" />
        {timed.map((p) => {
          const left = pos(p.start!.getTime())
          const width = Math.max(1.2, pos(endOf(p)) - left)
          const isCur = p.key === currentKey
          return (
            <button
              key={p.key}
              type="button"
              className="strip__stop"
              data-kind={p.slide.kind}
              data-current={isCur || undefined}
              data-now={p.key === nowKey || undefined}
              data-optional={p.slide.optional || undefined}
              style={{ left: `${left}%`, width: `${width}%` }}
              onClick={() => onSelect(p.key)}
              aria-label={`${p.slide.time!.start} ${p.slide.title}`}
              aria-current={isCur ? 'step' : undefined}
            />
          )
        })}
        {nowPos != null ? <span className="strip__now" style={{ left: `${nowPos}%` }} aria-hidden="true" /> : null}
      </div>
      <span className="strip__edge mono">{edgeLabel(lastEnd, mixedTz, lastEnd.slide.time!.end ?? lastEnd.slide.time!.start)}</span>
    </div>
  )
}

function edgeLabel(p: SlidePage, mixed: boolean, hhmm: string) {
  if (!mixed) return hhmm
  return `${p.slide.time!.tz === 'KST' ? '한국' : '현지'} ${hhmm}`
}
