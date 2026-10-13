import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { createHandler } from '../app.mjs'
import { openStore } from '../store.mjs'
import { ApiError, zudoAuthenticator } from '../auth.mjs'

const student = { id: 'student-a', name: '테스트 학생 A', role: 'student' }
const other = { id: 'student-b', name: '테스트 학생 B', role: 'student' }
const teacher = { id: 'teacher-a', name: '테스트 교사', role: 'teacher' }
const catalog = { regions: new Set(['general', 'boston', 'new-york']), locations: new Map([['d2-campus', { regionId: 'boston' }]]) }
const payload = (extra = {}) => ({ regionId: 'boston', locationKey: 'd2-campus', kind: 'review', title: '탐방 후기', body: '오늘 알게 된 내용을 나눠요.', clientId: randomUUID(), ...extra })
function setup(t, filename = ':memory:') {
  const store = openStore(filename)
  t.after(() => store.close())
  const authenticate = async (request) => {
    const who = request.headers.get('Authorization')
    if (who === 'Bearer student') return student
    if (who === 'Bearer other') return other
    if (who === 'Bearer teacher') return teacher
    if (who === 'Bearer parent') return { id: 'p', name: '테스트 보호자', role: 'parent' }
    throw new ApiError(401, 'unauthorized')
  }
  const handler = createHandler({ store, catalog, authenticate })
  const request = (route = '/posts', { role = 'student', method = 'GET', body, origin, headers = {} } = {}) => handler(new Request(`http://local/api/trip/community${route}`, {
    method, headers: { Authorization: `Bearer ${role}`, ...(origin ? { Origin: origin } : {}), ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...headers },
    ...(body ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}),
  }))
  const create = async (extra = {}, files = []) => {
    const form = new FormData(); form.set('payload', JSON.stringify(payload(extra)))
    files.forEach((blob) => form.append('photos', blob, 'photo.jpg'))
    const response = await request('/posts', { method: 'POST', body: form })
    return { response, data: await response.json() }
  }
  return { request, create, store, handler }
}

