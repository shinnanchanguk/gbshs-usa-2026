/**
 * 학생 느낀 점 → 살핌(salpeeem) 설문 응답 엑셀.
 *
 * 살핌 설문 양식(설문_양식_예시.xlsx)을 그대로 따른다: 시트 이름 '설문응답', 첫 줄 '학번 · 이름 · 질문…',
 * 그 아래 학생 한 명이 한 줄. 살핌은 학번과 이름이 둘 다 맞는 학생만 받으므로 학번은 네 자리(학년 1 + 반 1 + 번호 2, 예 1103)로 적는다.
 * 살핌은 응답을 "질문: 답" 줄로 모아 AI에 넘기고 첫 쌍점에서 질문과 답을 가르기 때문에, 질문 제목에는 쌍점·줄바꿈을 두지 않는다.
 * 살핌이 통째로 건너뛰는 칸 제목 낱말(타임스탬프·이메일·응답시간 등)도 질문 제목에 남기지 않는다.
 */
import type { SlidePage } from '../../content'
import type { StudentReflections } from '../../lib/repo'
import type { Student } from '../../lib/roster'

export const SALPEEM_SHEET = '설문응답'

/** 살핌 studentMatcher.ts 의 SKIP_HEADERS 에 걸리지 않게 바꿔 쓴다 */
const SKIP_WORDS: [RegExp, string][] = [
  [/타임스탬프/g, '타임 스탬프'],
  [/timestamp/gi, 'time stamp'],
  [/제출시간/g, '제출 시간'],
  [/응답시간/g, '응답 시간'],
  [/이메일/g, '전자 우편'],
  [/email/gi, 'e-mail'],
]

const stripControl = (s: string) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')

/** 칸 제목: "[2일차 하버드 특강 · 나노테크놀로지와 나노의학] 나노 기술을 의학에 쓰는 예 가운데 …?" */
export function salpeemQuestion(page: SlidePage): string {
  const prompt = page.slide.prompt?.trim() || '이곳에서 보고 듣고 느낀 점'
  let q = stripControl(`[${page.chapter.label} ${page.slide.title}] ${prompt}`)
    .replace(/\s*[:：]\s*/g, ' · ')
    .replace(/\s+/g, ' ')
    .trim()
  for (const [re, to] of SKIP_WORDS) q = q.replace(re, to)
  return q
}

/** 답: 줄바꿈은 한 칸 띄어 한 줄로(살핌이 줄 단위로 질문과 답을 다시 읽는다) */
export function salpeemAnswer(text: string): string {
  return stripControl(text).replace(/\s*[\r\n]+\s*/g, ' ').replace(/[ \t]{2,}/g, ' ').trim()
}

/** 살핌 네 자리 학번(G1C1N2). 명단 학번이 이미 네 자리면 그대로 쓴다. */
export function salpeemStudentNo(s: Student, grade = 1): string {
  if (/^\d{4}$/.test(s.id)) return s.id
  return `${grade}${s.classNo}${String(s.no).padStart(2, '0')}`
}

/**
 * 엑셀에 들어갈 표(첫 줄 = 제목). 느낀 점을 한 장이라도 쓴 학생만 넣는다.
 * classNo 를 주면 그 반 학생만.
 */
export function buildSalpeemRows(students: Student[], reflections: StudentReflections[], questionPages: SlidePage[], classNo: number | null): string[][] {
  const byId = new Map(students.map((s) => [s.id, s]))
  const header = ['학번', '이름', ...questionPages.map(salpeemQuestion)]
  const rows: string[][] = []
  for (const { studentId, book } of reflections) {
    const s = byId.get(studentId)
    if (!s || (classNo != null && s.classNo !== classNo)) continue
    const answers = questionPages.map((p) => salpeemAnswer(book[p.key]?.text ?? ''))
    if (!answers.some(Boolean)) continue
    rows.push([salpeemStudentNo(s), s.name, ...answers])
  }
  rows.sort((a, b) => a[0].localeCompare(b[0]))
  return [header, ...rows]
}

/** 표를 살핌 양식 엑셀로 만들어 내려받는다. 엑셀 도구는 이때만 불러온다. */
export async function downloadSalpeemXlsx(rows: string[][], filename: string) {
  const XLSX = await import('xlsx')
  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = rows[0].map((_, i) => ({ wch: i === 0 ? 7 : i === 1 ? 9 : 40 }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, SALPEEM_SHEET)
  const data = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
  const url = URL.createObjectURL(new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
}
