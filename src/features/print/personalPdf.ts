/**
 * 오프라인 안내 PDF 한 파일 만들기(휴대폰에서 단추를 누를 때).
 *   ① 내 정보 쪽(자리·방·짝·도우미·인솔 선생님 연락처)  ② 공통 안내(빌드 때 만든 PDF)  ③ 내 항공권(ZUDO)
 * 내 정보 쪽은 사이트 글꼴로 그림을 그려 넣어 한글 글꼴을 PDF 에 따로 심지 않는다.
 * pdf-lib 은 이 파일을 부를 때만 받아 온다(처음 화면이 무거워지지 않게).
 */
import { HELPER_LABEL, KAKAO_OPEN_CHAT, parentChat, type ParentContact, type Roster, type Student, type Teacher } from '../../lib/roster'
import type { Profile } from '../../lib/repo'
import { COMMON_PDF_URL } from './offline'
import { getTicket } from '../../lib/ticketStore'
import { readZudoSession } from '../../lib/zudo'

const W = 1240
const H = 1754
const M = 96
const FONT = '"Wanted Sans", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif'

type Line = { text: string; size?: number; bold?: boolean; gap?: number; muted?: boolean }

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const out: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width <= width) {
      line = next
      continue
    }
    if (line) out.push(line)
    // 한 낱말이 한 줄보다 길면 글자 단위로 자른다
    let piece = ''
    for (const ch of word) {
      if (ctx.measureText(piece + ch).width > width && piece) {
        out.push(piece)
        piece = ''
      }
      piece += ch
    }
    line = piece
  }
  if (line) out.push(line)
  return out
}

/** 캔버스 좌표의 사각형 [왼쪽, 위, 오른쪽, 아래] */
type Rect = [number, number, number, number]

/**
 * 보호자 문의(부장 선생님 오픈채팅): QR 과 주소를 그리고, PDF 에서 누를 수 있게 그 자리를 돌려준다.
 * QR 칸은 정수 픽셀로 그려야 칸 사이에 흰 줄이 안 생겨 카메라가 잘 읽는다.
 */
