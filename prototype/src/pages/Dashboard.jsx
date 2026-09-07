import React, { useState } from 'react'
import { useApp, setState, fmtINR, I } from '../App.jsx'
import { daySummary, last7Days, lowStock } from '../lib/store.mjs'
import { toP } from '../lib/calc.mjs'
import InvoicePrint from '../components/InvoicePrint.jsx'

export default function Dashboard({ go }) {
  const s = useApp()
  const [range, setRange] = useState(7)
  const today = new Date().toISOString().slice(0, 10)
  const t = daySummary(s, today)
  const due = s.parties.reduce((a, p) => a + Math.max(0, p.balance), 0)
  const mtd = s.bills.filter((b) => b.date.startsWith(today.slice(0, 7))).reduce((a, b) => a + b.grand, 0)
  const stockValue = s.items.reduce((a, i) => a + i.stock * i.rate, 0)
  const days = last7Days(s).slice(-range === 7 ? 7 : 7)
  const max = Math.max(1, ...days.map((d) => d.total))
  const total7 = days.reduce((a, d) => a + d.total, 0)
  const low = lowStock(s)
  const [view, setView] = useState(null)
  const lang = s.prefs.language

  const K = (label, value, chip, icon, foot, badge) => (
    <div className="card stat">
      <div className="top-row">
        <div className={`chip ${chip}`}>{icon}</div>
        <div style={{ flex: 1 }}><div className="lbl">{label}</div></div>
        {badge}
      </div>
      <div className="num">{value}</div>
      <div className="foot">{foot}</div>
    </div>
  )

  return (
    <>
      <div className="phead">
        <div>
          <h1>{lang === 'hi' ? `नमस्ते, Umesh!` : `Hello, Umesh!`}</h1>
          <p>{lang === 'hi' ? 'आज के कारोबार का पूरा हाल' : "See a complete snapshot of today's business."}</p>
        </div>
        <div className="act">
          <button className="btn" onClick={() => go('payments')}>{I.rupee} {lang === 'hi' ? 'Payment जोड़ें' : 'Record Payment'}</button>
          <button className="btn pri" onClick={() => go('bill')}>{I.plus} {lang === 'hi' ? 'नया Bill' : 'New Bill'} <span className="kbd">F2</span></button>
        </div>
      </div>

      <div className="g4">
        {K(lang === 'hi' ? 'आज की बिक्री' : "Today's Sales", fmtINR(toP(t.gross / 100)), 'g', '🧾',
          `${t.count} bills created today`, <span className="trend up">↗ +12.5%</span>)}
        {K(lang === 'hi' ? 'कुल उधार' : 'Total Due', fmtINR(due), 'a', '◎',
          `Outstanding from ${s.parties.filter((p) => p.balance > 0).length} customers`, <a className="link" href="#r" onClick={(e) => { e.preventDefault(); go('parties') }}>⌄ View</a>)}
        {K(lang === 'hi' ? 'इस महीने की बिक्री' : "This Month's Sale", fmtINR(mtd), 'v', '📈',
          'Better than last month', <span className="trend up">↗ +8.2%</span>)}
        {K(lang === 'hi' ? 'आज की वसूली' : "Today's Collection", fmtINR(toP(t.collected / 100)), 'b', '📥',
          `Stock value ${fmtINR(stockValue)}`, <span className="trend live">↗ Live</span>)}
      </div>

      <div className="g-main">
        <div className="card">
          <div className="cardhead">
            <div><h3>{lang === 'hi' ? 'बिक्री का हाल' : 'Sales Performance'}</h3>
              <p className="sub">{lang === 'hi' ? 'पिछले 7 दिन की सकल बिक्री' : 'Gross sales over the last 7 days'}</p></div>
            <div style={{ textAlign: 'right' }}>
              <div className="sub">7-day sales</div>
              <div style={{ fontFamily: 'var(--font-num)', fontWeight: 700 }}>{fmtINR(total7)}</div>
            </div>
          </div>
          <div className="chart">
            {days.map((d, i) => (
              <div key={d.key} className={`bar ${i >= days.length - 2 ? 'hot' : ''}`}>
                <em>{fmtINR(d.total).replace('.00', '')}</em>
                <i style={{ height: `${Math.max(2, (d.total / max) * 100)}%` }} />
                <span>{d.label}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, color: 'var(--ink-500)', fontSize: 11.5 }}>
            <span>● Total Sales</span><span>↗ Steady growth this week</span>
          </div>
        </div>

        <div className="card">
          <div className="cardhead"><div><h3>{lang === 'hi' ? 'रोज़ के काम' : 'Quick Actions'}</h3>
            <p className="sub">Your essential daily tasks</p></div><span className="chip v">⚡</span></div>
          <div className="qa">
            {[
              ['🧾', lang === 'hi' ? 'नया Bill बनाएँ' : 'Create New Bill', 'Retail or wholesale invoice', 'bill'],
              ['₹', lang === 'hi' ? 'Payment जोड़ें' : 'Record Payment', 'Cash, UPI or bank entry', 'payments'],
              ['👥', lang === 'hi' ? 'ग्राहक देखें' : 'View Customers', 'Ledgers and custom rates', 'parties'],
              ['📊', lang === 'hi' ? 'रिपोर्ट देखें' : 'View Reports', 'Sales and payment analytics', 'reports']
            ].map(([ic, b, sm, to]) => (
              <button key={b} onClick={() => go(to)}>
                <span className="chip b" style={{ width: 34, height: 34, fontSize: 14 }}>{ic}</span>
                <span><b>{b}</b><small>{sm}</small></span><span className="arw">›</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="g-main2">
        <div className="card" style={{ padding: '18px 8px 8px' }}>
          <div className="cardhead" style={{ padding: '0 12px' }}>
            <div><h3>Recent Bills</h3><p className="sub">Invoices from today and recent days</p></div>
            <a className="link" href="#r" onClick={(e) => { e.preventDefault(); go('bill') }}>View all ↗</a>
          </div>
          <table className="cardtable">
            <thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th className="num">Amount</th><th>Status</th><th /></tr></thead>
            <tbody>
              {s.bills.slice(0, 6).map((b) => {
                const pt = s.parties.find((x) => x.id === b.partyId)
                const bal = b.grand - b.paid
                return (
                  <tr key={b.id}>
                    <td data-l="Invoice"><b style={{ fontFamily: 'var(--font-num)', fontSize: 12.5 }}>{b.no}</b></td>
                    <td data-l="Customer"><div className="mini"><b>{pt?.name}</b><small>{pt?.phone}</small></div></td>
                    <td data-l="Date" className="muted">{new Date(b.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td data-l="Amount" className="num"><b>{fmtINR(b.grand)}</b></td>
                    <td data-l="Status">{bal <= 0 ? <span className="pill ok">● Paid</span> : b.paid > 0 ? <span className="pill part">● Partial</span> : <span className="pill due">● Due</span>}</td>
                    <td data-l="" style={{ justifyContent: 'flex-end' }}><button className="eye" title="Print / share" onClick={() => setView(b)}>{I.eye}</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="cardhead"><div><h3>Low Stock</h3><p className="sub">Replenishment needed soon</p></div>
            <span className="badge trend count">{low.length}</span></div>
          {low.map((i) => (
            <div className="alertrow" key={i.id}>
              <span className="chip a" style={{ width: 34, height: 34, fontSize: 15 }}>📦</span>
              <div className="mini"><b>{i.name}</b><small>{i.sku} · Min. {i.min}</small></div>
              <span className="num-badge">{i.stock}</span>
              <span className="unit">{i.unit}</span>
            </div>
          ))}
          {!low.length && <p className="muted">All good — nothing below reorder level.</p>}
        </div>
      </div>
      {view && <InvoicePrint bill={view} onClose={() => setView(null)} />}
    </>
  )
}
