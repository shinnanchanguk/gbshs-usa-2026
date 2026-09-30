import { useEffect, useRef, useState } from 'react'
import { trip } from '../../content'
import { Icon } from '../../components/Icon'
import { CODE_LEN, normalizeCode, unlock, type Roster } from '../../lib/roster'

/**
 * 첫 화면. 담임 선생님께 받은 입장 코드를 넣으면 명단 암호문이 풀리고 안으로 들어간다.
 * 카톡으로 받은 링크(#/code/…)로 들어오면 코드를 자동으로 넣는다.
 */
export function EntryGate({ initialCode, onOpen }: { initialCode: string | null; onOpen: (roster: Roster) => void }) {
  const [code, setCode] = useState(initialCode ? normalizeCode(initialCode) : '')
  const [state, setState] = useState<'idle' | 'checking' | 'wrong'>('idle')
  const tried = useRef(false)

  async function submit(value: string) {
    const v = normalizeCode(value)
    if (v.length < CODE_LEN) return
    setState('checking')
    const roster = await unlock(v)
    if (roster) onOpen(roster)
    else setState('wrong')
  }

  useEffect(() => {
    if (initialCode && !tried.current) {
      tried.current = true
      void submit(initialCode)
    }
    // 링크로 들어온 첫 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode])

  // 4자리씩 끊어 보여 준다: XXXX-XXXX-XXXX
  const shown = code.match(/.{1,4}/g)?.join('-') ?? ''

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
        <form
          className="gate__form"
          onSubmit={(e) => {
            e.preventDefault()
            void submit(code)
          }}
        >
          <label className="gate__label" htmlFor="code">
            <Icon name="lock" size="1rem" /> 입장 코드 12자리
          </label>
          <input
            id="code"
            className="gate__input"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            inputMode="text"
            value={shown}
            maxLength={CODE_LEN + 2}
            onChange={(e) => {
              setCode(normalizeCode(e.target.value).slice(0, CODE_LEN))
              setState('idle')
            }}
            aria-invalid={state === 'wrong'}
            aria-describedby="code-help"
            placeholder="XXXX-XXXX-XXXX"
            disabled={state === 'checking'}
          />
          <p id="code-help" className={state === 'wrong' ? 'gate__error' : 'gate__help'} role={state === 'wrong' ? 'alert' : undefined}>
            {state === 'wrong'
              ? '코드가 맞지 않아요. 영문과 숫자 12자리를 다시 확인해 주세요.'
              : state === 'checking'
                ? '여는 중이에요. 잠깐만 기다려 주세요.'
                : '담임 선생님이 보내 준 링크를 누르거나 코드를 넣어 주세요. 한 번 열면 이 기기에서는 다시 묻지 않아요.'}
          </p>
          <button className="btn btn--primary btn--block" type="submit" disabled={code.length < CODE_LEN || state === 'checking'}>
            {state === 'checking' ? '여는 중' : '들어가기'}
          </button>
        </form>
      </div>
    </div>
  )
}
