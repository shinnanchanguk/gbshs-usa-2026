import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { createHandler } from '../server/community/app.mjs'
import { openStore } from '../server/community/store.mjs'
import { ApiError } from '../server/community/auth.mjs'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const store = openStore(':memory:')
const handler = createHandler({ store, authenticate: async (request) => {
  const token = request.headers.get('Authorization')
  if (token === 'Bearer test-student-token') return { id: 'test-student', role: 'student', name: '테스트 학생' }
  if (token === 'Bearer test-teacher-token') return { id: 'test-teacher', role: 'teacher', name: '테스트 교사' }
  throw new ApiError(401, 'unauthorized')
} })
const vite = await createServer({ root, server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' })
await vite.listen()
const address = vite.httpServer.address()
const base = `http://127.0.0.1:${address.port}/gbshs-usa-2026/`
const browser = await chromium.launch()
const errors = []
async function open(role = 'student', width = 360) {
  const context = await browser.newContext({ viewport: { width, height: 800 } })
  await context.addInitScript((role) => {
    const me = { role, name: role === 'teacher' ? '테스트 교사' : '테스트 학생', studentNumber: role === 'student' ? '1101' : undefined, expiresAt: '2099-10-25T00:00:00Z', rosterCode: null, canResetPassword: false }
    if (!localStorage.getItem('usa2026:zudo-session')) localStorage.setItem('usa2026:zudo-session', JSON.stringify({ token: `test-${role}-token`, me }))
    localStorage.setItem('usa2026:profile', JSON.stringify({ role, fromZudo: true }))
  }, role)
  const page = await context.newPage()
  page.setDefaultTimeout(15_000)
  page.on('pageerror', (e) => errors.push(e.message))
  await page.route('**/api/trip/community/**', async (route) => {
    const original = route.request()
    const headers = { ...original.headers() }
    delete headers.origin
    const request = new Request(original.url(), { method: original.method(), headers, ...(!['GET', 'HEAD'].includes(original.method()) ? { body: original.postDataBuffer() ?? undefined } : {}) })
    const res = await handler(request)
    await route.fulfill({ status: res.status, headers: Object.fromEntries(res.headers), body: Buffer.from(await res.arrayBuffer()) })
  })
  await page.route('**/api/trip/ticket**', (r) => r.fulfill({ status: 404, contentType: 'application/json', body: '{}' }))
  await page.goto(`${base}tests/community.html`)
  return { context, page }
}
async function community(page) {
  await page.getByRole('button', { name: '내 정보와 메뉴' }).click()
  await page.getByRole('button', { name: '탐방 이야기', exact: true }).click()
  await page.getByRole('dialog', { name: '탐방 이야기' }).waitFor()
}
async function noOverflow(page) {
  const sizes = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, panel: document.querySelector('.sheet')?.getBoundingClientRect().width }))
  assert.ok(sizes.scroll <= sizes.width, JSON.stringify(sizes))
  assert.ok(sizes.panel <= sizes.width, JSON.stringify(sizes))
}
try {
  const { page, context } = await open()
  console.log('Browser: loaded fixture')
  await community(page)
  console.log('Browser: opened community')
  await page.getByText('아직 올라온 이야기가 없어요.', { exact: true }).waitFor()
  await page.getByRole('button', { name: '닫기', exact: true }).focus()
  await page.keyboard.press('Shift+Tab')
  assert.equal(await page.evaluate(() => document.querySelector('.sheet')?.contains(document.activeElement)), true)
  await page.keyboard.press('Tab')
  assert.equal(await page.getByRole('button', { name: '닫기', exact: true }).evaluate((el) => el === document.activeElement), true)
  await noOverflow(page)
  await page.getByRole('button', { name: '글쓰기', exact: true }).click()
  await page.getByLabel('제목', { exact: true }).fill('하버드에서 발견한 이야기')
  await page.getByLabel('내용', { exact: true }).fill('테스트 초안이에요. 새로 열어도 남아 있어요.')
  await page.getByLabel('지역', { exact: true }).selectOption('boston')
  await page.getByLabel('장소', { exact: true }).selectOption('d2-harvard-art-museums')
  const image = await sharp({ create: { width: 40, height: 30, channels: 3, background: '#ee5500' } }).jpeg().toBuffer()
  await page.locator('input[type=file]').setInputFiles({ name: 'test.jpg', mimeType: 'image/jpeg', buffer: image })
  await page.getByText('사진을 초안에 저장했어요. 게시할 때 함께 올라가요.', { exact: true }).waitFor()
  await context.setOffline(true)
  await page.getByLabel('내용', { exact: true }).fill('오프라인에서 작성한 초안이에요.')
  assert.equal(await page.getByRole('button', { name: '게시하기', exact: true }).isDisabled(), true)
  await context.setOffline(false)
  console.log('Browser: offline draft and photo saved')
  await page.reload(); await community(page)
  await page.getByRole('button', { name: '초안 이어 쓰기', exact: true }).click()
  assert.equal(await page.getByLabel('제목', { exact: true }).inputValue(), '하버드에서 발견한 이야기')
  assert.equal(await page.getByLabel('내용', { exact: true }).inputValue(), '오프라인에서 작성한 초안이에요.')
  await page.getByRole('button', { name: '게시하기', exact: true }).click()
  await page.getByRole('heading', { name: '하버드에서 발견한 이야기', exact: true }).waitFor()
  await page.getByRole('img', { name: '하버드에서 발견한 이야기 · 사진 1' }).waitFor()
  console.log('Browser: published post and photo')
  await page.getByLabel('댓글 남기기', { exact: true }).fill('참고가 됐어요.')
  await page.getByRole('button', { name: '댓글 등록', exact: true }).click()
  await page.getByText('참고가 됐어요.', { exact: true }).waitFor()
  await page.getByRole('button', { name: '수정', exact: true }).click()
  await page.getByLabel('제목', { exact: true }).fill('수정한 하버드 이야기')
  await page.getByRole('button', { name: '수정 완료', exact: true }).click()
  await page.getByRole('heading', { name: '수정한 하버드 이야기', exact: true }).waitFor()
  console.log('Browser: comment and edit saved')
  await page.getByRole('button', { name: '목록으로', exact: true }).click()
  await page.getByRole('button', { name: '프린스턴', exact: true }).click()
  await page.getByText('아직 올라온 이야기가 없어요.', { exact: true }).waitFor()
  await page.getByRole('button', { name: '보스턴 · 하버드 · MIT', exact: true }).click()
  await page.getByRole('button').filter({ hasText: '수정한 하버드 이야기' }).waitFor()
  await noOverflow(page)
  for (const width of [768, 1280]) { await page.setViewportSize({ width, height: 900 }); await noOverflow(page) }
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px' })
  await page.setViewportSize({ width: 360, height: 800 }); await noOverflow(page)
  fs.mkdirSync(path.join(root, 'test-results'), { recursive: true })
  await page.evaluate(() => { document.documentElement.style.fontSize = '' })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.screenshot({ path: path.join(root, 'test-results/community-mobile.png'), fullPage: true, animations: 'disabled' })
  const teacher = await open('teacher', 1280)
  await community(teacher.page)
  await teacher.page.getByRole('button').filter({ hasText: '수정한 하버드 이야기' }).click()
  teacher.page.once('dialog', (dialog) => dialog.accept())
  await teacher.page.getByRole('button', { name: '글 숨기기', exact: true }).click()
  await teacher.page.getByText('선생님이 숨긴 글이에요. 학생 목록에는 보이지 않아요.', { exact: true }).waitFor()
  await page.getByRole('button', { name: '닫기', exact: true }).click(); await community(page)
  await page.getByText('아직 올라온 이야기가 없어요.', { exact: true }).waitFor()
  await teacher.page.getByRole('button', { name: '목록으로', exact: true }).click()
  await teacher.page.getByLabel('숨긴 글만', { exact: true }).check()
  await teacher.page.getByRole('button').filter({ hasText: '수정한 하버드 이야기' }).waitFor()
  assert.deepEqual(errors, [])
  console.log('PASS: 360/768/1280px, 200% text, keyboard focus, reduced motion, draft/photo persistence, offline, publish, comment, edit, filters, teacher hide, cross-session visibility, no page errors')
  await context.close(); await teacher.context.close()
} catch (error) { console.error('Page errors:', errors); throw error }
finally { await browser.close(); await vite.close(); store.close() }
