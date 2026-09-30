#!/usr/bin/env node
/**
 * 명단 암호문 만들기 (`npm run roster:seal`)
 *
 * 입력(레포 밖, .gitignore 의 private/):
 *   private/roster.json      이름·좌석·객실·연락처가 든 원본
 *   private/access-code.txt  입장 코드 숫자 6자리 (없으면 새로 만든다)
 * 출력(공개, 커밋):
 *   content/roster.enc.json  PBKDF2-SHA256(60만 번) + AES-256-GCM 암호문
 *
 * 원본이 바뀌지 않았으면 암호문을 다시 만들지 않는다(커밋 차이가 생기지 않게).
 * 코드를 바꾸려면 private/access-code.txt 에 새 숫자 6자리를 적거나(지우면 새로 만든다) 다시 실행한다.
 * 이전 코드로 저장한 기기는 다시 입력해야 한다.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomInt, webcrypto as crypto } from 'node:crypto'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const P = (p) => path.join(ROOT, p)
const ITER = 600_000
// src/lib/roster.ts 의 CODE_LEN 과 같아야 한다.
// 숫자 6자리는 공개 암호문에 100만 가지를 다 넣어 보면 풀린다. 로그인이 붙기 전까지 쓰는 임시 잠금이다(2026-09-30 결정).
const CODE_LEN = 6

if (!fs.existsSync(P('private/roster.json'))) {
  console.error('private/roster.json 이 없습니다. 레포 밖 원본(엑셀)에서 명단을 먼저 만드세요.')
  process.exit(1)
}

let code = fs.existsSync(P('private/access-code.txt')) ? fs.readFileSync(P('private/access-code.txt'), 'utf8').trim() : ''
if (!code) {
  code = Array.from({ length: CODE_LEN }, () => randomInt(10)).join('')
  fs.writeFileSync(P('private/access-code.txt'), code + '\n', { mode: 0o600 })
  console.log('새 입장 코드를 private/access-code.txt 에 저장했습니다.')
}
// 숫자 3자리 + (빈칸이나 - 하나) + 숫자 3자리만 받는다. 다른 글자가 섞인 값을 조용히 잘라 쓰지 않는다.
if (!/^\d{3}[ -]?\d{3}$/.test(code)) {
  console.error(`private/access-code.txt 의 입장 코드는 숫자 ${CODE_LEN}자리여야 합니다.`)
  process.exit(1)
}
const normalized = code.replace(/\D/g, '')
// 손으로 고친 파일도 나만 읽게
fs.chmodSync(P('private/access-code.txt'), 0o600)
const plain = fs.readFileSync(P('private/roster.json'), 'utf8')
const text = JSON.stringify(JSON.parse(plain))

const b64 = (u8) => Buffer.from(u8).toString('base64')
const fromB64 = (s) => new Uint8Array(Buffer.from(s, 'base64'))

async function keyFor(salt, iter) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(normalized), 'PBKDF2', false, ['deriveBits'])
  const raw = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, base, 256)
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

const out = P('content/roster.enc.json')
if (fs.existsSync(out)) {
  try {
    const prev = JSON.parse(fs.readFileSync(out, 'utf8'))
    const key = await keyFor(fromB64(prev.salt), prev.iter)
    const old = new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(prev.iv) }, key, fromB64(prev.data)))
    if (old === text) {
      console.log('명단이 그대로라 암호문을 다시 만들지 않았습니다.')
      process.exit(0)
    }
  } catch {
    /* 코드가 바뀌었거나 파일이 깨졌으면 새로 만든다 */
  }
}

const salt = crypto.getRandomValues(new Uint8Array(16))
const iv = crypto.getRandomValues(new Uint8Array(12))
const key = await keyFor(salt, ITER)
const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text)))
fs.writeFileSync(out, JSON.stringify({ v: 1, iter: ITER, salt: b64(salt), iv: b64(iv), data: b64(data) }) + '\n')

// 방금 만든 암호문이 실제로 풀리는지 확인
const check = JSON.parse(fs.readFileSync(out, 'utf8'))
const again = new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(check.iv) }, await keyFor(fromB64(check.salt), check.iter), fromB64(check.data)))
if (again !== text) {
  console.error('암호문 확인 실패')
  process.exit(1)
}
console.log(`암호문을 만들었습니다: content/roster.enc.json (${data.length} bytes)`)
