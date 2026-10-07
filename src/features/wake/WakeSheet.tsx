import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { Sheet } from '../../components/Sheet'
import { useApp } from '../../app/context'
import { clock, dateLabel, instant } from '../../lib/time'
import { zudoFetch, useZudoSession } from '../../lib/zudo'
import { defaultWakeDate, expandRooms, minus, WAKE_DAYS, WAKE_LABEL, WAKE_LEAD_MIN, type WakeStatus } from './schedule'

type Check = { room: string; status: WakeStatus; checked_by: string; updated_at: string }
type Helper = { student_number: string; rooms: string[] }

const ORDER: (WakeStatus | 'none')[] = ['unreachable', 'none', 'kakao', 'face']

/**
 * 아침 기상 확인(10/7 회의).
 * 기상 도우미: 맡은 방마다 세 가지 중 하나를 누른다. 선생님: 그날 모든 방 현황, 마감 뒤 '연락 안 됨'·'아직'이 위로.
 * 기록은 ZUDO 서버에 남아 선생님 휴대폰에 바로 보인다(인터넷이 필요하다).
 */
export function WakeSheet({ onClose }: { onClose: () => void }) {
  const { roster, me, at } = useApp()
  const zudo = useZudoSession()
  const isTeacher = zudo?.me.role === 'teacher'
  const [date, setDate] = useState(() => defaultWakeDate(clock(at, 'EDT').ymd))
  const [checks, setChecks] = useState<Record<string, Check>>({})
  const [helpers, setHelpers] = useState<Helper[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'offline' | 'denied'>('loading')
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState('')

  const day = WAKE_DAYS.find((d) => d.date === date)!
  const deadline = minus(day.depart, WAKE_LEAD_MIN)
  const overdue = at.getTime() >= instant(date, deadline).getTime()

  const load = useCallback(async () => {
    try {
      const res = await zudoFetch(`/api/trip/wake?date=${date}`)
      if (res.status === 403 || res.status === 401) return setState('denied')
      if (!res.ok) return setState('offline')
      const body = (await res.json()) as { checks: Check[]; helpers?: Helper[] }
      setChecks(Object.fromEntries(body.checks.map((c) => [c.room, c])))
      setHelpers(body.helpers ?? [])
      setState('ready')
    } catch {
      setState('offline')
    }
  }, [date])

  useEffect(() => {
    setState('loading')
    void load()
    const id = window.setInterval(() => void load(), 20_000)
    return () => window.clearInterval(id)
  }, [load])

  const myRooms = useMemo(() => (isTeacher ? [] : expandRooms(me?.wakeupRooms)), [isTeacher, me])
  const allRooms = useMemo(() => {
    const set = new Set(roster.students.map((s) => s.room).filter(Boolean))
    return [...set].sort((a, b) => a.localeCompare(b, 'ko') || Number(a.slice(2)) - Number(b.slice(2)))
  }, [roster])
  const rooms = isTeacher ? allRooms : myRooms
  const occupants = (room: string) => roster.students.filter((s) => s.room === room).sort((a, b) => a.id.localeCompare(b.id))
  const helperOf = (room: string) => {
    const h = helpers.find((x) => x.rooms.includes(room))
    return h ? roster.students.find((s) => s.id === h.student_number) : undefined
  }

  const statusOf = (room: string): WakeStatus | 'none' => checks[room]?.status ?? 'none'
  const shown = isTeacher ? [...rooms].sort((a, b) => ORDER.indexOf(statusOf(a)) - ORDER.indexOf(statusOf(b)) || allRooms.indexOf(a) - allRooms.indexOf(b)) : rooms
  const count = (s: WakeStatus | 'none') => rooms.filter((r) => statusOf(r) === s).length

  async function mark(room: string, status: WakeStatus) {
    const next = checks[room]?.status === status ? null : status
    setSaving(room)
    setError('')
    try {
      const res = await zudoFetch('/api/trip/wake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, room, status: next }),
      })
      if (!res.ok) throw new Error(String(res.status))
      setChecks((prev) => {
        const copy = { ...prev }
        if (next) copy[room] = { room, status: next, checked_by: me?.id ?? 'teacher', updated_at: new Date().toISOString() }
        else delete copy[room]
        return copy
      })
    } catch {
      setError('저장하지 못했어요. 인터넷이 되는지 보고 다시 눌러 주세요.')
    } finally {
      setSaving(null)
    }
  }

  return (
    <Sheet title={isTeacher ? '기상 확인 현황' : '오늘 아침 기상 확인'} onClose={onClose}>
      <div className="wake">
        <div className="wake__dates" role="radiogroup" aria-label="날짜">
          {WAKE_DAYS.map((d) => (
            <button key={d.date} type="button" role="radio" aria-checked={d.date === date} data-on={d.date === date || undefined} className="classpick__btn" onClick={() => setDate(d.date)}>
              {dateLabel(d.date)}
            </button>
          ))}
        </div>
        <p className="wake__deadline">
          <Icon name="clock" size="1rem" /> 출발 {day.depart} · 확인 마감 <strong className="mono">{deadline}</strong>
          {overdue ? <span className="wake__late">마감 지남</span> : null}
        </p>

        {state === 'denied' ? <p className="fineprint">기상 도우미와 인솔 선생님만 볼 수 있어요. ZUDO로 다시 들어와 주세요.</p> : null}
        {state === 'offline' ? <p className="gate__error">인터넷이 안 돼서 불러오지 못했어요. 호텔 와이파이에 연결한 뒤 다시 열어 주세요.</p> : null}
        {state === 'loading' ? <p className="fineprint">불러오는 중이에요.</p> : null}

        {state === 'ready' ? (
          <>
            <p className="wake__sum">
              {(['unreachable', 'none', 'kakao', 'face'] as const).map((s) => (
                <span key={s} data-s={s}>
                  {s === 'none' ? '아직' : WAKE_LABEL[s]} <strong className="mono">{count(s)}</strong>
                </span>
              ))}
            </p>
            {!isTeacher && rooms.length === 0 ? <p className="fineprint">맡은 방이 없어요. 담임 선생님께 확인해 주세요.</p> : null}
            {error ? (
              <p className="gate__error" role="alert">
                {error}
              </p>
            ) : null}
            <ul className="wake__rooms">
              {shown.map((room) => {
                const st = statusOf(room)
                const people = occupants(room)
                const helper = isTeacher ? helperOf(room) : undefined
                return (
                  <li key={room} className="wake__room" data-s={st} data-late={(overdue && (st === 'none' || st === 'unreachable')) || undefined}>
                    <div className="wake__head">
                      <strong className="wake__no">{room}</strong>
                      <span className="wake__who">{people.map((p) => `${p.classNo}-${p.no} ${p.name}`).join(', ') || '배정 없음'}</span>
                    </div>
                    {helper ? <p className="wake__helper">기상 도우미 {helper.classNo}-{helper.no} {helper.name}</p> : null}
                    <div className="wake__btns">
                      {(['face', 'kakao', 'unreachable'] as const).map((s) => (
                        <button key={s} type="button" className="wake__btn" data-s={s} aria-pressed={st === s} disabled={saving === room} onClick={() => void mark(room, s)}>
                          {st === s ? <Icon name={s === 'unreachable' ? 'alert' : 'check'} size="0.95rem" /> : null}
                          {WAKE_LABEL[s]}
                        </button>
                      ))}
                    </div>
                  </li>
                )
              })}
            </ul>
            <button type="button" className="btn btn--ghost btn--block" onClick={() => void load()}>
              <Icon name="refresh" size="1rem" /> 새로 불러오기
            </button>
          </>
        ) : null}
        <p className="fineprint">
          {isTeacher
            ? '기상 도우미가 누르면 20초 안에 여기 보여요. 연락 안 됨과 아직 안 누른 방부터 찾아가 주세요.'
            : '출발 30분 전까지 맡은 방을 모두 눌러 주세요. 연락이 안 되는 방은 바로 담임 선생님께 알려요.'}
        </p>
      </div>
    </Sheet>
  )
}
