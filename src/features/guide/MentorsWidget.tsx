import { trip } from '../../content'
import { Icon } from '../../components/Icon'
import { useApp } from '../../app/context'

/** 대학별 멘토 수·조 편성과 MIT 멘토 전공. 이름은 명단(입장 코드)에서만 */
export function MentorsWidget() {
  const { roster } = useApp()
  return (
    <div className="mentors">
      {trip.mentors.map((m) => (
        <section key={m.school} className="card mentor">
          <h3 className="mentor__school">
            <Icon name="campus" size="1.05rem" /> {m.school}
            <span className="mentor__count mono">멘토 {m.count}</span>
          </h3>
          <p className="mentor__grouping">{m.grouping}</p>
          {m.school === 'MIT' ? (
            <ol className="mentor__list">
              {m.majors.map((x, i) => {
                const named = roster.mentorsMIT[i]
                return (
                  <li key={i}>
                    <span className="mentor__field">{x.field}</span>
                    <span className="mentor__detail">{x.detail}</span>
                    <span className="mentor__from">
                      {named?.name ? `${named.name} · ` : ''}
                      {x.from}
                    </span>
                  </li>
                )
              })}
            </ol>
          ) : m.majors.length === 0 ? (
            <p className="fineprint">멘토 명단은 여행사가 보내 주면 알려 줘요.</p>
          ) : null}
        </section>
      ))}
    </div>
  )
}
