import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
try {
  createRoot(document.getElementById('root')).render(<App />)
  setTimeout(() => document.getElementById('boot')?.remove(), 150)
} catch (e) {
  const d = document.getElementById('err')
  d.style.display = 'block'
  d.textContent = '⚠ Render error: ' + e.message + '\n' + (e.stack || '')
}
