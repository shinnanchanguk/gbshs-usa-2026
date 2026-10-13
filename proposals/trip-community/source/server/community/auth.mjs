import { createHash } from 'node:crypto'

export class ApiError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code }
}

/** ZUDO가 요청마다 역할·참가 자격을 확인한다. 브라우저의 profile·학번은 받지 않는다. */
export function zudoAuthenticator({ origin = 'https://www.zudo.my', fetcher = fetch } = {}) {
  const endpoint = new URL('/api/trip/me', origin)
  if (endpoint.protocol !== 'https:' && !['127.0.0.1', 'localhost'].includes(endpoint.hostname)) throw new Error('ZUDO origin must use HTTPS')
  return async (request) => {
    const header = request.headers.get('Authorization') ?? ''
    if (!/^Bearer [A-Za-z0-9._~-]{16,4096}$/.test(header)) throw new ApiError(401, 'unauthorized')
    let response
    try { response = await fetcher(endpoint, { headers: { Authorization: header }, redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(8000) }) }
    catch { throw new ApiError(503, 'auth_unavailable') }
    if (response.status === 401) throw new ApiError(401, 'unauthorized')
    if (response.status === 403) throw new ApiError(403, 'not_participant')
    if (!response.ok) throw new ApiError(503, 'auth_unavailable')
    let data
    try { data = await response.json() } catch { throw new ApiError(503, 'auth_unavailable') }
    const me = data.me
    if (!me || !['student', 'teacher'].includes(me.role)) throw new ApiError(403, 'community_role_denied')
    if (typeof me.name !== 'string' || !me.name.trim() || me.name.length > 80) throw new ApiError(503, 'invalid_identity')
    if (typeof me.expiresAt !== 'string' || !Number.isFinite(Date.parse(me.expiresAt)) || Date.parse(me.expiresAt) <= Date.now()) throw new ApiError(401, 'unauthorized')
    if (me.role === 'student' && !/^1\d{3}$/.test(me.studentNumber ?? '')) throw new ApiError(403, 'not_participant')
    const identity = me.role === 'student' ? me.studentNumber : me.name
    return { id: createHash('sha256').update(`gbshs-usa-2026:${me.role}:${identity}`).digest('hex'), role: me.role, name: me.name.trim() }
  }
}
