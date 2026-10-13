import { useCallback, useEffect, useRef, useState } from 'react'
import { Sheet } from '../../components/Sheet'
import { Icon } from '../../components/Icon'
import { KIND_NAMES, addComment, communityMessage, deleteComment, deletePost, getPost, listPosts, moderatePost, type CommunityComment, type CommunityPost } from '../../lib/community'
import { readCommunityDraft } from '../../lib/repo'
import { useZudoSession, ZUDO_HANDOFF_URL } from '../../lib/zudo'
import { CommunityEditor } from './CommunityEditor'
import { CommunityPhoto } from './CommunityPhoto'
import { locationByKey, locations, regionLabel, regions } from './catalog'
import './community.css'

export default function CommunitySheet({ location, onClose }: { location?: string; onClose: () => void }) {
  const session = useZudoSession()
  const allowed = session?.me.role === 'student' || session?.me.role === 'teacher'
  const [view, setView] = useState<{ kind: 'list' } | { kind: 'detail'; id: string } | { kind: 'editor'; post?: CommunityPost; region?: string; location?: string }>({ kind: 'list' })
  const owner = session ? `${session.me.role}:${session.me.studentNumber ?? session.me.name}` : ''
  const [revision, setRevision] = useState(0)
  return <Sheet title="탐방 이야기" wide onClose={onClose}>
    {!allowed ? <div className="community-empty">
      <Icon name="chat" size="2rem" />
      <h3>학생과 인솔 선생님이 함께 나누는 공간이에요.</h3>
      <p>탐방 이야기는 ZUDO로 로그인한 학생과 인솔 선생님이 이용할 수 있어요. 보호자 공유는 추후 제공할 예정이에요.</p>
      {!session ? <a className="btn btn--primary" href={ZUDO_HANDOFF_URL}>ZUDO로 로그인</a> : null}
    </div> : view.kind === 'editor' ? <CommunityEditor key={view.post?.id ?? 'new'} owner={owner} location={view.location ?? location} region={view.region} initial={view.post}
      onBack={() => setView(view.post ? { kind: 'detail', id: view.post.id } : { kind: 'list' })}
      onSaved={(post) => { setRevision((v) => v + 1); setView({ kind: 'detail', id: post.id }) }} /> : view.kind === 'detail' ?
      <PostDetail key={`${view.id}:${revision}`} id={view.id} onBack={() => { setRevision((v) => v + 1); setView({ kind: 'list' }) }} onEdit={(post) => setView({ kind: 'editor', post })} /> :
      <PostList key={revision} location={location} isTeacher={session?.me.role === 'teacher'} hasDraft={!!readCommunityDraft(owner)} onOpen={(id) => setView({ kind: 'detail', id })} onCompose={(region, location) => setView({ kind: 'editor', region, location })} />}
  </Sheet>
}

