import { useEffect } from 'react'
import { days, hotelById, trip } from '../../content'
import { dateLabel } from '../../lib/time'
import { WAKE_DAYS, WAKE_LEAD_MIN, minus } from '../wake/schedule'
import './print.css'

/** 이 PDF 를 만든 날(빌드 시각). 바뀐 내용은 사이트·카톡 공지를 따른다고 적는다. */
const BUILT = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric' })

const rules = days.find((d) => d.n === 0)?.slides.find((s) => s.widget === 'rules')

/**
 * 인터넷이 없을 때 보는 공통 안내 PDF 의 원본 화면(#/print).
 * 이름·자리·방·연락처 같은 명단은 넣지 않는다(공개 파일). 빌드 때 scripts/build-offline-pdf.mjs 가 A4 PDF 로 뜬다.
 * 내 정보 쪽은 휴대폰에서 단추를 누를 때 앞에 붙인다(personalPdf.ts).
 */
export function PrintGuide() {
  useEffect(() => {
    // 사이트 바탕색(종이색)이 PDF 빈자리에 비치지 않게 인쇄 화면에서만 흰 바탕으로 둔다
    document.documentElement.classList.add('printing')
    void document.fonts.ready.then(() => document.body.setAttribute('data-print-ready', '1'))
  }, [])

  return (
    <main className="print">
      <header className="print__cover">
        <p className="print__eyebrow">USA 2026 · 오프라인 안내</p>
        <h1>{trip.subtitle}</h1>
        <p>
          {trip.school} · {trip.period}
        </p>
        <p className="print__note">인터넷이 안 될 때 보는 안내예요. {BUILT} 기준이라, 바뀐 내용은 선생님 카톡 공지와 안내 사이트를 따라요.</p>
      </header>

      <section className="print__block">
        <h2>비상 연락처</h2>
        {trip.contacts.map((g) => (
          <div key={g.group} className="print__group">
            <h3>{g.group}</h3>
            <ul>
              {g.items.map((c) => (
                <li key={c.name}>
                  <strong>{c.name}</strong> <span className="print__mono">{c.phone}</span>
                  {c.note ? <span className="print__muted"> · {c.note}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="print__block">
        <h2>숙소와 항공편</h2>
        <ul className="print__list">
          {trip.hotels.map((h) => (
            <li key={h.id}>
              <strong>{h.name}</strong> ({h.nameEn}) · {h.nights.map((n) => dateLabel(n)).join(', ')} 밤
              <br />
              <span className="print__mono">{h.address}</span> · <span className="print__mono">{h.phone}</span>
            </li>
          ))}
          {trip.flights.map((f) => (
            <li key={f.id}>
              <strong>{f.code}</strong> {f.from} → {f.to} · 출발 {f.depart} · 도착 {f.arrive} · {f.duration}
            </li>
          ))}
        </ul>
      </section>

      <section className="print__block">
        <h2>아침 출발</h2>
        <p className="print__muted">기상 도우미는 출발 {WAKE_LEAD_MIN}분 전까지 확인을 마치고, 모두 출발 20분 전까지 버스에 와요.</p>
        <table className="print__table">
          <thead>
            <tr>
              <th>날짜</th>
              <th>기상 확인 마감</th>
              <th>버스에 오는 시각</th>
              <th>출발</th>
            </tr>
          </thead>
          <tbody>
            {WAKE_DAYS.map((d) => (
              <tr key={d.date}>
                <td>{dateLabel(d.date)}</td>
                <td className="print__mono">{minus(d.depart, WAKE_LEAD_MIN)}</td>
                <td className="print__mono">{minus(d.depart, 20)}</td>
                <td className="print__mono">{d.depart}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {days
        .filter((d) => d.n >= 1 && d.n <= 9)
        .map((d) => {
          const hotel = d.hotel ? hotelById.get(d.hotel) : undefined
          return (
            <section key={d.n} className="print__day">
              <h2>
                {d.n}일차 {d.date ? dateLabel(d.date, d.weekday) : ''} · {d.region}
              </h2>
              <p className="print__muted">
                {d.title}
                {hotel ? ` · 숙소 ${hotel.name}` : ''}
                {d.meals ? ` · 아침 ${d.meals.breakfast ?? '-'} · 점심 ${d.meals.lunch ?? '-'} · 저녁 ${d.meals.dinner ?? '-'}` : ''}
              </p>
              <table className="print__table">
                <tbody>
                  {d.slides.map((s) => (
                    <tr key={s.id}>
                      <td className="print__mono print__time">
                        {s.time ? `${s.time.start}${s.time.end ? `–${s.time.end}` : ''}${s.time.tz === 'KST' ? ' 한국' : ''}` : ''}
                      </td>
                      <td>
                        <strong>{s.title}</strong>
                        {s.optional ? <span className="print__muted"> (선택)</span> : null}
                        {s.place?.address ? (
                          <>
                            <br />
                            <span className="print__mono">{s.place.address}</span>
                          </>
                        ) : null}
                        {s.meeting ? (
                          <>
                            <br />
                            <span className="print__meet">
                              다시 모이는 곳: {s.meeting.place}
                              {s.meeting.time ? ` · ${s.meeting.time}` : ''}
                            </span>
                          </>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )
        })}

      {rules ? (
        <section className="print__block">
          <h2>꼭 지킬 약속</h2>
          <ol className="print__list">
            {rules.details.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="print__block">
        <h2>챙길 것</h2>
        {trip.checklist.map((g) => (
          <div key={g.group} className="print__group">
            <h3>{g.group}</h3>
            <p>{g.items.map((i) => i.label).join(' · ')}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
