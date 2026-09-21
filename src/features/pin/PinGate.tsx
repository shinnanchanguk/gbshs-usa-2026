import { useState } from 'react'
import { sha256Hex } from '../../lib/sha256'
import { IconLock } from '../../components/Icon'
import { trip } from '../../content'

/** 입장 번호(PIN)의 SHA-256. 번호를 바꾸려면 새 번호의 SHA-256 값으로 이 줄을 바꾼다 (README 참고). */
export const PIN_HASH = '6f97ae955d64057a7819cba2fa4b5a9a67acd73848e2191229da298cb39f7891'

/**
 * 첫 화면 잠금.
 * 번호는 화면을 가리는 용도일 뿐이다. 사이트 파일 자체는 공개 레포에 있으므로
 * 개인정보(학생 이름·연락처 등)는 애초에 넣지 않는다.
 */
export function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)
  const [checking, setChecking] = useState(false)

  async function check(value: string) {
    setChecking(true)
    const ok = (await sha256Hex(value)) === PIN_HASH
    setChecking(false)
    if (ok) onUnlock()
    else {
      setError(true)
      setCode('')
    }
  }

  function onChange(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 6)
    setCode(digits)
    setError(false)
    if (digits.length === 6) void check(digits)
  }

  return (
    <div className="ob">
      <div className="ob__inner ob__inner--center">
        <p className="ob__eyebrow">{trip.school}</p>
        <h1 className="ob__title">
          <span className="ob__title-en">{trip.title}</span>
          {trip.subtitle}
        </h1>
        <p className="ob__lead">{trip.period}</p>
        <form
          className="ob__card"
          onSubmit={(e) => {
            e.preventDefault()
            if (code.length === 6) void check(code)
          }}
        >
          <label className="field__label pin__label" htmlFor="pin">
            <IconLock size="1rem" /> 입장 번호 6자리
          </label>
          <input
            id="pin"
            className="field__input ob__code"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            maxLength={6}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={error}
            aria-describedby="pin-help"
            placeholder="······"
            disabled={checking}
          />
          <p id="pin-help" className={error ? 'ob__error' : 'field__help'} role={error ? 'alert' : undefined}>
            {error ? '번호가 맞지 않아요. 다시 입력해 주세요.' : '담임 선생님께 받은 번호를 입력하세요.'}
          </p>
          <button className="btn btn--primary" type="submit" disabled={code.length !== 6 || checking}>
            들어가기
          </button>
        </form>
      </div>
    </div>
  )
}
