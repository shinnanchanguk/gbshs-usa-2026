import sharp from 'sharp'
import { createHash } from 'node:crypto'
import { ApiError, zudoAuthenticator } from './auth.mjs'
import { loadCatalog } from './catalog.mjs'

const BASE = '/api/trip/community'
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const KINDS = new Set(['tip', 'question', 'review'])
export const MAX_REQUEST_BYTES = 16 * 1024 * 1024
function requiredText(value, max) {
  if (typeof value !== 'string' || !value.trim() || value.length > max || value.includes('\u0000')) throw new ApiError(400, 'invalid_text')
  return value.trim()
}
function version(value) { if (!Number.isSafeInteger(value) || value < 1) throw new ApiError(400, 'invalid_version'); return value }
function clientId(value) { if (!uuid.test(value ?? '')) throw new ApiError(400, 'invalid_client_id'); return value }
function input(body, catalog) {
  if (!body || typeof body !== 'object' || !catalog.regions.has(body.regionId) || !KINDS.has(body.kind)) throw new ApiError(400, 'invalid_category')
  if (body.locationKey !== null && catalog.locations.get(body.locationKey)?.regionId !== body.regionId) throw new ApiError(400, 'invalid_location')
  return { regionId: body.regionId, locationKey: body.locationKey, kind: body.kind, title: requiredText(body.title, 100), body: requiredText(body.body, 10000) }
}
async function readBody(request, limit) {
  if (Number(request.headers.get('content-length') ?? 0) > limit) throw new ApiError(413, 'too_large')
  const reader = request.body?.getReader()
  if (!reader) return Buffer.alloc(0)
  const chunks = []
  let size = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > limit) { await reader.cancel(); throw new ApiError(413, 'too_large') }
      chunks.push(value)
    }
    return Buffer.concat(chunks, size)
  } finally { reader.releaseLock() }
}
async function jsonBody(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new ApiError(415, 'json_required')
  try { const body = JSON.parse((await readBody(request, 64 * 1024)).toString('utf8')); if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error(); return body }
  catch (error) { if (error instanceof ApiError) throw error; throw new ApiError(400, 'invalid_json') }
}
async function sanitizePhoto(file) {
  if (!file || typeof file.arrayBuffer !== 'function' || file.size > 5 * 1024 * 1024 || file.size === 0) throw new ApiError(413, 'photo_too_large')
  const bytes = Buffer.from(await file.arrayBuffer())
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  const webp = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'
  if (!jpeg && !png && !webp) throw new ApiError(415, 'unsupported_photo')
  try {
    const image = sharp(bytes, { limitInputPixels: 24000000, failOn: 'error' })
    const meta = await image.metadata()
    if (!['jpeg', 'png', 'webp'].includes(meta.format) || (meta.pages ?? 1) > 1) throw new Error('bad_image')
    const { data, info } = await image.rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).flatten({ background: '#fff' }).jpeg({ quality: 82 }).toBuffer({ resolveWithObject: true })
    // sharp의 기본값으로 EXIF·GPS를 제거한다. 원본 메타데이터를 유지하지 않는다.
    return { bytes: data, width: info.width, height: info.height }
  } catch { throw new ApiError(400, 'invalid_photo') }
}