function PostList({ location: initialLocation, isTeacher, hasDraft, onOpen, onCompose }: {
  location?: string; isTeacher: boolean; hasDraft: boolean; onOpen: (id: string) => void; onCompose: (region: string, location?: string) => void
}) {
  const [region, setRegion] = useState(initialLocation ? locationByKey.get(initialLocation)?.regionId ?? '' : '')
  const [location, setLocation] = useState(initialLocation ?? '')
  const [kind, setKind] = useState('')
  const [hidden, setHidden] = useState(false)
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [next, setNext] = useState<number | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [loadingMore, setLoadingMore] = useState(false)
  const [retry, setRetry] = useState(0)
  const sequence = useRef(0)
  useEffect(() => {
    const mine = ++sequence.current
    const controller = new AbortController()
    setPosts([]); setNext(null); setState('loading'); setMessage(''); setLoadingMore(false)
    void listPosts({ region, location, kind, hidden }, controller.signal).then((data) => {
      if (mine !== sequence.current) return
      setPosts(data.posts); setNext(data.next); setState('ready')
    }).catch((error) => { if (!controller.signal.aborted && mine === sequence.current) { setMessage(communityMessage(error)); setState('error') } })
    return () => { ++sequence.current; controller.abort() }
  }, [region, location, kind, hidden, retry])
  async function more() {
    if (next === null || loadingMore) return
    const mine = sequence.current
    setLoadingMore(true)
    try {
      const data = await listPosts({ region, location, kind, hidden, before: next })
      if (mine !== sequence.current) return
      setPosts((prev) => [...prev, ...data.posts.filter((p) => !prev.some((q) => q.id === p.id))]); setNext(data.next)
    } catch (error) { if (mine === sequence.current) setMessage(communityMessage(error)) }
    finally { if (mine === sequence.current) setLoadingMore(false) }
  }
  return <div className="community-board">
    <div className="community-intro"><p>현장에서 찾은 정보, 궁금한 점, 기억에 남는 경험을 나눠요.</p>
      <button type="button" className="btn btn--primary" onClick={() => onCompose(region || 'general', location)}><Icon name="pen" size="1rem" />{hasDraft ? '초안 이어 쓰기' : '글쓰기'}</button>
    </div>
    <div className="community-regions" aria-label="지역별 이야기">
      {[{ id: '', label: '전체' }, ...regions].map((r) => <button key={r.id} type="button" aria-pressed={region === r.id} onClick={() => { setRegion(r.id); setLocation('') }}>{r.label}</button>)}
    </div>
    <div className="community-filters">
      <label>장소<select aria-label="장소" value={location} onChange={(e) => setLocation(e.target.value)}><option value="">모든 장소</option>{locations.filter((p) => !region || p.regionId === region).map((p) => <option value={p.key} key={p.key}>{p.label}</option>)}</select></label>
      <label>글 종류<select aria-label="글 종류" value={kind} onChange={(e) => setKind(e.target.value)}><option value="">모든 글</option>{Object.entries(KIND_NAMES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      {isTeacher ? <label className="community-check"><input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />숨긴 글만</label> : null}
    </div>
    {state === 'loading' ? <p role="status" className="community-empty">이야기를 불러오고 있어요.</p> : state === 'error' ? <div className="community-empty" role="status"><p>{message}</p><button type="button" className="btn btn--ghost" onClick={() => setRetry((v) => v + 1)}>다시 불러오기</button></div> : !posts.length ? <div className="community-empty"><h3>{hidden ? '숨긴 글이 없어요.' : '아직 올라온 이야기가 없어요.'}</h3><p>{hidden ? '선생님이 숨긴 글은 이곳에서 확인할 수 있어요.' : '먼저 발견한 작은 정보나 오늘의 경험을 남겨 보세요.'}</p></div> :
      <ul className="community-posts">{posts.map((post) => <li key={post.id}><button type="button" onClick={() => onOpen(post.id)}>
        {post.photos[0] ? <span className="community-posts__thumb"><CommunityPhoto id={post.photos[0].id} alt="" /></span> : null}
        <span className="community-posts__copy"><span className="community-meta">{KIND_NAMES[post.kind]} · {regionLabel(post.regionId)}{post.hidden ? ' · 숨김' : ''}</span>
          <strong>{post.title}</strong><span className="community-excerpt">{post.body.slice(0, 110)}</span>
          <span className="community-meta">{post.authorName} · {dateLabel(post.createdAt)} · 댓글 {post.commentCount}</span>
        </span>
      </button></li>)}</ul>}
    {state === 'ready' && message ? <p role="status" className="community-message">{message}</p> : null}
    {next !== null ? <button type="button" className="btn btn--ghost btn--block" disabled={loadingMore} onClick={() => void more()}>{loadingMore ? '불러오는 중이에요' : '더 보기'}</button> : null}
  </div>
}

function PostDetail({ id, onBack, onEdit }: { id: string; onBack: () => void; onEdit: (post: CommunityPost) => void }) {
  const [post, setPost] = useState<CommunityPost | null>(null)
  const [comments, setComments] = useState<CommunityComment[]>([])
  const [comment, setComment] = useState('')
  const commentId = useRef(crypto.randomUUID())
  const [busy, setBusy] = useState(false)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await getPost(id, signal)
      if (signal?.aborted) return
      setPost(data.post); setComments(data.comments); setState('ready')
    } catch (error) { if (!signal?.aborted) { setMessage(communityMessage(error)); setState('error') } }
  }, [id])
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort() }, [load])
  async function action(fn: () => Promise<unknown>, after?: () => void) {
    if (busy) return
    setBusy(true); setMessage('')
    try { await fn(); if (after) after(); else await load() } catch (error) { setMessage(communityMessage(error)) }
    finally { setBusy(false) }
  }
  return <article className="community-detail">
    <button type="button" className="link-btn" onClick={onBack}>목록으로</button>
    {state !== 'ready' || !post ? <div className="community-empty" role="status"><p>{state === 'loading' ? '이야기를 불러오고 있어요.' : message}</p>{state === 'error' ? <button type="button" className="btn btn--ghost" onClick={() => void load()}>다시 불러오기</button> : null}</div> : <>
      <p className="community-meta">{KIND_NAMES[post.kind]} · {regionLabel(post.regionId)}{post.locationKey ? ` · ${locationByKey.get(post.locationKey)?.label ?? ''}` : ''}</p>
      <h3 className="community-detail__title">{post.title}</h3>
      <p className="community-meta">{post.authorName}{post.authorRole === 'teacher' ? ' · 인솔 선생님' : ''} · {dateLabel(post.createdAt)}{post.version > 1 ? ' · 수정됨' : ''}</p>
      {post.hidden ? <p className="community-message">선생님이 숨긴 글이에요. 학생 목록에는 보이지 않아요.</p> : null}
      <p className="community-detail__body">{post.body}</p>
      <ul className="community-photos">{post.photos.map((p, i) => <li key={p.id}><CommunityPhoto id={p.id} alt={`${post.title} · 사진 ${i + 1}`} /></li>)}</ul>
      <div className="community-actions">
        {post.canEdit && !post.hidden ? <button type="button" className="btn btn--ghost btn--sm" disabled={busy} onClick={() => onEdit(post)}>수정</button> : null}
        {post.canEdit ? <button type="button" className="link-btn" disabled={busy} onClick={() => { if (window.confirm('이 글과 댓글·사진을 삭제할까요?')) void action(() => deletePost(post.id, post.version), onBack) }}>삭제</button> : null}
        {post.canModerate ? <button type="button" className="btn btn--ghost btn--sm" disabled={busy} onClick={() => { if (window.confirm(post.hidden ? '학생들이 다시 볼 수 있게 할까요?' : '학생 목록에서 이 글을 숨길까요?')) void action(() => moderatePost(post.id, !post.hidden, post.version)) }}>{post.hidden ? '숨김 해제' : '글 숨기기'}</button> : null}
      </div>
      <section className="community-comments" aria-label="댓글">
        <h4>댓글 {comments.length}</h4>
        <ul>{comments.map((c) => <li key={c.id}><p className="community-meta">{c.authorName} · {dateLabel(c.createdAt)}</p><p className="community-comment__body">{c.body}</p>{c.canDelete ? <button type="button" className="link-btn" disabled={busy} onClick={() => { if (window.confirm('이 댓글을 삭제할까요?')) void action(() => deleteComment(post.id, c.id)) }}>삭제</button> : null}</li>)}</ul>
        {!post.hidden ? <form onSubmit={(e) => { e.preventDefault(); void action(() => addComment(post.id, comment, commentId.current), () => { setComment(''); commentId.current = crypto.randomUUID(); void load() }) }}>
          <label htmlFor="community-comment">댓글 남기기</label><textarea id="community-comment" rows={3} maxLength={1000} required value={comment} disabled={busy} onChange={(e) => { setComment(e.target.value); commentId.current = crypto.randomUUID() }} />
          <button type="submit" className="btn btn--primary btn--sm" disabled={busy || !comment.trim()}>{busy ? '저장 중이에요' : '댓글 등록'}</button>
        </form> : null}
      </section>
      {message ? <p className="community-message" role="status">{message}</p> : null}
    </>}
  </article>
}
function dateLabel(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { timeZone: 'America/New_York', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value)) + ' (미 동부)'
}
