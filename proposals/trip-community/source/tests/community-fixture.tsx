/** 브라우저 통합 검사 전용. App의 입장 처리와 운영 명단을 사용하거나 변경하지 않는다. 빌드 엔트리에 포함되지 않는다. */
import { createRoot } from 'react-dom/client'
import { AppProvider } from '../src/app/context'
import { Shell } from '../src/app/Shell'
import '../src/styles/tokens.css'
import '../src/styles/fonts.css'
import '../src/styles/app.css'

const roster = { students: [], teachers: [], roles: {}, emergency: {}, nightDuty: [], mentorsMIT: [] }
createRoot(document.getElementById('root')!).render(<AppProvider roster={roster}><Shell onLock={() => undefined} /></AppProvider>)
