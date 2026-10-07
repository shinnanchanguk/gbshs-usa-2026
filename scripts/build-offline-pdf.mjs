#!/usr/bin/env node
/**
 * 오프라인 안내 PDF 만들기(빌드 마지막 단계).
 * dist/ 를 잠깐 띄워 인쇄용 화면(#/print)을 크로미움으로 A4 PDF 로 뜬다 → dist/offline/USA2026_offline-guide.pdf
 * 이름·자리·방이 없는 공개 내용만 들어간다. 휴대폰에서는 여기에 내 정보 쪽과 내 항공권을 붙인다(src/features/print/personalPdf.ts).
 * GitHub Actions 에서는 deploy.yml 이 크로미움을 먼저 설치한다.
 */
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')
const BASE = '/gbshs-usa-2026/'
const OUT = path.join(DIST, 'offline', 'USA2026_offline-guide.pdf')
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json' }

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('dist/index.html 이 없습니다. vite build 를 먼저 하세요.')
  process.exit(1)
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x')
  if (!url.pathname.startsWith(BASE)) return res.writeHead(404).end()
  let file = path.join(DIST, decodeURIComponent(url.pathname.slice(BASE.length)))
  if (!file.startsWith(DIST)) return res.writeHead(403).end()
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html')
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' })
  fs.createReadStream(file).pipe(res)
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const port = server.address().port

const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  // 서비스 워커가 끼어들지 않게 막고 연다
  await page.context().route('**/sw.js', (r) => r.fulfill({ status: 404, body: '' }))
  await page.goto(`http://127.0.0.1:${port}${BASE}#/print`, { waitUntil: 'networkidle' })
  await page.waitForSelector('body[data-print-ready="1"]', { timeout: 30_000 })
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  await page.pdf({ path: OUT, format: 'A4', printBackground: true, preferCSSPageSize: true })
  const size = fs.statSync(OUT).size
  if (size < 20_000) throw new Error(`PDF 가 너무 작습니다(${size} bytes)`)
  console.log(`오프라인 안내 PDF: ${path.relative(ROOT, OUT)} (${Math.round(size / 1024)} KB)`)
} finally {
  await browser.close()
  server.close()
}
