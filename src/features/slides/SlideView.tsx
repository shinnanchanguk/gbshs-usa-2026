import { useEffect, useRef, useState } from 'react'
import { KIND_LABEL, dayDateLabel, dayLabel, deck, photoSize, photoUrl, timeLabel, videoUrl, type DeckSlide } from '../../content'
import type { Profile } from '../../app/state'
import { goToSlide } from '../../lib/router'
import { PhotoLightbox } from './PhotoLightbox'
import { SlideActions, type SlidePanel } from './SlideActions'
import { IconArrowLeft, IconArrowRight, IconClock, IconPhoto, IconPin, IconWarning } from '../../components/Icon'

const THUMBS_SHOWN = 6

/**
 * 슬라이드 한 장: 시간·제목·대표 사진·설명·유의사항.
 * 출석 체크·피드백·느낀 점은 제목 아래 단추를 눌러야 창으로 뜬다.
 */
export function SlideView({ slide, profile, onOpen }: { slide: DeckSlide; profile: Profile; onOpen: (panel: SlidePanel) => void }) {
  const [lightbox, setLightbox] = useState<number | null>(null)
  const touch = useRef<{ x: number; y: number; t: number } | null>(null)
  const prev = deck[slide.index - 1]
  const next = deck[slide.index + 1]
  const coverIndex = Math.max(0, slide.photos.findIndex((p) => p.id === slide.cover))
  const cover = slide.photos[coverIndex]
  const others = slide.photos.filter((_, i) => i !== coverIndex)
  const teacher = profile.role === 'teacher'
  const size = cover ? photoSize(cover.id) : null

  useEffect(() => setLightbox(null), [slide.id])

  return (
    <article
      className="slide"
      aria-labelledby="slide-title"
      onTouchStart={(e) => {
        const target = e.target as HTMLElement
        if (target.closest('input, textarea, select, .att-grid, .trip-map')) return
        touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() }
      }}
      onTouchEnd={(e) => {
        const t = touch.current
        touch.current = null
        if (!t) return
        const dx = e.changedTouches[0].clientX - t.x
        const dy = e.changedTouches[0].clientY - t.y
        if (Date.now() - t.t < 700 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.8) {
          const target = dx < 0 ? next : prev
          if (target) goToSlide(target.id)
        }
      }}
    >
      <header className="slide__head">
        <p className="section-label slide__crumb">
          <span>
            {dayLabel(slide.day)}
            {slide.day.date && ` · ${dayDateLabel(slide.day)}`}
          </span>
          <span>
            {slide.order} / {slide.day.slides.length}
          </span>
        </p>
        <div className="slide__meta">
          {slide.time && (
            <span className="time-badge">
              <IconClock size="1rem" />
              {timeLabel(slide)}
            </span>
          )}
          <span className="chip">{KIND_LABEL[slide.kind]}</span>
        </div>
        <h1 className="slide__title" id="slide-title">
          {slide.title}
        </h1>
        {slide.place && (
          <p className="slide__place">
            <IconPin size="1rem" />
            <span>
              {slide.place.name}
              {slide.place.nameEn && slide.place.nameEn !== slide.place.name && <span className="slide__place-en"> {slide.place.nameEn}</span>}
            </span>
          </p>
        )}
        <SlideActions slide={slide} profile={profile} onOpen={onOpen} />
      </header>

      {cover && (
        <figure className="slide__cover">
          <button type="button" className="slide__cover-btn" onClick={() => setLightbox(coverIndex)} aria-label={`사진 크게 보기: ${cover.caption}`}>
            <img
              src={photoUrl(cover.id) ?? ''}
              alt={cover.caption}
              width={size?.w}
              height={size?.h}
              decoding="async"
              fetchPriority="high"
            />
          </button>
          <figcaption>{cover.caption}</figcaption>
        </figure>
      )}

      {others.length > 0 && (
        <div className="thumbs">
          {others.slice(0, THUMBS_SHOWN).map((p) => {
            const i = slide.photos.indexOf(p)
            return (
              <button key={p.id} type="button" className="thumbs__item" data-video={!!videoUrl(p.id)} onClick={() => setLightbox(i)} aria-label={`${videoUrl(p.id) ? '동영상 보기' : '사진 크게 보기'}: ${p.caption}`}>
                <img src={photoUrl(p.id, 'thumb') ?? ''} alt="" loading="lazy" decoding="async" />
              </button>
            )
          })}
          <button type="button" className="thumbs__more" onClick={() => setLightbox(coverIndex)}>
            <IconPhoto size="1.1rem" />
            사진 {slide.photos.length}장 모두 보기
          </button>
        </div>
      )}

      <p className="slide__summary">{slide.summary}</p>

      {slide.details.length > 0 && (
        <section className="slide__flow" aria-labelledby="flow-title">
          <h2 className="slide__section-title" id="flow-title">
            {slide.kind === 'info' ? '알아 둘 것' : '이렇게 진행돼요'}
          </h2>
          <ol className="slide__details" data-numbered={slide.kind !== 'info'}>
            {slide.details.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ol>
        </section>
      )}

      {slide.meeting && (
        <div className="notice notice--lock slide__meeting">
          <IconPin size="1.1rem" />
          <p>
            <strong>집결</strong> {slide.meeting.time && <span className="slide__meeting-time">{slide.meeting.time}</span>} {slide.meeting.place}
            {slide.meeting.note && <span className="slide__meeting-note"> · {slide.meeting.note}</span>}
          </p>
        </div>
      )}

      {slide.notices.length > 0 && (
        <div className="notice notice--warn slide__notices">
          <IconWarning size="1.1rem" />
          <div>
            <strong>유의사항</strong>
            <ul>
              {slide.notices.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {teacher && (slide.teacherNotes.length > 0 || slide.changes.length > 0) && (
        <div className="notice teacher-note">
          <div>
            <strong>교사 메모</strong>
            <ul>
              {slide.changes.map((c, i) => (
                <li key={`c${i}`}>
                  <span className="chip chip--change">운영계획과 다름</span> {c}
                </li>
              ))}
              {slide.teacherNotes.map((n, i) => (
                <li key={`n${i}`}>{n}</li>
              ))}
            </ul>
          </div>
        </div>
      )}


      {next && (
        <a className="next-step" href={`#/s/${next.id}`}>
          <span className="next-step__label">{next.day.n !== slide.day.n ? `다음 · ${dayLabel(next.day)}${next.day.date ? ` ${dayDateLabel(next.day)}` : ''}` : '다음 일정'}</span>
          <span className="next-step__body">
            {next.time && <strong className="next-step__time">{next.time.start}</strong>}
            {next.title}
            {next.place && next.place.name !== next.title && <span className="next-step__place"> · {next.place.name}</span>}
          </span>
          <IconArrowRight size="1rem" />
        </a>
      )}

      <nav className="slide__pager" aria-label="슬라이드 넘기기">
        {prev ? (
          <a className="pager-link" href={`#/s/${prev.id}`}>
            <IconArrowLeft size="1rem" />
            <span>
              <small>이전</small>
              {prev.title}
            </span>
          </a>
        ) : (
          <span />
        )}
        {next && (
          <a className="pager-link pager-link--next" href={`#/s/${next.id}`}>
            <span>
              <small>{next.day.n !== slide.day.n ? `다음 · ${dayLabel(next.day)}` : '다음'}</small>
              {next.title}
            </span>
            <IconArrowRight size="1rem" />
          </a>
        )}
      </nav>

      {lightbox !== null && slide.photos.length > 0 && <PhotoLightbox photos={slide.photos} start={lightbox} onClose={() => setLightbox(null)} />}
    </article>
  )
}
