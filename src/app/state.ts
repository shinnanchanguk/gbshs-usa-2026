/**
 * 화면 전체가 함께 쓰는 값 (모두 이 기기 브라우저에 저장).
 */
import { useCallback } from 'react'
import { useStored } from '../lib/storage'
import { trip } from '../content'

export type Profile =
  | { role: 'teacher'; classNo: number; name: string }
  | { role: 'student'; classNo: number; studentNo: number }

export function useProfile() {
  return useStored<Profile | null>('profile', null)
}

/* 출석 --------------------------------------------------------------------- */

/** 슬라이드 id → 반 번호 → 출석한 학생 번호들 */
export type AttendanceBook = Record<string, Record<string, number[]>>

export const classSize = (classNo: number) => trip.classes.find((c) => c.no === classNo)?.size ?? 0

export function useAttendance() {
  const [book, setBook] = useStored<AttendanceBook>('attendance', {})

  const toggle = useCallback(
    (slideId: string, classNo: number, studentNo: number) =>
      setBook((prev) => {
        const cls = String(classNo)
        const current = prev[slideId]?.[cls] ?? []
        const next = current.includes(studentNo) ? current.filter((n) => n !== studentNo) : [...current, studentNo].sort((a, b) => a - b)
        return { ...prev, [slideId]: { ...prev[slideId], [cls]: next } }
      }),
    [setBook],
  )

  const setAll = useCallback(
    (slideId: string, classNo: number, present: boolean) =>
      setBook((prev) => {
        const all = present ? Array.from({ length: classSize(classNo) }, (_, i) => i + 1) : []
        return { ...prev, [slideId]: { ...prev[slideId], [String(classNo)]: all } }
      }),
    [setBook],
  )

  return { book, toggle, setAll }
}

export function presentList(book: AttendanceBook, slideId: string, classNo: number): number[] {
  return book[slideId]?.[String(classNo)] ?? []
}

export function isComplete(book: AttendanceBook, slideId: string, classNo: number): boolean {
  const size = classSize(classNo)
  return size > 0 && presentList(book, slideId, classNo).length >= size
}

/* 소감 --------------------------------------------------------------------- */

export type ReflectionEntry = { text: string; updatedAt: string }
/** "반-번호" → 슬라이드 id → 소감 */
export type ReflectionBook = Record<string, Record<string, ReflectionEntry>>

export const studentKey = (classNo: number, studentNo: number) => `${classNo}-${studentNo}`

export function useReflections() {
  const [book, setBook] = useStored<ReflectionBook>('reflections', {})
  const save = useCallback(
    (key: string, slideId: string, text: string) =>
      setBook((prev) => {
        const mine = { ...prev[key] }
        if (text.trim()) mine[slideId] = { text, updatedAt: new Date().toISOString() }
        else delete mine[slideId]
        return { ...prev, [key]: mine }
      }),
    [setBook],
  )
  return { book, save }
}

/* 피드백 ------------------------------------------------------------------- */

export type FeedbackItem = {
  id: string
  /** null 이면 사이트 전체에 대한 피드백 */
  slideId: string | null
  author: string
  text: string
  createdAt: string
}

export function useFeedback() {
  const [items, setItems] = useStored<FeedbackItem[]>('feedback', [])
  const add = useCallback(
    (slideId: string | null, author: string, text: string) =>
      setItems((prev) => [
        ...prev,
        {
          id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
          slideId,
          author,
          text: text.trim(),
          createdAt: new Date().toISOString(),
        },
      ]),
    [setItems],
  )
  const remove = useCallback((id: string) => setItems((prev) => prev.filter((f) => f.id !== id)), [setItems])
  return { items, add, remove }
}
