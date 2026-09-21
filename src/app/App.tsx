import { useStored } from '../lib/storage'
import { PinGate, PIN_HASH } from '../features/pin/PinGate'
import { RoleGate } from '../features/role/RolePicker'
import { Shell } from './Shell'
import { useProfile } from './state'
import { deck } from '../content'

export function App() {
  const [unlocked, setUnlocked] = useStored<string | null>('unlock', null)
  const [profile] = useProfile()
  if (unlocked !== PIN_HASH) return <PinGate onUnlock={() => setUnlocked(PIN_HASH)} />
  if (!profile) return <RoleGate />
  if (!deck.length) return <p className="notice notice--warn">content/days 에 일정 파일이 없어요. README 의 "내용 고치기"를 참고하세요.</p>
  return <Shell profile={profile} />
}
