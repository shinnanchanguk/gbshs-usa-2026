/**
 * 사용자 기록 저장소. 지금은 기기 브라우저(localStorage)에 저장한다.
 *
 * 로그인·데이터베이스를 붙일 때는 이 파일의 훅 안쪽만 서버 호출로 바꾸면 된다.
 * 화면 코드는 아래 모양(Profile, Reflection, Attendance)만 알고 저장 방식을 모른다.
 */
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
