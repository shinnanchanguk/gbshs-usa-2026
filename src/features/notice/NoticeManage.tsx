import { useState } from 'react'
import { Icon } from '../../components/Icon'
import { Sheet } from '../../components/Sheet'
import type { Notice } from '../../lib/repo'
import { NoticeCard } from './NoticeCard'

/** 선생님 팝업 관리: 떠 있는 공지를 보고 고치거나 지운다. 어느 선생님이든 모든 공지를 관리할 수 있다. */
export function NoticeManage({
  notices,
  onCompose,
  onEdit,
  onDelete,
  onPreview,
  onClose,
}: {
  notices: Notice[]
  onCompose: () => void
  onEdit: (n: Notice) => void
  onDelete: (n: Notice) => void
  onPreview: () => void
  onClose: () => void
}) {
  const [confirming, setConfirming] = useState<string | null>(null)

  return (
    <Sheet title="팝업 관리" onClose={onClose}>
      <div className="notice-manage" data-noswipe>
        <div className="notice-manage__top">
          <button type="button" className="btn btn--primary" onClick={onCompose}>
            <Icon name="megaphone" size="1.1rem" /> 공지하기
          </button>
          <button type="button" className="btn btn--ghost" onClick={onPreview} disabled={notices.length === 0}>
            학생 화면으로 보기
          </button>
        </div>

        {notices.length === 0 ? (
          <p className="notice-manage__empty">떠 있는 공지가 없어요. 「공지하기」로 올리면 학생 화면에 팝업으로 떠요.</p>
        ) : (
          <>
            <h3 className="menu__h">떠 있는 공지 {notices.length}건</h3>
            <ul className="notice-manage__list">
              {notices.map((n) => (
                <li key={n.id} className="notice-manage__item">
                  <NoticeCard notice={n} compact />
                  {confirming === n.id ? (
                    <div className="notice-manage__actions" role="group" aria-label="지울지 확인">
                      <span className="notice-manage__ask">이 공지를 지울까요?</span>
                      <button type="button" className="btn btn--sm btn--ghost" onClick={() => setConfirming(null)}>
                        그대로 두기
                      </button>
                      <button
                        type="button"
                        className="btn btn--sm btn--danger"
                        onClick={() => {
                          setConfirming(null)
                          onDelete(n)
                        }}
                      >
                        지우기
                      </button>
                    </div>
                  ) : (
                    <div className="notice-manage__actions">
                      <button type="button" className="btn btn--sm btn--ghost" onClick={() => onEdit(n)}>
                        <Icon name="pen" size="1rem" /> 고치기
                      </button>
                      <button type="button" className="btn btn--sm btn--ghost" onClick={() => setConfirming(n.id)}>
                        <Icon name="trash" size="1rem" /> 지우기
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="fineprint">지금은 이 휴대폰에서만 보여요. 나중에 로그인이 생기면 학생들 휴대폰에도 떠요.</p>
      </div>
    </Sheet>
  )
}
