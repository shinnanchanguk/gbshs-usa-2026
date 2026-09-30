/**
 * 사용자 기록 저장소. 지금은 기기 브라우저(localStorage)에 저장한다.
 *
 * 로그인·데이터베이스를 붙일 때는 이 파일의 훅 안쪽만 서버 호출로 바꾸면 된다.
 * 화면 코드는 아래 모양(Profile, Reflection, Attendance)만 알고 저장 방식을 모른다.
 */
import { useCallback, useEffect, useMemo } from 'react'
import { useStored } from './storage'
import type { ThemeId } from '../content'

export type Role = 'student' | 'teacher' | 'parent'

export type Profile = {
  role: Role
  /** 학생 본인 또는 학부모의 자녀 학번 (명단에서 고름) */
  studentId?: string
  /** 교사 이름 (명단에서 고름) */
  teacherName?: string
  /** 교사가 출석을 볼 반 */
  classNo?: number
}

export function useProfile() {
  return useStored<Profile | null>('profile', null)
}

/** by: 쓴 학생의 학번 */
export type Reflection = { text: string; themes: ThemeId[]; updatedAt: string; by?: string }
/** 장 key → 느낀 점 */
export type ReflectionBook = Record<string, Reflection>

/** 느낀 점 한 편의 최대 글자 수(엑셀 한 칸 한도 32,767자보다 한참 작게) */
export const REFLECTION_MAX = 2000

/*
 * 느낀 점은 (학생, 장)마다 한 편이다. 이 기기에는 '학번|장 key' 로 저장한다.
 * 이름을 고르기 전에 쓴 것만 '장 key' 로 남고, 이름을 고르면 그 학생 것으로 옮긴다.
 * DB를 붙이면 같은 모양(student_id, page_key)으로 서버에 둔다. 학번은 로그인한 계정에서 정하고 화면이 보낸 값을 믿지 않는다.
 */
const SEP = '|'
const unsafeKey = (k: string) => k === '__proto__' || k === 'constructor' || k === 'prototype'
const asRecord = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {})

function parseReflection(v: unknown): Reflection | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  if (typeof o.text !== 'string' || !o.text.trim()) return null
  return {
    text: o.text.slice(0, REFLECTION_MAX),
    themes: Array.isArray(o.themes) ? (o.themes.filter((t) => typeof t === 'string') as ThemeId[]) : [],
    updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : '',
    by: typeof o.by === 'string' ? o.by : undefined,
  }
}

type Entry = { key: string; owner: string | undefined; page: string; r: Reflection }

function reflectionEntries(raw: unknown): Entry[] {
  const out: Entry[] = []
  for (const [key, v] of Object.entries(asRecord(raw))) {
    if (unsafeKey(key)) continue
    const r = parseReflection(v)
    if (!r) continue
    const bar = key.indexOf(SEP)
    const owner = bar >= 0 ? key.slice(0, bar) : r.by
    const page = bar >= 0 ? key.slice(bar + 1) : key
    if (!page || unsafeKey(page)) continue
    out.push({ key, owner: owner || undefined, page, r })
  }
  return out
}

