#!/usr/bin/env node
/**
 * 안내 자료 검사 (`npm run check`, 빌드 전에 자동 실행)
 *
 * - content/trip.json, content/days/*.json, content/seating.json 이 src/content/schema.ts 구조를 따르는지
 * - 슬라이드 id 가 겹치지 않는지, 일차 안에서 시각 순서가 맞는지
 * - 슬라이드가 가리키는 사진이 실제로 있는지, 받은 사진이 빠짐없이 어딘가에 쓰였는지
 * - public/photos 에 목록에 없는 파일이 남아 있지 않은지
 * - 좌표가 미국 동부 또는 인천 근처인지
 * - 공개 파일에 학생 이름·연락처가 섞여 들어가지 않았는지(레포 밖 private/roster.json 이 있을 때)
 * - 암호문(content/roster.enc.json)이 있는지
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Day, Trip, PhotoSources, Seating } from '../src/content/schema.ts'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'))
const errors = []
const warnings = []

function parse(schema, data, label) {
  const result = schema.safeParse(data)
  if (!result.success) {
    for (const issue of result.error.issues) errors.push(`${label} → ${issue.path.join('.') || '(전체)'}: ${issue.message}`)
    return null
  }
  return result.data
}

const trip = parse(Trip, read('content/trip.json'), 'content/trip.json')
const seating = parse(Seating, read('content/seating.json'), 'content/seating.json')
const sources = parse(PhotoSources, read('content/photo-sources.json'), 'content/photo-sources.json')
const excluded = fs.existsSync(path.join(ROOT, 'content/photo-excluded.json')) ? read('content/photo-excluded.json') : {}

const dayFiles = fs.readdirSync(path.join(ROOT, 'content/days')).filter((f) => f.endsWith('.json')).sort()
const days = []
for (const file of dayFiles) {
  const day = parse(Day, read(`content/days/${file}`), `content/days/${file}`)
  if (!day) continue
  if (file !== `day${day.n}.json`) errors.push(`content/days/${file}: 파일 이름이 day${day.n}.json 이어야 한다`)
  days.push(day)
}
days.sort((a, b) => a.n - b.n)

const IN_US_EAST = ([lng, lat]) => lng > -80 && lng < -69 && lat > 37 && lat < 45.5
const IN_INCHEON = ([lng, lat]) => lng > 126 && lng < 127.2 && lat > 37 && lat < 38
const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))
const hotelIds = new Set((trip?.hotels ?? []).map((h) => h.id))

const slideIds = new Set()
const used = new Map()
for (const day of days) {
  let last = -1
  if (day.hotel && !hotelIds.has(day.hotel)) errors.push(`${day.n}일차: hotel "${day.hotel}" 가 trip.hotels 에 없다`)
  for (const slide of day.slides) {
    const where = `${day.n}일차 「${slide.title}」(${slide.id})`
    if (slideIds.has(slide.id)) errors.push(`${where}: 슬라이드 id 가 겹친다`)
    slideIds.add(slide.id)
    if (!slide.id.startsWith(`d${day.n}-`)) errors.push(`${where}: id 는 "d${day.n}-" 로 시작해야 한다`)
    if (slide.time) {
      const t = toMin(slide.time.start)
      // 8일차(자정 넘은 비행)는 날짜가 바뀌므로 순서 검사에서 뺀다
      if (t < last && day.n !== 8) errors.push(`${where}: 앞 슬라이드보다 시각이 이르다 (${slide.time.start})`)
      last = t
      if (slide.time.end && toMin(slide.time.end) < t && ![1, 7, 8].includes(day.n)) warnings.push(`${where}: 끝 시각이 시작보다 이르다`)
    }
    if (slide.place && !IN_US_EAST(slide.place.coords) && !IN_INCHEON(slide.place.coords)) {
      errors.push(`${where}: 좌표 ${slide.place.coords} 가 미국 동부·인천 범위 밖이다 ([경도, 위도] 순서 확인)`)
    }
    if (slide.cover && !slide.photos.some((p) => p.id === slide.cover)) errors.push(`${where}: cover 가 photos 목록에 없다`)
    if (slide.photos.length && !slide.cover) errors.push(`${where}: 사진이 있으면 cover(대표 사진)를 정해야 한다`)
    if (slide.reflect && !slide.themes.length) warnings.push(`${where}: 느낀 점 칸이 있는데 활동 주제(themes)가 없다`)
    for (const text of [slide.title, slide.summary, ...slide.details, ...slide.notices, ...slide.tips, slide.leg?.text ?? '', slide.meeting?.place ?? '', slide.meeting?.note ?? '']) {
      if (text.includes('—')) errors.push(`${where}: 긴 줄표(—)를 쓰지 않는다: "${text.slice(0, 40)}…"`)
    }
    for (const photo of slide.photos) {
      if (sources && !sources.photos[photo.id]) errors.push(`${where}: 사진 ${photo.id} 가 content/photo-sources.json 에 없다`)
      if (used.has(photo.id)) errors.push(`${where}: 사진 ${photo.id} 가 ${used.get(photo.id)} 에도 쓰였다 (한 사진은 한 곳에만)`)
      used.set(photo.id, slide.id)
    }
  }
}
for (const n of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) if (!days.some((d) => d.n === n)) errors.push(`content/days/day${n}.json 이 없다`)

if (seating) {
  for (const bus of seating.buses) {
    const nums = bus.rows.flat().filter((n) => n != null)
    for (const n of nums) if (!bus.seats[String(n)]) errors.push(`seating ${bus.no}호차: ${n}번 자리 정보가 없다`)
    const students = Object.values(bus.seats).filter((s) => s.role === 'student').length
    const expected = trip?.buses.find((b) => b.no === bus.no)?.students
    if (expected && students !== expected) errors.push(`seating ${bus.no}호차: 학생 자리 ${students}개, trip.json 은 ${expected}명`)
  }
}

if (sources) {
  const unused = Object.keys(sources.photos).filter((id) => !used.has(id))
  if (unused.length) {
    errors.push(`받은 사진 중 어느 슬라이드에도 없는 사진 ${unused.length}장 (쓰거나 content/photo-excluded.json 에 이유를 적고 빼야 한다):`)
    for (const id of unused.slice(0, 40)) errors.push(`  - ${id} (${sources.photos[id].from})`)
    if (unused.length > 40) errors.push(`  … 외 ${unused.length - 40}장`)
  }
  for (const id of Object.keys(excluded)) {
    if (sources.photos[id]) errors.push(`제외 목록의 사진 ${id} 가 아직 photo-sources.json 에 있다`)
  }
  const expected = new Set(Object.values(sources.photos).flatMap((p) => [p.src, p.thumb, ...(p.video ? [p.video] : [])]))
  const photoRoot = path.join(ROOT, 'public', 'photos')
  const walk = (dir) =>
    fs.existsSync(dir)
      ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]))
      : []
  for (const file of walk(photoRoot)) {
    const rel = path.relative(path.join(ROOT, 'public'), file).split(path.sep).join('/')
    if (!expected.has(rel)) errors.push(`public/${rel}: photo-sources.json 에 없는 파일이다 (지우거나 목록에 추가)`)
  }
  for (const rel of expected) {
    if (!fs.existsSync(path.join(ROOT, 'public', rel))) errors.push(`public/${rel}: 목록에는 있는데 파일이 없다`)
  }
}

// 공개 파일에 개인정보가 새지 않았는지: 레포 밖 명단이 있으면(로컬에서만) 커밋될 모든 글 파일에서 이름·연락처를 찾는다.
const privatePath = path.join(ROOT, 'private', 'roster.json')
if (fs.existsSync(privatePath)) {
  const roster = JSON.parse(fs.readFileSync(privatePath, 'utf8'))
  const names = [...roster.students.map((s) => s.name), ...roster.teachers.map((t) => t.name), ...roster.mentorsMIT.map((m) => m.name)].filter((n) => n && n.length >= 2)
  const phones = roster.teachers.map((t) => (t.phone ?? '').replace(/\D/g, '')).filter((p) => p.length >= 9)
  let files = []
  try {
    const { execFileSync } = await import('node:child_process')
    files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean)
  } catch {
    files = []
  }
  const TEXT = /\.(json|ts|tsx|js|mjs|css|html|md|txt|webmanifest|yml|yaml)$/
  for (const f of files) {
    if (!TEXT.test(f) || f.startsWith('public/photos/')) continue
    const full = path.join(ROOT, f)
    if (!fs.existsSync(full)) continue
    const text = fs.readFileSync(full, 'utf8')
    for (const n of names) if (text.includes(n)) errors.push(`${f}: 공개 파일에 명단의 이름("${n.slice(0, 1)}…")이 들어 있다`)
    const digits = text.replace(/\D/g, '')
    for (const p of phones) if (digits.includes(p)) errors.push(`${f}: 공개 파일에 인솔교사 연락처가 들어 있다`)
  }
}

const encPath = path.join(ROOT, 'content', 'roster.enc.json')
if (!fs.existsSync(encPath)) errors.push('content/roster.enc.json 이 없다 (npm run roster:seal 로 만든다)')

for (const w of warnings) console.warn(`주의: ${w}`)
if (errors.length) {
  console.error(`검사 실패 (${errors.length}건)`)
  for (const e of errors) console.error(`- ${e}`)
  process.exit(1)
}
const slideCount = days.reduce((n, d) => n + d.slides.length, 0)
console.log(`검사 통과: ${days.length}개 묶음, 슬라이드 ${slideCount}장, 사진 ${used.size}장`)
