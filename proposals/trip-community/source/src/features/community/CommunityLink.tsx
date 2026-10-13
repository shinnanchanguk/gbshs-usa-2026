import { createContext, useContext } from 'react'
import { Icon } from '../../components/Icon'
import { GUIDE } from '../../lib/edition'
import { locationByKey } from './catalog'

export const CommunityOpener = createContext<(location?: string) => void>(() => undefined)
export function CommunityLink({ pageKey }: { pageKey: string }) {
  const open = useContext(CommunityOpener)
  if (GUIDE || !locationByKey.has(pageKey)) return null
  return <button type="button" className="community-entry" onClick={() => open(pageKey)}>
    <Icon name="chat" />
    <span><strong>이 장소의 이야기</strong><span>친구들이 남긴 정보와 후기를 보고 이야기를 나눠요.</span></span>
    <Icon name="chevronRight" />
  </button>
}
