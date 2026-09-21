import { useState } from 'react'
import { trip } from '../../content'
import { classSize, useProfile, type Profile } from '../../app/state'

/**
 * 역할 고르기 (지금은 임시로 누구나 교사/학생 역할을 모두 체험할 수 있다).
 * 교사: 담임 반 출석판 + 피드백, 학생: 느낀 점 쓰기.
 */
export function RolePicker({ onDone }: { onDone?: () => void }) {
  const [profile, setProfile] = useProfile()
  const [role, setRole] = useState<Profile['role']>(profile?.role ?? 'teacher')
  const [classNo, setClassNo] = useState(profile?.classNo ?? 1)
  const [studentNo, setStudentNo] = useState(profile?.role === 'student' ? profile.studentNo : 1)
  const [name, setName] = useState(profile?.role === 'teacher' ? profile.name : '')

  function save() {
    setProfile(
      role === 'teacher'
        ? { role, classNo, name: name.trim() }
        : { role, classNo, studentNo: Math.min(studentNo, classSize(classNo)) },
    )
    onDone?.()
  }

  return (
    <div className="role">
      <p className="notice notice--warn role__note">지금은 시험 운영 중이라 누구나 교사·학생 역할을 바꿔 가며 써 볼 수 있어요. 입력한 내용은 이 기기에만 저장돼요.</p>
      <div className="role__choices" role="radiogroup" aria-label="역할">
        {(['teacher', 'student'] as const).map((r) => (
          <button key={r} type="button" role="radio" aria-checked={role === r} className="role__choice" data-active={role === r} onClick={() => setRole(r)}>
            <strong>{r === 'teacher' ? '선생님' : '학생'}</strong>
            <span>{r === 'teacher' ? '장소마다 담임 반 출석 체크, 슬라이드 피드백 남기기' : '일정마다 느낀 점 쓰기'}</span>
          </button>
        ))}
      </div>
      <div className="field-row">
        <label className="field">
          <span className="field__label">{role === 'teacher' ? '담임 반' : '반'}</span>
          <select className="field__input" value={classNo} onChange={(e) => setClassNo(Number(e.target.value))}>
            {trip.classes.map((c) => (
              <option key={c.no} value={c.no}>
                {c.no}반
              </option>
            ))}
          </select>
        </label>
        {role === 'student' ? (
          <label className="field">
            <span className="field__label">번호</span>
            <select className="field__input" value={Math.min(studentNo, classSize(classNo))} onChange={(e) => setStudentNo(Number(e.target.value))}>
              {Array.from({ length: classSize(classNo) }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}번
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="field">
            <span className="field__label">이름 (피드백에 함께 적혀요)</span>
            <input className="field__input" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 홍길동" maxLength={20} />
          </label>
        )}
      </div>
      <button className="btn btn--primary role__save" type="button" onClick={save}>
        {profile ? '바꾸기' : '시작하기'}
      </button>
    </div>
  )
}

export function RoleGate() {
  return (
    <div className="ob">
      <div className="ob__inner">
        <p className="ob__eyebrow">{trip.title}</p>
        <h1 className="ob__title">누구로 볼까요?</h1>
        <div className="ob__card">
          <RolePicker />
        </div>
      </div>
    </div>
  )
}

export function profileLabel(profile: Profile): string {
  return profile.role === 'teacher'
    ? `선생님 · ${profile.classNo}반 담임${profile.name ? ` · ${profile.name}` : ''}`
    : `학생 · ${profile.classNo}반 ${profile.studentNo}번`
}
