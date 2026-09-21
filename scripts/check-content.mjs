#!/usr/bin/env node
/**
 * 안내 자료 검사 (`npm run check`, 빌드 전에 자동 실행)
 *
 * - content/trip.json, content/days/*.json 이 src/content/schema.ts 구조를 따르는지
 * - 슬라이드 id 가 겹치지 않는지, 일차 안에서 시각 순서가 맞는지
 * - 슬라이드가 가리키는 사진이 실제로 있는지, 받은 사진이 빠짐없이 어딘가에 쓰였는지
 * - public/photos 에 목록에 없는 파일이 남아 있지 않은지
 * - 좌표가 미국 동부 또는 인천 근처인지
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Day, Trip, PhotoSources } from '../src/content/schema.ts'

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

parse(Trip, read('content/trip.json'), 'content/trip.json')
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

const IN_US_EAST = ([lng, lat]) => lng > -80 && lng < -69 && lat > 37 && lat < 45.5
const IN_INCHEON = ([lng, lat]) => lng > 126 && lng < 127.2 && lat > 37 && lat < 38
const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))

const slideIds = new Set()
const used = new Map()
for (const day of days) {
  let last = -1
  for (const slide of day.slides) {
    const where = `${day.n}일차 「${slide.title}」(${slide.id})`
    if (slideIds.has(slide.id)) errors.push(`${where}: 슬라이드 id 가 겹친다`)
    slideIds.add(slide.id)
    if (!slide.id.startsWith(`d${day.n}-`)) errors.push(`${where}: id 는 "d${day.n}-" 로 시작해야 한다`)
    if (slide.time) {
      const t = toMin(slide.time.start)
      if (t < last) errors.push(`${where}: 앞 슬라이드보다 시각이 이르다 (${slide.time.start})`)
      last = t
      if (slide.time.end && toMin(slide.time.end) < t && !(day.n === 7 || day.n === 8)) warnings.push(`${where}: 끝 시각이 시작보다 이르다`)
    }
    if (slide.place && !IN_US_EAST(slide.place.coords) && !IN_INCHEON(slide.place.coords)) {
      errors.push(`${where}: 좌표 ${slide.place.coords} 가 미국 동부·인천 범위 밖이다 ([경도, 위도] 순서 확인)`)
    }
    if (slide.cover && !slide.photos.some((p) => p.id === slide.cover)) errors.push(`${where}: cover 가 photos 목록에 없다`)
    if (slide.photos.length && !slide.cover) errors.push(`${where}: 사진이 있으면 cover(대표 사진)를 정해야 한다`)
    for (const photo of slide.photos) {
      if (sources && !sources.photos[photo.id]) errors.push(`${where}: 사진 ${photo.id} 가 content/photo-sources.json 에 없다`)
      if (used.has(photo.id)) errors.push(`${where}: 사진 ${photo.id} 가 ${used.get(photo.id)} 에도 쓰였다 (한 사진은 한 곳에만)`)
      used.set(photo.id, slide.id)
    }
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

for (const w of warnings) console.warn(`주의: ${w}`)
if (errors.length) {
  console.error(`검사 실패 (${errors.length}건)`)
  for (const e of errors) console.error(`- ${e}`)
  process.exit(1)
}
const slideCount = days.reduce((n, d) => n + d.slides.length, 0)
console.log(`검사 통과: ${days.length}개 일차, 슬라이드 ${slideCount}장, 사진 ${used.size}장`)