function drawChat(ctx: CanvasRenderingContext2D, chat: ParentContact, startY: number): { y: number; link?: Rect } {
  let y = startY + 44
  ctx.fillStyle = '#1c1a17'
  ctx.font = `700 36px ${FONT}`
  y += 36 * 1.45
  ctx.fillText('보호자 문의', M, y)
  ctx.font = `400 30px ${FONT}`
  for (const row of wrap(ctx, `여행 중 궁금한 일은 ${chat.teacher} 부장 선생님께 카카오톡 1:1 오픈채팅으로 물어봐 주세요.`, W - M * 2)) {
    y += 30 * 1.45
    ctx.fillText(row, M, y)
  }
  const unit = Math.floor(280 / chat.qr.size)
  const box = unit * chat.qr.size
  const top = Math.round(y + 28)
  if (top + box > H - M) return { y }
  ctx.fillStyle = '#fff'
  ctx.fillRect(M, top, box, box)
  ctx.save()
  ctx.translate(M, top)
  ctx.scale(unit, unit)
  ctx.fillStyle = '#000'
  ctx.fill(new Path2D(chat.qr.path))
  ctx.restore()
  const tx = M + box + 40
  ctx.fillStyle = '#1c1a17'
  ctx.font = `700 32px ${FONT}`
  ctx.fillText('카카오톡 오픈채팅', tx, top + 80)
  ctx.font = `400 28px ${FONT}`
  ctx.fillText(chat.url.replace(/^https:\/\//, ''), tx, top + 130)
  ctx.fillStyle = '#5d574f'
  ctx.fillText('휴대폰 카메라로 찍거나 눌러서 열어요', tx, top + 180)
  return { y: top + box, link: [M, top, W - M, top + box] }
}

async function drawPage(lines: Line[], chat?: ParentContact | null): Promise<{ png: Uint8Array; link?: Rect }> {
  await Promise.all([document.fonts.load(`700 52px ${FONT}`, '가'), document.fonts.load(`400 34px ${FONT}`, '가')]).catch(() => undefined)
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, W, H)
  let y = M
  for (const l of lines) {
    const size = l.size ?? 34
    ctx.font = `${l.bold ? 700 : 400} ${size}px ${FONT}`
    ctx.fillStyle = l.muted ? '#5d574f' : '#1c1a17'
    y += l.gap ?? 0
    for (const row of wrap(ctx, l.text, W - M * 2)) {
      y += size * 1.45
      if (y > H - M) break
      ctx.fillText(row, M, y)
    }
  }
  const link = chat ? drawChat(ctx, chat, y).link : undefined
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'))
  if (!blob) throw new Error('canvas')
  return { png: new Uint8Array(await blob.arrayBuffer()), link }
}

function studentLines(s: Student, roster: Roster, label: string): Line[] {
  const byId = new Map(roster.students.map((x) => [x.id, x]))
  const names = (ids: string[] | undefined) => (ids ?? []).map((id) => byId.get(id)?.name).filter(Boolean).join(', ')
  const lines: Line[] = [
    { text: label, size: 36, bold: true, gap: 28 },
    { text: `${s.classNo}반 ${s.no}번 ${s.name}`, size: 52, bold: true },
    { text: `버스: ${s.bus}호차 ${s.seat}번 자리${s.partners?.length ? ` · 짝 ${names(s.partners)}` : ''}`, gap: 18 },
    { text: `방: ${s.room}${s.connected ? '(커넥티드룸)' : ''}${s.roommates.length ? ` · 같은 방 ${names(s.roommates)}` : ''}` },
  ]
  if (s.helpers?.length) {
    lines.push({ text: `맡은 도우미: ${s.helpers.map((h) => (h === 'wakeup' && s.wakeupRooms ? `${HELPER_LABEL[h]}(${s.wakeupRooms})` : HELPER_LABEL[h])).join(', ')}` })
  }
  return lines
}

function teacherLines(t: Teacher, roster: Roster): Line[] {
  const roles = Object.entries(roster.roles).filter(([, who]) => who.includes(t.name)).map(([k]) => k)
  const emergency = Object.entries(roster.emergency).filter(([, who]) => who.includes(t.name)).map(([k]) => k)
  const duty = roster.nightDuty.filter((d) => d.name === t.name).map((d) => `${d.date} ${d.time}`)
  const lines: Line[] = [
    { text: '선생님 정보', size: 36, bold: true, gap: 28 },
    { text: `${t.name}${t.position ? ` ${t.position}` : ''}`, size: 52, bold: true },
    { text: `버스: ${t.bus ? `${t.bus}호차${t.seat ? ` ${t.seat}번 자리` : ''}` : '-'} · 방: ${t.room ?? '-'}`, gap: 18 },
  ]
  if (roles.length) lines.push({ text: `맡은 일: ${roles.join(', ')}` })
  if (emergency.length) lines.push({ text: `비상시: ${emergency.join(', ')}` })
  if (duty.length) lines.push({ text: `야간 근무: ${duty.join(' / ')}` })
  return lines
}

function contactLines(roster: Roster): Line[] {
  if (!roster.teachers.length) return []
  return [
    { text: '인솔 선생님 연락처', size: 36, bold: true, gap: 44 },
    ...roster.teachers.map<Line>((t) => ({ text: `${t.name}${t.position ? `(${t.position})` : ''}${t.bus ? ` · ${t.bus}호차` : ''} · ${t.phone ?? '-'}` })),
  ]
}

export type OfflinePdfResult = { blob: Blob; name: string; missingTicket: boolean }

export async function buildOfflinePdf(opts: { roster: Roster; profile: Profile | null; me: Student | null; teacher: Teacher | null }): Promise<OfflinePdfResult> {
  const { roster, profile, me, teacher } = opts
  const { PDFDocument, PDFName, PDFString } = await import('pdf-lib')
  const res = await fetch(COMMON_PDF_URL, { cache: 'no-cache' })
  if (!res.ok) throw new Error('common')
  const common = await PDFDocument.load(await res.arrayBuffer())

  const out = await PDFDocument.create()
  out.setTitle('USA 2026 오프라인 안내')

  // ① 내 정보 쪽
  const head: Line[] = [
    { text: 'USA 2026 · 오프라인 안내', size: 30, muted: true },
    { text: '이름·자리·연락처가 들어 있어요. 다른 사람에게 보내지 마세요.', size: 28, muted: true },
  ]
  const body =
    profile?.role === 'teacher' && teacher
      ? teacherLines(teacher, roster)
      : me
        ? studentLines(me, roster, profile?.role === 'parent' ? '우리 아이 정보' : '내 정보')
        : []
  if (body.length) {
    const chat = profile?.role === 'parent' ? parentChat(roster) : null
    const drawn = await drawPage([...head, ...body, ...contactLines(roster)], chat)
    const png = await out.embedPng(drawn.png)
    const [pw, ph] = [595.28, 841.89]
    const page = out.addPage([pw, ph])
    page.drawImage(png, { x: 0, y: 0, width: pw, height: ph })
    if (chat && drawn.link && KAKAO_OPEN_CHAT.test(chat.url)) {
      // QR·주소 자리를 누르면 오픈채팅이 열리게 링크를 얹는다(PDF 는 아래가 원점이라 위아래를 뒤집는다)
      const s = pw / W
      const [x0, y0, x1, y1] = drawn.link
      const annot = out.context.register(
        out.context.obj({
          Type: 'Annot',
          Subtype: 'Link',
          Rect: [x0 * s, ph - y1 * s, x1 * s, ph - y0 * s],
          Border: [0, 0, 0],
          A: { Type: 'Action', S: 'URI', URI: PDFString.of(chat.url) },
        }),
      )
      page.node.set(PDFName.of('Annots'), out.context.obj([annot]))
    }
  }

  // ② 공통 안내
  for (const p of await out.copyPages(common, common.getPageIndices())) out.addPage(p)

  // ③ 내(자녀) 항공권: ZUDO 로 들어왔고 받을 수 있을 때만. 인터넷이 없으면 이 기기에 저장해 둔 것으로.
  let missingTicket = false
  const ticketOwner = profile?.role !== 'teacher' ? me?.id : undefined
  if (ticketOwner && readZudoSession()) {
    try {
      const ticket = await PDFDocument.load(await (await getTicket(ticketOwner)).arrayBuffer())
      for (const p of await out.copyPages(ticket, ticket.getPageIndices())) out.addPage(p)
    } catch {
      missingTicket = true
    }
  } else if (ticketOwner) {
    missingTicket = true
  }

  const bytes = await out.save()
  const who = me?.id ?? (teacher ? 'teacher' : 'guide')
  return { blob: new Blob([bytes as BlobPart], { type: 'application/pdf' }), name: `USA2026_${who}_오프라인안내.pdf`, missingTicket }
}
