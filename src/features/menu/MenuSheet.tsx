import { useState } from 'react'
import { slidePages, trip } from '../../content'
import { Icon, type IconName } from '../../components/Icon'
import { Sheet } from '../../components/Sheet'
import { useApp } from '../../app/context'
import { forget } from '../../lib/roster'
import type { Role } from '../../lib/repo'

const ROLES: { id: Role; label: string; sub: string; icon: IconName }[] = [
  { id: 'student', label: '학생', sub: '내 자리·방, 장마다 느낀 점', icon: 'user' },
  { id: 'teacher', label: '선생님', sub: '인원 확인, 선생님 메모', icon: 'users' },
  { id: 'parent', label: '보호자', sub: '한국 시각, 우리 아이 자리·방', icon: 'shield' },
]

/** 나는 누구인지(역할·이름) 고르기와 자주 찾는 장 바로가기 */
export function MenuSheet({
  onJump,
  onClose,
  onLock,
  noticeCount,
  onNotices,
}: {
  onJump: (key: string) => void
  onClose: () => void
  onLock: () => void
  noticeCount: number
  onNotices: (view: 'compose' | 'manage') => void
}) {
  const { profile, setProfile, roster, me, teacher } = useApp()
  const role = profile?.role
  const [classNo, setClassNo] = useState<number>(me?.classNo ?? profile?.classNo ?? 1)

  const find = (widget: string) => slidePages.find((p) => p.slide.widget === widget)?.key
  const quick: { key?: string; label: string; icon: IconName }[] = [
    { key: find('bus'), label: '버스와 내 자리', icon: 'seat' },
    { key: find('rooms'), label: '숙소와 방', icon: 'bed' },
    { key: find('contacts'), label: '비상 연락처', icon: 'phone' },
    { key: find('checklist'), label: '챙길 것', icon: 'check' },
    { key: find('deadlines'), label: '날짜별 할 일', icon: 'calendar' },
    { key: find('report'), label: '발표회 보고서', icon: 'pen' },
  ]

  return (
    <Sheet title={profile ? '내 정보' : '누가 보나요?'} onClose={onClose}>
      <div className="menu">
        <div className="rolepick" role="radiogroup" aria-label="역할">
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={role === r.id}
              className="rolepick__btn"
              data-on={role === r.id || undefined}
              onClick={() => setProfile({ role: r.id, classNo: profile?.classNo ?? classNo, studentId: r.id === 'teacher' ? undefined : profile?.studentId, teacherName: r.id === 'teacher' ? profile?.teacherName : undefined })}
            >
              <Icon name={r.icon} />
              <span className="rolepick__label">{r.label}</span>
              <span className="rolepick__sub">{r.sub}</span>
            </button>
          ))}
        </div>

        {role === 'student' || role === 'parent' ? (
          <section className="whopick">
            <h3 className="whopick__title">{role === 'student' ? '나는' : '우리 아이는'}</h3>
            <div className="classpick" role="radiogroup" aria-label="반">
              {trip.classes.map((c) => (
                <button key={c.no} type="button" role="radio" aria-checked={classNo === c.no} className="classpick__btn" data-on={classNo === c.no || undefined} data-class={c.no} onClick={() => setClassNo(c.no)}>
                  {c.no}반
                </button>
              ))}
            </div>
            <ul className="namepick" data-noswipe>
              {roster.students
                .filter((s) => s.classNo === classNo)
                .sort((a, b) => a.no - b.no)
                .map((s) => (
                  <li key={s.id}>
                    <button type="button" className="namepick__btn" data-on={me?.id === s.id || undefined} aria-pressed={me?.id === s.id} onClick={() => setProfile({ ...profile!, studentId: s.id, classNo: s.classNo })}>
                      <span className="mono">{s.no}</span> {s.name}
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        ) : null}

        {role === 'teacher' ? (
          <section className="whopick">
            <h3 className="whopick__title">선생님 이름</h3>
            <ul className="namepick">
              {roster.teachers.map((t) => (
                <li key={t.name}>
                  <button type="button" className="namepick__btn" data-on={teacher?.name === t.name || undefined} aria-pressed={teacher?.name === t.name} onClick={() => setProfile({ ...profile!, teacherName: t.name })}>
                    {t.name}
                    {t.bus ? <span className="mono"> · {t.bus}호차</span> : null}
                  </button>
                </li>
              ))}
            </ul>
            <p className="fineprint">인원 확인 화면에서 볼 반은 그 화면에서 바꿀 수 있어요.</p>
          </section>
        ) : null}

        {role === 'teacher' ? (
          <section className="whopick">
            <h3 className="whopick__title">학생 공지</h3>
            <div className="notice-entry">
              <button type="button" className="quick__btn" onClick={() => onNotices('compose')} disabled={!teacher}>
                <Icon name="megaphone" />
                공지하기
              </button>
              <button type="button" className="quick__btn" onClick={() => onNotices('manage')} disabled={!teacher}>
                <Icon name="list" />
                팝업 관리
                {noticeCount ? <span className="notice-entry__count mono">{noticeCount}</span> : null}
              </button>
            </div>
            {teacher ? null : <p className="fineprint">위에서 선생님 이름을 먼저 골라 주세요. 공지에 올린 사람으로 보여요.</p>}
          </section>
        ) : null}

        {profile ? (
          <>
            <h3 className="menu__h">바로 가기</h3>
            <ul className="quick">
              {quick
                .filter((q) => q.key)
                .map((q) => (
                  <li key={q.label}>
                    <button type="button" className="quick__btn" onClick={() => onJump(q.key!)}>
                      <Icon name={q.icon} />
                      {q.label}
                    </button>
                  </li>
                ))}
            </ul>
            <button type="button" className="btn btn--primary btn--block" onClick={onClose}>
              안내 보기
            </button>
          </>
        ) : null}

        <p className="fineprint menu__fine">
          느낀 점·인원 확인·체크한 것은 지금은 이 휴대폰에만 저장돼요. 나중에 로그인이 생기면 선생님과 함께 볼 수 있게 옮겨 드려요.
        </p>
        <button
          type="button"
          className="link-btn"
          onClick={() => {
            forget()
            onLock()
          }}
        >
          <Icon name="lock" size="1rem" /> 이 기기에서 잠그기(입장 코드 다시 묻기)
        </button>
      </div>
    </Sheet>
  )
}
