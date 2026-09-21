import { deck, dayLabel } from '../../content'
import { useFeedback } from '../../app/state'
import { buildPrompt } from '../../lib/prompt'
import { slideHref } from '../../lib/router'
import { CopyButton, FeedbackBox, FeedbackList } from './FeedbackBox'

/** 이 기기에 저장된 피드백을 모두 모아 보고, 한 번에 프롬프트로 복사한다. */
export function FeedbackPage() {
  const { items } = useFeedback()
  const order = new Map(deck.map((s) => [s.id, s.index]))
  const sorted = [...items].sort((a, b) => (order.get(a.slideId ?? '') ?? -1) - (order.get(b.slideId ?? '') ?? -1) || a.createdAt.localeCompare(b.createdAt))
  const bySlide = deck.filter((s) => items.some((f) => f.slideId === s.id))

  return (
    <div className="page">
      <header className="page__head">
        <p className="section-label">피드백 모아보기</p>
        <h1 className="page__title">선생님 피드백</h1>
        <p className="page__lead">
          여기 적은 피드백은 이 기기에만 저장돼요. <strong>전체 프롬프트 복사</strong>를 눌러 담당 선생님께 보내 주시면, 어느 슬라이드의 어떤 내용인지까지 함께 전달돼 바로 반영할 수 있어요.
        </p>
        <div className="page__actions">
          <CopyButton text={() => buildPrompt(sorted)} label={`전체 프롬프트 복사 (${items.length})`} className="btn btn--primary" />
        </div>
      </header>

      <FeedbackBox slideId={null} title="사이트 전체 피드백" />

      {bySlide.length > 0 && (
        <section className="page__section">
          <h2 className="pane__title">슬라이드별 피드백</h2>
          {bySlide.map((s) => (
            <div key={s.id} className="pane fb-group">
              <a className="fb-group__title" href={slideHref(s.id)}>
                {dayLabel(s.day)} · {s.order}. {s.title}
              </a>
              <FeedbackList items={items.filter((f) => f.slideId === s.id)} />
            </div>
          ))}
        </section>
      )}
      {items.length === 0 && <p className="field__help">아직 남긴 피드백이 없어요. 슬라이드 아래 입력창이나 위 칸에 적어 보세요.</p>}
    </div>
  )
}
