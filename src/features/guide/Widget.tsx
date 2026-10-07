import { useState } from 'react'
import { rich } from '../../components/Rich'
import { chapters, trip, type SlidePage, type Widget as WidgetName } from '../../content'
import { Icon } from '../../components/Icon'
import { useApp } from '../../app/context'
import { useChecklist } from '../../lib/repo'
import { goTo } from '../../lib/router'
import { clock, daysUntil } from '../../lib/time'
import { BusWidget } from '../roster/BusWidget'
import { GUIDE, LATER } from '../../lib/edition'
import { LaterNote } from './LaterNote'
import { RoomsWidget } from '../roster/RoomsWidget'
import { ContactsWidget } from './ContactsWidget'
import { MentorsWidget } from './MentorsWidget'
import { ReportWidget } from '../reflection/ReportWidget'
import { TicketWidget } from '../ticket/TicketWidget'

export function Widget({ name, page }: { name: WidgetName; page: SlidePage }) {
  switch (name) {
    case 'cover':
      return <CoverWidget />
    case 'deadlines':
      return <DeadlinesWidget />
    case 'forms':
      return <FormsWidget />
    case 'checklist':
      return <ChecklistWidget />
    case 'money':
      return <TipWidget />
    case 'bus':
      return GUIDE ? <LaterNote icon="seat" title="버스 자리" text={`호차·자리·옆자리 친구와 도우미 역할은 ${LATER}`} /> : <BusWidget />
    case 'rooms':
    case 'hotels':
      return <RoomsWidget />
    case 'contacts':
      return <ContactsWidget />
    case 'mentors':
      return <MentorsWidget />
    case 'report':
      return <ReportWidget />
    case 'ticket':
      return GUIDE ? <LaterNote icon="plane" title="내 항공권" text="학생마다 왕복 항공권이 한 장씩 있어요. 출발 전에 ZUDO로 로그인하면 내 것만 보고 내려받을 수 있어요." /> : <TicketWidget />
    case 'rules':
      return <RulesBadge page={page} />
    default:
      return null
  }
}

