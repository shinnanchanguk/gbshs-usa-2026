import { useState } from 'react'
import { seating, trip } from '../../content'
import { Icon } from '../../components/Icon'
import { useApp } from '../../app/context'
import { HELPER_JOB, HELPER_LABEL, type Student } from '../../lib/roster'
import { SeatMap } from './SeatMap'

/** 버스 좌석: 내 자리 카드 + 호차별 좌석표(이름은 입장 코드로 풀린 명단에서) */
export function BusWidget() {
  const { me, roster, studentById, profile } = useApp()
  const [bus, setBus] = useState<number>(me?.bus ?? 1)
  const partner = me?.partners?.map((id) => studentById.get(id)).filter(Boolean) as Student[] | undefined
  const info = trip.buses.find((b) => b.no === bus)!
  return (
    <div className="buswidget">
      {me ? (
        <section className="myseat" aria-label="내 자리">
          <div className="myseat__big">
            <span className="myseat__bus mono">{me.bus}호차</span>
            <span className="myseat__seat mono">{me.seat}</span>
            <span className="myseat__unit">번 자리</span>
          </div>
          <div className="myseat__side">
            <p>
              {profile?.role === 'parent' ? `${me.name} 학생` : '나'} · {me.classNo}반 {me.no}번
            </p>
            {partner?.length ? <p>짝: {partner.map((p) => `${p.name}(${p.bus === me.bus ? `${p.seat}번` : `${p.bus}호차`})`).join(', ')}</p> : null}
            {me.helpers?.includes('luggage') ? <p className="myseat__role">수하물 도우미라 앞쪽 통로 쪽 자리예요.</p> : null}
          </div>
        </section>
      ) : (
        <p className="hint">
          <Icon name="user" size="1rem" /> 오른쪽 위 사람 단추에서 나를 고르면 내 자리가 여기 크게 보여요.
        </p>
      )}

      <div className="seg-group" role="tablist" aria-label="호차">
        {seating.buses.map((b) => (
          <button key={b.no} type="button" role="tab" aria-selected={bus === b.no} className="seg" data-on={bus === b.no || undefined} onClick={() => setBus(b.no)}>
            {b.no}호차 <span className="seg__sub">{trip.buses.find((x) => x.no === b.no)?.classes.join('·')}반</span>
          </button>
        ))}
      </div>
      <p className="fineprint">{info.note}</p>
      <SeatMap bus={bus} roster={roster} highlight={me?.bus === bus ? me.seat : null} />

      {me?.helpers?.length ? (
        <section className="card helper-card">
          <h3>
            <Icon name="star" size="1rem" /> 내가 맡은 도우미
          </h3>
          <ul className="bullets">
            {me.helpers.map((h) => (
              <li key={h}>
                <strong>{HELPER_LABEL[h]}</strong>
                {h === 'wakeup' && me.wakeupRooms ? ` (${me.wakeupRooms})` : ''}: {HELPER_JOB[h]}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
