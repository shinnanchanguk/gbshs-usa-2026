import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const vite = await createServer({ root, server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' })
await vite.listen()
const base = `http://127.0.0.1:${vite.httpServer.address().port}/gbshs-usa-2026/`
const fixture = `${base}tests/private-notes.html`
const browser = await chromium.launch({ args: ['--use-angle=swiftshader'] })
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
const errors = []
const secret = '개인 메모 검사: 멘토에게 질문하기'
let requestsWithPrivateText = 0
await context.addInitScript(() => {
  if (!localStorage.getItem('usa2026:zudo-session')) localStorage.setItem('usa2026:zudo-session', JSON.stringify({ token: 'fixture-student', me: { role: 'student', name: '테스트 학생', studentNumber: '1101', expiresAt: '2099-10-25T00:00:00Z', rosterCode: null, canResetPassword: false } }))
  if (!localStorage.getItem('usa2026:profile')) localStorage.setItem('usa2026:profile', JSON.stringify({ role: 'student', fromZudo: true }))
})
// 실제 지도 엔진과 좌표는 사용하되, 검사 중 외부 타일망의 상태에 의존하지 않는다.
await context.route('**/styles/positron', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ version: 8, glyphs: `${base}fixture-glyphs/{fontstack}/{range}.pbf`, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#fbf8f2' } }] }) }))
await context.route('**/fixture-glyphs/**', (route) => route.fulfill({ contentType: 'application/x-protobuf', body: Buffer.alloc(0) }))
await context.route('**/api/trip/**', (route) => route.fulfill({ status: 404, contentType: 'application/json', body: '{}' }))
const page = await context.newPage()
let guideServer
page.setDefaultTimeout(15_000)
page.on('pageerror', (error) => errors.push(error.message))
page.on('request', (request) => { if (request.url().includes(secret) || request.postData()?.includes(secret)) requestsWithPrivateText++ })
const input = () => page.getByRole('textbox', { name: '개인 메모', exact: true })
const close = () => page.getByRole('button', { name: '닫기', exact: true }).click()
const enter = async (key) => { await page.goto(`${fixture}#/p/${key}`); await page.locator('[data-slot="0"] .private-note-entry').waitFor() }
const openNote = () => page.locator('[data-slot="0"] .private-note-entry').click()
async function identity(role, number = '1101') {
  await page.evaluate(({ role, number }) => {
    for (const [key, value] of [
      ['usa2026:zudo-session', { token: `fixture-${role}`, me: { role, name: '테스트 계정', studentNumber: number, children: [number], expiresAt: '2099-10-25T00:00:00Z', rosterCode: null, canResetPassword: false } }],
      ['usa2026:profile', { role, fromZudo: true }],
    ]) { const next = JSON.stringify(value); localStorage.setItem(key, next); window.dispatchEvent(new StorageEvent('storage', { key, newValue: next, storageArea: localStorage })) }
  }, { role, number })
}
async function noOverflow() {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), true)
  assert.equal(await page.locator('.sheet').evaluate((element) => element.scrollWidth <= element.clientWidth + 1), true)
}

try {
  await enter('d3-mit-lecture-qa')
  // 편집기를 한 번도 열지 않은 상태에서 오프라인 첫 작성이 가능해야 한다.
  await context.setOffline(true)
  await openNote()
  await input().fill(secret + '\n첫 일정의 메모')
  await page.getByText('이 기기에 자동 저장했어요.', { exact: true }).waitFor()
  await close()
  await context.setOffline(false)
  await page.reload()
  await openNote()
  assert.equal(await input().inputValue(), secret + '\n첫 일정의 메모')
  await close()
  await page.locator('.map-private-note').waitFor()
  console.log('PASS: offline first use, autosave, reload, real map marker')

  await enter('d3-mit-campus-mentoring')
  await openNote()
  await input().fill('같은 장소의 두 번째 일정 메모')
  await close()
  const marker = page.getByRole('button', { name: '내 메모 2개: MIT(매사추세츠 공과대학교)', exact: true })
  await marker.waitFor()
  await marker.click()
  assert.equal(await input().inputValue(), '같은 장소의 두 번째 일정 메모')
  await page.getByLabel('메모 일정 선택', { exact: true }).selectOption('d3-mit-lecture-qa')
  assert.equal(await input().inputValue(), secret + '\n첫 일정의 메모')
  await page.getByLabel('메모 일정 선택', { exact: true }).selectOption('d3-mit-campus-mentoring')
  assert.equal(await input().inputValue(), '같은 장소의 두 번째 일정 메모')
  await noOverflow()
  await page.getByRole('button', { name: '닫기', exact: true }).focus()
  await page.keyboard.press('Shift+Tab')
  assert.equal(await page.evaluate(() => document.querySelector('.sheet')?.contains(document.activeElement)), true)
  await page.keyboard.press('Escape')
  await page.getByRole('dialog', { name: '내 메모', exact: true }).waitFor({ state: 'hidden' })
  await page.waitForFunction(() => document.activeElement?.classList.contains('map-private-note'))
  assert.equal(await marker.evaluate((element) => element === document.activeElement), true)
  console.log('PASS: same-place grouping, separate schedule text, keyboard focus')

  // 지도 이동은 화면 좌표가 아니라 장소 좌표에 연결된 마커를 움직여야 한다.
  const before = await marker.boundingBox()
  const canvas = await page.locator('.maplibregl-canvas').boundingBox()
  await page.mouse.move(canvas.x + canvas.width / 2, canvas.y + canvas.height / 2)
  await page.mouse.down(); await page.mouse.move(canvas.x + canvas.width / 2 + 70, canvas.y + canvas.height / 2, { steps: 8 }); await page.mouse.up()
  await page.waitForFunction((x) => { const rect = document.querySelector('.map-private-note')?.getBoundingClientRect(); return rect && Math.abs(rect.x - x) > 20 }, before.x)
  assert.equal(await marker.getAttribute('data-note-keys'), JSON.stringify(['d3-mit-lecture-qa', 'd3-mit-campus-mentoring']))
  const afterPan = await marker.boundingBox()
  await page.mouse.move(canvas.x + canvas.width * .2, canvas.y + canvas.height * .4)
  await page.mouse.wheel(0, -400)
  await page.waitForFunction((x) => { const rect = document.querySelector('.map-private-note')?.getBoundingClientRect(); return rect && Math.abs(rect.x - x) > 5 }, afterPan.x)
  assert.equal(await marker.getAttribute('data-note-keys'), JSON.stringify(['d3-mit-lecture-qa', 'd3-mit-campus-mentoring']))
  await marker.click(); await close()
  console.log('PASS: marker follows map pan and zoom without changing schedule IDs')

  // 열린 메모도 다른 학생·보호자로 전환하는 즉시 가려야 한다.
  await marker.click()
  await identity('student', '1314')
  await page.getByRole('dialog', { name: '내 메모', exact: true }).waitFor({ state: 'hidden' })
  assert.equal(await page.locator('.map-private-note').count(), 0)
  await openNote(); assert.equal(await input().inputValue(), ''); await close()
  await identity('parent')
  assert.equal(await page.locator('.private-note-entry').count(), 0)
  assert.equal(await page.locator('.map-private-note').count(), 0)
  await identity('student')
  await openNote(); assert.equal(await input().inputValue(), '같은 장소의 두 번째 일정 메모')
  console.log('PASS: account isolation, parent exclusion, no stale open dialog')

  // 쓰기 실패는 입력을 유지하되, 저장 완료로 안내하면 안 된다.
  await page.evaluate(() => {
    const original = Storage.prototype.setItem
    window.fixtureBlockNotes = true
    Storage.prototype.setItem = function(key, value) { if (window.fixtureBlockNotes && key === 'usa2026:private-notes:v1') throw new DOMException('Fixture quota', 'QuotaExceededError'); return original.call(this, key, value) }
  })
  await input().fill('기기 저장이 막혔을 때의 변경')
  await page.getByRole('alert').filter({ hasText: '기기에 저장하지 못했어요.' }).waitFor()
  await close(); await openNote()
  assert.equal(await input().inputValue(), '기기 저장이 막혔을 때의 변경')
  await page.evaluate(() => { window.fixtureBlockNotes = false })
  await input().fill('저장을 다시 시도한 메모')
  await page.getByText('이 기기에 자동 저장했어요.', { exact: true }).waitFor()
  await page.reload(); await openNote()
  assert.equal(await input().inputValue(), '저장을 다시 시도한 메모')
  console.log('PASS: blocked storage warning, memory recovery, successful retry')

  fs.mkdirSync(path.join(root, 'test-results'), { recursive: true })
  await page.screenshot({ path: path.join(root, 'test-results/private-notes-desktop.png'), animations: 'disabled' })
  await page.emulateMedia({ media: 'print' })
  assert.equal(await page.locator('.private-note-paper').isVisible(), false)
  await page.emulateMedia({ media: 'screen' })
  for (const width of [360, 768, 1280]) { await page.setViewportSize({ width, height: 900 }); await noOverflow() }
  await page.setViewportSize({ width: 360, height: 800 })
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px' })
  await noOverflow()
  await page.evaluate(() => { document.documentElement.style.fontSize = '' })
  await page.screenshot({ path: path.join(root, 'test-results/private-notes-mobile.png'), animations: 'disabled' })
  console.log('PASS: 360/768/1280px, 200% text, reduced motion')

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: '메모 지우기', exact: true }).click()
  assert.equal(await input().inputValue(), '')
  await close()
  assert.equal(await page.locator('.map-private-note').count(), 1)
  await enter('d8-flight-ke086'); await openNote(); await input().fill('좌표 없는 비행 일정의 메모'); await close()
  assert.equal(await page.locator('.map-private-note').count(), 0)
  await page.reload(); await openNote(); assert.equal(await input().inputValue(), '좌표 없는 비행 일정의 메모'); await close()
  const peer = await context.newPage()
  await peer.goto(`${fixture}#/p/d8-flight-ke086`)
  await peer.locator('[data-slot="0"] .private-note-entry').click()
  await peer.getByRole('textbox', { name: '개인 메모', exact: true }).fill('다른 탭에서 고친 메모')
  await openNote(); assert.equal(await input().inputValue(), '다른 탭에서 고친 메모'); await close()
  await peer.close()
  console.log('PASS: delete updates marker, placeless schedule, cross-tab sync')

  await enter('day-3'); await openNote(); await input().fill('일차 전체 준비 메모'); await close()
  await page.reload(); await openNote(); assert.equal(await input().inputValue(), '일차 전체 준비 메모'); await close()
  await page.evaluate(() => { localStorage.setItem('usa2026:zudo-session', 'null'); window.dispatchEvent(new StorageEvent('storage', { key: 'usa2026:zudo-session', newValue: 'null', storageArea: localStorage })) })
  await page.locator('.private-note-entry').first().waitFor({ state: 'hidden' })
  assert.equal(await page.locator('.map-private-note').count(), 0)
  await identity('student')

  // 공개 안내판은 같은 브라우저에 메모가 남아 있어도 저장소를 읽지 않는다.
  guideServer = await createServer({ root, configFile: path.join(root, 'vite.guide.config.ts'), server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' })
  await guideServer.listen()
  const guide = await context.newPage()
  guide.on('pageerror', (error) => errors.push(error.message))
  const savedBook = await page.evaluate(() => localStorage.getItem('usa2026:private-notes:v1'))
  await guide.addInitScript((book) => {
    localStorage.setItem('usa2026:private-notes:v1', book)
    const original = Storage.prototype.getItem
    window.fixtureNoteReads = 0
    Storage.prototype.getItem = function(key) { if (key === 'usa2026:private-notes:v1') window.fixtureNoteReads++; return original.call(this, key) }
  }, savedBook)
  await guide.goto(`http://127.0.0.1:${guideServer.httpServer.address().port}/gbshs-usa-2026/guide/tests/private-notes.html#/p/d3-mit-lecture-qa`)
  await guide.locator('[data-slot="0"] h1').waitFor()
  assert.equal(await guide.locator('.private-note-entry, .map-private-note').count(), 0)
  assert.equal(await guide.evaluate(() => window.fixtureNoteReads), 0)
  await guide.close()
  console.log('PASS: day memo, logout, print hiding, public guide never reads private notes')

  // 개인정보 API 호출·제출 데이터·외부 지도 요청에 메모 본문을 포함하지 않는다.
  assert.equal(requestsWithPrivateText, 0)
  const records = await page.evaluate(() => JSON.parse(localStorage.getItem('usa2026:private-notes:v1')))
  assert.equal(records.entries.some((note) => note.pageKey === 'd3-mit-lecture-qa' && note.text.includes(secret)), true)
  assert.deepEqual(errors, [])
  console.log('PASS: literal private text stays in local note storage; no browser errors')
} catch (error) {
  console.error('Page errors:', errors)
  console.error('Focus:', await page.evaluate(() => ({ active: document.activeElement?.outerHTML.slice(0, 500), dialog: !!document.querySelector('.sheet'), markers: document.querySelectorAll('.map-private-note').length })))
  throw error
}
finally { await context.close(); await browser.close(); await guideServer?.close(); await vite.close() }
