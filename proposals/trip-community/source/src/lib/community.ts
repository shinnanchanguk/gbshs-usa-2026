import { readZudoSession, ZUDO_ORIGIN } from './zudo'

/** 별도 서버를 쓰면 빌드할 때 origin 을 지정한다. 기본은 기존 ZUDO 서버의 동일 API 경로다. */
const ORIGIN = import.meta.env.VITE_COMMUNITY_ORIGIN || ZUDO_ORIGIN
const BASE = '/api/trip/community'
export type PostKind = 'tip' | 'question' | 'review'
export const KIND_NAMES: Record<PostKind, string> = { tip: '정보 공유', question: '질문', review: '탐방 후기' }
export type CommunityPhoto = { id: string; width: number; height: number }
export type CommunityPost = {
  id: string; regionId: string; locationKey: string | null; kind: PostKind
  title: string; body: string; authorName: string; authorRole: 'student' | 'teacher'
  createdAt: string; updatedAt: string; version: number; hidden: boolean
  canEdit: boolean; canModerate: boolean; photos: CommunityPhoto[]; commentCount: number
}
export type CommunityComment = { id: string; body: string; authorName: string; createdAt: string; canDelete: boolean }
export type PostInput = { regionId: string; locationKey: string | null; kind: PostKind; title: string; body: string }
export class CommunityError extends Error {
  constructor(readonly status: number, readonly code: string) { super(code) }
}
export function communityMessage(error: unknown): string {
  if (error instanceof CommunityError) {
    if (error.code === 'duplicate_post_key') return '이 초안은 이미 게시됐어요. 목록에서 게시한 글을 열어 수정해 주세요. 지금 작성한 초안은 남아 있어요.'
    if (error.status === 401) return '로그인이 만료됐어요. ZUDO에서 다시 들어와 주세요. 초안은 이 기기에 남아 있어요.'
    if (error.status === 403) return '학생과 인솔 선생님만 탐방 이야기를 이용할 수 있어요.'
    if (error.status === 404) return '글을 찾을 수 없거나 게시판이 아직 준비되지 않았어요.'
    if (error.status === 409) return '다른 창에서 글이 바뀌었어요. 새 내용을 확인한 뒤 다시 수정해 주세요. 초안은 남아 있어요.'
    if (error.status === 429) return '잠시 뒤 다시 시도해 주세요.'
    if (error.status === 413) return '사진 용량이 커요. 사진 수를 줄여 다시 올려 주세요.'
    if (error.status === 400 || error.status === 415) return '제목·내용·장소와 사진 형식을 확인해 주세요.'
  }
  return '연결하지 못했어요. 인터넷을 확인한 뒤 다시 시도해 주세요. 작성한 초안은 남아 있어요.'
}
async function request(path: string, init: RequestInit = {}) {
  const token = readZudoSession()?.token
  if (!token) throw new CommunityError(401, 'no_session')
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(`${ORIGIN}${BASE}${path}`, {
    ...init, headers, cache: 'no-store', credentials: 'omit', signal: init.signal ?? AbortSignal.timeout(25_000),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new CommunityError(res.status, data.error ?? 'failed')
  }
  return res
}
export async function listPosts(filters: { region?: string; location?: string; kind?: string; before?: number; hidden?: boolean }, signal?: AbortSignal): Promise<{ posts: CommunityPost[]; next: number | null }> {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== '') params.set(key, String(value))
  return (await request(`/posts?${params}`, { signal })).json()
}
export async function getPost(id: string, signal?: AbortSignal): Promise<{ post: CommunityPost; comments: CommunityComment[] }> {
  return (await request(`/posts/${encodeURIComponent(id)}`, { signal })).json()
}
export async function publishPost(input: PostInput, photos: Blob[], clientId: string): Promise<{ post: CommunityPost }> {
  const form = new FormData()
  form.set('payload', JSON.stringify({ ...input, clientId }))
  photos.forEach((blob, i) => form.append('photos', blob, `photo-${i + 1}.jpg`))
  return (await request('/posts', { method: 'POST', body: form })).json()
}
export async function editPost(id: string, input: PostInput, version: number): Promise<{ post: CommunityPost }> {
  return (await request(`/posts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...input, version }) })).json()
}
export async function deletePost(id: string, version: number) {
  await request(`/posts/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ version }) })
}
export async function moderatePost(id: string, hidden: boolean, version: number) {
  return (await request(`/posts/${id}/moderation`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hidden, version }) })).json()
}
export async function addComment(id: string, body: string, clientId: string) {
  return (await request(`/posts/${id}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body, clientId }) })).json()
}
export async function deleteComment(postId: string, id: string) {
  await request(`/posts/${postId}/comments/${id}`, { method: 'DELETE' })
}
export async function fetchCommunityPhoto(id: string, signal?: AbortSignal): Promise<Blob> {
  return (await request(`/photos/${id}`, { signal })).blob()
}
