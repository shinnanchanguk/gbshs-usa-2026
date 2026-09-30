/**
 * 사용자 기록 저장소. 지금은 기기 브라우저(localStorage)에 저장한다.
 *
 * 로그인·데이터베이스를 붙일 때는 이 파일의 훅 안쪽만 서버 호출로 바꾸면 된다.
 * 화면 코드는 아래 모양(Profile, Reflection, Attendance)만 알고 저장 방식을 모른다.
 */
import { useCallback, useMemo } from 'react'
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

export type Reflection = { text: string; themes: ThemeId[]; updatedAt: string }
export type ReflectionBook = Record<string, Reflection>

export function useReflections() {
  return useStored<ReflectionBook>('reflections', {})
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
 */
export function useNotices() {
  const [raw, setRaw] = useStored<unknown>('notices', [])
  const notices = useMemo(() => parseNotices(raw), [raw])
  const edit = useCallback((fn: (list: Notice[]) => Notice[]) => setRaw((prev: unknown) => fn(parseNotices(prev))), [setRaw])

  return useMemo(
    () => ({
      notices,
      create(title: string, body: string, author: string) {
        const now = new Date().toISOString()
        edit((list) => [{ id: newNoticeId(), title: title.slice(0, NOTICE_TITLE_MAX), body: body.slice(0, NOTICE_BODY_MAX), author, createdAt: now, updatedAt: now }, ...list])
      },
      update(id: string, title: string, body: string, editor: string) {
        const now = new Date().toISOString()
        edit((list) =>
          list.map((n) =>
            n.id === id ? { ...n, title: title.slice(0, NOTICE_TITLE_MAX), body: body.slice(0, NOTICE_BODY_MAX), updatedAt: now, editedBy: editor && editor !== n.author ? editor : undefined } : n,
          ),
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
