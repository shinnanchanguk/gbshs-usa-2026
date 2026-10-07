import { useEffect, useRef, useState } from 'react'
import { trip } from '../../content'
import { Icon } from '../../components/Icon'
import { CODE_LEN, normalizeCode, unlock, type Roster } from '../../lib/roster'
import { ZUDO_HANDOFF_URL } from '../../lib/zudo'

/**
 * 첫 화면. ZUDO 로 들어오면(src/lib/zudo.ts) 이 화면을 거치지 않고 바로 열린다.
 * 아직 이 기기에서 열지 않았으면 ZUDO 로 보내고, 선생님께 받은 비상용 링크(#/code/…)나 코드로도 열 수 있다.
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
  const [code, setCode] = useState(initialCode ? normalizeCode(initialCode) : '')
  const [state, setState] = useState<'idle' | 'checking' | 'wrong'>('idle')
  const [open, setOpen] = useState(false)
  const tried = useRef(false)
  const input = useRef<HTMLInputElement>(null)

  async function submit(value: string) {
    const v = normalizeCode(value)
    if (v.length < CODE_LEN) return
    setState('checking')
    const roster = await unlock(v)
    if (roster) onOpen(roster)
    else {
      setState('wrong')
      setOpen(true)
      requestAnimationFrame(() => input.current?.select())
    }
  }

  useEffect(() => {
    if (initialCode && !tried.current) {
      tried.current = true
      void submit(initialCode)
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
            ZUDO에 로그인하면 내 자리·방·항공권이 바로 열려요. 한 번 들어오면 이 기기에서는 다시 묻지 않아요.
          </p>

          <button type="button" className="gate__more" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            <Icon name="lock" size="0.95rem" /> 선생님께 받은 코드로 열기
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
                코드 붙여 넣기
              </label>
              <input
                ref={input}
                id="code"
                className="gate__input gate__input--long"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                value={code}
                onChange={(e) => {
                  setCode(normalizeCode(e.target.value))
                  setState('idle')
                }}
                aria-invalid={state === 'wrong'}
                aria-describedby="code-help"
                readOnly={state === 'checking'}
                aria-busy={state === 'checking'}
              />
              <p id="code-help" className={state === 'wrong' ? 'gate__error' : 'gate__help'} role={state === 'wrong' ? 'alert' : undefined}>
                {state === 'wrong'
                  ? '코드가 맞지 않아요. 받은 코드를 그대로 붙여 넣었는지 확인해 주세요.'
                  : state === 'checking'
                    ? '여는 중이에요. 잠깐만 기다려 주세요.'
                    : '선생님이 보내 준 링크를 누르면 저절로 열려요.'}
              </p>
              <button className="btn btn--ghost btn--block" type="submit" disabled={code.length < CODE_LEN || state === 'checking'}>
                {state === 'checking' ? '여는 중' : '코드로 열기'}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  )
}
