import { hotelById, type DayPage, type SlidePage } from '../../content'
import { rich } from '../../components/Rich'
import { Icon, KIND_ICON, LEG_ICON } from '../../components/Icon'
import { goTo } from '../../lib/router'
import { duration } from '../../lib/time'
import { useApp } from '../../app/context'
import { timeText } from './parts'

/**
 * 일차 표지. 그날의 날짜·요약·식사·숙소와, 장소와 이동을 시간 순서로 잇는 시간 척추.
 * 척추의 한 줄을 누르면 그 장으로 간다.
 */
export function DayCover({ page }: { page: DayPage }) {
  const { day } = page
  const { me } = useApp()
  const slides = page.chapter.pages.filter((p): p is SlidePage => p.type === 'slide')
  const busMin = slides.reduce((n, p) => n + (p.slide.leg?.mode === 'bus' ? (p.slide.leg.minutes ?? 0) : 0), 0)
  const walkMin = slides.reduce((n, p) => n + (p.slide.leg?.mode === 'walk' ? (p.slide.leg.minutes ?? 0) : 0), 0)
  const places = new Set(slides.flatMap((p) => (p.slide.place ? [p.slide.place.name] : []))).size
  const hotel = day.hotel ? hotelById.get(day.hotel) : null
  const [, m, d] = (day.date ?? '0000-00-00').split('-').map(Number)

  return (
    <article className="page daycover">
      <header className="daycover__head">
        <p className="daycover__date">
          <span className="daycover__md mono">
            {m}.{String(d).padStart(2, '0')}
          </span>
          <span className="daycover__wd">{day.weekday}요일</span>
          <span className="daycover__n">{page.chapter.label}</span>
        </p>
        <h1 className="page__title">{rich(day.title)}</h1>
        <p className="daycover__region">
          <Icon name="pin" size="1rem" /> {day.region}
        </p>
      </header>
      <p className="lead">{rich(day.summary)}</p>

      <dl className="facts">
        <div>
          <dt>들르는 곳</dt>
          <dd className="mono">{places}곳</dd>
        </div>
        {busMin ? (
          <div>
            <dt>버스</dt>
            <dd className="mono">{duration(busMin)}</dd>
          </div>
        ) : null}
        {walkMin ? (
          <div>
            <dt>걷기</dt>
            <dd className="mono">{duration(walkMin)}</dd>
          </div>
        ) : null}
        {me ? (
          <div>
            <dt>내 버스</dt>
            <dd className="mono">{me.bus}호차 {me.seat}번</dd>
          </div>
        ) : null}
      </dl>

      {day.meals ? (
        <ul className="meals" aria-label="식사">
          {(['breakfast', 'lunch', 'dinner'] as const).map((k) =>
            day.meals?.[k] ? (
              <li key={k}>
                <span className="meals__k">{{ breakfast: '아침', lunch: '점심', dinner: '저녁' }[k]}</span>
                <span className="meals__v">{rich(day.meals[k])}</span>
              </li>
            ) : null,
          )}
        </ul>
      ) : null}

      <ol className="spine" aria-label={`${page.chapter.label} 일정`}>
        {slides.map((p) => {
          const t = timeText(p)
          return (
            <li key={p.key} className="spine__item">
              {p.slide.leg ? (
                <div className="spine__leg">
                  <Icon name={LEG_ICON[p.slide.leg.mode] ?? 'bus'} size="0.95rem" />
                  <span>{rich(p.slide.leg.text)}</span>
                </div>
              ) : null}
              <button type="button" className="spine__stop" onClick={() => goTo(p.key, { replace: true })}>
                <span className="spine__time mono">{p.slide.time?.start ?? ''}</span>
                <span className="spine__dot" data-kind={p.slide.kind} aria-hidden="true">
                  <Icon name={KIND_ICON[p.slide.kind] ?? 'pin'} size="0.85rem" />
                </span>
                <span className="spine__body">
                  <span className="spine__title">
                    {rich(p.slide.title)}
                    {p.slide.optional ? <span className="tag tag--quiet">선택</span> : null}
                  </span>
                  {t.stay ? <span className="spine__stay mono">{t.stay}</span> : null}
                </span>
                <Icon name="chevronRight" size="1rem" />
              </button>
            </li>
          )
        })}
      </ol>

      {hotel ? (
        <section className="card hotel-card">
          <div className="hotel-card__icon" aria-hidden="true">
            <Icon name="bed" />
          </div>
          <div>
            <h2 className="hotel-card__name">오늘 밤: {hotel.name}</h2>
            <p className="hotel-card__en">{hotel.nameEn}</p>
            <p className="hotel-card__addr">{hotel.address}</p>
            <a className="link" href={`tel:${hotel.phone.replace(/[^+\d]/g, '')}`}>
              <Icon name="phone" size="1rem" /> {hotel.phone}
            </a>
            {me ? <p className="hotel-card__me">내 방 배정 {me.room} · 실제 호수는 도착해서 알려 줘요</p> : null}
          </div>
        </section>
      ) : null}
    </article>
  )
}