/** 한 학생의 느낀 점과 저장 함수. studentId 가 없으면 이름을 고르기 전 느낀 점. */
export function useMyReflections(studentId: string | undefined): [ReflectionBook, (pageKey: string, next: { text: string; themes: ThemeId[] } | null) => void] {
  const [raw, setRaw] = useStored<unknown>('reflections', {})

  // 이름을 고르기 전에 이 휴대폰에 쓴 느낀 점은 이름을 고르면 그 학생 것으로 옮긴다
  useEffect(() => {
    if (!studentId || !reflectionEntries(raw).some((e) => e.owner === undefined)) return
    setRaw((prev: unknown) => {
      const copy: Record<string, unknown> = { ...asRecord(prev) }
      for (const e of reflectionEntries(prev)) {
        if (e.owner !== undefined) continue
        delete copy[e.key]
        const k = studentId + SEP + e.page
        if (!copy[k]) copy[k] = { ...e.r, by: studentId }
      }
      return copy
    })
  }, [raw, studentId, setRaw])

  const mine = useMemo(() => {
    const out: ReflectionBook = {}
    for (const e of reflectionEntries(raw)) if (e.owner === studentId) out[e.page] = e.r
    return out
  }, [raw, studentId])

  const save = useCallback(
    (pageKey: string, next: { text: string; themes: ThemeId[] } | null) => {
      if (unsafeKey(pageKey) || pageKey.includes(SEP)) return
      setRaw((prev: unknown) => {
        const copy: Record<string, unknown> = { ...asRecord(prev) }
        const k = studentId ? studentId + SEP + pageKey : pageKey
        if (!next || !next.text.trim()) delete copy[k]
        else copy[k] = { text: next.text.slice(0, REFLECTION_MAX), themes: next.themes, updatedAt: new Date().toISOString(), by: studentId }
        return copy
      })
    },
    [studentId, setRaw],
  )

  return [mine, save]
}

/** 한 학생이 쓴 느낀 점 전부 */
export type StudentReflections = { studentId: string; book: ReflectionBook }

/**
 * 선생님 화면에서 모아 보는 학생들의 느낀 점.
 * 지금은 DB가 없어 이 기기에 저장된 것만 모인다. DB를 붙이면 여기서 서버의 전체 학생 느낀 점을 읽는다(읽기는 로그인한 선생님만).
 */
export function useClassReflections(): StudentReflections[] {
  const [raw] = useStored<unknown>('reflections', {})
  return useMemo(() => {
    const byStudent = new Map<string, ReflectionBook>()
    for (const e of reflectionEntries(raw)) {
      if (!e.owner) continue
      const own = byStudent.get(e.owner) ?? {}
      own[e.page] = e.r
      byStudent.set(e.owner, own)
    }
    return [...byStudent].map(([studentId, book]) => ({ studentId, book }))
  }, [raw])
}

/** 장마다 출석한 학생 학번 목록 */
export type AttendanceBook = Record<string, { present: string[]; updatedAt: string }>

export function useAttendance() {
  return useStored<AttendanceBook>('attendance', {})
}

export function useChecklist() {
  return useStored<Record<string, boolean>>('checklist', {})
}

/** 마지막으로 본 장 (다시 열면 그 자리에서) */
export function useLastPage() {
  return useStored<string | null>('last-page', null)
}

export function useMapTall() {
  return useStored<boolean>('map-tall', false)
}

/** 선생님이 올리는 공지. 학생 화면에 팝업으로 뜬다. */
export type Notice = {
  id: string
  title: string
  body: string
  /** 올린 선생님 이름 */
  author: string
  createdAt: string
  updatedAt: string
  /** 올린 사람과 다른 선생님이 고쳤으면 그 이름 */
  editedBy?: string
  /** 보호자 화면에도 띄울지(없으면 학생에게만) */
  alsoParents?: boolean
}

export const NOTICE_TITLE_MAX = 60
export const NOTICE_BODY_MAX = 1000

/** 저장된 값이 깨졌거나 모양이 달라도 화면이 멈추지 않게, 모양이 맞는 공지만 남긴다 */
function parseNotice(v: unknown): Notice | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  const str = (k: string) => (typeof o[k] === 'string' ? (o[k] as string) : null)
  const [id, title, body, author, createdAt, updatedAt] = ['id', 'title', 'body', 'author', 'createdAt', 'updatedAt'].map(str)
  if (!id || !title || body == null || author == null || !createdAt || !updatedAt) return null
  return {
    id,
    title: title.slice(0, NOTICE_TITLE_MAX),
    body: body.slice(0, NOTICE_BODY_MAX),
    author,
    createdAt,
    updatedAt,
    editedBy: typeof o.editedBy === 'string' ? o.editedBy : undefined,
    alsoParents: o.alsoParents === true,
  }
}

