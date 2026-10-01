import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Roster, Student, Teacher } from '../lib/roster'
import { useProfile, type Profile } from '../lib/repo'
import { now } from '../lib/time'
import { GUIDE } from '../lib/edition'

/** 사전 안내판은 역할을 고르지 않고 이름 없는 학생 화면으로 본다 */
const GUIDE_PROFILE: Profile = { role: 'student' }

type AppState = {
  roster: Roster
  profile: Profile | null
  setProfile: (p: Profile | null) => void
  /** 학생이면 본인, 학부모면 자녀 */
  me: Student | null
  teacher: Teacher | null
  /** 1분마다 갱신되는 현재 시각 (?now= 로 바꿔 볼 수 있음) */
  at: Date
  studentById: Map<string, Student>
}

const Ctx = createContext<AppState | null>(null)

export function AppProvider({ roster, children }: { roster: Roster; children: ReactNode }) {
  const [stored, setProfile] = useProfile()
  const profile = GUIDE ? GUIDE_PROFILE : stored
  const [at, setAt] = useState(now)
  useEffect(() => {
    const id = window.setInterval(() => setAt(now()), 60_000)
    return () => window.clearInterval(id)
  }, [])
  const value = useMemo<AppState>(() => {
    const studentById = new Map(roster.students.map((s) => [s.id, s]))
    return {
      roster,
      profile,
      setProfile,
      me: profile?.studentId ? (studentById.get(profile.studentId) ?? null) : null,
      teacher: profile?.teacherName ? (roster.teachers.find((t) => t.name === profile.teacherName) ?? null) : null,
      at,
      studentById,
    }
  }, [roster, profile, setProfile, at])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp(): AppState {
  const v = useContext(Ctx)
  if (!v) throw new Error('AppProvider 밖에서 useApp 을 불렀다')
  return v
}
