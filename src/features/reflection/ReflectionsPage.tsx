import { dayDateLabel, dayLabel, deck, days } from '../../content'
import { studentKey, useProfile, useReflections } from '../../app/state'
import { slideHref } from '../../lib/router'
import { CopyButton } from '../feedback/FeedbackBox'

/** 학생이 쓴 소감을 일차별로 모아 보고 한꺼번에 복사한다. */
export function ReflectionsPage() {
  const [profile] = useProfile()
  const { book } = useReflections()
  if (profile?.role !== 'student') {
    return (
      <div className="page">
        <p className="notice notice--warn">소감 모아보기는 학생 역할에서 볼 수 있어요. 아래쪽 역할 단추에서 학생으로 바꿔 보세요.</p>
      </div>
    )
  }
  const mine = book[studentKey(profile.classNo, profile.studentNo)] ?? {}
  const written = deck.filter((s) => mine[s.id]?.text)

  const asText = () =>
    [
      `${profile.classNo}반 ${profile.studentNo}번 · 미국 진로체험학습 소감`,
      '',
      ...days.flatMap((d) => {
        const list = written.filter((s) => s.day.n === d.n)
        if (!list.length) return []
        const head = d.n === 0 ? `[${d.title}]` : `[${dayLabel(d)} ${dayDateLabel(d)}] ${d.title}`
        return [head, ...list.map((s) => `- ${s.title}: ${mine[s.id].text}`), '']
      }),
    ].join('\n')

  return (
    <div className="page">
      <header className="page__head">
        <p className="section-label">
          {profile.classNo}반 {profile.studentNo}번
        </p>
        <h1 className="page__title">내 소감 모아보기</h1>
        <p className="page__lead">이 기기에 저장된 소감이에요. 보고서를 쓸 때 전체 복사해서 쓰세요.</p>
        <div className="page__actions">
          <CopyButton text={asText} label={`전체 복사 (${written.length})`} className="btn btn--primary" />
        </div>
      </header>
      {days.map((d) => {
        const list = written.filter((s) => s.day.n === d.n)
        if (!list.length) return null
        return (
          <section key={d.n} className="page__section">
            <h2 className="pane__title">{d.n === 0 ? d.title : `${dayLabel(d)} ${dayDateLabel(d)} · ${d.title}`}</h2>
            {list.map((s) => (
              <article key={s.id} className="pane">
                <a className="fb-group__title" href={slideHref(s.id)}>
                  {s.title}
                </a>
                <p className="fb-item__text">{mine[s.id].text}</p>
              </article>
            ))}
          </section>
        )
      })}
      {written.length === 0 && <p className="field__help">아직 쓴 소감이 없어요. 슬라이드마다 아래쪽 "느낀 점" 칸에 적어 보세요.</p>}
    </div>
  )
}
