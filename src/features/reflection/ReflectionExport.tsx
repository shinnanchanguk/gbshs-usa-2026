import { useEffect, useMemo, useState } from 'react'
import { slidePages, trip } from '../../content'
import { Icon } from '../../components/Icon'
import { useApp } from '../../app/context'
import { useClassReflections } from '../../lib/repo'
import { buildSalpeemRows, downloadSalpeemXlsx, preloadXlsx } from './salpeemExport'

/** 선생님: 학생 느낀 점을 살핌 설문에 바로 올릴 수 있는 엑셀로 받기 */
export function ReflectionExport() {
  const { roster } = useApp()
  const reflections = useClassReflections()
  const [classNo, setClassNo] = useState<number | null>(null)
  const [state, setState] = useState<'idle' | 'working' | 'failed'>('idle')

  const questionPages = useMemo(() => slidePages.filter((p) => p.slide.reflect), [])
  const themeLabel = useMemo(() => {
    const m = new Map<string, string>(trip.themes.map((t) => [t.id, t.label]))
    return (id: string) => m.get(id)
  }, [])
  const rows = useMemo(() => buildSalpeemRows(roster.students, reflections, questionPages, classNo, themeLabel), [roster.students, reflections, questionPages, classNo, themeLabel])

  // 엑셀 도구를 미리 받아 두면 인터넷이 약한 곳에서도 바로 만들 수 있다
  useEffect(() => preloadXlsx(), [])
  const count = rows.length - 1

  const download = async () => {
    setState('working')
    try {
      const d = new Date()
      const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
      await downloadSalpeemXlsx(rows, `USA2026_느낀점_살핌설문_${classNo ? `${classNo}반` : '전체'}_${ymd}.xlsx`)
      setState('idle')
    } catch {
      setState('failed')
    }
  }

  return (
    <section className="whopick">
      <h3 className="whopick__title">학생 느낀 점</h3>
      <div className="classpick classpick--all" role="radiogroup" aria-label="받을 반">
        <button type="button" role="radio" aria-checked={classNo === null} className="classpick__btn" data-on={classNo === null || undefined} onClick={() => setClassNo(null)}>
          전체
        </button>
        {trip.classes.map((c) => (
          <button key={c.no} type="button" role="radio" aria-checked={classNo === c.no} className="classpick__btn" data-on={classNo === c.no || undefined} data-class={c.no} onClick={() => setClassNo(c.no)}>
            {c.no}반
          </button>
        ))}
      </div>
      <button type="button" className="quick__btn export-btn" onClick={() => void download()} disabled={count === 0 || state === 'working'}>
        <Icon name="download" />
        살핌 설문용 엑셀 받기
        <span className="export-btn__count mono">{count}명</span>
      </button>
      {state === 'failed' ? (
        <p className="fineprint export-btn__error" role="alert">
          엑셀을 만들지 못했어요. 인터넷이 되는 곳에서 사이트를 새로 열고 다시 눌러 주세요.
        </p>
      ) : null}
      <p className="fineprint">
        살핌 설문에 이 파일을 그대로 올리면 학생마다 생기부 초안을 만들 수 있어요. 학번은 네 자리(예: 1103)로 들어가고, 느낀 점을 쓰는 장 {questionPages.length}곳이 한 칸씩 질문이 돼요. 살핌에서는 학번 체계를 네 자리로 두고 학생 명단을 먼저 등록해 주세요.
      </p>
      <p className="fineprint">지금은 이 휴대폰에 저장된 느낀 점만 들어가요. 나중에 로그인이 생기면 학생 모두의 느낀 점이 여기로 모여요.</p>
    </section>
  )
}
