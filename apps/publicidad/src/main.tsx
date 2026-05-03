import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './ErrorBoundary'
import './index.css'

// Global error catcher — writes any uncaught JS error directly to the DOM
// so we can diagnose blank pages even when React itself crashes
window.onerror = (msg, src, line, col, err) => {
  const root = document.getElementById('root')
  if (root && root.childElementCount === 0) {
    root.innerHTML = `<div style="font-family:sans-serif;padding:2rem;max-width:700px;margin:4rem auto">
      <h1 style="color:#ff5c02;margin-bottom:1rem">Error al cargar DosmiAds</h1>
      <pre style="background:#f3f3f3;padding:1rem;border-radius:8px;overflow:auto;font-size:12px;color:#c00;white-space:pre-wrap">${msg}\n${src}:${line}:${col}\n\n${err?.stack ?? ''}</pre>
      <button onclick="location.reload()" style="margin-top:1.5rem;padding:0.5rem 1.5rem;background:#ff5c02;color:white;border:none;border-radius:8px;cursor:pointer">Recargar</button>
    </div>`
  }
}
window.onunhandledrejection = (e) => {
  const root = document.getElementById('root')
  if (root && root.childElementCount === 0) {
    root.innerHTML = `<div style="font-family:sans-serif;padding:2rem;max-width:700px;margin:4rem auto">
      <h1 style="color:#ff5c02;margin-bottom:1rem">Error al cargar DosmiAds (promise)</h1>
      <pre style="background:#f3f3f3;padding:1rem;border-radius:8px;overflow:auto;font-size:12px;color:#c00;white-space:pre-wrap">${e.reason?.message ?? String(e.reason)}\n\n${e.reason?.stack ?? ''}</pre>
      <button onclick="location.reload()" style="margin-top:1.5rem;padding:0.5rem 1.5rem;background:#ff5c02;color:white;border:none;border-radius:8px;cursor:pointer">Recargar</button>
    </div>`
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
