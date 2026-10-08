import { useState } from 'react'
import { slidePages, trip } from '../../content'
import { Icon, type IconName } from '../../components/Icon'
import { Sheet } from '../../components/Sheet'
import { useApp } from '../../app/context'
import { forget } from '../../lib/roster'
import type { Role } from '../../lib/repo'
import { ReflectionExport } from '../reflection/ReflectionExport'
import { GUIDE } from '../../lib/edition'
import { forgetZudoSession, useZudoSession, ZUDO_HANDOFF_URL, ZUDO_PASSWORD_RESET_URL } from '../../lib/zudo'
import { forgetTickets } from '../../lib/ticketStore'
import { OfflinePdfButton } from '../print/OfflinePdfButton'

const ROLES: { id: Role; label: string; sub: string; icon: IconName }[] = [
  { id: 'student', label: '학생', sub: '내 자리·방, 장소마다 사진·느낀 점', icon: 'user' },
  { id: 'teacher', label: '선생님', sub: '인원 확인, 선생님 메모', icon: 'users' },
  { id: 'parent', label: '보호자', sub: '한국 시각, 우리 아이 자리·방·기록', icon: 'shield' },
]

/** 나는 누구인지(역할·이름) 고르기와 자주 찾는 장 바로가기 */
export function MenuSheet({
  onJump,
  onClose,
  onLock,
  noticeCount,
  onNotices,
  onWake,
}: {
  onJump: (key: string) => void
  onClose: () => void
  onLock: () => void
  noticeCount: number
  onNotices: (view: 'compose' | 'manage') => void
  onWake: () => void
}) {
  const { profile, setProfile, roster, me, teacher, studentById } = useApp()
  const role = profile?.role
  const zudo = useZudoSession()
  // ZUDO 로 들어온 학생·보호자는 ZUDO 가 정한 역할·학번 그대로 둔다(선생님은 학생 화면으로 바꿔 볼 수 있게 열어 둔다)
  const locked = !GUIDE && !!zudo && zudo.me.role !== 'teacher'
  const kids = (zudo?.me.children ?? []).map((id) => studentById.get(id)).filter((s): s is NonNullable<typeof s> => !!s)
  const canWake = !!zudo && (zudo.me.role === 'teacher' || (role === 'student' && !!me?.helpers?.includes('wakeup')))
  const [classNo, setClassNo] = useState<number>(me?.classNo ?? profile?.classNo ?? 1)

  const find = (widget: string) => slidePages.find((p) => p.slide.widget === widget)?.key
  const quick: { key?: string; label: string; icon: IconName }[] = [
    { key: find('bus'), label: GUIDE ? '버스와 자리' : '버스와 내 자리', icon: 'seat' },
    { key: find('rooms'), label: '숙소와 방', icon: 'bed' },
    { key: find('contacts'), label: '비상 연락처', icon: 'phone' },
    { key: find('checklist'), label: '챙길 것', icon: 'check' },
    { key: find('deadlines'), label: '날짜별 할 일', icon: 'calendar' },
    { key: find('report'), label: '발표회 보고서', icon: 'pen' },
  ]

  return (
    <Sheet title={GUIDE ? '바로 가기' : profile ? '내 정보' : '누가 보나요?'} onClose={onClose}>
      <div className="menu">
        {GUIDE ? null : locked ? (
        <section className="whopick zudo-me">
          <h3 className="whopick__title">ZUDO로 로그인했어요</h3>
          <p className="zudo-me__who">
            <Icon name={role === 'parent' ? 'shield' : 'user'} />
            {role === 'parent' ? `${zudo!.me.name} 보호자` : me ? `${me.classNo}반 ${me.no}번 ${me.name}` : zudo!.me.name}
          </p>
          {role === 'parent' && kids.length > 1 ? (
            <ul className="namepick" aria-label="자녀 고르기">
              {kids.map((k) => (
                <li key={k.id}>
                  <button type="button" className="namepick__btn" data-on={me?.id === k.id || undefined} aria-pressed={me?.id === k.id} onClick={() => setProfile({ ...profile!, studentId: k.id, classNo: k.classNo })}>
                    <span className="mono">{k.classNo}-{k.no}</span> {k.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : role === 'parent' && me ? (
            <p className="fineprint">우리 아이: {me.classNo}반 {me.no}번 {me.name}</p>
          ) : null}
          {canWake ? (
            <button type="button" className="quick__btn" onClick={onWake}>
              <Icon name="clock" />
              오늘 아침 기상 확인
            </button>
          ) : null}
        </section>
        ) : (
        <>
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
            <h3 className="whopick__title">공지</h3>
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

        {role === 'teacher' && zudo ? (
          <section className="whopick">
            <h3 className="whopick__title">ZUDO</h3>
            <div className="notice-entry">
              <button type="button" className="quick__btn" onClick={onWake}>
                <Icon name="clock" />
                기상 확인 현황
              </button>
              {zudo.me.canResetPassword ? (
                <a className="quick__btn" href={ZUDO_PASSWORD_RESET_URL} target="_blank" rel="noopener noreferrer">
                  <Icon name="lock" />
                  학생·학부모 비밀번호 초기화
                </a>
              ) : null}
            </div>
          </section>
        ) : null}

        {role === 'teacher' && !zudo ? (
          <p className="fineprint">
            기상 확인 현황은 <a href={ZUDO_HANDOFF_URL}>ZUDO로 로그인하면</a> 볼 수 있어요.
          </p>
        ) : null}

        {role === 'teacher' ? <ReflectionExport /> : null}

        </>
        )}

        {profile ? (
          <>
            {GUIDE ? null : <h3 className="menu__h">바로 가기</h3>}
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
            <OfflinePdfButton />
            <button type="button" className="btn btn--primary btn--block" onClick={onClose}>
              안내 보기
            </button>
          </>
        ) : null}

        {GUIDE ? (
          <p className="fineprint menu__fine">
            이 링크는 출발 전 사전 안내용이에요. 준비물과 여행 일정은 모두 볼 수 있고, 버스 자리·방 배정·인솔 선생님 연락처는 추후 공지 예정이에요.
          </p>
        ) : (
          <>
          <p className="fineprint menu__fine">
            사진·느낀 점·인원 확인·체크한 것은 이 휴대폰에만 저장돼요. 기상 확인과 내 항공권만 ZUDO에서 받아 와요.
          </p>
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              forget()
              forgetZudoSession()
              void forgetTickets()
              if (zudo) setProfile(null)
              onLock()
            }}
          >
            <Icon name="lock" size="1rem" /> 이 기기에서 잠그기(다시 ZUDO로 로그인)
          </button>
          </>
        )}
      </div>
    </Sheet>
  )
}
