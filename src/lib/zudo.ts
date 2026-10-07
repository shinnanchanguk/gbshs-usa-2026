/**
 * ZUDO(학교 기숙사 시스템) 로그인 연동.
 *
 * ZUDO 에서 '미국 체험학습 안내'를 누르면 ZUDO 가 주소 #/zudo/<한 번 쓰는 코드> 로 보낸다.
 * 이 코드를 POST /api/trip/session 으로 기기용 토큰과 바꿔 이 기기에 저장한다(여행이 끝날 때까지 유효).
 * 그다음부터는 ZUDO 로그인 없이 열리고, 서버 자료(내 항공권·기상 확인)를 부를 때만 이 토큰을 쓴다.
 * 누가 무엇을 볼 수 있는지는 ZUDO 서버가 매번 다시 판정한다. 이 기기의 값은 화면을 고르는 데만 쓴다.
 */
import { readStored, useStored, writeStored } from './storage'

/** 개발 중에는 VITE_ZUDO_ORIGIN 으로 로컬 ZUDO 를 가리킨다 */
export const ZUDO_ORIGIN: string = import.meta.env.VITE_ZUDO_ORIGIN || 'https://zudo.my'
export const ZUDO_HANDOFF_URL = `${ZUDO_ORIGIN}/trip-handoff`
export const ZUDO_PASSWORD_RESET_URL = `${ZUDO_ORIGIN}/password-reset`

export type ZudoMe = {
  role: 'student' | 'parent' | 'teacher'
  name: string
  studentNumber?: string
  children?: string[]
  canResetPassword: boolean
  rosterCode: string | null
  expiresAt: string
}

export type ZudoSession = { token: string; me: ZudoMe }

const KEY = 'zudo-session'

function parseSession(v: unknown): ZudoSession | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  const me = o.me as Record<string, unknown> | undefined
  if (typeof o.token !== 'string' || !me || !['student', 'parent', 'teacher'].includes(me.role as string)) return null
  if (typeof me.expiresAt === 'string' && Date.parse(me.expiresAt) <= Date.now()) return null
  return {
    token: o.token,
    me: {
      role: me.role as ZudoMe['role'],
      name: typeof me.name === 'string' ? me.name : '',
      studentNumber: typeof me.studentNumber === 'string' ? me.studentNumber : undefined,
      children: Array.isArray(me.children) ? me.children.filter((c): c is string => typeof c === 'string') : undefined,
      canResetPassword: me.canResetPassword === true,
      rosterCode: typeof me.rosterCode === 'string' ? me.rosterCode : null,
      expiresAt: typeof me.expiresAt === 'string' ? me.expiresAt : '',
    },
  }
}

export function readZudoSession(): ZudoSession | null {
  return parseSession(readStored<unknown>(KEY, null))
}

export function useZudoSession(): ZudoSession | null {
  const [raw] = useStored<unknown>(KEY, null)
  return parseSession(raw)
}

export function forgetZudoSession() {
  writeStored(KEY, null)
}

export class ZudoError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code)
  }
}

/** 같은 코드를 두 번 바꾸지 않게(화면이 시작 처리를 두 번 돌려도) 진행 중인 교환을 함께 쓴다 */
const inflight = new Map<string, Promise<ZudoSession>>()

/** ZUDO 가 준 한 번 쓰는 코드를 기기용 토큰과 바꾼다 */
export function exchangeHandoffCode(code: string): Promise<ZudoSession> {
  let p = inflight.get(code)
  if (!p) {
    p = doExchange(code)
    inflight.set(code, p)
  }
  return p
}

async function doExchange(code: string): Promise<ZudoSession> {
  const res = await fetch(`${ZUDO_ORIGIN}/api/trip/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
    cache: 'no-store',
    credentials: 'omit',
  })
  const body = (await res.json().catch(() => ({}))) as { token?: string; me?: unknown; error?: string }
  if (!res.ok || !body.token) throw new ZudoError(res.status, body.error ?? 'failed')
  const session = parseSession({ token: body.token, me: body.me })
  if (!session) throw new ZudoError(500, 'bad_response')
  writeStored(KEY, session)
  return session
}

/** 기기용 토큰으로 ZUDO 의 /api/trip/* 를 부른다. 토큰이 끊겼으면(401) 이 기기의 세션을 지운다. */
export async function zudoFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const session = readZudoSession()
  if (!session) throw new ZudoError(401, 'no_session')
  const res = await fetch(`${ZUDO_ORIGIN}${path}`, {
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: `Bearer ${session.token}` },
    cache: 'no-store',
    credentials: 'omit',
  })
  if (res.status === 401) forgetZudoSession()
  return res
}

/** 지금 ZUDO 가 보는 '나'로 저장값을 새로 맞춘다(학부모 인증이 바뀌었을 때 등). 인터넷이 없으면 그대로 둔다. */
export async function refreshZudoMe(): Promise<void> {
  const session = readZudoSession()
  if (!session) return
  try {
    const res = await zudoFetch('/api/trip/me')
    if (!res.ok) return
    const body = (await res.json()) as { me?: unknown }
    const next = parseSession({ token: session.token, me: body.me })
    if (next) writeStored(KEY, next)
  } catch {
    // 인터넷이 없으면 저장해 둔 값을 계속 쓴다
  }
}
