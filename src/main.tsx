import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { LocaleProvider } from './i18n/LocaleProvider'
import { ThemeProvider } from './theme/ThemeProvider'
import './index.css'

const root = document.getElementById('root')
if (!root) {
  throw new Error('Root element not found')
}

window.addEventListener('error', (event) => {
  root.textContent = `Runtime error: ${event.message}`
})

window.addEventListener('unhandledrejection', (event) => {
  root.textContent = `Unhandled rejection: ${String(event.reason)}`
})

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <LocaleProvider>
        <App />
      </LocaleProvider>
    </ThemeProvider>
  </StrictMode>,
)
