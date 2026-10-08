#!/usr/bin/env node
/**
 * 학생 사전 안내판(dist/guide) 점검. npm run build 끝에 돈다.
 * 비밀번호 없이 퍼지는 판이라, 암호문 명단·복호화 코드가 섞여 들어가면 빌드를 멈춘다.
 * private/roster.json 이 있는 컴퓨터에서는 이름·전화번호도 하나도 없는지 본다(CI 에는 그 파일이 없다).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIR = path.join(ROOT, 'dist', 'guide')
if (!fs.existsSync(path.join(DIR, 'index.html'))) {
  console.error('dist/guide 가 없습니다. 사전 안내판 빌드가 먼저 돌아야 합니다.')
  process.exit(1)
}

const files = []
const walk = (d, out = files) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name)
    if (e.isDirectory()) walk(f, out)
    else if (/\.(js|css|html|json|webmanifest|txt)$/.test(e.name)) out.push(f)
  }
  return out
}
walk(DIR)
const text = files.map((f) => fs.readFileSync(f, 'utf8')).join('\n')

const errors = []
for (const word of ['PBKDF2', 'deriveBits', 'roster-key', 'roster.enc', 'field-photos', 'createObjectStore']) if (text.includes(word)) errors.push(`복호화·명단 코드("${word}")가 들어 있다`)
const sealed = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'roster.enc.json'), 'utf8'))
for (let i = 0; i + 40 <= sealed.data.length; i += 40) {
  if (text.includes(sealed.data.slice(i, i + 40))) {
    errors.push('암호문 명단이 들어 있다')
    break
  }
}
if (/"teacherNotes"\s*:\s*\[\s*"/.test(text)) errors.push('선생님 메모(teacherNotes)가 들어 있다')

const privatePath = path.join(ROOT, 'private', 'roster.json')
if (fs.existsSync(privatePath)) {
  const r = JSON.parse(fs.readFileSync(privatePath, 'utf8'))
  const names = [...r.students.map((s) => s.name), ...r.teachers.map((t) => t.name), ...(r.mentorsMIT ?? []).map((m) => m.name), ...(r.nightDuty ?? []).map((d) => d.name)].filter((n) => n && n.length >= 2)
  const digits = text.replace(/\D/g, '')
  const phones = r.teachers.map((t) => (t.phone ?? '').replace(/\D/g, '')).filter((p) => p.length >= 8)
  const nameHits = new Set(names.filter((n) => text.includes(n))).size
  const phoneHits = phones.filter((p) => digits.includes(p)).length
  if (nameHits) errors.push(`명단 이름 ${nameHits}개가 들어 있다`)
  if (phoneHits) errors.push(`인솔교사 전화번호 ${phoneHits}개가 들어 있다`)

  // 보호자 문의 오픈채팅 주소는 명단 암호문에만 둔다. 사전 안내판·본판 번들·레포에 올라가는 파일 어디에도 평문이면 멈춘다.
  const chatId = String(r.parentContact?.url ?? '').split('/o/')[1]
  if (chatId && chatId.length >= 6) {
    if (text.includes(chatId)) errors.push('사전 안내판에 보호자 문의 오픈채팅 주소가 들어 있다')
    const mainHits = walk(path.join(ROOT, 'dist'), []).filter((f) => fs.readFileSync(f, 'utf8').includes(chatId))
    if (mainHits.length) errors.push(`본판 번들 ${mainHits.length}개 파일에 보호자 문의 오픈채팅 주소가 들어 있다`)
    const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT }).toString().split('\0').filter((f) => /\.(json|ts|tsx|js|mjs|md|html|css|txt|ya?ml)$/.test(f))
    const repoHits = tracked.filter((f) => fs.existsSync(path.join(ROOT, f)) && fs.readFileSync(path.join(ROOT, f), 'utf8').includes(chatId))
    if (repoHits.length) errors.push(`레포에 올라가는 파일 ${repoHits.length}개에 보호자 문의 오픈채팅 주소가 들어 있다`)
  }
}

if (errors.length) {
  console.error(`사전 안내판 점검 실패 (${errors.length}건)`)
  for (const e of errors) console.error(`- ${e}`)
  process.exit(1)
}
console.log(`사전 안내판 점검 통과: 파일 ${files.length}개에 명단·암호문·선생님 메모 없음`)
