import { canRecord, slidePages, type SlidePage } from '../../content'
import { rich } from '../../components/Rich'
import { Icon } from '../../components/Icon'
import { useApp } from '../../app/context'
import { useFieldPhotos, useStudentReflections } from '../../lib/repo'
import { goTo } from '../../lib/router'
import { FieldPhotos } from './FieldPhotos'

const DEVICE_NOTE = '지금은 아이 휴대폰에 저장된 기록만 보여요. 나중에 로그인이 생기면 보호자 휴대폰에서도 바로 볼 수 있어요.'

/** 보호자 화면: 우리 아이가 이 장소에서 남긴 사진과 느낀 점(메모). 보기만 한다. */
export function ChildRecord({ page }: { page: SlidePage }) {
  const { me } = useApp()
  const book = useStudentReflections(me?.id)
  const { book: photos } = useFieldPhotos(me?.id)
  const memo = me ? book[page.key] : undefined
  const has = !!memo || !!photos[page.key]?.length

  return (
    <section className="reflect reflect--read" aria-label="우리 아이 현장 기록">
      <h2 className="block__title">
        <Icon name="photo" size="1.05rem" /> 우리 아이 현장 기록
      </h2>
      {!me ? (
        <p className="reflect__status">오른쪽 위 사람 단추에서 우리 아이를 고르면, 아이가 이곳에서 남긴 사진과 메모를 볼 수 있어요.</p>
      ) : has ? (
        <>
          <FieldPhotos page={page} studentId={me.id} readOnly />
          {memo ? <p className="reflect__memo">{memo.text}</p> : null}
          <p className="reflect__status">{DEVICE_NOTE}</p>
        </>
      ) : (
        <p className="reflect__status">아직 이곳에서 남긴 사진이나 메모가 없어요. {DEVICE_NOTE}</p>
      )}
    </section>
  )
}

/** 보호자 화면의 「발표회 보고서」 장: 우리 아이가 남긴 현장 기록을 장소 순서대로 모아 본다. */
export function ChildRecordList() {
  const { me } = useApp()
  const book = useStudentReflections(me?.id)
  const { book: photos } = useFieldPhotos(me?.id)
  if (!me)
    return (
      <p className="hint">
        <Icon name="info" size="1rem" /> 오른쪽 위 사람 단추에서 우리 아이를 고르면, 아이가 장소마다 남긴 사진과 메모를 여기서 모아 볼 수 있어요.
      </p>
    )
  const pages = slidePages.filter((p) => canRecord(p) && (book[p.key] || photos[p.key]?.length))
  return (
    <div className="report">
      <p className="hint">
        <Icon name="info" size="1rem" /> {DEVICE_NOTE}
      </p>
      {pages.length ? (
        <ol className="childrec">
          {pages.map((p) => (
            <li key={p.key} className="childrec__item">
              <button type="button" className="childrec__where" onClick={() => goTo(p.key)}>
                {p.chapter.label} · {rich(p.slide.title)}
                <Icon name="chevronRight" size="1rem" />
              </button>
              <FieldPhotos page={p} studentId={me.id} readOnly />
              {book[p.key] ? <p className="reflect__memo">{book[p.key].text}</p> : null}
            </li>
          ))}
        </ol>
      ) : (
        <p className="hint">
          <Icon name="photo" size="1rem" /> 아직 남긴 사진이나 메모가 없어요.
        </p>
      )}
    </div>
  )
}
