/*
 * 오프라인 대비 서비스 워커.
 * - 화면(html): 먼저 인터넷에서 새로 받고, 안 되면 저장해 둔 것을 보여 준다(새 내용이 늦게 반영되는 일이 없게).
 * - 이름에 해시가 붙은 파일(js·css·글꼴): 한 번 받으면 저장해 두고 쓴다.
 * - 답사 사진·지도 타일: 본 것만 저장해 두고, 오래된 것부터 지워 개수를 넘지 않게 한다.
 * 해외에서 지하철·박물관처럼 인터넷이 약한 곳에서도 이미 본 일정과 사진은 열린다.
 */
const PREFIX = 'usa2026-'
const SHELL = PREFIX + 'shell-v4'
const ASSETS = PREFIX + 'assets-v2'
const PHOTOS = PREFIX + 'photos-v1'
const TILES = PREFIX + 'tiles-v1'
const OFFLINE = PREFIX + 'offline-v1'
const KEEP = [SHELL, ASSETS, PHOTOS, TILES, OFFLINE]
const LIMIT = { [PHOTOS]: 500, [TILES]: 1800 }

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((c) => c.addAll(['./', './manifest.webmanifest', './icons/icon-192.png']))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && !KEEP.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

async function trim(name) {
  const max = LIMIT[name]
  if (!max) return
  const cache = await caches.open(name)
  const keys = await cache.keys()
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i])
}

async function cacheFirst(request, name) {
  const cache = await caches.open(name)
  const hit = await cache.match(request)
  if (hit) return hit
  const res = await fetch(request)
  if (res.ok) {
    cache.put(request, res.clone())
    trim(name)
  }
  return res
}

async function networkFirst(request) {
  const cache = await caches.open(SHELL)
  try {
    const res = await fetch(request)
    // 앱 첫 화면(html)일 때만 오프라인용으로 저장한다(다른 파일 주소로 덮어쓰지 않게)
    const shellPath = new URL('./', self.location).pathname
    const path = new URL(request.url).pathname
    if (res.ok && (path === shellPath || path === shellPath + 'index.html') && (res.headers.get('content-type') || '').includes('text/html')) cache.put('./', res.clone())
    return res
  } catch {
    return (await cache.match('./')) || Response.error()
  }
}

// 학생 사전 안내판(/guide/)은 따로 빌드한 사이트라 이 서비스 워커가 맡지 않는다(오프라인 때 본 사이트 화면이 대신 뜨지 않게)
const GUIDE_PATH = new URL('./guide/', self.location).pathname

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin === self.location.origin && (url.pathname === GUIDE_PATH.slice(0, -1) || url.pathname.startsWith(GUIDE_PATH))) return
  if (req.mode === 'navigate' && url.origin === self.location.origin) {
    event.respondWith(networkFirst(req))
    return
  }
  if (url.origin === self.location.origin) {
    if (url.pathname.includes('/assets/')) event.respondWith(cacheFirst(req, ASSETS))
    // 오프라인 안내 PDF: 새로 받을 수 있으면 새것을, 안 되면 저장해 둔 것을 쓴다(내용이 바뀔 수 있어서)
    else if (url.pathname.includes('/offline/')) event.respondWith(fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(OFFLINE).then((c) => c.put(req, copy)) } return res }).catch(() => caches.match(req).then((r) => r || Response.error())))
    else if (url.pathname.includes('/photos/')) event.respondWith(cacheFirst(req, PHOTOS))
    return
  }
  if (url.hostname === 'tiles.openfreemap.org') {
    // 타일·글꼴·스프라이트만 저장하고, 스타일·타일 목록(JSON)은 늘 새로 받는다(타일 판이 바뀌어도 따라가게)
    if (/\.(pbf|png|webp|pbf\?.*)$/.test(url.pathname) || url.pathname.includes('/fonts/') || url.pathname.includes('/sprites/')) event.respondWith(cacheFirst(req, TILES))
    else event.respondWith(fetch(req).catch(() => caches.match(req).then((r) => r || Response.error())))
  }
})
