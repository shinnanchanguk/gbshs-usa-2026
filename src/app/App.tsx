import { useEffect, useState } from 'react'
import { EntryGate } from '../features/gate/EntryGate'
import { reopen, type Roster } from '../lib/roster'
import { clearCodeFromUrl, parseHash } from '../lib/router'
import { GUIDE, PUBLIC_ROSTER } from '../lib/edition'
import { AppProvider } from './context'
import { Shell } from './Shell'

/** 학생 사전 안내판이면 입장 코드 없이 빈 명단으로, 본 사이트면 입장 코드로 명단을 연다 */
export function App() {
  return GUIDE ? <GuideApp /> : <FullApp />
}

function GuideApp() {
  return (
    <AppProvider roster={PUBLIC_ROSTER}>
      <Shell onLock={() => undefined} />
    </AppProvider>
  )
}

/**
 * 입장 코드 → 명단 열기 → 안내 화면.
 * 이 기기에서 한 번 열었으면 저장한 열쇠로 바로 연다.
 */
function FullApp() {
  const [roster, setRoster] = useState<Roster | null>(null)
  const [checked, setChecked] = useState(false)
  // 링크(#/code/…)로 들어오면 코드를 메모리에만 옮기고 주소창에서 바로 지운다(맞든 틀리든)
  const [linkCode, setLinkCode] = useState(() => {
    const code = parseHash(window.location.hash).code
    if (code) clearCodeFromUrl(null)
    return code
  })

  // 입장 화면이 열린 탭에 코드 링크를 붙여 넣으면 주소의 # 만 바뀐다. 그때도 받아서 연다.
  useEffect(() => {
    const onHash = () => {
      const code = parseHash(window.location.hash).code
      if (!code) return
      clearCodeFromUrl(null)
      setLinkCode(code)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    let alive = true
    void reopen().then((r) => {
      if (!alive) return
      if (r && !linkCode) setRoster(r)
      setChecked(true)
    })
    return () => {
      alive = false
    }
  }, [linkCode])

  if (!checked) return <div className="boot" aria-busy="true" />
  if (!roster)
    return (
      <EntryGate
        key={linkCode ?? 'typed'}
        initialCode={linkCode}
        onOpen={(r) => setRoster(r)}
      />
    )
  return (
    <AppProvider roster={roster}>
      <Shell onLock={() => setRoster(null)} />
    </AppProvider>
  )
}