test('인증과 출처: 비로그인·보호자·다른 사이트는 게시판을 읽지 못한다', async (t) => {
  const { request } = setup(t)
  assert.equal((await request('/posts', { role: 'none' })).status, 401)
  assert.equal((await request('/posts', { role: 'parent' })).status, 403)
  assert.equal((await request('/posts', { origin: 'https://evil.example' })).status, 403)
  const res = await request('/posts', { origin: 'https://shinnanchanguk.github.io' })
  assert.equal(res.status, 200)
  assert.equal(res.headers.get('access-control-allow-origin'), 'https://shinnanchanguk.github.io')
  assert.match(res.headers.get('cache-control'), /no-store/)
})
test('글 생성·지역/장소/유형 필터·조회가 실제 DB 데이터를 돌려준다', async (t) => {
  const { request, create } = setup(t)
  const { response, data } = await create()
  assert.equal(response.status, 201)
  assert.equal(data.post.authorName, student.name)
  assert.equal((await (await request('/posts?region=boston&location=d2-campus&kind=review')).json()).posts.length, 1)
  assert.equal((await (await request('/posts?region=new-york')).json()).posts.length, 0)
  assert.equal((await (await request(`/posts/${data.post.id}`)).json()).post.body, data.post.body)
})
test('작성자 위조가 무시되고 다른 학생은 수정·삭제·숨김을 할 수 없다', async (t) => {
  const { request, create } = setup(t)
  const { data } = await create({ authorName: '위조 이름', authorRole: 'teacher', authorId: teacher.id })
  assert.equal(data.post.authorRole, 'student'); assert.equal(data.post.authorName, student.name)
  const id = data.post.id
  assert.equal((await request(`/posts/${id}`, { role: 'other', method: 'PATCH', body: { ...payload(), version: 1 } })).status, 403)
  assert.equal((await request(`/posts/${id}`, { role: 'other', method: 'DELETE', body: { version: 1 } })).status, 403)
  assert.equal((await request(`/posts/${id}/moderation`, { method: 'PATCH', body: { hidden: true, version: 1 } })).status, 403)
})
test('초안 재전송은 같은 글을 반환하고 동시에 수정하면 충돌한다', async (t) => {
  const { request, create } = setup(t)
  const clientId = randomUUID()
  const first = await create({ clientId }), second = await create({ clientId })
  assert.equal(first.data.post.id, second.data.post.id)
  assert.equal((await (await request('/posts')).json()).posts.length, 1)
  const changed = await create({ clientId, body: '응답 유실 뒤 바꾼 초안' })
  assert.equal(changed.response.status, 409)
  assert.equal(changed.data.error, 'duplicate_post_key')
  const id = first.data.post.id
  const edited = await request(`/posts/${id}`, { method: 'PATCH', body: { ...payload({ title: '바뀐 제목' }), version: 1 } })
  assert.equal(edited.status, 200)
  assert.equal((await edited.json()).post.version, 2)
  assert.equal((await request(`/posts/${id}`, { method: 'PATCH', body: { ...payload(), version: 1 } })).status, 409)
  assert.equal((await request(`/posts/${id}`, { method: 'DELETE', body: { version: 1 } })).status, 409)
})
test('사진은 서버에서 JPEG로 재처리하고 EXIF를 제거하며 인증 없이는 보이지 않는다', async (t) => {
  const { request, create } = setup(t)
  const original = await sharp({ create: { width: 2000, height: 1200, channels: 3, background: '#123456' } }).withMetadata().jpeg().toBuffer()
  const { data, response } = await create({}, [new Blob([original], { type: 'image/jpeg' })])
  assert.equal(response.status, 201)
  const photo = data.post.photos[0]
  assert.equal(photo.width, 1600)
  const res = await request(`/photos/${photo.id}`)
  assert.equal(res.headers.get('content-type'), 'image/jpeg')
  const meta = await sharp(Buffer.from(await res.arrayBuffer())).metadata()
  assert.equal(meta.exif, undefined)
  assert.equal(meta.icc, undefined)
  assert.equal((await request(`/photos/${photo.id}`, { role: 'none' })).status, 401)
  assert.equal((await request(`/photos/${photo.id}`, { role: 'parent' })).status, 403)
})
test('가짜 JPEG·SVG·6장 첨부를 거부하고 실패한 게시글을 남기지 않는다', async (t) => {
  const { request, create } = setup(t)
  assert.equal((await create({}, [new Blob(['<svg></svg>'], { type: 'image/jpeg' })])).response.status, 415)
  assert.equal((await create({}, Array(6).fill(new Blob(['bad'], { type: 'image/jpeg' })))).response.status, 400)
  assert.equal((await (await request('/posts')).json()).posts.length, 0)
})

test('응답 유실 뒤 같은 초안 키로 사진만 바꾸어도 잘못된 성공을 반환하지 않는다', async (t) => {
  const { create, request } = setup(t)
  const image = async (color) => new Blob([await sharp({ create: { width: 10, height: 10, channels: 3, background: color } }).jpeg().toBuffer()], { type: 'image/jpeg' })
  const clientId = randomUUID(), original = await image('#ffffff')
  assert.equal((await create({ clientId }, [original])).response.status, 201)
  assert.equal((await create({ clientId }, [original])).response.status, 200)
  assert.equal((await create({ clientId }, [await image('#000000')])).response.status, 409)
  assert.equal((await (await request('/posts')).json()).posts.length, 1)
})

