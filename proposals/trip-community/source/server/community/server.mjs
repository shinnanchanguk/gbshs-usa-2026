import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHandler, MAX_REQUEST_BYTES } from './app.mjs'
import { openStore } from './store.mjs'
import { zudoAuthenticator } from './auth.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.resolve(process.env.COMMUNITY_DATA_DIR ?? path.join(here, 'data'))
fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 })
const filename = path.join(dataDir, 'community.sqlite')
const store = openStore(filename)
if (process.platform !== 'win32') fs.chmodSync(filename, 0o600)
const origins = (process.env.COMMUNITY_ALLOWED_ORIGINS ?? 'https://shinnanchanguk.github.io').split(',').map((s) => s.trim()).filter(Boolean)
const handler = createHandler({ store, allowedOrigins: origins, authenticate: zudoAuthenticator({ origin: process.env.ZUDO_ORIGIN ?? 'https://www.zudo.my' }) })
const server = http.createServer(async (req, res) => {
  try {
    const buffers = []
    let size = 0
    for await (const chunk of req) {
      size += chunk.length
      if (size > MAX_REQUEST_BYTES) { res.writeHead(413, { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' }); res.end('{"error":"too_large"}'); return }
      buffers.push(chunk)
    }
    const request = new Request(new URL(req.url ?? '/', 'http://community.local'), { method: req.method, headers: req.headers, ...(!['GET', 'HEAD'].includes(req.method) ? { body: Buffer.concat(buffers) } : {}) })
    const response = await handler(request)
    res.writeHead(response.status, Object.fromEntries(response.headers))
    res.end(Buffer.from(await response.arrayBuffer()))
  } catch { res.writeHead(500, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end('{"error":"server_error"}') }
})
server.requestTimeout = 30_000
server.headersTimeout = 15_000
server.listen(Number(process.env.PORT ?? 8788), process.env.HOST ?? '127.0.0.1', () => console.log('Community server ready'))
function stop() { server.close(() => { store.close(); process.exit(0) }) }
process.on('SIGINT', stop); process.on('SIGTERM', stop)
