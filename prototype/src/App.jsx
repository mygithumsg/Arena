import React, { useEffect, useSyncExternalStore, useState } from 'react'
import { load, save } from './lib/store.mjs'
import { fmtINR } from './lib/calc.mjs'
import { THEMES, applyTheme } from './lib/themes.mjs'
import InvoicePrint from './components/InvoicePrint.jsx'
import Dashboard from './pages/Dashboard.jsx'
import BillNew from './pages/BillNew.jsx'
import Bills from './pages/Bills.jsx'
import { Items, Parties, Reports } from './pages/Pages.jsx'

// ---- tiny store binding ------------------------------------------------------
let state = load()
const subs = new Set()
export function getState() { return state }
export function setState(next) { state = next; save(next); if (next.prefs) applyTheme(next.prefs.theme || 'emerald'); subs.forEach((f) => f()) }
export function adopt(next) { state = next; subs.forEach((f) => f()) } // store ops that already persisted
export function setPrint(bill) { printSubs.forEach((f) => f(bill)) }
const printSubs = new Set()
export function useApp() { return useSyncExternalStore((f) => (subs.add(f), () => subs.delete(f)), getState, getState) }
export { fmtINR }

let toastId = null, toastTimer = null
export function toast(msg) { toastId = { msg, k: Date.now() }; subs.forEach((f) => f()); clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastId = null; subs.forEach((f) => f()) }, 2600) }
export function useToast() { return toastId }

// ---- icons -------------------------------------------------------------------
export const I = {
  grid: '▦', receipt: '🧾', people: '👥', box: '📦', pay: '💳', chart: '📊',
  rupee: '₹', gear: '⚙️', shield: '🛡', spark: '✦', plus: '+', eye: '👁', search: '🔍'
}

const NAV = [
  { k: 'dash', label: 'Dashboard', ic: I.grid },
  { k: 'bill', label: 'Sales Bills', ic: I.receipt, kbd: 'F2' },
  { k: 'parties', label: 'Customers', ic: I.people },
  { k: 'items', label: 'Items & Stock', ic: I.box },
  { k: 'payments', label: 'Payments', ic: I.pay },
  { k: 'reports', label: 'Reports', ic: I.chart }
]