export const parseNotices = (v: unknown): Notice[] => (Array.isArray(v) ? v.map(parseNotice).filter((n): n is Notice => n !== null) : [])

/** 공지 한 판(고치면 판이 바뀐다). '다시 보지 않기'는 판마다 적어서, 선생님이 고친 공지는 다시 뜨게 한다. */
export const noticeVersion = (n: Notice) => `${n.id}@${n.updatedAt}`

export function newNoticeId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * 공지 목록과 올리기·고치기·지우기. 지금은 이 기기에만 저장된다.
 *
 * DB를 붙일 때(그때 비로소 모든 학생 휴대폰에 뜬다) 이 안쪽만 서버 호출로 바꾼다. 서버에서 지킬 것:
 * - 올린 사람·고친 사람은 로그인한 선생님 계정에서 정한다. 화면이 보낸 이름·역할을 믿지 않는다.
 * - 올린 시각·고친 시각은 서버 시계로 적는다(고친 시각이 바뀌면 학생에게 다시 뜨기 때문).
 * - 제목 1~60자, 본문 1~1000자를 서버에서도 확인하고, 쓰기·지우기는 선생님 계정만 허용한다.
 * - 공지에는 선생님 실명이 들어가므로 읽기도 로그인한 여행 참가자만 허용한다(입장 코드는 로그인이 아니다).
 * - 보호자 계정에는 alsoParents 가 켜진 공지만 내려 준다.
 */
export function useNotices() {
  const [raw, setRaw] = useStored<unknown>('notices', [])
  const notices = useMemo(() => parseNotices(raw), [raw])
  const edit = useCallback((fn: (list: Notice[]) => Notice[]) => setRaw((prev: unknown) => fn(parseNotices(prev))), [setRaw])

  return useMemo(
    () => ({
      notices,
      create(title: string, body: string, author: string, alsoParents: boolean) {
        const now = new Date().toISOString()
        edit((list) => [{ id: newNoticeId(), title: title.slice(0, NOTICE_TITLE_MAX), body: body.slice(0, NOTICE_BODY_MAX), author, createdAt: now, updatedAt: now, alsoParents }, ...list])
      },
      update(id: string, title: string, body: string, editor: string, alsoParents: boolean) {
        const now = new Date().toISOString()
        const t = title.slice(0, NOTICE_TITLE_MAX)
        const b = body.slice(0, NOTICE_BODY_MAX)
        edit((list) =>
          list.map((n) => {
            if (n.id !== id) return n
            // 받는 사람만 바꿨으면 판을 그대로 둔다(이미 '다시 보지 않기'를 누른 학생에게 또 뜨지 않게)
            if (n.title === t && n.body === b) return { ...n, alsoParents }
            return { ...n, title: t, body: b, updatedAt: now, editedBy: editor && editor !== n.author ? editor : undefined, alsoParents }
          }),
        )
      },
      remove(id: string) {
        edit((list) => list.filter((n) => n.id !== id))
      },
    }),
    [notices, edit],
  )
}

const parseHidden = (v: unknown): string[] => (Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : [])

/** 이 기기에서 '다시 보지 않기'를 누른 공지 판. 지워진 공지의 기록은 함께 치워 쌓이지 않게 한다. */
export function useHiddenNotices() {
  const [raw, setRaw] = useStored<unknown>('notices-hidden', [])
  const hidden = useMemo(() => parseHidden(raw), [raw])
  const hide = useCallback(
    (n: Notice, live: Notice[]) => {
      const keep = new Set(live.map(noticeVersion))
      setRaw((prev: unknown) => [...parseHidden(prev).filter((v) => keep.has(v)), noticeVersion(n)])
    },
    [setRaw],
  )
  return { hidden, hide }
}
