import { useEffect, useState } from 'react'
import { fetchCommunityPhoto } from '../../lib/community'
import { getPhoto } from '../../lib/photoStore'

/** 게시 사진은 토큰으로 받아 blob 으로 표시한다. 공개 주소나 서비스 워커 캐시에 남기지 않는다. */
export function CommunityPhoto({ id, alt, local = false }: { id: string; alt: string; local?: boolean }) {
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    let url: string | null = null
    setSrc(null)
    setFailed(false)
    void (local ? getPhoto(id) : fetchCommunityPhoto(id, controller.signal)).then((blob) => {
      if (controller.signal.aborted) return
      if (!blob) { setFailed(true); return }
      url = URL.createObjectURL(blob)
      setSrc(url)
    }).catch(() => { if (!controller.signal.aborted) setFailed(true) })
    return () => { controller.abort(); if (url) URL.revokeObjectURL(url) }
  }, [id, local])
  return src ? <img src={src} alt={alt} decoding="async" /> : <span className="community-photo-placeholder" role="status">{failed ? '사진을 불러오지 못했어요.' : '사진을 불러오고 있어요.'}</span>
}
