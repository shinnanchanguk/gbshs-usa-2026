import { useState } from 'react'
import { rich } from '../../components/Rich'
import { pageByKey, trip, type SlidePage } from '../../content'
import { Icon } from '../../components/Icon'
import { useApp } from '../../app/context'
import { useReflections } from '../../lib/repo'
import { copyText } from '../../lib/clipboard'
import { goTo } from '../../lib/router'
import { dateLabel } from '../../lib/time'

/**
 * 발표회 보고서 초안. 장마다 쓴 느낀 점을 활동 주제별로 모아 보여 주고, 주제마다 한 가지 이상 채웠는지 알려 준다.
 * 복사하거나 공유(카톡 등)로 담임 선생님께 보낼 수 있다.
 */
export function ReportWidget() {
  const [book] = useReflections()
  const { me, profile } = useApp()
  const [done, setDone] = useState<string | null>(null)

  const entries = Object.entries(book)
    .map(([key, r]) => ({ page: pageByKey.get(key) as SlidePage | undefined, r }))
    .filter((e): e is { page: SlidePage; r: (typeof book)[string] } => !!e.page && e.page.type === 'slide')
    .sort((a, b) => a.page.index - b.page.index)

  const byTheme = trip.themes.map((t) => ({ theme: t, items: entries.filter((e) => e.r.themes.includes(t.id)) }))
  const covered = byTheme.filter((g) => g.items.length).length

  const draft = [
    '2026 해외 이공계 진로체험학습 느낀 점',
    me ? `${me.classNo}반 ${me.no}번 ${me.name}` : '',
    '',
    ...byTheme.flatMap((g) =>
      g.items.length
        ? [`[${g.theme.label}]`, ...g.items.map((e) => `- ${e.page.day.date ? dateLabel(e.page.day.date, e.page.day.weekday) + ' ' : ''}${e.page.slide.title}: ${e.r.text.trim()}`), '']
        : [],
    ),
    ...(entries.some((e) => !e.r.themes.length) ? ['[주제를 고르지 않은 글]', ...entries.filter((e) => !e.r.themes.length).map((e) => `- ${e.page.slide.title}: ${e.r.text.trim()}`)] : []),
  ]
    .filter((l, i, a) => !(l === '' && a[i - 1] === ''))
    .join('\n')
    .trim()

  if (profile?.role && profile.role !== 'student') {
    return (
      <p className="hint">
        <Icon name="info" size="1rem" /> 학생이 장마다 적은 느낀 점이 이 장에서 활동 주제별로 모여요. 지금은 학생 휴대폰에만 저장되고, 학생이 복사하거나 보내기로 담임 선생님께 전해요.
      </p>
    )
  }

  return (
    <div className="report">
      <div className="coverage" aria-label="활동 주제 채움">
        <p className="coverage__head">
          <span className="mono">
            {covered} / {trip.themes.length}
          </span>{' '}
          주제에 한 가지 이상 썼어요
        </p>
        <ul className="coverage__list">
          {byTheme.map((g) => (
            <li key={g.theme.id} data-done={g.items.length > 0 || undefined}>
              <span className="coverage__mark" aria-hidden="true">
                {g.items.length ? <Icon name="check" size="0.8rem" strokeWidth={2.6} /> : null}
              </span>
              <span className="coverage__label">{g.theme.label}</span>
              <span className="coverage__n mono">{g.items.length}</span>
              {!g.items.length ? <span className="coverage__hint">{g.theme.hint}</span> : null}
            </li>
          ))}
        </ul>
      </div>

      {entries.length ? (
        <>
          <div className="report__actions" data-noswipe>
            <button
              type="button"
              className="btn btn--primary"
              onClick={async () => {
                const ok = await copyText(draft)
                setDone(ok ? '초안을 복사했어요. 보고서 문서에 붙여 넣으세요.' : '복사가 막혔어요. 아래 글을 길게 눌러 복사하세요.')
              }}
            >
              <Icon name="copy" size="1.05rem" /> 초안 복사
            </button>
            {typeof navigator !== 'undefined' && 'share' in navigator ? (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => navigator.share({ title: '느낀 점', text: draft }).catch(() => undefined)}
              >
                <Icon name="share" size="1.05rem" /> 담임 선생님께 보내기
              </button>
            ) : null}
          </div>
          {done ? (
            <p className="reflect__status" role="status">
              {done}
            </p>
          ) : null}
          <pre className="report__draft" data-noswipe>
            {draft}
          </pre>
          <ol className="report__list">
            {entries.map((e) => (
              <li key={e.page.key}>
                <button type="button" onClick={() => goTo(e.page.key)}>
                  <span className="report__where">
                    {e.page.chapter.label} · {rich(e.page.slide.title)}
                  </span>
                  <span className="report__text">{e.r.text}</span>
                </button>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p className="hint">
          <Icon name="pen" size="1rem" /> 아직 적은 느낀 점이 없어요. 대학·특강·박물관 장 아래의 「느낀 점」 칸에 쓰면 여기로 모여요.
        </p>
      )}
    </div>
  )
}