export default function App() {
  const s = useApp()
  const [route, setRoute] = useState('dash')
  window.__go = setRoute /* test hook */
  const [q, setQ] = useState('')
  const [print, setPrintState] = useState(null)
  const [themeOpen, setThemeOpen] = useState(false)
  useEffect(() => { printSubs.add(setPrintState); return () => printSubs.delete(setPrintState) }, [])
  useEffect(() => { applyTheme(s.prefs.theme || 'emerald'); const on = (ev) => { if (ev.key === 'F10') { ev.preventDefault(); setThemeOpen((v) => !v) } }; window.addEventListener('keydown', on); return () => window.removeEventListener('keydown', on) }, [s.prefs.theme])
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'F2') { e.preventDefault(); setRoute('bill') }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); document.getElementById('gsearch')?.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const setTheme = (id) => { const next = { ...s, prefs: { ...s.prefs, theme: id } }; setState(next); toast(`Theme: ${THEMES.find(t => t.id === id)?.name}`) }
  return (
    <div className="app">
      <aside className="sb">
        <div className="sb-brand">
          <div className="sb-logo">U₹</div>
          <div className="sb-word"><b>UMESH</b><span>SMARTBILL</span></div>
        </div>
        <div className="sb-switch">
          <div className="m">US</div>
          <div><b>{s.company.legal}</b><small>Main Branch · Ambikapur</small></div>
        </div>
        <nav className="sb-nav">
          <div className="sb-lbl">WORKSPACE</div>
          {NAV.map((n) => (
            <button key={n.k} className={`sb-i ${route === n.k ? 'on' : ''}`} onClick={() => setRoute(n.k)}>
              <span className="ic">{n.ic}</span>{n.label}{n.kbd && <span className="kbd">{n.kbd}</span>}
            </button>
          ))}
          <div className="sb-lbl">MANAGE</div>
          <button className="sb-i" onClick={() => { localStorage.removeItem('umesh_smartbill_v1'); location.reload() }}>
            <span className="ic">↺</span>Reset demo data
          </button>
          <div className="tip">
            <b>{I.spark} SMART TIP</b>
            <p>{s.items.filter((i) => !i.service && i.stock < i.min).length} items are below reorder level. Reorder them on time.</p>
            <a href="#" onClick={(e) => { e.preventDefault(); setRoute('items') }}>View stock ›</a>
          </div>
        </nav>
        <div className="sb-foot">
          <button className="sb-i" onClick={() => setRoute('reports')}><span className="ic">{I.gear}</span>Settings</button>
          <div className="secure">{I.shield} Your data is secure · offline-first</div>
        </div>
      </aside>

      <div className="main">
        <header className="top">
          <div className="mlogo"><span className="m">U₹</span><div><b>UMESH</b><small>SMARTBILL</small></div></div>
          <div className="search">
            <span>{I.search}</span>
            <input id="gsearch" placeholder="Search bill, customer or item…" value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setRoute('items'); window.__q = q } }} />
            <span className="kbd2">⌘K</span>
          </div>
          <div className="top-right">
            <div className="lang">
              <button className={s.prefs.language === 'hi' ? 'on' : ''} onClick={() => setState({ ...s, prefs: { ...s.prefs, language: 'hi' } })}>हिंदी</button>
              <button className={s.prefs.language === 'en' ? 'on' : ''} onClick={() => setState({ ...s, prefs: { ...s.prefs, language: 'en' } })}>EN</button>
            </div>
            <button className="bell" title="3 pending: day close, reminders, backup" />
            <button className="btn sm" title="Themes (F10) — 12 built-in" onClick={() => setThemeOpen((v) => !v)}>◑ Theme</button>
            <div className="who">
              <div className="ava">UK</div>
              <div><b>Umesh Kumar</b><small>Administrator</small></div>
              <button className="btn pri sm" style={{ marginLeft: 8 }} onClick={() => setRoute('bill')}>{I.plus} New Bill <span className="kbd">F2</span></button>
            </div>
          </div>
        </header>

        <div className="content">
          {route === 'dash' && <Dashboard go={setRoute} />}
          {route === 'bill' && <BillNew go={setRoute} />}
          {route === 'bills' && <Bills go={setRoute} />}
          {route === 'payments' && <Reports tab="payments" />}
          {route === 'parties' && <Parties />}
          {route === 'items' && <Items />}
          {route === 'reports' && <Reports />}
        </div>
      </div>
      <nav className="mobnav">
        <a className={route === 'dash' ? 'on' : ''} onClick={() => setRoute('dash')}><span className="ic">▦</span>Home</a>
        <a className={route === 'items' ? 'on' : ''} onClick={() => setRoute('items')}><span className="ic">📦</span>Items</a>
        <button className="fab" title="New Bill" onClick={() => setRoute('bill')}>+</button>
        <a className={route === 'parties' ? 'on' : ''} onClick={() => setRoute('parties')}><span className="ic">👥</span>Customers</a>
        <a className={route === 'reports' ? 'on' : ''} onClick={() => setRoute('reports')}><span className="ic">📊</span>Reports</a>
      </nav>
      <Toast />
      {print && <InvoicePrint bill={print} onClose={() => setPrintState(null)} />}
      {themeOpen && (
        <div className="print-root" style={{ alignItems: 'center' }} onClick={() => setThemeOpen(false)}>
          <div className="print-wrap" style={{ width: 620 }} onClick={(e) => e.stopPropagation()}>
            <div className="print-bar"><b>Themes — 12 built-in (F10)</b>
              <span className="muted">poora UI + invoice accent ek click mein badlein</span>
              <button className="btn sm" style={{ marginLeft: 'auto' }} onClick={() => setThemeOpen(false)}>Close</button></div>
            <div className="themes">
              {THEMES.map((t) => (
                <button key={t.id} className={`th ${(s.prefs.theme || 'emerald') === t.id ? 'on' : ''}`} onClick={() => setTheme(t.id)}>
                  <div className="prev" style={{ background: t.vars['--sb-900'] }}>
                    <i style={{ background: t.vars['--sb-card'] }} />
                    <em style={{ background: t.vars['--accent'] }}>₹1,234</em>
                    <i style={{ background: t.vars['--canvas'] }} />
                  </div>
                  <span>{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Toast() {
  const t = useToast()
  return t ? <div className="toast"><span>✓</span>{t.msg}</div> : null
}
