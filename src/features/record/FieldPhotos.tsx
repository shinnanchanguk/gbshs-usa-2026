import { useCallback, useEffect, useState } from 'react'
import type { SlidePage } from '../../content'
import { Icon } from '../../components/Icon'
import { FIELD_PHOTO_MAX, newPhotoId, useFieldPhotos, type FieldPhoto } from '../../lib/repo'
import { askPersist, deletePhoto, getPhoto, putPhoto, shrinkPhoto } from '../../lib/photoStore'
import { Lightbox } from '../photos/Lightbox'

/** 기기에 저장한 사진을 화면에 띄울 주소로. 화면에서 사라지면 주소를 풀어 메모리를 돌려준다. */
function usePhotoSrc(id: string): string | null {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    let url: string | null = null
    let alive = true
    void getPhoto(id).then((blob) => {
      if (!alive || !blob) return
      url = URL.createObjectURL(blob)
      setSrc(url)
    })
    return () => {
      alive = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [id])
  return src
}

function Thumb({ photo, label, onSrc, onOpen, onRemove }: { photo: FieldPhoto; label: string; onSrc: (id: string, src: string | null) => void; onOpen: () => void; onRemove?: () => void }) {
  const src = usePhotoSrc(photo.id)
  useEffect(() => {
    onSrc(photo.id, src)
  }, [photo.id, src, onSrc])
  return (
    <li className="fphotos__item">
      <button type="button" className="fphotos__thumb" onClick={onOpen} aria-label={`${label} 크게 보기`} disabled={!src}>
        {src ? <img src={src} alt="" width={photo.w || undefined} height={photo.h || undefined} decoding="async" /> : <Icon name="photo" size="1.2rem" />}
      </button>
      {onRemove ? (
        <button type="button" className="fphotos__remove" onClick={onRemove} aria-label={`${label} 지우기`}>
          <Icon name="trash" size="0.95rem" />
        </button>
      ) : null}
    </li>
  )
}

/**
 * 한 장소에서 올린 사진들. 학생 본인은 올리고 지우고(readOnly=false), 보호자는 보기만 한다.
 * 올릴 때 휴대폰에서 화면 크기로 줄이고 촬영 위치 같은 정보를 지운 뒤 이 기기에 저장한다.
 */
export function FieldPhotos({ page, studentId, readOnly = false }: { page: SlidePage; studentId: string | undefined; readOnly?: boolean }) {
  const { book, add, remove } = useFieldPhotos(studentId)
  const list = book[page.key] ?? []
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [srcs, setSrcs] = useState<Record<string, string>>({})
  const onSrc = useCallback((id: string, src: string | null) => setSrcs((m) => (src ? (m[id] === src ? m : { ...m, [id]: src }) : id in m ? Object.fromEntries(Object.entries(m).filter(([k]) => k !== id)) : m)), [])
  const shown = list.filter((p) => srcs[p.id])
  const left = FIELD_PHOTO_MAX - list.length

  async function onPick(files: FileList | null) {
    if (!files?.length || !studentId) return
    const picked = [...files]
    const take = picked.slice(0, Math.max(0, left))
    setBusy(true)
    setMsg(null)
    askPersist()
    let added = 0
    let failed = 0
    let memoryOnly = false
    let full = false
    for (const f of take) {
      const small = await shrinkPhoto(f)
      if (!small) {
        failed++
        continue
      }
      const id = newPhotoId()
      const kept = await putPhoto(id, small.blob)
      if (kept === 'full') {
        full = true
        break
      }
      if (kept === 'memory') memoryOnly = true
      if (add(page.key, { id, w: small.w, h: small.h, at: new Date().toISOString() })) added++
      else await deletePhoto(id) // 목록에 못 넣었으면(다른 창에서 먼저 5장이 참) 바이트도 지운다
    }
    setBusy(false)
    const notes: string[] = []
    if (added) notes.push(`사진 ${added}장을 이 휴대폰에 저장했어요.`)
    if (failed) notes.push(`${failed}장은 열 수 없는 사진이라 올리지 못했어요.`)
    if (picked.length > take.length) notes.push(`한 장소에 ${FIELD_PHOTO_MAX}장까지 올릴 수 있어요.`)
    if (full) notes.push('휴대폰 저장 공간이 모자라요. 사진 앱에서 공간을 비운 뒤 다시 올려 주세요.')
    if (memoryOnly) notes.push('이 브라우저는 사진을 저장하지 못해 창을 닫으면 사라져요. 사파리나 크롬 일반 창으로 열어 주세요.')
    setMsg(notes.join(' ') || null)
  }

  if (!studentId) {
    return readOnly ? null : (
      <p className="fphotos__hint">
        <Icon name="user" size="1rem" /> 오른쪽 위 사람 단추에서 내 이름을 고르면 이곳에서 찍은 사진을 올릴 수 있어요.
      </p>
    )
  }

  if (readOnly && !list.length) return null

  return (
    <div className="fphotos">
      <ul className="fphotos__list" aria-label="이곳에서 올린 사진">
        {list.map((p, i) => (
          <Thumb
            key={p.id}
            photo={p}
            label={`사진 ${i + 1}`}
            onSrc={onSrc}
            onOpen={() => setOpen(p.id)}
            onRemove={
              readOnly
                ? undefined
                : () => {
                    if (window.confirm('이 사진을 지울까요? 지우면 되살릴 수 없어요.')) remove(page.key, p.id)
                  }
            }
          />
        ))}
        {!readOnly && left > 0 ? (
          <li className="fphotos__item">
            <label className="fphotos__add" data-busy={busy || undefined}>
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                disabled={busy}
                onChange={(e) => {
                  void onPick(e.target.files)
                  e.target.value = ''
                }}
              />
              <Icon name="photo" size="1.2rem" />
              <span>{busy ? '올리는 중' : '사진 올리기'}</span>
            </label>
          </li>
        ) : null}
      </ul>
      {readOnly ? null : (
        <p className="reflect__status" aria-live="polite">
          {msg ?? `이곳에서 찍은 사진을 ${FIELD_PHOTO_MAX}장까지 올릴 수 있어요. 사진과 메모는 보호자 화면에서도 보여요.`}
        </p>
      )}
      {open && shown.some((p) => p.id === open) ? (
        <Lightbox
          photos={shown.map((p) => ({ id: p.id, caption: `${page.slide.title} · 사진 ${list.indexOf(p) + 1}`, src: srcs[p.id] }))}
          start={shown.findIndex((p) => p.id === open)}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </div>
  )
}
