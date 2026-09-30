import { useState } from 'react'
import { Sheet } from '../../components/Sheet'
import { NOTICE_BODY_MAX, NOTICE_TITLE_MAX, type Notice } from '../../lib/repo'

/** 쓰다 만 공지. 창 밖을 잘못 눌러 닫혀도 다시 열면 이어서 쓴다(사이트를 새로 열면 사라진다). */
const drafts = new Map<string, { title: string; body: string; alsoParents: boolean }>()

/** 선생님이 공지를 새로 올리거나 고치는 창 */
export function NoticeEditor({
  initial,
  author,
  onSave,
  onClose,
}: {
  initial: Notice | null
  author: string
  onSave: (title: string, body: string, alsoParents: boolean) => void
  onClose: () => void
}) {
  const draftKey = initial?.id ?? 'new'
  const start = drafts.get(draftKey) ?? { title: initial?.title ?? '', body: initial?.body ?? '', alsoParents: initial?.alsoParents === true }
  const [title, setTitle] = useState(start.title)
  const [body, setBody] = useState(start.body)
  const [alsoParents, setAlsoParents] = useState(start.alsoParents)

  const keep = (next: Partial<{ title: string; body: string; alsoParents: boolean }>) => drafts.set(draftKey, { title, body, alsoParents, ...next })
  const filled = title.trim().length > 0 && body.trim().length > 0
  const changed = !initial || title.trim() !== initial.title || body.trim() !== initial.body || alsoParents !== (initial.alsoParents === true)
  const ready = filled && changed

  return (
    <Sheet title={initial ? '공지 고치기' : '공지하기'} onClose={onClose}>
      <form
        className="notice-form"
        data-noswipe
        onSubmit={(e) => {
          e.preventDefault()
          if (!ready) return
          drafts.delete(draftKey)
          onSave(title.trim().slice(0, NOTICE_TITLE_MAX), body.trim().slice(0, NOTICE_BODY_MAX), alsoParents)
        }}
      >
        <div className="notice-form__label">
          <label htmlFor="notice-title">제목</label>
          <span className="mono notice-form__count" id="notice-title-count">
            {title.length} / {NOTICE_TITLE_MAX}
          </span>
        </div>
        <input
          id="notice-title"
          className="notice-form__input"
          value={title}
          maxLength={NOTICE_TITLE_MAX}
          onChange={(e) => {
            setTitle(e.target.value)
            keep({ title: e.target.value })
          }}
          placeholder="예: 내일 아침 집합 시간이 바뀌었어요"
          autoComplete="off"
          aria-describedby="notice-title-count"
        />
        <div className="notice-form__label">
          <label htmlFor="notice-body">내용</label>
          <span className="mono notice-form__count" id="notice-body-count">
            {body.length} / {NOTICE_BODY_MAX}
          </span>
        </div>
        <textarea
          id="notice-body"
          className="notice-form__input notice-form__area"
          value={body}
          maxLength={NOTICE_BODY_MAX}
          rows={7}
          onChange={(e) => {
            setBody(e.target.value)
            keep({ body: e.target.value })
          }}
          placeholder="학생들이 알아야 할 내용을 적어 주세요."
          aria-describedby="notice-body-count"
        />
        <label className="notice-form__check">
          <input
            type="checkbox"
            checked={alsoParents}
            onChange={(e) => {
              setAlsoParents(e.target.checked)
              keep({ alsoParents: e.target.checked })
            }}
          />
          <span>
            보호자 화면에도 띄우기
            <span className="notice-form__check-sub">체크하지 않으면 학생에게만 떠요.</span>
          </span>
        </label>
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
