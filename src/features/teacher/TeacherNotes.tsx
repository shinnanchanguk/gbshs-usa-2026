import type { SlidePage } from '../../content'
import { rich } from '../../components/Rich'
import { Icon } from '../../components/Icon'

const SOURCE_LABEL: Record<string, string> = {
  plan: '운영계획(안)',
  'plan-v2': '운영계획 수정(안)',
  recording: '9/21 답사 결과 회의',
  briefing: '9/30 학생 브리핑',
  waiver: '9/30 동의서 설명',
  roster: '좌석·객실표',
  mentor: '멘토 정보',
}

/** 교사 화면에만: 자료끼리 달라진 점, 아직 정해지지 않은 것, 내용 출처 */
export function TeacherNotes({ page }: { page: SlidePage }) {
  const { changes, teacherNotes, sources } = page.slide
  if (!changes.length && !teacherNotes.length) return null
  return (
    <details className="tnotes">
      <summary>
        <Icon name="info" size="1rem" /> 선생님 메모 <span className="mono">{changes.length + teacherNotes.length}</span>
      </summary>
      {changes.length ? (
        <>
          <h3>자료가 바뀐 점</h3>
          <ul className="bullets bullets--tight">
            {changes.map((c, i) => (
              <li key={i}>{rich(c)}</li>
            ))}
          </ul>
        </>
      ) : null}
      {teacherNotes.length ? (
        <>
          <h3>확인할 것</h3>
          <ul className="bullets bullets--tight">
            {teacherNotes.map((c, i) => (
              <li key={i}>{rich(c)}</li>
            ))}
          </ul>
        </>
      ) : null}
      <p className="fineprint">출처: {sources.map((s) => SOURCE_LABEL[s] ?? s).join(', ')}</p>
    </details>
  )
}
