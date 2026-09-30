import { seating } from '../../content'
import type { Roster } from '../../lib/roster'
import { Icon } from '../../components/Icon'

/**
 * 버스 좌석표. 앞(운전석·출입구)에서 뒤(화장실)로. 한 줄은 창가·통로 | 통로 | 통로·창가.
 * 자리 색 = 반, 별 = 수하물 도우미, 오렌지 = 내 자리. present 를 주면 출석 표시로 쓴다.
 */
export function SeatMap({
  bus,
  roster,
  highlight,
  present,
  onToggle,
}: {
  bus: number
  roster: Roster
  highlight?: number | null
  present?: Set<string>
  onToggle?: (studentId: string) => void
}) {
  const layout = seating.buses.find((b) => b.no === bus)!
  const byseat = new Map(roster.students.filter((s) => s.bus === bus).map((s) => [s.seat, s]))
  const teacherBySeat = new Map(roster.teachers.filter((t) => t.bus === bus).map((t) => [t.seat, t]))

  const cell = (n: number | null, key: string) => {
    if (n == null) return <div key={key} className="seat seat--empty" aria-hidden="true" />
    const info = layout.seats[String(n)]
    const s = byseat.get(n)
    const t = teacherBySeat.get(n)
    const label = s ? s.name : t ? t.name : info?.role === 'guide' ? '가이드' : info?.role === 'staff' ? '수행원' : ''
    const here = present && s ? present.has(s.id) : undefined
    const common = {
      className: 'seat',
      'data-role': info?.role,
      'data-class': s?.classNo,
      'data-me': highlight === n || undefined,
      'data-present': here,
    }
    const body = (
      <>
        <span className="seat__no mono">
          {n}
          {info?.helper ? (
            <span className="seat__star">
              <Icon name="star" size="0.62rem" strokeWidth={2.4} label="수하물 도우미" />
            </span>
          ) : null}
        </span>
        <span className="seat__name">{label}</span>
      </>
    )
    if (onToggle && s)
      return (
        <button key={key} type="button" {...common} aria-pressed={here} onClick={() => onToggle(s.id)} aria-label={`${n}번 ${s.name} ${here ? '탑승' : '미확인'}`}>
          {body}
        </button>
      )
    return (
      <div key={key} {...common}>
        {body}
      </div>
    )
  }

  return (
    <div className="seatmap" data-noswipe>
      <div className="seatmap__front">
        <span>운전석</span>
        <span>출입구</span>
      </div>
      <div className="seatmap__grid">
        {layout.rows.map((row, r) => (
          <div key={r} className="seatmap__row">
            {cell(row[0], `${r}a`)}
            {cell(row[1], `${r}b`)}
            <span className="seatmap__aisle mono" aria-hidden="true">
              {r + 1}
            </span>
            {layout.toiletRows.includes(r) ? (
              <div className="seat seat--toilet" data-first={r === layout.toiletRows[0] || undefined}>
                {r === layout.toiletRows[0] ? '화장실' : ''}
              </div>
            ) : (
              <>
                {cell(row[2], `${r}c`)}
                {cell(row[3], `${r}d`)}
              </>
            )}
          </div>
        ))}
      </div>
      <ul className="seatmap__legend" aria-label="반 색">
        {[1, 2, 3, 4, 5].map((c) => (
          <li key={c} data-class={c}>
            {c}반
          </li>
        ))}
        <li data-star>수하물 도우미</li>
      </ul>
    </div>
  )
}
