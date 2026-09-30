#!/usr/bin/env node
/**
 * 장소 사이 실제 길 만들기 (`npm run routes`)
 *
 * 장을 순서대로 이어 가며, 장소가 있는 장마다 바로 앞 장소에서 오는 길을 OSRM 공개 서버에서 받아
 * content/routes.json 에 저장한다(키: "<앞 장 id>><이 장 id>"). 버스는 자동차 길, 걷기는 보행 길.
 * 이미 받은 구간은 좌표가 같으면 다시 받지 않는다. 빌드할 때는 인터넷이 필요 없다(저장된 파일만 읽음).
 *
 * 실행: node --network-family-autoselection-attempt-timeout=2000 scripts/build-routes.mjs (npm run routes)
 *   (이 옵션이 없으면 IPv6 연결을 기다리다 시간이 초과되는 환경이 있다)
 *
 * 경로 데이터 © OpenStreetMap contributors (ODbL), 계산: OSRM (project-osrm.org, routing.openstreetmap.de)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'content/routes.json')
const days = fs
  .readdirSync(path.join(ROOT, 'content/days'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'content/days', f), 'utf8')))
  .sort((a, b) => a.n - b.n)

const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {}
const out = {}
const inUS = ([lng]) => lng < -60
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Douglas-Peucker 로 점 줄이기(약 15m 허용) */
function simplify(points, tol = 0.00014) {
  if (points.length < 3) return points
  const keep = new Uint8Array(points.length)
  keep[0] = keep[points.length - 1] = 1
  const stack = [[0, points.length - 1]]
  while (stack.length) {
    const [a, b] = stack.pop()
    const [x1, y1] = points[a]
    const [x2, y2] = points[b]
    let max = 0
    let idx = -1
    for (let i = a + 1; i < b; i++) {
      const [x, y] = points[i]
      const dx = x2 - x1
      const dy = y2 - y1
      const t = dx || dy ? Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy))) : 0
      const d = Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy))
      if (d > max) {
        max = d
        idx = i
      }
    }
    if (max > tol && idx > 0) {
      keep[idx] = 1
      stack.push([a, idx], [idx, b])
    }
  }
  return points.filter((_, i) => keep[i]).map(([x, y]) => [Math.round(x * 1e5) / 1e5, Math.round(y * 1e5) / 1e5])
}

async function fetchRoute(mode, a, b) {
  const base = mode === 'walk' ? 'https://routing.openstreetmap.de/routed-foot/route/v1/driving' : 'https://router.project-osrm.org/route/v1/driving'
  const url = `${base}/${a[0]},${a[1]};${b[0]},${b[1]}?overview=full&geometries=geojson`
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'gbshs-usa-2026 trip guide (static build script)' } })
      if (res.ok) {
        const j = await res.json()
        const r = j.routes?.[0]
        if (r) return { km: Math.round((r.distance / 1000) * 10) / 10, min: Math.round(r.duration / 60), coords: simplify(r.geometry.coordinates) }
      }
    } catch {
      /* 다시 시도 */
    }
    await sleep(1500 * (attempt + 1))
  }
  return null
}

let last = null
let fetched = 0
let kept = 0
for (const day of days) {
  for (const slide of day.slides) {
    if (!slide.place) continue
    const here = slide.place.coords
    if (last && inUS(last.coords) && inUS(here)) {
      const key = `${last.id}>${slide.id}`
      const mode = slide.leg?.mode === 'walk' ? 'walk' : 'bus'
      // 같은 건물 안(150m 이내)에서 이어지는 일정은 길을 그리지 않는다
      const same = Math.hypot((last.coords[0] - here[0]) * 84, (last.coords[1] - here[1]) * 111) < 0.15
      const old = prev[key]
      if (same) {
        // 같은 자리에서 이어지는 일정은 길이 없다
      } else if (old && old.mode === mode && old.from?.join() === last.coords.join() && old.to?.join() === here.join()) {
        out[key] = old
        kept++
      } else {
        const r = await fetchRoute(mode, last.coords, here)
        if (r) {
          out[key] = { mode, km: r.km, min: r.min, from: last.coords, to: here, coords: r.coords }
          fetched++
          console.log(`받음 ${key}: ${mode} ${r.km}km ${r.min}분 점 ${r.coords.length}개`)
        } else console.warn(`실패 ${key} (직선으로 그린다)`)
        await sleep(1100)
      }
    }
    last = { id: slide.id, coords: here }
  }
}
fs.writeFileSync(OUT, JSON.stringify(out) + '\n')
console.log(`routes.json: ${Object.keys(out).length}구간 (새로 받음 ${fetched}, 그대로 ${kept})`)
