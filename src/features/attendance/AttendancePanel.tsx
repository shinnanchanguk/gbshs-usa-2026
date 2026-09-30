import { useState } from 'react'
import { trip, type SlidePage } from '../../content'
import { Icon } from '../../components/Icon'
import { useApp } from '../../app/context'
import { useAttendance } from '../../lib/repo'
import { SeatMap } from '../roster/SeatMap'

/**
 * 인원 확인. 반별 번호판 또는 버스 좌석표에서 학생을 눌러 확인한다.
 * 확인한 학번은 장마다 이 기기에 저장된다(나중에 DB 로 옮기면 선생님끼리 함께 보게 된다).
 */
export function AttendancePanel({ page }: { page: SlidePage }) {
  const { roster, profile, setProfile } = useApp()
  const [book, setBook] = useAttendance()
  const [mode, setMode] = useState<'class' | 'bus1' | 'bus2'>('class')
  const classNo = profile?.classNo ?? 1
  const present = new Set(book[page.key]?.present ?? [])
  const inClass = roster.students.filter((s) => s.classNo === classNo).sort((a, b) => a.no - b.no)
  const scope = mode === 'class' ? inClass : roster.students.filter((s) => s.bus === (mode === 'bus1' ? 1 : 2))
  const here = scope.filter((s) => present.has(s.id))
  const missing = scope.filter((s) => !present.has(s.id))

  const save = (next: Set<string>) => setBook((b) => ({ ...b, [page.key]: { present: [...next], updatedAt: new Date().toISOString() } }))
  const toggle = (id: string) => {
    const next = new Set(present)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    save(next)
  }

  return (
    <section className="attend" data-noswipe aria-label="인원 확인">
      <div className="attend__head">
        <h2 className="block__title">
          <Icon name="users" size="1.05rem" /> 인원 확인
        </h2>
        <span className="attend__count mono" data-full={missing.length === 0 || undefined}>
          {here.length}/{scope.length}
        </span>
      </div>
      <div className="seg-group" role="tablist" aria-label="확인 방식">
        <button type="button" role="tab" aria-selected={mode === 'class'} className="seg" data-on={mode === 'class' || undefined} onClick={() => setMode('class')}>
          반별
        </button>
        <button type="button" role="tab" aria-selected={mode === 'bus1'} className="seg" data-on={mode === 'bus1' || undefined} onClick={() => setMode('bus1')}>
          1호차 좌석
        </button>
        <button type="button" role="tab" aria-selected={mode === 'bus2'} className="seg" data-on={mode === 'bus2' || undefined} onClick={() => setMode('bus2')}>
          2호차 좌석
        </button>
      </div>

      {mode === 'class' ? (
        <>
          <div className="classpick" role="radiogroup" aria-label="반">
            {trip.classes.map((c) => (
              <button
                key={c.no}
                type="button"
                role="radio"
                aria-checked={classNo === c.no}
                className="classpick__btn"
                data-on={classNo === c.no || undefined}
                data-class={c.no}
                onClick={() => setProfile({ ...(profile ?? { role: 'teacher' }), classNo: c.no })}
              >
                {c.no}반
              </button>
            ))}
          </div>
          <ul className="roll">
            {inClass.map((s) => (
              <li key={s.id}>
                <button type="button" className="roll__btn" aria-pressed={present.has(s.id)} data-on={present.has(s.id) || undefined} onClick={() => toggle(s.id)}>
                  <span className="roll__no mono">{s.no}</span>
                  <span className="roll__name">{s.name}</span>
                  <span className="roll__bus mono">{s.bus}호</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <SeatMap bus={mode === 'bus1' ? 1 : 2} roster={roster} present={present} onToggle={toggle} />
      )}

      <div className="attend__foot">
        {missing.length ? (
          <p className="attend__missing">
            아직 확인 안 됨 <span className="mono">{missing.length}</span>: {missing.slice(0, 12).map((s) => s.name).join(', ')}
            {missing.length > 12 ? ` 외 ${missing.length - 12}명` : ''}
          </p>
        ) : (
          <p className="attend__done">
            <Icon name="check" size="1rem" /> 모두 확인했어요
          </p>
        )}
        <div className="attend__actions">
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => save(new Set([...present, ...scope.map((s) => s.id)]))}>
            모두 확인
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => {
              const next = new Set(present)
              for (const s of scope) next.delete(s.id)
              save(next)
            }}
          >
            다시 세기
          </button>
        </div>
      </div>
      <p className="fineprint">확인한 기록은 이 휴대폰에만 저장돼요.</p>
    </section>
  )
}