function CoverWidget() {
  const { at } = useApp()
  const d = daysUntil(trip.startDate, at)
  const travel = chapters.filter((c) => c.n >= 1 && c.n <= 9)
  return (
    <div className="cover">
      <div className="cover__hero">
        <p className="cover__title">
          <span className="cover__en">USA 2026</span>
          <span className="cover__ko">6박 9일 · 미국 동부</span>
        </p>
        <p className="cover__count mono">{d > 0 ? `D-${d}` : d === 0 ? '오늘 출발' : travel.some((c) => c.day.date === clock(at, 'EDT').ymd) ? '여행 중' : '다녀왔어요'}</p>
      </div>
      <dl className="facts facts--cover">
        <div>
          <dt>대학</dt>
          <dd className="mono">4곳</dd>
        </div>
        <div>
          <dt>숙소</dt>
          <dd className="mono">{trip.hotels.length}곳</dd>
        </div>
        <div>
          <dt>학생</dt>
          <dd className="mono">100명</dd>
        </div>
        <div>
          <dt>버스</dt>
          <dd className="mono">2대</dd>
        </div>
      </dl>
      <ol className="cover__days">
        {travel.map((c) => (
          <li key={c.n}>
            <button type="button" onClick={() => goTo(c.pages[0].key)}>
              <span className="cover__day-n mono">{String(c.n).padStart(2, '0')}</span>
              <span className="cover__day-date mono">
                {c.day.date?.slice(5).replace('-', '/')} {c.day.weekday}
              </span>
              <span className="cover__day-title">{rich(c.day.title)}</span>
              <Icon name="chevronRight" size="1rem" />
            </button>
          </li>
        ))}
      </ol>
      <div className="flights">
        {trip.flights.map((f) => (
          <div key={f.id} className="flight">
            <span className="flight__code mono">
              <Icon name="plane" size="1rem" /> {f.code}
            </span>
            <span className="flight__route">
              {rich(`${f.from} → ${f.to}`)}
            </span>
            <span className="flight__times mono">
              {f.depart} 출발 · {f.arrive} 도착
            </span>
            <span className="flight__dur">{f.duration}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DeadlinesWidget() {
  const { at, profile } = useApp()
  const role = profile?.role ?? 'student'
  const today = clock(at, 'KST').ymd
  const WHO = { all: '모두', student: '학생', parent: '보호자', teacher: '교사' } as const
  const list = trip.deadlines.filter((d) => role === 'teacher' || d.who !== 'teacher')
  const nextIdx = list.findIndex((d) => d.date >= today)
  return (
    <ol className="deadlines">
      {list.map((d, i) => {
        const left = daysUntil(d.date, at)
        const [, m, day] = d.date.split('-').map(Number)
        const wd = ['일', '월', '화', '수', '목', '금', '토'][new Date(Date.UTC(2026, m - 1, day)).getUTCDay()]
        return (
          <li key={d.date + d.title} className="deadline" data-past={d.date < today || undefined} data-next={i === nextIdx || undefined}>
            <span className="deadline__date mono">
              {m}/{day}
              <span className="deadline__wd">{wd}</span>
            </span>
            <span className="deadline__body">
              <span className="deadline__title">
                {d.title}
                <span className="tag tag--quiet">{WHO[d.who]}</span>
              </span>
              <span className="deadline__detail">
                {d.time ? <span className="mono">{d.time} · </span> : null}
                {rich(d.detail)}
              </span>
            </span>
            {i === nextIdx && left >= 0 ? <span className="deadline__left mono">{left === 0 ? '오늘' : `D-${left}`}</span> : null}
          </li>
        )
      })}
    </ol>
  )
}

function FormsWidget() {
  return (
    <div className="forms">
      {trip.forms.map((f) => (
        <section key={f.id} className="card form">
          <h2 className="form__title">
            <Icon name="document" /> {f.title}
          </h2>
          <p className="form__what">{f.what}</p>
          <ol className="form__steps">
            {f.steps.map((s) => (
              <li key={s.field}>
                <span className="form__field">{s.field}</span>
                <span className="form__write">{rich(s.write)}</span>
                {s.example ? <span className="form__example mono">{s.example}</span> : null}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}

function ChecklistWidget() {
  const [checks, setChecks] = useChecklist()
  const all = trip.checklist.flatMap((g) => g.items)
  const done = all.filter((i) => checks[i.id]).length
  return (
    <div className="checklist" data-noswipe>
      <div className="checklist__progress">
        <span className="mono">
          {done} / {all.length}
        </span>
        <span className="checklist__bar" aria-hidden="true">
          <span style={{ transform: `scaleX(${done / all.length})` }} />
        </span>
        <span className="sr-only">
          {all.length}개 가운데 {done}개 챙겼어요
        </span>
      </div>
      {trip.checklist.map((g) => (
        <fieldset key={g.group} className="checklist__group">
          <legend>{g.group}</legend>
          {g.items.map((i) => (
            <label key={i.id} className="check" data-done={checks[i.id] || undefined}>
              <input type="checkbox" checked={!!checks[i.id]} onChange={(e) => setChecks((c) => ({ ...c, [i.id]: e.target.checked }))} />
              <span className="check__box" aria-hidden="true">
                <Icon name="check" size="0.9rem" strokeWidth={2.4} />
              </span>
              <span className="check__text">
                <span className="check__label">{i.label}</span>
                {i.detail ? <span className="check__detail">{i.detail}</span> : null}
              </span>
            </label>
          ))}
        </fieldset>
      ))}
      <p className="fineprint">체크한 것은 이 휴대폰에만 저장돼요.</p>
    </div>
  )
}

/** 자유식 가격 가늠: 메뉴 가격 + 세금(대략) + 팁 */
function TipWidget() {
  const [price, setPrice] = useState('15')
  const [tip, setTip] = useState(18)
  const p = Number(price.replace(/[^\d.]/g, '')) || 0
  const tax = p * 0.08
  const total = p + tax + (p * tip) / 100
  return (
    <section className="card calc" data-noswipe>
      <h2 className="calc__title">
        <Icon name="wallet" /> 메뉴 가격으로 실제 낼 돈 가늠하기
      </h2>
      <div className="calc__row">
        <label className="calc__field">
          <span>메뉴 가격</span>
          <span className="calc__input">
            <span className="mono">$</span>
            <input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} aria-label="메뉴 가격(달러)" />
          </span>
        </label>
        <div className="calc__tips" role="radiogroup" aria-label="팁 비율">
          {[15, 18, 20].map((t) => (
            <button key={t} type="button" role="radio" aria-checked={tip === t} className="seg" data-on={tip === t || undefined} onClick={() => setTip(t)}>
              팁 {t}%
            </button>
          ))}
        </div>
      </div>
      <p className="calc__result">
        <span>세금(약 8%) 더하고 팁 {tip}%까지</span>
        <strong className="mono">약 ${total.toFixed(2)}</strong>
      </p>
      <p className="fineprint">세금은 주마다 달라서 대략으로 계산했어요. 팁은 가게가 요구할 때도 있고 아닐 때도 있으니 영수증과 계산 화면을 보고 정해요. 여행사가 주는 25달러로는 {total > 25 ? '조금 모자라요' : '낼 수 있어요'}.</p>
    </section>
  )
}

function RulesBadge({ page }: { page: SlidePage }) {
  return (
    <div className="rule-banner" role="note">
      <Icon name="shield" size="1.4rem" />
      <p>
        이 약속 {page.slide.details.length}가지는 <strong>100명이 함께 움직이기 위한 최소한</strong>이에요. 한 사람이 어기면 다음 일정의 자유 시간부터 줄어들어요.
      </p>
    </div>
  )
}

