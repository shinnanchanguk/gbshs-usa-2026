import { KIND_LABEL, canRecord, pageAt, pages, type SlidePage } from '../../content'
import { rich } from '../../components/Rich'
import { Icon, KIND_ICON } from '../../components/Icon'
import { useApp } from '../../app/context'
import { goTo } from '../../lib/router'
import { AttendancePanel } from '../attendance/AttendancePanel'
import { ReflectBox } from '../reflection/ReflectBox'
import { ChildRecord } from '../record/ChildRecord'
import { GUIDE } from '../../lib/edition'
import { TeacherNotes } from '../teacher/TeacherNotes'
import { Widget } from '../guide/Widget'
import { LegChip, MeetingPass, Photos, Section, kstText, mapsLink, timeText } from './parts'

export function SlideView({ page }: { page: SlidePage }) {
  const { slide } = page
  const { profile, me, at } = useApp()
  const role = profile?.role ?? 'student'
  const t = timeText(page)
  const kst = kstText(page)
  const live = pageAt(at)
  const isLive = live.page?.key === page.key && live.state === 'live'
  const isNext = live.page?.key === page.key && live.state === 'next'
  const next = pages[page.index + 1]
  const maps = mapsLink(page)
  const pos = page.chapter.pages.indexOf(page) + 1

  return (
    <article className="page" data-kind={slide.kind}>
      <header className="page__head">
        {t.range ? (
          <p className="page__meta">
            <span className="page__time mono">{rich(t.range)}</span>
            {t.stay ? <span className="page__stay mono">{t.stay}</span> : null}
            <span className="page__kind">
              <Icon name={KIND_ICON[slide.kind] ?? 'info'} size="0.95rem" />
              {KIND_LABEL[slide.kind]}
            </span>
          </p>
        ) : null}
        {isLive || isNext || slide.optional ? (
          <p className="page__flags">
            {isLive ? <span className="tag tag--live">지금 진행 중</span> : null}
            {isNext ? <span className="tag tag--next">곧 시작</span> : null}
            {slide.optional ? <span className="tag tag--quiet">선택 일정 · 일정이 밀리면 빠질 수 있어요</span> : null}
          </p>
        ) : null}
        <h1 className="page__title">{rich(slide.title)}</h1>
        {slide.place ? (
          <p className="page__place">
            <Icon name="pin" size="1rem" />
            <span>
              {slide.place.name}
              {slide.place.nameEn ? <span className="page__place-en"> · {slide.place.nameEn}</span> : null}
            </span>
            {maps ? (
              <a className="page__maps" href={maps} target="_blank" rel="noreferrer noopener">
                지도 앱
                <Icon name="external" size="0.9rem" />
              </a>
            ) : null}
          </p>
        ) : null}
        {kst && role === 'parent' ? <p className="page__kst mono">{kst}</p> : null}
      </header>

      <LegChip page={page} />
      <Photos page={page} />
      <p className="lead">{rich(slide.summary)}</p>
      {kst && role !== 'parent' ? <p className="page__kst page__kst--quiet mono">{kst}</p> : null}

      {slide.meeting ? <MeetingPass meeting={slide.meeting} /> : null}

      {slide.busNotes ? (
        <div className="busnotes">
          {(['1', '2'] as const).map((b) => (
            <div key={b} className="busnotes__card" data-mine={me?.bus === Number(b) || undefined}>
              <span className="busnotes__bus mono">{b}호차{me?.bus === Number(b) ? ' · 내 버스' : ''}</span>
              <p>{rich(slide.busNotes![b])}</p>
            </div>
          ))}
        </div>
      ) : null}

      {slide.widget ? <Widget name={slide.widget} page={page} /> : null}

      {slide.details.length ? (
        <Section title={slide.widget ? '더 알아 둘 것' : '이렇게 해요'} icon="list">
          <ol className="steps">
            {slide.details.map((d, i) => (
              <li key={i}>{rich(d)}</li>
            ))}
          </ol>
        </Section>
      ) : null}

      {slide.notices.length ? (
        <Section title="꼭 지켜요" icon="alert" tone="warn">
          <ul className="bullets">
            {slide.notices.map((d, i) => (
              <li key={i}>{rich(d)}</li>
            ))}
          </ul>
        </Section>
      ) : null}

      {slide.tips.length ? (
        <Section title="답사 다녀온 선생님의 요령" icon="bulb" tone="tip">
          <ul className="bullets">
            {slide.tips.map((d, i) => (
              <li key={i}>{rich(d)}</li>
            ))}
          </ul>
        </Section>
      ) : null}

      {slide.links.length ? (
        <div className="links">
          {slide.links.map((l) => (
            <a key={l.url} className="chip-link" href={l.url} target="_blank" rel="noreferrer noopener">
              {l.label}
              <Icon name="external" size="0.9rem" />
            </a>
          ))}
        </div>
      ) : null}

      {role === 'student' && canRecord(page) && !GUIDE ? <ReflectBox page={page} /> : null}
      {role === 'parent' && canRecord(page) && !GUIDE ? <ChildRecord page={page} /> : null}
      {role === 'teacher' && slide.attendance ? <AttendancePanel page={page} /> : null}
      {role === 'teacher' ? <TeacherNotes page={page} /> : null}

      {next ? (
        <button type="button" className="next-card" onClick={() => goTo(next.key, { replace: true })}>
          <span className="next-card__label">
            다음 장 <span className="mono">{String(pos).padStart(2, '0')}/{String(page.chapter.pages.length).padStart(2, '0')}</span>
          </span>
          <span className="next-card__title">
            {next.type === 'slide' && next.slide.time ? <span className="mono">{next.slide.time.start}</span> : null}
            {next.type === 'slide' ? rich(next.slide.title) : rich(`${next.chapter.label} · ${next.day.title}`)}
          </span>
          {next.type === 'slide' && next.slide.leg ? <span className="next-card__leg">{rich(next.slide.leg.text)}</span> : null}
          <Icon name="arrowRight" />
        </button>
      ) : null}
    </article>
  )
}
