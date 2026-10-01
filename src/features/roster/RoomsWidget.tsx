import { useState } from 'react'
import { trip } from '../../content'
import { Icon } from '../../components/Icon'
import { useApp } from '../../app/context'
import type { Student } from '../../lib/roster'
import { dateLabel } from '../../lib/time'
import { GUIDE, LATER } from '../../lib/edition'
import { LaterNote } from '../guide/LaterNote'

/** 숙소 3곳 + 내 방 + 전체 방 배정(펼쳐 보기) */
export function RoomsWidget() {
  const { me, roster, studentById, profile } = useApp()
  const [open, setOpen] = useState(false)
  const mates = me?.roommates.map((id) => studentById.get(id)).filter(Boolean) as Student[] | undefined

  // 방 번호 순서로 묶기 (남 1 … 남 41, 여 1 … 여 10)
  const rooms = new Map<string, Student[]>()
  for (const s of roster.students) rooms.set(s.room, [...(rooms.get(s.room) ?? []), s])
  const order = (label: string) => (label.startsWith('남') ? 0 : 1000) + Number(label.replace(/\D/g, ''))
  const sorted = [...rooms.entries()].sort((a, b) => order(a[0]) - order(b[0]))

  return (
    <div className="rooms">
      {me ? (
        <section className="myroom">
          <span className="myroom__label">
            <Icon name="bed" size="1rem" /> {profile?.role === 'parent' ? `${me.name} 학생 방` : '내 방'}
          </span>
          <strong className="myroom__no mono">{me.room}</strong>
          <p className="myroom__mates">
            {mates?.length ? `같은 방: ${mates.map((m) => `${m.name}(${m.classNo}반)`).join(', ')}` : '혼자 쓰는 방이에요.'}
            {me.connected ? ' 옆방과 안에서 문으로 이어진 커넥티드룸이에요.' : ''}
          </p>
          <p className="fineprint">세 숙소 모두 같은 짝과 써요. 호텔의 실제 방 호수는 도착해서 선생님이 알려 줘요.</p>
        </section>
      ) : null}

      <ol className="hotels">
        {trip.hotels.map((h, i) => (
          <li key={h.id} className="card hotel">
            <span className="hotel__n mono">{i + 1}</span>
            <div className="hotel__body">
              <h3 className="hotel__name">{h.name}</h3>
              <p className="hotel__nights mono">
                {h.nights.map((n) => dateLabel(n)).join(' · ')} · {h.nights.length}박
              </p>
              <p className="hotel__addr">{h.address}</p>
              <a className="link" href={`tel:${h.phone.replace(/[^+\d]/g, '')}`}>
                <Icon name="phone" size="1rem" /> {h.phone}
              </a>
              <ul className="bullets bullets--tight">
                {h.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>

      {GUIDE ? <LaterNote icon="bed" title="방 배정" text={`누구와 같은 방을 쓰는지는 ${LATER}`} /> : null}
      {GUIDE ? null : (
      <button type="button" className="btn btn--ghost btn--block" onClick={() => setOpen(!open)} aria-expanded={open}>
        <Icon name="users" size="1.05rem" /> 전체 방 배정 {open ? '접기' : '보기'}
      </button>
      )}
      {open && !GUIDE ? (
        <div className="roomtable" data-noswipe>
          {sorted.map(([label, list]) => (
            <div key={label} className="roomtable__row" data-me={list.some((s) => s.id === me?.id) || undefined}>
              <span className="roomtable__label mono">{label}</span>
              <span className="roomtable__names">
                {list.map((s) => (
                  <span key={s.id} data-class={s.classNo}>
                    {s.name}
                  </span>
                ))}
              </span>
            </div>
          ))}
          <p className="fineprint">선생님 방: {roster.teachers.map((t) => t.room).filter((r, i, a) => r && a.indexOf(r) === i).length}실. 층과 호수는 체크인 때 알려 줘요.</p>
        </div>
      ) : null}
    </div>
  )
}
