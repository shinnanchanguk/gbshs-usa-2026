import { useEffect, useState } from 'react'
import { EntryGate } from '../features/gate/EntryGate'
import { reopen, unlock, type Roster } from '../lib/roster'
import { clearCodeFromUrl, parseHash } from '../lib/router'
import { GUIDE, PUBLIC_ROSTER } from '../lib/edition'
import { readStored, writeStored } from '../lib/storage'
import type { Profile } from '../lib/repo'
import { exchangeHandoffCode, readZudoSession, refreshZudoMe, ZudoError, type ZudoMe } from '../lib/zudo'
import { AppProvider } from './context'
import { Shell } from './Shell'

/** 학생 사전 안내판이면 입장 코드 없이 빈 명단으로, 본 사이트면 ZUDO(또는 비상용 코드)로 명단을 연다 */
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

/** ZUDO 가 알려 준 '나'를 이 사이트의 역할·학번으로 옮긴다 */
function profileFromZudo(me: ZudoMe, roster: Roster): Profile {
  const prev = readStored<Profile | null>('profile', null)
  const byId = new Map(roster.students.map((s) => [s.id, s]))
  if (me.role === 'student') {
    const s = me.studentNumber ? byId.get(me.studentNumber) : undefined
    return { role: 'student', studentId: s?.id, classNo: s?.classNo, fromZudo: true }
  }
  if (me.role === 'parent') {
    const children = (me.children ?? []).filter((c) => byId.has(c))
    const keep = prev?.studentId && children.includes(prev.studentId) ? prev.studentId : children[0]
    return { role: 'parent', studentId: keep, classNo: keep ? byId.get(keep)?.classNo : undefined, children, fromZudo: true }
  }
  const t = roster.teachers.find((x) => x.name === me.name)
  return { role: 'teacher', teacherName: t?.name, classNo: prev?.classNo, fromZudo: true }
}

function zudoNotice(e: unknown): string {
  if (e instanceof ZudoError && e.status === 403) return '이 ZUDO 계정으로는 체험학습 안내를 열 수 없어요. 1학년 학생, 인증을 마친 1학년 보호자, 인솔 선생님만 들어올 수 있어요.'
  if (e instanceof ZudoError && e.status === 400) return 'ZUDO에서 넘어온 지 오래됐어요. ZUDO에서 다시 눌러 주세요.'
  if (e instanceof ZudoError && e.status >= 500) return 'ZUDO가 잠깐 답하지 않아요. 조금 뒤 ZUDO에서 다시 눌러 주세요.'
  return 'ZUDO와 연결하지 못했어요. 인터넷을 확인하고 ZUDO에서 다시 눌러 주세요.'
}

/**
 * ZUDO(또는 비상용 코드) → 명단 열기 → 안내 화면.
 * 이 기기에서 한 번 열었으면 저장한 열쇠로 바로 연다. 명단을 다시 봉해 열쇠가 바뀌었으면 ZUDO 세션에 든 열쇠로 다시 연다.
 */
function FullApp() {
  const [roster, setRoster] = useState<Roster | null>(null)
  const [checked, setChecked] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  // 링크(#/code/…, #/zudo/…)로 들어오면 코드를 메모리에만 옮기고 주소창에서 바로 지운다(맞든 틀리든)
  const [link, setLink] = useState(() => {
    const loc = parseHash(window.location.hash)
    if (loc.code || loc.zudo) clearCodeFromUrl(null)
    return { code: loc.code, zudo: loc.zudo }
  })

  // 입장 화면이 열린 탭에 링크를 붙여 넣으면 주소의 # 만 바뀐다. 그때도 받아서 연다.
  useEffect(() => {
    const onHash = () => {
      const loc = parseHash(window.location.hash)
      if (!loc.code && !loc.zudo) return
      clearCodeFromUrl(null)
      setLink({ code: loc.code, zudo: loc.zudo })
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    let alive = true
    const open = async () => {
      if (link.zudo) {
        try {
          const session = await exchangeHandoffCode(link.zudo)
          const r = session.me.rosterCode ? await unlock(session.me.rosterCode) : null
          if (!alive) return
          if (r) {
            writeStored('profile', profileFromZudo(session.me, r))
            setNotice(null)
            setRoster(r)
            setChecked(true)
            return
          }
          setNotice('명단을 열지 못했어요. 담임 선생님께 알려 주세요.')
        } catch (e) {
          if (alive) setNotice(zudoNotice(e))
        }
      }
      let r = await reopen()
      const session = readZudoSession()
      if (!r && session?.me.rosterCode) r = await unlock(session.me.rosterCode)
      if (!alive) return
      // ZUDO 로 들어온 기기는 학생·보호자 정보를 늘 ZUDO 가 정한 대로 맞춘다(선생님은 고른 화면을 그대로 둔다)
      const sync = (me: ZudoMe, roster: Roster) => {
        const prev = readStored<Profile | null>('profile', null)
        if (me.role !== 'teacher' || !prev?.fromZudo) writeStored('profile', profileFromZudo(me, roster))
      }
      if (r && session && !link.code) sync(session.me, r)
      if (r && !link.code) setRoster(r)
      setChecked(true)
      // 인터넷이 될 때 자녀·역할을 최신으로 맞춘다
      if (session && !link.zudo && r && !link.code) {
        const opened = r
        void refreshZudoMe().then(() => {
          const fresh = readZudoSession()
          if (alive && fresh) sync(fresh.me, opened)
        })
      }
    }
    void open()
    return () => {
      alive = false
    }
  }, [link])

  if (!checked) return <div className="boot" aria-busy="true" />
  if (!roster)
    return (
      <EntryGate
        key={link.code ?? link.zudo ?? 'typed'}
        initialCode={link.code}
        notice={notice}
        onOpen={(r) => setRoster(r)}
      />
    )
  return (
    <AppProvider roster={roster}>
      <Shell onLock={() => setRoster(null)} />
    </AppProvider>
  )
}
