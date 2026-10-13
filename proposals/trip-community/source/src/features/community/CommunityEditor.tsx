import { useEffect, useRef, useState, type FormEvent } from 'react'
import { KIND_NAMES, communityMessage, editPost, publishPost, type CommunityPost, type PostInput, type PostKind } from '../../lib/community'
import { readCommunityDraft, saveCommunityDraft, type CommunityDraft } from '../../lib/repo'
import { deletePhoto, getPhoto, putPhoto, shrinkPhoto } from '../../lib/photoStore'
import { CommunityPhoto } from './CommunityPhoto'
import { locations, locationByKey, regions } from './catalog'

export function CommunityEditor({ owner, location, region, initial, onSaved, onBack }: {
  owner: string; location?: string; region?: string; initial?: CommunityPost; onSaved: (post: CommunityPost) => void; onBack: () => void
}) {
  const slot = initial?.id ?? 'new'
  const [draft, setDraft] = useState<CommunityDraft>(() => {
    const saved = readCommunityDraft(owner, slot)
    if (saved) return saved
    const place = location ? locationByKey.get(location) : null
    return {
      clientId: crypto.randomUUID(), photoIds: [], baseVersion: initial?.version,
      input: initial ? { title: initial.title, body: initial.body, kind: initial.kind, regionId: initial.regionId, locationKey: initial.locationKey } :
        { title: '', body: '', kind: 'tip', regionId: place?.regionId ?? region ?? 'general', locationKey: place?.key ?? null },
    }
  })
  const latest = useRef(draft)
  const [busy, setBusy] = useState(false)
  const [picking, setPicking] = useState(false)
  const [message, setMessage] = useState('초안은 이 기기에 저장돼요. 게시하면 학생과 인솔 선생님이 볼 수 있어요.')
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine)
    window.addEventListener('online', sync); window.addEventListener('offline', sync)
    return () => { window.removeEventListener('online', sync); window.removeEventListener('offline', sync) }
  }, [])
  function persist(next: CommunityDraft) {
    latest.current = next
    setDraft(next)
    if (!saveCommunityDraft(owner, slot, next)) setMessage('이 브라우저는 초안을 저장하지 못해 창을 닫으면 사라져요. 일반 브라우저 창으로 열어 주세요.')
  }
  const update = (change: Partial<PostInput>) => persist({ ...latest.current, input: { ...latest.current.input, ...change } })
  async function pick(files: FileList | null) {
    if (!files?.length) return
    setPicking(true)
    let failed = 0
    const picked = [...files].slice(0, Math.max(0, 5 - latest.current.photoIds.length))
    for (const file of picked) {
      const small = await shrinkPhoto(file)
      if (!small) { failed++; continue }
      const id = `community-${crypto.randomUUID()}`
      const status = await putPhoto(id, small.blob)
      // 게시판 초안 사진은 실제 기기 저장이 성공했을 때만 첨부 목록에 넣는다.
      if (status !== 'saved') { await deletePhoto(id); failed++; continue }
      persist({ ...latest.current, photoIds: [...latest.current.photoIds, id] })
    }
    setPicking(false)
    setMessage(failed ? '일부 사진을 저장하지 못했어요. 형식과 기기 저장 공간을 확인해 주세요.' : '사진을 초안에 저장했어요. 게시할 때 함께 올라가요.')
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy || picking) return
    setBusy(true)
    const current = latest.current
    try {
      let result: { post: CommunityPost }
      if (initial) result = await editPost(initial.id, current.input, current.baseVersion ?? initial.version)
      else {
        const blobs = await Promise.all(current.photoIds.map((id) => getPhoto(id)))
        if (blobs.some((blob) => !blob)) throw new Error('missing_photo')
        result = await publishPost(current.input, blobs as Blob[], current.clientId)
      }
      saveCommunityDraft(owner, slot, null)
      await Promise.all(current.photoIds.map(deletePhoto))
      onSaved(result.post)
    } catch (error) {
      setMessage(error instanceof Error && error.message === 'missing_photo' ? '초안 사진이 기기에서 지워졌어요. 해당 사진을 제거하거나 다시 첨부해 주세요.' : communityMessage(error))
    } finally { setBusy(false) }
  }
  async function discard() {
    if (!window.confirm('저장한 초안을 지울까요?')) return
    await Promise.all(latest.current.photoIds.map(deletePhoto))
    saveCommunityDraft(owner, slot, null)
    onBack()
  }
  return <form className="community-form" onSubmit={(event) => void submit(event)}>
    <button type="button" className="link-btn" onClick={onBack} disabled={busy || picking}>돌아가기 · 초안 유지</button>
    <h3>{initial ? '이야기 수정' : '새 이야기'}</h3>
    <label>글 종류<select aria-label="글 종류" value={draft.input.kind} disabled={busy} onChange={(e) => update({ kind: e.target.value as PostKind })}>
      {Object.entries(KIND_NAMES).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
    </select></label>
    <div className="community-form__pair">
      <label>지역<select aria-label="지역" value={draft.input.regionId} disabled={busy} onChange={(e) => update({ regionId: e.target.value, locationKey: null })}>
        {regions.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
      </select></label>
      <label>장소<select aria-label="장소" value={draft.input.locationKey ?? ''} disabled={busy} onChange={(e) => update({ locationKey: e.target.value || null })}>
        <option value="">지역 전체</option>
        {locations.filter((p) => p.regionId === draft.input.regionId).map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
      </select></label>
    </div>
    <label>제목<input aria-label="제목" value={draft.input.title} maxLength={100} required disabled={busy} placeholder="어떤 이야기를 나누고 싶나요?" onChange={(e) => update({ title: e.target.value })} /></label>
    <label>내용<textarea aria-label="내용" value={draft.input.body} maxLength={10000} required rows={10} disabled={busy} placeholder="발견한 정보나 기억에 남는 경험을 적어 주세요." onChange={(e) => update({ body: e.target.value })} /></label>
    <p className="community-meta">{draft.input.body.length.toLocaleString()} / 10,000자</p>
    {initial ? <p className="fineprint">첨부 사진은 유지되고 제목·내용·분류를 수정해요.</p> : <>
      <label className="community-upload">사진 첨부 · 최대 5장<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/avif" multiple disabled={busy || picking || draft.photoIds.length >= 5} onChange={(e) => { void pick(e.target.files); e.target.value = '' }} /></label>
      <ul className="community-photos community-photos--draft">{draft.photoIds.map((id, i) => <li key={id}>
        <CommunityPhoto id={id} local alt={`첨부 사진 ${i + 1}`} />
        <button type="button" className="btn btn--ghost btn--sm" disabled={busy || picking} onClick={() => { persist({ ...latest.current, photoIds: latest.current.photoIds.filter((p) => p !== id) }); void deletePhoto(id) }}>사진 {i + 1} 제거</button>
      </li>)}</ul>
    </>}
    <p className="community-message" role="status">{!online ? '인터넷이 끊겼어요. 초안은 계속 작성할 수 있고 연결되면 게시할 수 있어요.' : message}</p>
    <p className="fineprint">다른 사람의 얼굴이 나온 사진은 함께 올려도 되는지 먼저 확인해 주세요. 방 번호·연락처·항공권은 올리지 않아요.</p>
    <div className="community-actions">
      <button type="submit" className="btn btn--primary" disabled={busy || picking || !online || !draft.input.title.trim() || !draft.input.body.trim()}>{busy ? '저장 중이에요' : initial ? '수정 완료' : '게시하기'}</button>
      <button type="button" className="btn btn--ghost" disabled={busy || picking} onClick={() => { if (saveCommunityDraft(owner, slot, latest.current)) setMessage('초안을 저장했어요. 나중에 글쓰기를 열어 이어 쓸 수 있어요.'); else setMessage('이 브라우저는 초안을 저장하지 못해 창을 닫으면 사라져요.') }}>초안 저장</button>
      <button type="button" className="link-btn" disabled={busy || picking} onClick={() => void discard()}>초안 지우기</button>
    </div>
  </form>
}
