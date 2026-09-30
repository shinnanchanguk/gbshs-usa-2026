import { useEffect, useRef, useState } from 'react'
import { trip, type SlidePage, type ThemeId } from '../../content'
import { Icon } from '../../components/Icon'
import { REFLECTION_MAX, useMyReflections } from '../../lib/repo'
import { useApp } from '../../app/context'
import { clock } from '../../lib/time'

/** 학생 느낀 점. 쓰는 대로 이 기기에 저장되고, 활동 주제를 골라 두면 발표회 보고서 초안에 주제별로 모인다. */
export function ReflectBox({ page }: { page: SlidePage }) {
  const { me } = useApp()
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
        <Icon name="pen" size="1.05rem" /> 느낀 점
      </h2>
      {page.slide.prompt ? <p className="reflect__prompt">{page.slide.prompt}</p> : null}
      <textarea
        className="reflect__input"
        rows={4}
        value={text}
        maxLength={REFLECTION_MAX}
        placeholder="보고, 듣고, 생각한 것을 짧게라도 적어 두세요."
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
        aria-label={`${page.slide.title} 느낀 점`}
      />
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
      <p className="reflect__status" aria-live="polite">
        {savedAt ? `이 휴대폰에 저장했어요 · 현지 ${clock(new Date(savedAt), 'EDT').time}` : '쓰는 대로 이 휴대폰에 저장돼요. 다녀와서 「발표회 보고서」 장에서 주제별로 모아 볼 수 있어요.'}
      </p>
    </section>
  )
}
