import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
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
    <App />
  </StrictMode>,
)
