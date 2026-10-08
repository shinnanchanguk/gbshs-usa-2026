/**
 * 명단(버스 좌석·객실·도우미·인솔교사 연락처·멘토)은 공개 레포에 암호문(content/roster.enc.json)으로만 있다.
 * 입장 코드로 PBKDF2(SHA-256, 60만 번) 열쇠를 만들어 AES-GCM 으로 푼다. 코드를 모르면 내용을 볼 수 없다.
 * 한 번 풀리면 이 기기에 열쇠를 저장해 다음부터는 바로 연다.
 *
 * 로그인·데이터베이스가 붙으면 이 파일 대신 서버에서 명단을 받는다(화면 코드는 Roster 모양만 쓴다).
 */
import encJson from '../../content/roster.enc.json'
import { readStored, writeStored } from './storage'

export type HelperKey = 'luggage' | 'wakeup' | 'photo' | 'banner' | 'web'

export type Student = {
  id: string
  name: string
  classNo: number
  no: number
  gender: 'M' | 'F'
  bus: 1 | 2
  seat: number
  room: string
  roommates: string[]
  connected: boolean
  partners?: string[]
  helpers?: HelperKey[]
  helperTeacher?: Partial<Record<HelperKey, string>>
  wakeupRooms?: string
}

export type Teacher = { name: string; bus?: number; seat?: number; room?: string; phone?: string; position?: string }

export type Roster = {
  students: Student[]
  teachers: Teacher[]
  roles: Record<string, string[]>
  emergency: Record<string, string[]>
  nightDuty: { date: string; time: string; name: string }[]
  mentorsMIT: { no: number; name: string; field: string; detail: string; school: string }[]
  /** 보호자 문의(부장 선생님 1:1 오픈채팅). 공개 레포에 남지 않게 암호문에만 있다. 예전 암호문에는 없다. */
  parentContact?: ParentContact
}

/** QR 은 명단을 만들 때 미리 그린 모듈 경로다(가로 줄 단위 사각형, 바깥 여백 4칸 포함). */
export type ParentContact = { teacher: string; url: string; qr: { size: number; path: string } }

/**
 * 카카오톡 오픈채팅 주소 모양. 괄호·역슬래시·물음표를 받지 않는다.
 * personalPdf 가 이 주소를 PDF 링크(PDFString, 이스케이프 없음)에 그대로 넣으므로 넓히지 말 것.
 */
export const KAKAO_OPEN_CHAT = /^https:\/\/open\.kakao\.com\/o\/[A-Za-z0-9]+$/
const QR_PATH = /^[Mhvz0-9 -]+$/

/** 보호자 문의 오픈채팅. 모양이 예상과 다르면(값이 빠졌거나 이상하면) 화면에 쓰지 않는다. */
export function parentChat(roster: Roster): ParentContact | null {
  const c = roster.parentContact
  if (!c || typeof c.url !== 'string' || typeof c.teacher !== 'string' || !c.qr || typeof c.qr.path !== 'string') return null
  if (!KAKAO_OPEN_CHAT.test(c.url) || !QR_PATH.test(c.qr.path) || c.qr.path.length > 20000) return null
  if (!Number.isInteger(c.qr.size) || c.qr.size < 21 || c.qr.size > 200 || c.teacher.length > 20) return null
  return c
}

type Sealed = { v: 1; iter: number; salt: string; iv: string; data: string }
const sealed = encJson as Sealed

const KEY_STORE = 'roster-key'

const b64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
const toB64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)))

/**
 * 명단 열쇠(입장 코드)의 최소 길이. scripts/seal-roster.mjs 의 CODE_LEN 과 같아야 한다.
 * 2026-10-07부터 사람이 치지 않는다: ZUDO 로 들어오면 서버가 열쇠를 넘겨주고(src/lib/zudo.ts),
 * 비상용으로만 #/code/<열쇠> 링크를 쓴다. 그래서 무차별 대입이 안 되게 26자 무작위(영문 대문자·숫자)로 바꿨다.
 */
export const CODE_LEN = 26

/** 코드를 표준 모양으로: 영문·숫자만, 대문자로 */
export const normalizeCode = (raw: string) => raw.replace(/[^0-9A-Za-z]/g, '').toUpperCase()

async function deriveRaw(code: string): Promise<ArrayBuffer> {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(normalizeCode(code)), 'PBKDF2', false, ['deriveBits'])
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: b64(sealed.salt), iterations: sealed.iter }, base, 256)
}

async function openWith(raw: ArrayBuffer): Promise<Roster> {
  const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt'])
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(sealed.iv) }, key, b64(sealed.data))
  return JSON.parse(new TextDecoder().decode(plain)) as Roster
}

/** 코드로 명단을 연다. 틀리면 null */
export async function unlock(code: string): Promise<Roster | null> {
  try {
    const raw = await deriveRaw(code)
    const roster = await openWith(raw)
    writeStored(KEY_STORE, toB64(raw))
    return roster
  } catch {
    return null
  }
}

/** 저장해 둔 열쇠로 다시 연다. 없거나 암호문이 바뀌었으면 null */
export async function reopen(): Promise<Roster | null> {
  const stored = readStored<string | null>(KEY_STORE, null)
  if (!stored) return null
  try {
    return await openWith(b64(stored).buffer as ArrayBuffer)
  } catch {
    writeStored(KEY_STORE, null)
    return null
  }
}

export function forget() {
  writeStored(KEY_STORE, null)
}

export const HELPER_LABEL: Record<HelperKey, string> = {
  luggage: '수하물 승하차 도우미',
  wakeup: '기상 도우미',
  photo: '사진·영상 도우미',
  banner: '현수막 도우미',
  web: '웹페이지 제작 도우미',
}

export const HELPER_JOB: Record<HelperKey, string> = {
  luggage: '숙소에 도착하면 가장 먼저 내려 짐을 꺼내 한곳에 격자로 늘어놓아요. 아침에는 가장 먼저 나와 짐을 싣고 가장 나중에 타요.',
  wakeup: '아침마다 맡은 방이 제때 일어났는지 확인해요. 출발 30분 전까지 확인을 마치고, 안 되는 방은 바로 선생님께 알려요.',
  photo: '우리 반 사진과 영상을 찍어 공유 폴더에 올려요.',
  banner: '현수막을 챙기고 단체 사진을 찍을 때 펼쳐요.',
  web: '이 안내 사이트를 함께 만들고 고쳐요.',
}
