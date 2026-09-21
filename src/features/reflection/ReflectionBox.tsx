import { useEffect, useRef, useState } from 'react'
import type { DeckSlide } from '../../content'
import { studentKey, useReflections } from '../../app/state'
import { IconPen } from '../../components/Icon'

/** 학생 소감. 쓰는 대로 이 기기에 자동 저장된다. */
export function ReflectionBox({ slide, classNo, studentNo }: { slide: DeckSlide; classNo: number; studentNo: number }) {
  const key = studentKey(classNo, studentNo)
  const { book, save } = useReflections()
  const saved = book[key]?.[slide.id]
  const [text, setText] = useState(saved?.text ?? '')
  const [status, setStatus] = useState<'idle' | 'typing' | 'saved'>('idle')
  const timer = useRef<number | undefined>(undefined)

  // 슬라이드나 학생이 바뀌면 저장된 글을 다시 불러온다.
  useEffect(() => {
    setText(book[key]?.[slide.id]?.text ?? '')
    setStatus('idle')
    // 입력 중인 글이 저장본으로 덮이지 않게 book 은 의존성에 넣지 않는다.
  }, [slide.id, key])

  function onChange(value: string) {
    setText(value)
    setStatus('typing')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      save(key, slide.id, value)
      setStatus('saved')
    }, 500)
  }

  return (
    <section className="pane reflection">
      <label className="reflection__meta" htmlFor={`refl-${slide.id}`}>
        <IconPen size="1rem" />
        {classNo}반 {studentNo}번 · {status === 'typing' ? '저장 중…' : status === 'saved' || saved ? '이 기기에 저장됨' : '쓰면 자동으로 저장돼요'}
      </label>
      <textarea
        id={`refl-${slide.id}`}
        className="field__input reflection__input"
        rows={6}
        autoFocus
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder="이곳에서 보고 듣고 느낀 점, 새로 알게 된 것, 궁금해진 것을 적어 보세요."
      />
      <a className="reflection__all" href="#/reflections">
        내 소감 모아보기
      </a>
    </section>
  )
}
