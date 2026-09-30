import { trip } from '../../content'
import { Icon } from '../../components/Icon'
import { useApp } from '../../app/context'

const tel = (p: string) => `tel:${p.replace(/[^+\d]/g, '')}`

/** 비상 연락처: 인솔 선생님(명단) → 위급 → 공관 → 여행사·학교. 교사 화면에는 업무 분장·야간 근무도. */
export function ContactsWidget() {
  const { roster, profile } = useApp()
  const teacherView = profile?.role === 'teacher'
  return (
    <div className="contacts">
      <ol className="ladder" aria-label="도움을 청하는 순서">
        {['다치거나 아프면 가까운 인솔 선생님께 바로 알려요', '선생님이 말하는 대로 움직여요', '생명이 위급하면 911'].map((s, i) => (
          <li key={s}>
            <span className="ladder__n mono">{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>

      <section className="card">
        <h3 className="card__title">
          <Icon name="users" size="1.05rem" /> 인솔 선생님
        </h3>
        <ul className="contact-list">
          {roster.teachers.map((t) => (
            <li key={t.name}>
              <span className="contact-list__name">
                {t.name}
                <span className="contact-list__sub">
                  {t.position ?? '교사'}
                  {t.bus ? ` · ${t.bus}호차` : ''}
                </span>
              </span>
              {t.phone ? (
                <a className="call" href={tel(t.phone)} aria-label={`${t.name} 선생님께 전화`}>
                  <Icon name="phone" size="1rem" />
                  <span className="mono">{t.phone}</span>
                </a>
              ) : null}
            </li>
          ))}
        </ul>
        <p className="fineprint">현지에서 쓸 번호가 따로 생기면 다시 알려 줘요.</p>
      </section>

      {trip.contacts.map((g) => (
        <section key={g.group} className="card">
          <h3 className="card__title">{g.group}</h3>
          <ul className="contact-list">
            {g.items.map((c) => (
              <li key={c.name}>
                <span className="contact-list__name">
                  {c.name}
                  {c.note ? <span className="contact-list__sub">{c.note}</span> : null}
                </span>
                <a className="call" href={tel(c.phone)} aria-label={`${c.name} 전화`}>
                  <Icon name="phone" size="1rem" />
                  <span className="mono">{c.phone}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {teacherView ? (
        <>
          <section className="card">
            <h3 className="card__title">인솔 업무 분장</h3>
            <dl className="duty">
              {Object.entries(roster.roles).map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v.join(', ')}</dd>
                </div>
              ))}
            </dl>
            <h3 className="card__title">화재·지진·환자 발생 때</h3>
            <dl className="duty">
              {Object.entries(roster.emergency).map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v.join(', ')}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="card">
            <h3 className="card__title">야간 근무 (2시간씩)</h3>
            <ol className="night" data-noswipe>
              {roster.nightDuty.map((d, i) => (
                <li key={i}>
                  <span className="mono">{d.date}</span>
                  <span className="mono">{d.time.replace('~', '–')}</span>
                  <span>{d.name}</span>
                </li>
              ))}
            </ol>
          </section>
        </>
      ) : null}
    </div>
  )
}
