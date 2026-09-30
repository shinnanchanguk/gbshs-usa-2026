import { Fragment, type ReactNode } from 'react'
import { Icon } from './Icon'

/**
 * 안내 글 속 화살표(→)를 문자 대신 SVG 화살표로 그린다(화면 기호는 SVG 만 쓴다).
 * 내용 JSON 은 사람이 읽고 고치기 쉽게 "인천 → 뉴욕" 처럼 두고, 화면에 낼 때만 바꾼다.
 */
export function rich(text: string | undefined | null): ReactNode {
  if (!text) return text
  if (!text.includes('→')) return text
  const parts = text.split('→')
  return parts.map((p, i) => (
    <Fragment key={i}>
      {i > 0 ? (
        <>
          <Icon name="arrowRight" size="0.95em" strokeWidth={2} className="icon icon--inline" />
          <span className="sr-only">에서 </span>
        </>
      ) : null}
      {i > 0 ? p.replace(/^\s+/, '') : p.replace(/\s+$/, '')}
    </Fragment>
  ))
}
