import { useState } from 'react'
import { useFeedback, useProfile, type FeedbackItem } from '../../app/state'
import { buildPrompt, formatDateTime } from '../../lib/prompt'
import { copyText } from '../../lib/clipboard'
import { IconCopy, IconMessage, IconSend, IconTrash } from '../../components/Icon'

/** "복사됨" 표시를 잠깐 띄우는 복사 단추 */
export function CopyButton({ text, label = '프롬프트 복사', className = 'btn btn--ghost' }: { text: () => string; label?: string; className?: string }) {
  const [state, setState] = useState<'idle' | 'ok' | 'fail'>('idle')
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        const ok = await copyText(text())
        setState(ok ? 'ok' : 'fail')
        window.setTimeout(() => setState('idle'), 1800)
      }}
    >
      <IconCopy size="1rem" />
      {state === 'ok' ? '복사됨' : state === 'fail' ? '복사 실패' : label}
    </button>
  )
}

export function FeedbackList({ items }: { items: FeedbackItem[] }) {
  const { remove } = useFeedback()
  if (!items.length) return null
  return (
    <ul className="fb-list">
      {items.map((item) => (
        <li key={item.id} className="fb-item">
          <p className="fb-item__meta">
            <strong>{item.author || '이름 없음'}</strong> · {formatDateTime(item.createdAt)}
          </p>
          <p className="fb-item__text">{item.text}</p>
          <div className="fb-item__actions">
            <CopyButton text={() => buildPrompt([item])} />
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                if (window.confirm('이 피드백을 지울까요?')) remove(item.id)
              }}
            >
              <IconTrash size="1rem" /> 지우기
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}

/**
 * 채팅 프롬프트처럼 생긴 피드백 입력창.
 * slideId 가 null 이면 사이트 전체에 대한 피드백이다.
 */
export function FeedbackBox({ slideId, title, showTitle = true }: { slideId: string | null; title: string; showTitle?: boolean }) {
  const { items, add } = useFeedback()
  const [profile, setProfile] = useProfile()
  const [text, setText] = useState('')
  const author = profile?.role === 'teacher' ? profile.name : ''
  const [nameDraft, setNameDraft] = useState(author)
  const mine = items.filter((f) => f.slideId === slideId)

  function submit() {
    if (!text.trim()) return
    const name = nameDraft.trim()
    if (profile?.role === 'teacher' && name !== profile.name) setProfile({ ...profile, name })
    add(slideId, name, text)
    setText('')
  }

  return (
    <section className="prompt" aria-label={title}>
      {showTitle && (
        <p className="prompt__label">
          <IconMessage size="1.05rem" /> {title}
          {mine.length > 0 && <span className="chip">{mine.length}</span>}
        </p>
      )}
      {!author && (
        <input
          className="field__input prompt__name"
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          placeholder="이름 (피드백에 함께 적혀요)"
          maxLength={20}
          aria-label="이름"
        />
      )}
      <form
        className="prompt__box"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <textarea
          className="prompt__input"
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              submit()
            }
          }}
          placeholder={slideId ? '이 슬라이드에서 고칠 점·더할 점을 적어 주세요 (Enter 저장, Shift+Enter 줄바꿈)' : '사이트 전체에 대한 의견을 적어 주세요'}
          aria-label={title}
        />
        <button type="submit" className="prompt__send" disabled={!text.trim()} aria-label="피드백 저장">
          <IconSend size="1.1rem" />
        </button>
      </form>
      <FeedbackList items={mine} />
    </section>
  )
}
