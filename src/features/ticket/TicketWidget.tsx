import { useEffect, useState } from 'react'
import { trip } from '../../content'
import { Icon } from '../../components/Icon'
import { useApp } from '../../app/context'
import { saveBlob } from '../../lib/fileSave'
import { downloadTicket, getTicket, savedTicket } from '../../lib/ticketStore'
import { useZudoSession, ZUDO_HANDOFF_URL, ZudoError } from '../../lib/zudo'

/** 받은 PDF 를 새 탭에서 연다. 기다리는 동안 막히지 않게 창을 먼저 연다. */
function openBlob(blob: Blob, win: Window | null, name: string) {
  // 새 창을 못 열었으면(홈 화면 앱 등) 이 화면을 PDF 로 바꾸지 않고 파일로 내려받게 한다(돌아올 길이 없어지지 않게)
  if (!win) return saveBlob(blob, name)
  const url = URL.createObjectURL(blob)
  win.location.href = url
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

function message(e: unknown): string {
  if (e instanceof ZudoError && e.status === 404) return '아직 항공권 파일이 올라오지 않았어요. 담임 선생님께 알려 주세요.'
  if (e instanceof ZudoError && (e.status === 401 || e.status === 403)) return 'ZUDO로 다시 로그인해 주세요.'
  if (e instanceof ZudoError && e.status >= 500) return 'ZUDO가 잠깐 답하지 않아요. 조금 뒤 다시 눌러 주세요. 이 기기에 저장된 항공권은 그대로 열려요.'
  return '인터넷이 안 돼서 받지 못했어요. 한 번 받아 두면 다음부터는 인터넷 없이 열려요.'
}

/**
 * 내 전자항공권(10/7 회의: 학생마다 공항에서 각자 체크인, 사이트에서 자기 것만 보고 내려받기).
 * 학생은 자기 것, 보호자는 자녀 것, 선생님은 반·번호를 골라 본다. 볼 수 있는지는 ZUDO 가 판정한다.
 */
export function TicketWidget() {
  const { profile, me, roster } = useApp()
  const zudo = useZudoSession()
  const isTeacher = profile?.role === 'teacher'
  const [classNo, setClassNo] = useState(profile?.classNo ?? 1)
  const [pick, setPick] = useState<string>('')
  const target = isTeacher ? pick : (me?.id ?? '')
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    setError('')
    if (!target) return setSaved(false)
    void savedTicket(target).then((b) => alive && setSaved(!!b))
    return () => {
      alive = false
    }
  }, [target])

  if (!zudo)
    return (
      <section className="card ticket">
        <h3 className="card__title">
          <Icon name="plane" /> 내 항공권
        </h3>
        <p className="ticket__text">공항에서 각자 체크인할 때 보여 주는 항공권이에요. ZUDO로 로그인하면 내 것을 보고 내려받을 수 있어요.</p>
        <a className="btn btn--primary btn--block" href={ZUDO_HANDOFF_URL}>
          ZUDO로 로그인
        </a>
      </section>
    )

  const name = `USA2026_${target}_항공권.pdf`
  async function view() {
    if (!target) return
    const win = window.open('', '_blank')
    setBusy(true)
    setError('')
    try {
      const blob = await getTicket(target)
      setSaved(true)
      openBlob(blob, win, name)
    } catch (e) {
      win?.close()
      setError(message(e))
    } finally {
      setBusy(false)
    }
  }
  async function save() {
    if (!target) return
    setBusy(true)
    setError('')
    try {
      // 인터넷이 되면 새로 받아(선생님이 고쳐 올렸을 수 있다) 저장하고, 안 되면 저장해 둔 것을 쓴다
      const blob = await downloadTicket(target).catch(async (e) => {
        const kept = await getTicket(target).catch(() => null)
        if (kept && saved) return kept
        throw e
      })
      setSaved(true)
      saveBlob(blob, name)
    } catch (e) {
      setError(message(e))
    } finally {
      setBusy(false)
    }
  }

  const who = isTeacher ? roster.students.find((s) => s.id === pick) : me
  return (
    <section className="card ticket">
      <h3 className="card__title">
        <Icon name="plane" /> {isTeacher ? '학생 항공권' : profile?.role === 'parent' ? '우리 아이 항공권' : '내 항공권'}
      </h3>
      <p className="ticket__text">
        {trip.flights.map((f) => `${f.code} ${f.depart}`).join(' · ')}. 왕복이 한 장에 있어요. 공항에서 여권과 함께 이 화면을 보여 주면 돼요.
      </p>

      {isTeacher ? (
        <div className="ticket__pick">
          <div className="classpick" role="radiogroup" aria-label="반">
            {trip.classes.map((c) => (
              <button key={c.no} type="button" role="radio" aria-checked={classNo === c.no} className="classpick__btn" data-on={classNo === c.no || undefined} data-class={c.no} onClick={() => setClassNo(c.no)}>
                {c.no}반
              </button>
            ))}
          </div>
          <select className="ticket__select" value={pick} onChange={(e) => setPick(e.target.value)} aria-label="학생 고르기">
            <option value="">학생을 골라 주세요</option>
            {roster.students
              .filter((s) => s.classNo === classNo)
              .sort((a, b) => a.no - b.no)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.no}번 {s.name}
                </option>
              ))}
          </select>
        </div>
      ) : null}

      {target ? (
        <>
          <p className="ticket__who">
            {who ? `${who.classNo}반 ${who.no}번 ${who.name}` : target}
            <span className="ticket__state">{saved ? '이 기기에 저장됨 · 인터넷 없이 열려요' : '아직 이 기기에 없어요'}</span>
          </p>
          <div className="ticket__btns">
            <button type="button" className="btn btn--primary" onClick={() => void view()} disabled={busy}>
              <Icon name="document" size="1.05rem" /> 항공권 열기
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => void save()} disabled={busy}>
              <Icon name="download" size="1.05rem" /> 내려받기
            </button>
          </div>
        </>
      ) : !isTeacher ? (
        <p className="fineprint">내 정보에서 이름이 정해지면 보여요.</p>
      ) : null}
      {error ? (
        <p className="gate__error" role="alert">
          {error}
        </p>
      ) : null}
      <p className="fineprint">이름·항공권 번호가 들어 있어요. 다른 사람에게 보내지 마세요.</p>
    </section>
  )
}