test('실제 본문 크기를 제한하며 Content-Length 없는 과대 스트림도 중단한다', async (t) => {
  const { create, request, handler } = setup(t)
  const id = (await create()).data.post.id
  assert.equal((await request(`/posts/${id}/comments`, { method: 'POST', body: { body: 'x'.repeat(70000), clientId: randomUUID() } })).status, 413)
  let sent = 0, cancelled = false
  const stream = new ReadableStream({
    pull(controller) { if (sent++ < 18) controller.enqueue(new Uint8Array(1024 * 1024)); else controller.close() },
    cancel() { cancelled = true },
  })
  const res = await handler(new Request('http://local/api/trip/community/posts', { method: 'POST', headers: { Authorization: 'Bearer student', 'Content-Type': 'multipart/form-data; boundary=test' }, body: stream, duplex: 'half' }))
  assert.equal(res.status, 413)
  assert.equal(cancelled, true)
})
test('댓글 재전송·소유권·잘못된 게시글 경로를 확인한다', async (t) => {
  const { request, create } = setup(t)
  const id = (await create()).data.post.id, otherPost = (await create()).data.post.id
  const body = { body: '궁금했던 내용이에요.', clientId: randomUUID() }
  const first = await (await request(`/posts/${id}/comments`, { method: 'POST', body })).json()
  const again = await (await request(`/posts/${id}/comments`, { method: 'POST', body })).json()
  assert.equal(first.comment.id, again.comment.id)
  assert.equal((await request(`/posts/${id}/comments`, { method: 'POST', body: { body: ' ', clientId: randomUUID() } })).status, 400)
  assert.equal((await request(`/posts/${otherPost}/comments/${first.comment.id}`, { method: 'DELETE' })).status, 404)
  assert.equal((await request(`/posts/${id}/comments/${first.comment.id}`, { role: 'other', method: 'DELETE' })).status, 403)
  assert.equal((await request(`/posts/${id}/comments/${first.comment.id}`, { role: 'teacher', method: 'DELETE' })).status, 204)
})
test('숨긴 글은 목록·직접 URL·댓글·사진에서도 학생에게 보이지 않고 교사만 복구한다', async (t) => {
  const { request, create } = setup(t)
  const image = await sharp({ create: { width: 10, height: 10, channels: 3, background: '#fff' } }).jpeg().toBuffer()
  const { data } = await create({}, [new Blob([image], { type: 'image/jpeg' })])
  const id = data.post.id, photoId = data.post.photos[0].id
  assert.equal((await request(`/posts/${id}/moderation`, { role: 'teacher', method: 'PATCH', body: { hidden: true, version: 1 } })).status, 200)
  assert.equal((await (await request('/posts')).json()).posts.length, 0)
  assert.equal((await request('/posts?hidden=true')).status, 403)
  assert.equal((await request(`/posts/${id}`)).status, 404)
  assert.equal((await request(`/photos/${photoId}`)).status, 404)
  assert.equal((await request(`/posts/${id}/comments`, { method: 'POST', body: { body: '댓글', clientId: randomUUID() } })).status, 404)
  assert.equal((await (await request('/posts?hidden=true', { role: 'teacher' })).json()).posts.length, 1)
  assert.equal((await request(`/photos/${photoId}`, { role: 'teacher' })).status, 200)
  assert.equal((await request(`/posts/${id}/moderation`, { role: 'teacher', method: 'PATCH', body: { hidden: false, version: 2 } })).status, 200)
  assert.equal((await request(`/posts/${id}`)).status, 200)
})
test('본문·분류·페이지 ID·버전·커서 검증이 잘못된 요청을 거부한다', async (t) => {
  const { request, create } = setup(t)
  for (const extra of [{ title: ' ' }, { body: 'x'.repeat(10001) }, { regionId: 'unknown' }, { locationKey: 'missing' }, { regionId: 'general' }, { kind: 'unknown' }]) assert.equal((await create(extra)).response.status, 400)
  assert.equal((await request('/posts?before=NaN')).status, 400)
  assert.equal((await request('/posts?region=unknown')).status, 400)
  assert.equal((await request('/posts?hidden=maybe')).status, 400)
})
test('페이지 넘김은 중복 없이 이어지고 새 글이 생겨도 이전 목록 순서를 유지한다', async (t) => {
  const { request, create } = setup(t)
  for (let i = 0; i < 22; i++) await create({ title: `글 ${i}` })
  const first = await (await request('/posts')).json()
  assert.equal(first.posts.length, 20); assert.ok(first.next)
  await create({ title: '새 글' })
  const second = await (await request(`/posts?before=${first.next}`)).json()
  assert.equal(second.posts.length, 2)
  assert.equal(second.next, null)
  assert.ok(!second.posts.some((p) => first.posts.some((q) => p.id === q.id)))
})
test('서버를 다시 열어도 DB 글이 유지된다', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trip-community-test-'))
  t.after(() => {
    const target = path.resolve(dir), base = path.resolve(os.tmpdir())
    if (path.dirname(target) !== base || !path.basename(target).startsWith('trip-community-test-')) throw new Error('Unsafe test cleanup path')
    fs.rmSync(target, { recursive: true, force: true })
  })
  const filename = path.join(dir, 'test.sqlite')
  const first = openStore(filename)
  const p = first.create(student, payload(), [])
  first.close()
  const second = openStore(filename)
  assert.equal(second.get(student, p.id).post.title, '탐방 후기')
  second.close()
})
test('글 삭제는 댓글과 사진도 함께 삭제한다', async (t) => {
  const { request, create } = setup(t)
  const image = await sharp({ create: { width: 10, height: 10, channels: 3, background: '#fff' } }).jpeg().toBuffer()
  const { data } = await create({}, [new Blob([image], { type: 'image/jpeg' })])
  const id = data.post.id
  await request(`/posts/${id}/comments`, { method: 'POST', body: { body: '댓글', clientId: randomUUID() } })
  assert.equal((await request(`/posts/${id}`, { method: 'DELETE', body: { version: 1 } })).status, 204)
  assert.equal((await request(`/posts/${id}`)).status, 404)
  assert.equal((await request(`/photos/${data.post.photos[0].id}`)).status, 404)
})
test('요청 제한이 반복 쓰기를 막는다', async (t) => {
  const { create } = setup(t)
  for (let i = 0; i < 30; i++) assert.equal((await create()).response.status, 201)
  assert.equal((await create()).response.status, 429)
})
test('실제 인증 어댑터가 ZUDO 응답으로만 작성자·역할을 정하고 실패 시 접근을 막는다', async () => {
  const token = 'this-is-a-fake-test-token'
  const request = new Request('http://local/', { headers: { Authorization: `Bearer ${token}` } })
  const me = { role: 'student', name: '테스트 학생', studentNumber: '1101', expiresAt: '2099-10-25T00:00:00Z' }
  const authenticate = zudoAuthenticator({ fetcher: async (url, options) => {
    assert.equal(String(url), 'https://www.zudo.my/api/trip/me')
    assert.equal(options.headers.Authorization, `Bearer ${token}`)
    assert.equal(options.redirect, 'error')
    return Response.json({ me })
  } })
  const actor = await authenticate(request)
  assert.equal(actor.name, me.name); assert.equal(actor.role, 'student'); assert.notEqual(actor.id, token)
  await assert.rejects(authenticate(new Request('http://local/')), (e) => e.status === 401)
  for (const [status, expected] of [[401, 401], [403, 403], [503, 503]]) await assert.rejects(zudoAuthenticator({ fetcher: async () => new Response('{}', { status }) })(request), (e) => e.status === expected)
  await assert.rejects(zudoAuthenticator({ fetcher: async () => Response.json({ me: { ...me, role: 'parent' } }) })(request), (e) => e.status === 403)
  await assert.rejects(zudoAuthenticator({ fetcher: async () => Response.json({ me: { ...me, expiresAt: '2020-01-01' } }) })(request), (e) => e.status === 401)
})
