/**
 * 주소의 # 뒤를 화면 위치로 쓴다 (GitHub Pages 에서 새로고침해도 404 가 나지 않는다).
 *   #/s/<슬라이드 id>   슬라이드
 *   #/feedback          피드백 모아보기
 *   #/reflections       내 소감 모아보기
 */
import { useEffect, useState } from 'react'

export type Route = { name: 'slide'; slideId: string | null } | { name: 'feedback' } | { name: 'reflections' }

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '')
  if (path.startsWith('/feedback')) return { name: 'feedback' }
  if (path.startsWith('/reflections')) return { name: 'reflections' }
  const m = path.match(/^\/s\/([a-z0-9-]+)/)
  return { name: 'slide', slideId: m ? m[1] : null }
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash))
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export const slideHref = (slideId: string) => `#/s/${slideId}`

export function goToSlide(slideId: string) {
  window.location.hash = slideHref(slideId)
}
