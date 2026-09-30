/**
 * 주소의 # 뒤를 화면 위치로 쓴다 (GitHub Pages 에서 새로고침해도 404 가 나지 않는다).
 *   #/p/<장 key>     그 장 (예: #/p/d2-quincy-market, #/p/day-3)
 *   #/code/<코드>    입장 코드를 담은 링크. 열리면 주소에서 바로 지우고, 코드로 만든 열쇠만 기기에 저장한다.
 * 코드는 # 뒤에만 있어서 서버로 보내지지 않는다.
 */
import { useEffect, useState } from 'react'

export type Location = { pageKey: string | null; code: string | null }

export function parseHash(hash: string): Location {
  const path = hash.replace(/^#/, '')
  const code = path.match(/^\/code\/([A-Za-z0-9-]+)/)
  if (code) return { pageKey: null, code: code[1] }
  const m = path.match(/^\/p\/([a-z0-9-]+)/)
  return { pageKey: m ? m[1] : null, code: null }
}

export function useLocation(): Location {
  const [loc, setLoc] = useState(() => parseHash(window.location.hash))
  useEffect(() => {
    const onChange = () => setLoc(parseHash(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return loc
}

export const pageHref = (key: string) => `#/p/${key}`

/** 장 이동. replace 면 뒤로 가기 기록을 남기지 않는다(넘길 때마다 기록이 쌓이지 않게). */
export function goTo(key: string, opts: { replace?: boolean } = {}) {
  const href = pageHref(key)
  if (window.location.hash === href) return
  if (opts.replace) {
    history.replaceState(null, '', href)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else {
    window.location.hash = href
  }
}

export function clearCodeFromUrl(nextKey: string | null) {
  history.replaceState(null, '', nextKey ? pageHref(nextKey) : window.location.pathname + window.location.search)
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}
