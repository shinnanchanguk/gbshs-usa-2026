import type { Notice } from '../../lib/repo'

/** 공지 한 건. 학생 팝업과 선생님 팝업 관리가 같은 모양을 쓴다. */
export function NoticeCard({ notice, compact = false, titleId }: { notice: Notice; compact?: boolean; titleId?: string }) {
  const edited = notice.updatedAt !== notice.createdAt
  return (
    <article className="notice" data-compact={compact || undefined}>
      <h3 className="notice__title" id={titleId}>
        {notice.title}
      </h3>
      <p className="notice__meta">
        <span className="notice__author">{notice.author} 선생님</span>
        <span className="mono">{stamp(notice.createdAt)}</span>
        {edited ? (
          <span className="notice__edited">
            {notice.editedBy ? `${notice.editedBy} 선생님이 ` : ''}고침 <span className="mono">{stamp(notice.updatedAt)}</span>
          </span>
        ) : null}
      </p>
      <p className="notice__body">{notice.body}</p>
    </article>
  )
}

/** 이 휴대폰 시계 기준 "10월 1일 21:30" */
export function stamp(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${hh}:${mm}`
}
