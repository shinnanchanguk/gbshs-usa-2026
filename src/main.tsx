import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/expedition-tokens.css'
import './styles/fonts.css'
import './styles/app.css'
import { App } from './app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
