// Polyfills for Node.js globals required by amazon-cognito-identity-js
import { Buffer } from 'buffer'
import process from 'process'

// Make Buffer and process available globally
if (typeof window !== 'undefined') {
  ;(window as any).Buffer = Buffer
  ;(window as any).process = process
  ;(window as any).global = window
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import './index.css'
import App from './App.tsx'
import { store } from './store/index.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