/** 기존 ZUDO 서버에서 호출하거나 별도 server.mjs로 실행할 수 있는 Request → Response 처리기. */
export function createHandler({ store, authenticate = zudoAuthenticator(), catalog = loadCatalog(), allowedOrigins = ['https://shinnanchanguk.github.io'] }) {
  const origins = new Set(allowedOrigins)
  return async (request) => {
    const origin = request.headers.get('Origin')
    const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', Vary: 'Origin', 'Cross-Origin-Resource-Policy': 'same-site' }
    if (origin && origins.has(origin)) Object.assign(headers, { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS' })
    const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' } })
    try {
      if (origin && !origins.has(origin)) throw new ApiError(403, 'origin_denied')
      const url = new URL(request.url)
      if (url.pathname !== BASE && !url.pathname.startsWith(`${BASE}/`)) throw new ApiError(404, 'not_found')
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
      const actor = await authenticate(request)
      // 커스텀 인증 어댑터도 서버에서 확인된 학생·인솔 교사만 반환해야 한다.
      if (!actor?.id || !actor.name || !['student', 'teacher'].includes(actor.role)) throw new ApiError(403, 'community_role_denied')
      store.rate(actor, 'requests', 180)
      if (!['GET', 'HEAD'].includes(request.method)) store.rate(actor, 'writes', 30)
      const suffix = url.pathname.slice(BASE.length)
      if (suffix === '/posts' && request.method === 'GET') {
        const filters = Object.fromEntries(url.searchParams)
        if (filters.region && !catalog.regions.has(filters.region)) throw new ApiError(400, 'invalid_region')
        if (filters.location && !catalog.locations.has(filters.location)) throw new ApiError(400, 'invalid_location')
        if (filters.kind && !KINDS.has(filters.kind)) throw new ApiError(400, 'invalid_kind')
        if (filters.before && (!/^\d+$/.test(filters.before) || !Number.isSafeInteger(Number(filters.before)) || Number(filters.before) < 1)) throw new ApiError(400, 'invalid_cursor')
        if (filters.hidden && !['true', 'false'].includes(filters.hidden)) throw new ApiError(400, 'invalid_hidden')
        return json(store.list(actor, { ...filters, before: filters.before ? Number(filters.before) : null, hidden: filters.hidden === 'true' }))
      }
      if (suffix === '/posts' && request.method === 'POST') {
        if (!request.headers.get('content-type')?.startsWith('multipart/form-data')) throw new ApiError(415, 'multipart_required')
        // Content-Length가 없거나 잘못돼도 스트림을 읽는 중 실제 크기를 제한한다.
        const bytes = await readBody(request, MAX_REQUEST_BYTES)
        let form, body
        try { form = await new Response(bytes, { headers: { 'Content-Type': request.headers.get('content-type') } }).formData(); const payload = form.get('payload'); if (typeof payload !== 'string' || payload.length > 20000) throw new Error(); body = JSON.parse(payload) }
        catch { throw new ApiError(400, 'invalid_form') }
        const value = { ...input(body, catalog), clientId: clientId(body.clientId) }
        const files = form.getAll('photos')
        if (files.length > 5) throw new ApiError(400, 'too_many_photos')
        const hash = createHash('sha256').update(JSON.stringify(value))
        for (const file of files) {
          if (!file || typeof file.arrayBuffer !== 'function' || file.size > 5 * 1024 * 1024 || file.size === 0) throw new ApiError(413, 'photo_too_large')
          hash.update(`:${file.size}:`).update(Buffer.from(await file.arrayBuffer()))
        }
        value.requestHash = hash.digest('hex')
        const existing = store.existing(actor, value.clientId, value.requestHash)
        if (existing) return json({ post: existing })
        const photos = []
        for (const file of files) photos.push(await sanitizePhoto(file))
        return json({ post: store.create(actor, value, photos) }, 201)
      }
      const photo = suffix.match(/^\/photos\/([^/]+)$/)
      if (photo && uuid.test(photo[1]) && request.method === 'GET') return new Response(store.photo(actor, photo[1]), { headers: { ...headers, 'Content-Type': 'image/jpeg', 'Content-Disposition': 'inline; filename="photo.jpg"' } })
      const match = suffix.match(/^\/posts\/([^/]+)(?:\/(moderation|comments)(?:\/([^/]+))?)?$/)
      if (!match || !uuid.test(match[1])) throw new ApiError(404, 'not_found')
      const [, id, action, child] = match
      if (!action && request.method === 'GET') return json(store.get(actor, id))
      if (!action && request.method === 'PATCH') { const body = await jsonBody(request); return json({ post: store.update(actor, id, input(body, catalog), version(body.version)) }) }
      if (!action && request.method === 'DELETE') { const body = await jsonBody(request); store.remove(actor, id, version(body.version)); return new Response(null, { status: 204, headers }) }
      if (action === 'moderation' && !child && request.method === 'PATCH') {
        const body = await jsonBody(request)
        if (typeof body.hidden !== 'boolean') throw new ApiError(400, 'invalid_hidden')
        return json({ post: store.moderate(actor, id, body.hidden, version(body.version)) })
      }
      if (action === 'comments' && !child && request.method === 'POST') { const body = await jsonBody(request); return json({ comment: store.comment(actor, id, requiredText(body.body, 1000), clientId(body.clientId)) }, 201) }
      if (action === 'comments' && uuid.test(child ?? '') && request.method === 'DELETE') { store.removeComment(actor, id, child); return new Response(null, { status: 204, headers }) }
      throw new ApiError(405, 'method_not_allowed')
    } catch (error) {
      if (error instanceof ApiError) return json({ error: error.code }, error.status)
      // 토큰·글·사진·개인정보를 일반 로그에 기록하지 않는다.
      return json({ error: 'server_error' }, 500)
    }
  }
}
