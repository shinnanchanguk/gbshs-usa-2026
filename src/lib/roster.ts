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
}

type Sealed = { v: 1; iter: number; salt: string; iv: string; data: string }
const sealed = encJson as Sealed

const KEY_STORE = 'roster-key'

const b64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
const toB64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)))

/**
 * 입장 코드 길이(숫자). scripts/seal-roster.mjs 의 CODE_LEN 과 같아야 한다.
 * 숫자 6자리는 공개된 암호문에 100만 가지를 다 넣어 보면 풀린다. 로그인이 붙기 전까지 쓰는 임시 잠금이다(2026-09-30 결정).
 */
export const CODE_LEN = 6

/** 입력한 코드를 표준 모양으로: 숫자만 */
export const normalizeCode = (raw: string) => raw.replace(/\D/g, '')

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
  wakeup: '맡은 남학생 객실이 제때 일어났는지 확인하고 점호를 준비해요.',
  photo: '우리 반 사진과 영상을 찍어 공유 폴더에 올려요.',
  banner: '현수막을 챙기고 단체 사진을 찍을 때 펼쳐요.',
  web: '이 안내 사이트를 함께 만들고 고쳐요.',
}
