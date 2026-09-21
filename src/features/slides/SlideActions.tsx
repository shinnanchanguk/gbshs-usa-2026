import type { DeckSlide } from '../../content'
import { classSize, isComplete, presentList, studentKey, useAttendance, useFeedback, useReflections, type Profile } from '../../app/state'
import { IconCheck, IconMessage, IconPen, IconUsers } from '../../components/Icon'

export type SlidePanel = 'attendance' | 'feedback' | 'reflection'

/** 슬라이드 위쪽 단추 줄: 누르면 출석판·피드백·느낀 점 창이 뜬다. 단추에 지금 상태를 함께 적는다. */
export function SlideActions({ slide, profile, onOpen }: { slide: DeckSlide; profile: Profile; onOpen: (panel: SlidePanel) => void }) {
  const { book } = useAttendance()
  const { items } = useFeedback()
  const { book: reflections } = useReflections()

  if (profile.role === 'student') {
    const written = !!reflections[studentKey(profile.classNo, profile.studentNo)]?.[slide.id]?.text
    return (
      <div className="slide-actions">
        <button type="button" className="action-btn" data-done={written} onClick={() => onOpen('reflection')}>
          {written ? <IconCheck size="1rem" /> : <IconPen size="1rem" />}
          {written ? '느낀 점 고치기' : '느낀 점 쓰기'}
        </button>
      </div>
    )
  }

  const feedbackCount = items.filter((f) => f.slideId === slide.id).length
  const size = classSize(profile.classNo)
  const present = presentList(book, slide.id, profile.classNo).length
  const done = isComplete(book, slide.id, profile.classNo)
  return (
    <div className="slide-actions">
      {slide.attendance && (
        <button type="button" className="action-btn action-btn--primary" data-done={done} onClick={() => onOpen('attendance')}>
          {done ? <IconCheck size="1rem" /> : <IconUsers size="1rem" />}
          출석 체크
          <span className="action-btn__meta">
            {profile.classNo}반 {done ? '완료' : `${present}/${size}`}
          </span>
        </button>
      )}
      <button type="button" className="action-btn" onClick={() => onOpen('feedback')}>
        <IconMessage size="1rem" />
        피드백
        {feedbackCount > 0 && <span className="action-btn__meta">{feedbackCount}</span>}
      </button>
    </div>
  )
}
