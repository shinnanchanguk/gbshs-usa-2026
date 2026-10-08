import { useEffect, useRef, useState } from 'react'
import { trip } from '../../content'
import { Icon } from '../../components/Icon'
import { normalizeCode, unlock, type Roster } from '../../lib/roster'
import { exchangeTripPin, TRIP_PIN_LENGTH, ZudoError, ZUDO_HANDOFF_URL } from '../../lib/zudo'

/**
 * 첫 화면. ZUDO 로 들어오면(src/lib/zudo.ts) 이 화면을 거치지 않고 바로 열린다.
 * 아직 이 기기에서 열지 않았으면 ZUDO 로 보낸다. 비상용 PIN은 인터넷이 될 때 서버에서 확인한다.
 * 예전에 받은 긴 비상용 링크(#/code/…)도 그대로 열린다.
 */
export function EntryGate({
  initialCode,
  notice,
  onOpen,
}: {
  initialCode: string | null
  /** ZUDO 에서 넘어오다 실패했을 때 보여 줄 말 */
  notice?: string | null
  onOpen: (roster: Roster) => void
}) {
  const [code, setCode] = useState(initialCode && /^\d{6}$/.test(initialCode) ? initialCode : '')
  const [state, setState] = useState<'idle' | 'checking' | 'wrong'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const tried = useRef(false)
  const input = useRef<HTMLInputElement>(null)
  // 홈 화면에 추가한 앱으로 열었는지. 아이폰은 이 앱과 사파리의 저장 공간이 따로라 ZUDO 로그인이 사파리에 남는다.
  const standalone =
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true)

  async function submit(value: string, fromLink = false) {
    const v = normalizeCode(value)
    if (state === 'checking' || (!/^\d{6}$/.test(v) && !(fromLink && /^[0-9A-Z]{26}$/.test(v)))) return
    setState('checking')
    setError(null)
    try {
      const key = /^\d{6}$/.test(v) ? await exchangeTripPin(v) : v
      const roster = await unlock(key)
      if (!roster) throw new Error('roster_unavailable')
      onOpen(roster)
    } catch (e) {
      const message = e instanceof ZudoError && e.status === 401
        ? 'PIN이 맞지 않아요. 선생님께 받은 6자리 번호를 확인해 주세요.'
        : e instanceof ZudoError && e.status === 429
          ? 'PIN을 여러 번 넣어 잠시 잠겼어요. 15분 뒤 다시 넣거나 ZUDO로 로그인해 주세요.'
          : e instanceof ZudoError && e.status === 423
            ? '비상용 PIN이 잠겼어요. ZUDO로 로그인해 주세요.'
            : e instanceof ZudoError && (e.status === 404 || e.status === 410 || e.status === 503)
              ? '지금은 비상용 PIN으로 열 수 없어요. ZUDO로 로그인해 주세요.'
              : 'PIN을 확인하지 못했어요. 인터넷을 확인하거나 ZUDO로 로그인해 주세요.'
      setError(message)
      setState('wrong')
      setOpen(true)
      requestAnimationFrame(() => input.current?.select())
    }
  }

  useEffect(() => {
    if (initialCode && !tried.current) {
      tried.current = true
      void submit(initialCode, true)
    }
    // 링크로 들어온 첫 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode])

  return (
    <div className="gate">
      <div className="gate__inner">
        <h1 className="gate__title">
          <span className="gate__title-en">USA 2026</span>
          <span className="gate__title-ko">미국 동부 진로체험학습</span>
          <span className="gate__school">{trip.school}</span>
        </h1>
        <p className="gate__period">{trip.period}</p>
        <ol className="gate__route" aria-label="주요 방문지">
          {['인천', '예일', '하버드', 'MIT', '뉴욕', '프린스턴', '워싱턴'].map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ol>
        <div className="gate__form">
          {notice ? (
            <p className="gate__error" role="alert">
              {notice}
            </p>
          ) : null}
          <a className="btn btn--primary btn--block" href={ZUDO_HANDOFF_URL}>
            <Icon name="user" size="1.1rem" /> ZUDO로 로그인
          </a>
          <p className="gate__help">
            ZUDO로 로그인하면 PIN 없이 열려요. 한 번 들어오면 이 기기에서는 다시 묻지 않아요.
          </p>
          {standalone ? (
            <p className="gate__help">
              홈 화면에 둔 앱으로 열었다면 로그인이 사파리(또는 크롬)에서 열려요. 그 브라우저에서 이 안내를 계속 쓰면 돼요.
            </p>
          ) : null}

          <button type="button" className="gate__more" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            <Icon name="lock" size="0.95rem" /> 비상용 PIN으로 열기
          </button>
          {open ? (
            <form
              className="gate__code"
              onSubmit={(e) => {
                e.preventDefault()
                void submit(code)
              }}
            >
              <label className="gate__label" htmlFor="code">
                선생님께 받은 6자리 PIN
              </label>
              <input
                ref={input}
                id="code"
                className="gate__input"
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={TRIP_PIN_LENGTH}
                placeholder="6자리 숫자"
                spellCheck={false}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, '').slice(0, TRIP_PIN_LENGTH))
                  setError(null)
                  setState('idle')
                }}
                aria-invalid={state === 'wrong'}
                aria-describedby="code-help"
                readOnly={state === 'checking'}
                aria-busy={state === 'checking'}
              />
              <p id="code-help" className={state === 'wrong' ? 'gate__error' : 'gate__help'} role={state === 'wrong' ? 'alert' : undefined}>
                {state === 'wrong'
                  ? error
                  : state === 'checking'
                    ? '여는 중이에요. 잠깐만 기다려 주세요.'
                    : 'ZUDO로 들어오기 어려울 때만 써요. 처음 열 때는 인터넷이 필요해요.'}
              </p>
              <button className="btn btn--ghost btn--block" type="submit" disabled={code.length !== TRIP_PIN_LENGTH || state === 'checking'}>
                {state === 'checking' ? '여는 중' : 'PIN으로 열기'}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  )
}
