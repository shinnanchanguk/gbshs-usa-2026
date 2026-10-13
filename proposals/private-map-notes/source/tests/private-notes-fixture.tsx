/** 가상 계정으로 메모만 검사하는 개발용 진입점. 운영 빌드·로그인 처리에는 포함하지 않는다. */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProvider } from '../src/app/context'
import { Shell } from '../src/app/Shell'
import '../src/styles/tokens.css'
import '../src/styles/fonts.css'
import '../src/styles/app.css'

const roster = { students: [], teachers: [], roles: {}, emergency: {}, nightDuty: [], mentorsMIT: [] }
createRoot(document.getElementById('root')!).render(<StrictMode><AppProvider roster={roster}><Shell onLock={() => undefined} /></AppProvider></StrictMode>)
