import { useEffect, useRef, useState } from 'react'
import { trip, type SlidePage, type ThemeId } from '../../content'
import { Icon } from '../../components/Icon'
import { REFLECTION_MAX, useMyReflections } from '../../lib/repo'
import { useApp } from '../../app/context'
import { clock } from '../../lib/time'
import { FieldPhotos } from '../record/FieldPhotos'

/**
 * 학생의 현장 기록: 그 장소에서 찍은 사진과 느낀 점(메모).
 * 느낀 점 장(reflect)은 질문과 활동 주제를 함께 보여 주고 발표회 보고서 초안에 주제별로 모인다.
 * 그 밖의 장소(식사·쇼핑 등)는 짧은 메모만 남긴다. 쓰는 대로 이 기기에 저장된다.
 */
export function ReflectBox({ page }: { page: SlidePage }) {
  const { me } = useApp()
  const reflect = page.slide.reflect
  const [mine, save] = useMyReflections(me?.id)
  const saved = mine[page.key]
  const [text, setText] = useState(saved?.text ?? '')
  const [themes, setThemes] = useState<ThemeId[]>(saved?.themes?.length ? saved.themes : page.slide.themes)
  const [savedAt, setSavedAt] = useState<string | null>(saved?.updatedAt ?? null)
  const timer = useRef<number | null>(null)
  // 늦게 도는 자동 저장이 옛 값을 쓰지 않게 최신 글·주제를 ref 로 들고 있는다
  const latest = useRef({ text, themes })
  latest.current = { text, themes }

  // 다른 탭에서 바뀌거나 다른 학생으로 바뀌면 따라간다(입력 중이 아닐 때)
  useEffect(() => {
    if (timer.current != null) return
    const r = mine[page.key]
    setText(r?.text ?? '')
    setThemes(r?.themes?.length ? r.themes : page.slide.themes)
    setSavedAt(r?.updatedAt || null)
  }, [mine, page.key, page.slide.themes])

  const commit = (nextText: string, nextThemes: ThemeId[]) => {
    save(page.key, nextText.trim() ? { text: nextText, themes: nextThemes } : null)
    setSavedAt(nextText.trim() ? new Date().toISOString() : null)
  }

  const flush = () => {
    if (timer.current) {
      window.clearTimeout(timer.current)
      timer.current = null
      commit(text, themes)
    }
  }

  return (
    <section className="reflect" data-noswipe>
      <h2 className="block__title">
        <Icon name="photo" size="1.05rem" /> 현장 기록
      </h2>
      <FieldPhotos page={page} studentId={me?.id} />
      <h3 className="reflect__sub">
        <Icon name="pen" size="1rem" /> {reflect ? '느낀 점' : '메모'}
      </h3>
      {reflect && page.slide.prompt ? <p className="reflect__prompt">{page.slide.prompt}</p> : null}
      <textarea
        className="reflect__input"
        rows={4}
        value={text}
        maxLength={REFLECTION_MAX}
        placeholder={reflect ? '보고, 듣고, 생각한 것을 짧게라도 적어 두세요.' : '기억해 두고 싶은 것을 짧게 적어 두세요.'}
        onChange={(e) => {
          const v = e.target.value
          setText(v)
          if (timer.current) window.clearTimeout(timer.current)
          timer.current = window.setTimeout(() => {
            timer.current = null
            commit(latest.current.text, latest.current.themes)
          }, 600)
        }}
        onBlur={flush}
        aria-label={`${page.slide.title} ${reflect ? '느낀 점' : '메모'}`}
      />
      {reflect ? (
      <div className="reflect__themes" role="group" aria-label="발표회 보고서 활동 주제">
        {trip.themes.map((t) => {
          const on = themes.includes(t.id)
          return (
            <button
              key={t.id}
              type="button"
              className="chip"
              data-on={on || undefined}
              aria-pressed={on}
              onClick={() => {
                const next = on ? themes.filter((x) => x !== t.id) : [...themes, t.id]
                setThemes(next)
                latest.current = { text, themes: next }
                if (timer.current) {
                  window.clearTimeout(timer.current)
                  timer.current = null
                }
                if (text.trim()) commit(text, next)
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>
      ) : null}
      <p className="reflect__status" aria-live="polite">
        {savedAt
          ? `이 휴대폰에 저장했어요 · 현지 ${clock(new Date(savedAt), 'EDT').time}`
          : reflect
            ? '쓰는 대로 이 휴대폰에 저장돼요. 다녀와서 「발표회 보고서」 장에서 주제별로 모아 볼 수 있어요.'
            : '쓰는 대로 이 휴대폰에 저장돼요.'}
      </p>
    </section>
  )
}
