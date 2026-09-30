import { useState } from 'react'
import { Sheet } from '../../components/Sheet'
import { NOTICE_BODY_MAX, NOTICE_TITLE_MAX, type Notice } from '../../lib/repo'

/** 선생님이 공지를 새로 올리거나 고치는 창 */
export function NoticeEditor({
  initial,
  author,
  onSave,
  onClose,
}: {
  initial: Notice | null
  author: string
  onSave: (title: string, body: string) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [body, setBody] = useState(initial?.body ?? '')
  const ready = title.trim().length > 0 && body.trim().length > 0

  return (
    <Sheet title={initial ? '공지 고치기' : '공지하기'} onClose={onClose}>
      <form
        className="notice-form"
        data-noswipe
        onSubmit={(e) => {
          e.preventDefault()
          if (ready) onSave(title.trim().slice(0, NOTICE_TITLE_MAX), body.trim().slice(0, NOTICE_BODY_MAX))
        }}
      >
        <label className="notice-form__label" htmlFor="notice-title">
          제목
        </label>
        <input
          id="notice-title"
          className="notice-form__input"
          value={title}
          maxLength={NOTICE_TITLE_MAX}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 내일 아침 집합 시간이 바뀌었어요"
          autoComplete="off"
        />
        <label className="notice-form__label" htmlFor="notice-body">
          내용
          <span className="mono notice-form__count">
            {body.length} / {NOTICE_BODY_MAX}
          </span>
        </label>
        <textarea
          id="notice-body"
          className="notice-form__input notice-form__area"
          value={body}
          maxLength={NOTICE_BODY_MAX}
          rows={7}
          onChange={(e) => setBody(e.target.value)}
          placeholder="학생들이 알아야 할 내용을 적어 주세요."
        />
        <p className="notice-form__author">
          올리는 사람 <strong>{author} 선생님</strong>
        </p>
        {initial ? <p className="fineprint">고친 공지는 '다시 보지 않기'를 누른 학생에게도 한 번 더 떠요.</p> : null}
        <button type="submit" className="btn btn--primary btn--block" disabled={!ready}>
          {initial ? '고친 내용 올리기' : '올리기'}
        </button>
        <p className="fineprint">지금은 이 휴대폰에서만 보여요. 나중에 로그인이 생기면 학생들 휴대폰에도 떠요.</p>
      </form>
    </Sheet>
  )
}
