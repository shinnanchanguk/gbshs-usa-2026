import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/fonts.css'
import './styles/app.css'
import { App } from './app/App'
import { PrintGuide } from './features/print/PrintGuide'

// #/print 는 오프라인 안내 PDF 를 뜨는 인쇄용 화면(scripts/build-offline-pdf.mjs). 명단 없이 공개 내용만 보여 준다.
const printing = window.location.hash === '#/print'

createRoot(document.getElementById('root')!).render(<StrictMode>{printing ? <PrintGuide /> : <App />}</StrictMode>)

// 배포본에서만: 한 번 연 화면·사진·지도를 기기에 저장해 두어 해외에서 인터넷이 약해도 일정이 열리게 한다.
// 학생 사전 안내판은 두지 않는다(본 사이트 서비스 워커와 저장 공간이 섞이지 않게).
if (import.meta.env.PROD && !__GUIDE__ && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).catch(() => undefined)
  })
}
