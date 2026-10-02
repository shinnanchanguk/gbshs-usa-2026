#!/usr/bin/env node
/**
 * Built guide layout regression, including every chapter and Korean date/arrow.
 * Start `npm run preview`, then `npm run check:layout`.
 * GUIDE_URL can point at production. BROWSER_CHANNEL=chrome uses installed Chrome;
 * otherwise install the test browser once with `npx playwright install chromium`.
 * BROWSER_ENGINE=webkit checks Safari layout (`npx playwright install webkit`).
 * GUIDE_WIDTHS optionally limits the sweep. This only reads the public guide.
 */
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium, webkit } from 'playwright'

const root = new URL('../', import.meta.url)
const read = (file) => JSON.parse(fs.readFileSync(new URL(file, root), 'utf8'))
const overrides = read('content/guide-overrides.json')
const hidden = new Set(overrides.hidePages)
const pages = []
for (let n = 0; n <= 10; n++) {
  const day = read(`content/days/day${n}.json`)
  if (n >= 1 && n <= 9) pages.push({ key: `day-${n}`, title: day.title })
  for (const slide of day.slides) {
    if (!hidden.has(slide.id)) pages.push({ key: slide.id, title: overrides.titles?.[slide.id] ?? slide.title })
  }
}

const url = process.env.GUIDE_URL ?? 'http://127.0.0.1:4173/gbshs-usa-2026/guide/'
const widths = (process.env.GUIDE_WIDTHS ?? '320,359,360,361,375,390,414,568,768,958,959,960,961,1024,1280,1440,1920').split(',').map(Number)
if (!widths.every((w) => Number.isInteger(w) && w >= 320)) throw new Error('Invalid GUIDE_WIDTHS')
const engine = process.env.BROWSER_ENGINE ?? 'chromium'
if (!['chromium', 'webkit'].includes(engine)) throw new Error('Invalid BROWSER_ENGINE')
const browser = await (engine === 'webkit' ? webkit : chromium).launch({
  channel: engine === 'chromium' ? process.env.BROWSER_CHANNEL || undefined : undefined,
})
const failures = []
let checks = 0
try {
  const page = await browser.newPage({ viewport: { width: widths[0], height: 844 }, reducedMotion: 'reduce' })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(url)
  await page.locator('[data-slot="0"] h1').waitFor()
  await page.evaluate(() => document.fonts.ready)
  for (const width of widths) {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 844 })
    let count = 0
    for (const { key, title } of pages) {
      await page.evaluate((key) => { location.hash = `#/p/${key}` }, key)
      await page.waitForFunction((title) => {
        const normalize = (s) => s.replace(/\s+/g, '').replace(/→/g, '에서')
        return normalize(document.querySelector('[data-slot="0"] h1')?.textContent ?? '') === normalize(title)
      }, title, { timeout: 10000 })
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
      const result = await page.evaluate(() => {
        const slot = document.querySelector('[data-slot="0"]')
        const failures = []
        let checks = 0
        const check = (ok, kind, el, values) => {
          checks++
          if (!ok) failures.push({ kind, selector: el.className || el.tagName, text: el.textContent.slice(0, 90), values })
        }
        for (const li of slot.querySelectorAll('.steps li')) {
          const body = li.querySelector(':scope > .rich')
          check(!!body && li.childNodes.length === 1, 'single-list-body', li, { nodes: li.childNodes.length })
          if (!body) continue
          const a = li.getBoundingClientRect(), b = body.getBoundingClientRect()
          const style = getComputedStyle(li)
          const expected = parseFloat(style.gridTemplateColumns) + parseFloat(style.columnGap)
          check(Math.abs(b.left - a.left - expected) <= 1 && b.right <= a.right + 1, 'number-body-columns', li,
            { bodyOffset: b.left - a.left, expected, overflow: b.right - a.right })
        }
        for (const date of slot.querySelectorAll('.nowrap')) {
          const range = document.createRange()
          range.selectNodeContents(date)
          const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0)
          const tops = []
          for (const rect of rects) if (!tops.some((top) => Math.abs(top - rect.top) < 1)) tops.push(rect.top)
          check(tops.length === 1, 'date-single-line', date, { lines: tops.length })
          const li = date.closest('.steps li')
          if (li) {
            const a = li.querySelector(':scope > .rich')?.getBoundingClientRect(), b = date.getBoundingClientRect()
            check(!!a && b.left >= a.left - 1 && b.right <= a.right + 1, 'date-in-body-column', date,
              { left: b.left, right: b.right, bodyLeft: a?.left, bodyRight: a?.right })
          }
        }
        for (const el of slot.querySelectorAll('*')) {
          const style = getComputedStyle(el)
          if (/grid|flex/.test(style.display)) {
            const fragments = [...el.children].filter((c) => c.matches('.nowrap, .icon--inline'))
            check(fragments.length === 0, 'sentence-fragments-in-layout', el, { fragments: fragments.length })
          }
        }
        for (const el of slot.querySelectorAll('.steps li, .next-card__title, .pass__main, .leg, .page__place, .deadline__body')) {
          check(el.scrollWidth - el.clientWidth <= 1, 'text-overflow', el, { overflow: el.scrollWidth - el.clientWidth })
        }
        for (const el of slot.querySelectorAll('.next-card__title > .mono')) {
          const range = document.createRange()
          range.selectNodeContents(el)
          check(range.getClientRects().length === 1, 'next-time-single-line', el, { rects: range.getClientRects().length })
        }
        const app = document.querySelector('.app')
        check(app.scrollWidth - app.clientWidth <= 1, 'app-overflow', app, { overflow: app.scrollWidth - app.clientWidth })
        return { failures, checks }
      })
      checks += result.checks
      if (result.failures.length) {
        count += result.failures.length
        failures.push({ width, key, failures: result.failures })
      }
    }
    console.log(`${width}px: ${pages.length} pages, ${count} failures`)
  }
  if (errors.length) failures.push({ kind: 'pageerror', errors: [...new Set(errors)] })
} finally {
  await browser.close()
}
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2))
  process.exitCode = 1
} else {
  console.log(`PASS: ${pages.length} pages × ${widths.length} widths, ${checks} geometry checks (${fileURLToPath(root)})`)
}
