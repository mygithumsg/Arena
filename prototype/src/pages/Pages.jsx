import React, { useMemo, useState } from 'react'
import { useApp, setState, fmtINR, toast, setPrint, adopt } from '../App.jsx'
import { fromP, toP } from '../lib/calc.mjs'
import { recordPayment } from '../lib/store.mjs'

const T = (v) => Number(v) || 0
const toCSV = (rows) => rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n')
const download = (name, text) => {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }))
  a.download = name; a.click(); URL.revokeObjectURL(a.href)
}

// ---------------- ITEMS (REQ-3/8: dual Wholesale + Retail rates) ----------------
export function Items() {
  const s = useApp()
  const [q, setQ] = useState('')
  const rows = s.items.filter((i) => (i.name + i.sku + i.hsn).toLowerCase().includes(q.toLowerCase()))
  const upd = (id, patch) => setState({ ...s, items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })
  return (
    <>
      <div className="phead"><div><h1>Items &amp; Stock</h1>
        <p>Retail + Wholesale rate — dono har item par (REQ-8) · inline edit · click row to open full editor</p></div>
        <div className="act">
          <button className="btn" onClick={() => download('items.csv', toCSV([['SKU', 'Name', 'Unit', 'HSN', 'GST%', 'Retail', 'Wholesale', 'MRP', 'Stock', 'Min'],
            ...s.items.map((i) => [i.sku, i.name, i.unit, i.hsn, i.taxPct, fromP(i.retail ?? i.rate), fromP(i.wholesale ?? i.rate), fromP(i.mrp), i.stock, i.min])]))}>Export CSV</button>
          <button className="btn pri" onClick={() => {
            setState({ ...s, items: [...s.items, { id: 'ITM' + (s.items.length + 1).toString().padStart(2, '0'), sku: 'NEW01', name: 'New item', unit: 'PCS', hsn: '0000', taxPct: 5, rate: 10000, retail: 10000, wholesale: 9500, mrp: 0, stock: 0, min: 0 }] })
            toast('Item added — rates set karo')
          }}>+ New Item</button>
        </div>
      </div>
      <div className="card" style={{ padding: '18px 8px 8px' }}>
        <div style={{ padding: '0 12px 12px' }}><input className="inp" style={{ maxWidth: 340 }} placeholder="Search items…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <table className="cardtable">
          <thead><tr><th>SKU</th><th>Item</th><th>HSN / GST</th><th className="num">Retail ₹</th><th className="num">Wholesale ₹</th>
            <th className="num">MRP</th><th className="num">Stock</th><th className="num">Min</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i.id}>
                <td data-l="SKU" className="num">{i.sku}</td>
                <td data-l="Item"><b>{i.name}</b><div className="muted">unit {i.unit}{i.service ? ' · service' : ''}</div></td>
                <td data-l="HSN · GST" className="num">{i.hsn} · {i.taxPct}%</td>
                <td data-l="Retail ₹" className="num"><input className="inp num-i" style={{ height: 32, width: 96 }} title="Retail rate"
                  value={fromP(i.retail ?? i.rate)} onChange={(e) => upd(i.id, { retail: toP(e.target.value), rate: toP(e.target.value) })} /></td>
                <td data-l="Wholesale ₹" className="num"><input className="inp num-i" style={{ height: 32, width: 96 }} title="Wholesale rate"
                  value={fromP(i.wholesale ?? i.rate)} onChange={(e) => upd(i.id, { wholesale: toP(e.target.value) })} /></td>
                <td data-l="MRP" className="num">{i.mrp ? fmtINR(i.mrp) : '—'}</td>
                <td data-l="Stock" className="num"><b>{i.stock}</b></td>
                <td data-l="Min" className="num">{i.min}</td>
                <td data-l="Status">{i.service ? <span className="pill off">Service</span> : i.stock <= 0 ? <span className="pill due">Out</span> : i.stock < i.min ? <span className="pill due">Low</span> : <span className="pill ok">OK</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted" style={{ padding: '8px 12px 6px' }}>ℹ Rate yahan badalne se <b>purane bills nahi badalte</b> — invoice apna snapshot rate carry karta hai (REQ-11). Naye bills par naya rate lagega.</p>
      </div>
    </>
  )
}

// ---------------- PARTIES (REQ-9: customer-wise rates · REQ-5: receipts) ----------------
export function Parties() {
  const s = useApp()
  const [q, setQ] = useState('')
  const [rates, setRates] = useState(null)
  const [pay, setPay] = useState(null)
  const [ledger, setLedger] = useState(null)
  const rows = s.parties.filter((p) => (p.name + p.gstin + p.phone).toLowerCase().includes(q.toLowerCase()))
  const payments = s.payments || []
  return (
    <>
      <div className="phead"><div><h1>Customers &amp; Suppliers</h1>
        <p>Custom rate-book per customer (REQ-9) · Payment In → alag receipt record (REQ-5)</p></div>
        <div className="act"><button className="btn pri" onClick={() => {
          setState({ ...s, parties: [...s.parties, { id: 'P' + Date.now(), kind: 'customer', name: 'New Customer', gstin: '', stateCode: '22', creditLimit: 0, balance: 0, phone: '', priceMode: 'retail', customRates: {} }] })
          toast('Party created')
        }}>+ New Party</button></div>
      </div>
      <div className="card" style={{ padding: '18px 8px 8px' }}>
        <div style={{ padding: '0 12px 12px', display: 'flex', gap: 10 }}>
          <input className="inp" style={{ maxWidth: 320 }} placeholder="Search name / GSTIN / phone…" value={q} onChange={(e) => setQ(e.target.value)} />
          <span className="muted" style={{ alignSelf: 'center' }}>Total udhaar = <b style={{ color: 'var(--danger-500)' }}>{fmtINR(Math.max(0, s.parties.reduce((a, p) => a + p.balance, 0)))}</b> · Receipts issued: <b>{payments.length}</b></span>
        </div>
        <table className="cardtable">
          <thead><tr><th>Party</th><th>GSTIN</th><th>State</th><th>Kind</th><th>Price list</th>
            <th className="num">Credit limit</th><th className="num">Balance (Dr)</th><th>Status</th><th /></tr></thead>
          <tbody>{rows.map((p) => (
            <tr key={p.id}>
              <td data-l="Party"><div className="mini"><b>{p.name}</b><small>{p.phone || '—'}</small></div></td>
              <td data-l="GSTIN" className="num">{p.gstin || <span className="muted">Unregistered</span>}</td>
              <td data-l="State">{p.stateCode}</td><td data-l="Kind" className="muted">{p.kind}</td>
              <td data-l="Price list">{p.priceMode === 'wholesale' ? '📦 Wholesale' : '🏷 Retail'} <span className="muted">{Object.keys(p.customRates || {}).length ? `· ${Object.keys(p.customRates).length} custom ⚡` : ''}</span></td>
              <td data-l="Credit limit" className="num">{p.creditLimit ? fmtINR(p.creditLimit) : '—'}</td>
              <td data-l="Balance (Dr)" className="num"><b style={{ color: p.balance > 0 ? 'var(--danger-500)' : 'var(--brand-700)' }}>{fmtINR(p.balance)}</b></td>
              <td data-l="Status">{p.creditLimit && p.balance > p.creditLimit ? <span className="pill due">Over limit</span> : p.balance > 0 ? <span className="pill part">Udhaar</span> : <span className="pill ok">Clear</span>}</td>
              <td data-l="" style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button className="btn sm" onClick={() => setLedger(p)}>Khata</button>{' '}
                <button className="btn sm" onClick={() => setRates(p)}>Custom rates</button>{' '}
                <button className="btn sm pri" onClick={() => setPay(p)}>₹ Payment</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: 16, padding: '18px 8px 8px' }}>
        <div className="cardhead" style={{ padding: '0 12px' }}><div><h3>Payment Records (Receipts)</h3>
          <p className="sub">Har bhugtan ka alag record — print / WhatsApp / PDF ready (REQ-5)</p></div></div>
        {payments.length ? (
          <table>
            <thead><tr><th>Receipt #</th><th>Date</th><th>Party</th><th className="num">Amount</th><th>Mode</th><th>Against bill</th><th /></tr></thead>
            <tbody>{[...payments].reverse().map((r) => (
              <tr key={r.id}>
                <td className="num"><b>{r.no}</b></td><td className="muted">{r.date}</td>
                <td>{s.parties.find((p) => p.id === r.partyId)?.name}</td>
                <td className="num"><b style={{ color: 'var(--brand-700)' }}>{fmtINR(r.amount)}</b></td>
                <td>{r.mode}</td>
                <td className="muted">{s.bills.find((b) => b.id === r.forBillId)?.no || r.note || '—'}</td>
                <td><button className="eye" onClick={() => setPrint({ receipt: true, ...r })}>👁</button></td>
              </tr>
            ))}</tbody>
          </table>
        ) : <p className="muted" style={{ padding: 12 }}>Abhi koi receipt nahi. Customer ke saamne "₹ Payment" dabao — yahan alag record dikhega.</p>}
      </div>

      {rates && <PartyRates party={rates} onClose={() => setRates(null)} />}
      {pay && <PayModal party={pay} onClose={() => setPay(null)} />}
      {ledger && <Ledger party={ledger} onClose={() => setLedger(null)} />}
    </>
  )
}
function PartyRates({ party, onClose }) {
  const s = useApp()
  const [draft, setDraft] = useState({ ...(party.customRates || {}) })
  const saveIt = () => {
    setState({ ...s, parties: s.parties.map((x) => (x.id === party.id ? { ...x, customRates: draft } : x)) })
    toast('Custom rates saved — in bills pehle lagenge, purane bills nahi badlenge')
    onClose()
  }
  return (
    <div className="print-root" onClick={onClose}>
      <div className="print-wrap" style={{ width: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="print-bar"><b>{party.name} — custom rate-book (REQ-9)</b>
          <button className="btn sm" style={{ marginLeft: 'auto' }} onClick={onClose}>×</button></div>
        <div style={{ padding: 14, maxHeight: '70vh', overflow: 'auto' }}>
          <p className="muted" style={{ marginTop: 0 }}>Custom rate → Retail/Wholesale toggle se upar priority. Khaali = default list.</p>
          <table><thead><tr><th>Item</th><th className="num">Retail</th><th className="num">Wholesale</th><th className="num">Custom ₹</th></tr></thead>
            <tbody>{s.items.map((i) => (
              <tr key={i.id}><td>{i.name}</td>
                <td className="num muted">{fromP(i.retail ?? i.rate).toFixed(2)}</td>
                <td className="num muted">{fromP(i.wholesale ?? i.rate).toFixed(2)}</td>
                <td><input className="inp num-i" style={{ height: 28, width: 88 }} placeholder={fromP(i.retail ?? i.rate).toFixed(2)}
                  value={draft[i.id] != null ? fromP(draft[i.id]) : ''}
                  onChange={(e) => { const v = e.target.value; setDraft((d) => { const n = { ...d }; if (v === '') delete n[i.id]; else n[i.id] = toP(v); return n }) }} /></td>
              </tr>))}</tbody></table>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Cancel</button>
            <button className="btn pri" style={{ flex: 1, justifyContent: 'center' }} onClick={saveIt}>Save rate-book</button>
          </div>
        </div>
      </div>
    </div>
  )
}
function PayModal({ party, onClose }) {
  const s = useApp()
  const due = Math.max(0, party.balance)
  const [amt, setAmt] = useState(fromP(due) || '')
  const [pm, setPm] = useState('Cash')
  const [billId, setBillId] = useState('')
  const doPay = () => {
    const r = recordPayment(s, { partyId: party.id, amount: toP(amt), mode: pm, forBillId: billId || null, note: 'Payment received' })
    adopt(r.state)
    toast(`Receipt ${r.receipt.no} ban gayi — alag record mil gaya`)
    setPrint({ receipt: true, ...r.receipt })
    onClose()
  }
  const bills = s.bills.filter((b) => b.partyId === party.id && b.grand - b.paid > 0)
  return (
    <div className="print-root" style={{ alignItems: 'center' }} onClick={onClose}>
      <div className="print-wrap" style={{ width: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="print-bar"><b>₹ Payment — {party.name}</b><button className="btn sm" style={{ marginLeft: 'auto' }} onClick={onClose}>×</button></div>
        <div style={{ padding: 14, display: 'grid', gap: 10 }}>
          <div className="muted">Udhaar: <b style={{ color: 'var(--danger-500)' }}>{fmtINR(due)}</b> · save karte hi <b>alag receipt record</b> + print khulega</div>
          <div className="field"><label>Amount ₹</label><input className="inp num-i" value={amt} onChange={(e) => setAmt(e.target.value)} autoFocus /></div>
          <div className="field"><label>Kis bill ke against (optional)</label>
            <select className="inp" value={billId} onChange={(e) => { setBillId(e.target.value); const b = bills.find((x) => x.id === e.target.value); if (b) setAmt(fromP(b.grand - b.paid)) }}>
              <option value="">— koi bhi / advance —</option>
              {bills.map((b) => <option key={b.id} value={b.id}>{b.no} · bal {fmtINR(b.grand - b.paid)}</option>)}
            </select></div>
          <div className="field"><label>Mode</label>
            <div style={{ display: 'flex', gap: 6 }}>{['Cash', 'UPI', 'Card', 'Cheque'].map((m) => <button key={m} className={`chipbtn ${pm === m ? 'on' : ''}`} onClick={() => setPm(m)}>{m}</button>)}</div></div>
          <button className="btn pri" style={{ justifyContent: 'center' }} onClick={doPay}>Save + Receipt print kholein</button>
        </div>
      </div>
    </div>
  )
}
function Ledger({ party, onClose }) {
  const s = useApp()
  const bills = s.bills.filter((b) => b.partyId === party.id)
  const pays = (s.payments || []).filter((r) => r.partyId === party.id)
  const entries = [...bills.map((b) => ({ d: b.date, t: 'Bill', ref: b.no, dr: b.grand, cr: 0, bal: 0, b })),
    ...pays.map((r) => ({ d: r.date, t: 'Payment', ref: r.no, dr: 0, cr: r.amount, bal: 0, r }))]
    .sort((a, b) => a.d.localeCompare(b.d))
  let run = 0
  entries.forEach((e) => { run += e.dr - e.cr; e.bal = run })
  const wa = `https://wa.me/${(party.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Namaste ${party.name} 🙏\n${s.company.legal} se khata update:\nBaki: ${fmtINR(party.balance)}\nKripya bhugtan karein. Dhanyavaad!`)}`
  return (
    <div className="print-root" onClick={onClose}>
      <div className="print-wrap" style={{ width: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="print-bar"><b>Khata — {party.name}</b>
          <span className="recvd">Balance Dr {fmtINR(party.balance)}</span>
          <button className="btn sm" style={{ marginLeft: 'auto' }} onClick={() => window.open(wa, '_blank')}>💬 WhatsApp reminder</button>
          <button className="btn sm" style={{ marginLeft: 6 }} onClick={onClose}>×</button></div>
        <div style={{ padding: 12, maxHeight: '68vh', overflow: 'auto' }}>
          <table><thead><tr><th>Date</th><th>Type</th><th>Ref</th><th className="num">Debit</th><th className="num">Credit</th><th className="num">Running</th></tr></thead>
            <tbody>{entries.slice().reverse().map((e, i) => (
              <tr key={i}>
                <td className="muted">{e.d}</td><td>{e.t === 'Bill' ? '🧾 Bill' : '💰 Payment'}</td>
                <td className="num" style={{ fontSize: 11.5 }}>{e.ref}</td>
                <td className="num">{e.dr ? fmtINR(e.dr) : '—'}</td>
                <td className="num">{e.cr ? fmtINR(e.cr) : '—'}</td>
                <td className="num"><b>{fmtINR(e.bal)}</b></td>
              </tr>))}</tbody></table>
        </div>
      </div>
    </div>
  )
}

// ---------------- REPORTS (REQ-5: cash/credit/payment alag) ----------------
export function Reports({ tab = 'sales' }) {
  const s = useApp()
  const [from, setFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 6); return d.toISOString().slice(0, 10) })
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10))
  const [view, setView] = useState(tab === 'payments' ? 'receipts' : 'daywise')
  const bills = useMemo(() => s.bills.filter((b) => b.date >= from && b.date <= to), [s.bills, from, to])
  const pays = useMemo(() => (s.payments || []).filter((r) => r.date >= from && r.date <= to), [s.payments, from, to])

  const daywise = useMemo(() => {
    const m = new Map()
    for (const b of bills) {
      const r = m.get(b.date) || { date: b.date, count: 0, gross: 0, disc: 0, tax: 0, credit: 0, collected: 0, cash: 0, upi: 0 }
      r.count++; r.gross += b.grand; r.disc += b.discTotal; r.tax += b.totalTax; r.credit += b.grand - b.paid; r.collected += b.paid
      if (b.mode === 'Cash') r.cash += b.paid; if (b.mode === 'UPI') r.upi += b.paid
      m.set(b.date, r)
    }
    return [...m.values()].sort((a, b) => b.date.localeCompare(a.date))
  }, [bills])
  const itemwise = useMemo(() => {
    const m = new Map()
    for (const b of bills) for (const l of b.lines) {
      const it = s.items.find((x) => x.id === l.itemId); if (!it) continue
      const r = m.get(it.id) || { name: l.itemName || it.name, hsn: it.hsn, qty: 0, gross: 0, disc: 0, taxable: 0, tax: 0, net: 0 }
      r.qty += Number(l.qty) || 0; r.gross += l.gross; r.disc += l.discAmt + (l.billDiscShare || 0)
      r.taxable += l.finalTaxable; r.tax += l.tax; r.net += l.amount
      m.set(it.id, r)
    }
    return [...m.values()].sort((a, b) => b.net - a.net)
  }, [bills, s.items])
  const gst = useMemo(() => {
    const m = new Map()
    for (const b of bills) for (const sl of b.slabs) {
      const k = String(sl.rate)
      const r = m.get(k) || { rate: sl.rate, taxable: 0, cgst: 0, sgst: 0, igst: 0, docs: 0 }
      r.taxable += sl.taxable; r.docs++
      if (b.interState) r.igst += sl.tax; else { r.cgst += Math.round(sl.tax / 2); r.sgst += sl.tax - Math.round(sl.tax / 2) }
      m.set(k, r)
    }
    return [...m.values()].sort((a, b) => b.rate - a.rate)
  }, [bills])
  const partywise = s.parties.filter((p) => p.balance !== 0)
  const tot = (arr, k) => arr.reduce((a, r) => a + r[k], 0)

  const exportX = () => {
    if (view === 'daywise') download(`daywise_${from}_${to}.csv`, toCSV([['Date', 'Bills', 'Gross', 'Discount', 'Tax', 'Collected', 'Cash', 'UPI', 'On credit'], ...daywise.map((r) => [r.date, r.count, fromP(r.gross), fromP(r.disc), fromP(r.tax), fromP(r.collected), fromP(r.cash), fromP(r.upi), fromP(r.credit)])]))
    if (view === 'itemwise') download('itemwise.csv', toCSV([['Item', 'HSN', 'Qty', 'Gross', 'Disc', 'Taxable', 'Tax', 'Net'], ...itemwise.map((r) => [r.name, r.hsn, r.qty, fromP(r.gross), fromP(r.disc), fromP(r.taxable), fromP(r.tax), fromP(r.net)])]))
    if (view === 'gst') download('gst_summary.csv', toCSV([['Rate', 'Taxable', 'CGST', 'SGST', 'IGST', 'Docs'], ...gst.map((r) => [r.rate, fromP(r.taxable), fromP(r.cgst), fromP(r.sgst), fromP(r.igst), r.docs])]))
    if (view === 'collections') download('collections.csv', toCSV([['Receipt', 'Party', 'Date', 'Amount', 'Mode', 'Against'], ...pays.map((r) => [r.no, s.parties.find((p) => p.id === r.partyId)?.name, r.date, fromP(r.amount), r.mode, s.bills.find((b) => b.id === r.forBillId)?.no || r.note])]))
    if (view === 'outstanding') download('outstanding.csv', toCSV([['Party', 'GSTIN', 'State', 'Balance', 'Limit'], ...partywise.map((p) => [p.name, p.gstin, p.stateCode, fromP(p.balance), fromP(p.creditLimit)])]))
    toast('CSV downloaded (Excel-ready)')
  }
  const tabs = [['daywise', 'Daywise Sales'], ['itemwise', 'Itemwise Sales'], ['gst', 'GST / Tax Summary'], ['outstanding', 'Outstanding (Udhaar)'], ['receipts', 'Payment Receipts'], ['collections', 'Bills Register']]
  return (
    <>
      <div className="phead"><div><h1>Reports</h1><p>Har number drill karke bill/receipt tak · range badlo toh sab saath recalc</p></div>
        <div className="act" style={{ alignItems: 'center' }}>
          <input className="inp" type="date" style={{ width: 150 }} value={from} onChange={(e) => setFrom(e.target.value)} />
          <span className="muted">→</span>
          <input className="inp" type="date" style={{ width: 150 }} value={to} onChange={(e) => setTo(e.target.value)} />
          <button className="btn" onClick={exportX}>Export CSV</button>
        </div>
      </div>
      <div className="card" style={{ padding: 12, marginBottom: 14, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {tabs.map(([k, l]) => <button key={k} className={`chipbtn ${view === k ? 'on' : ''}`} onClick={() => setView(k)}>{l}</button>)}
        <span className="muted" style={{ marginLeft: 'auto', alignSelf: 'center' }}>{bills.length} bills · {pays.length} receipts in range</span>
      </div>

      {view === 'daywise' && <Table cols={['Date', 'Bills', 'Gross (incl. GST)', 'Discount', 'Tax', 'Collected', 'Cash', 'UPI', 'On credit']}
        rows={daywise.map((r) => [new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), r.count, fmtINR(r.gross), fmtINR(r.disc), fmtINR(r.tax), fmtINR(r.collected), fmtINR(r.cash), fmtINR(r.upi), fmtINR(r.credit)])}
        nums={[1, 2, 3, 4, 5, 6, 7, 8]}
        foot={['TOTAL', bills.length, fmtINR(tot(daywise, 'gross')), fmtINR(tot(daywise, 'disc')), fmtINR(tot(daywise, 'tax')), fmtINR(tot(daywise, 'collected')), fmtINR(tot(daywise, 'cash')), fmtINR(tot(daywise, 'upi')), fmtINR(tot(daywise, 'credit'))]} />}

      {view === 'itemwise' && <Table cols={['Item', 'HSN', 'Qty', 'Gross', 'Discount', 'Taxable', 'Tax', 'Net']}
        rows={itemwise.map((r) => [r.name, r.hsn, r.qty, fmtINR(r.gross), fmtINR(r.disc), fmtINR(r.taxable), fmtINR(r.tax), fmtINR(r.net)])}
        nums={[2, 3, 4, 5, 6, 7]}
        foot={['TOTAL', '', '', fmtINR(tot(itemwise, 'gross')), fmtINR(tot(itemwise, 'disc')), fmtINR(tot(itemwise, 'taxable')), fmtINR(tot(itemwise, 'tax')), fmtINR(tot(itemwise, 'net'))]} />}

      {view === 'gst' && <>
        <Table cols={['Slab', 'Taxable value', 'CGST', 'SGST', 'IGST', 'Docs']}
          rows={gst.map((r) => [r.rate + '%', fmtINR(r.taxable), fmtINR(r.cgst), fmtINR(r.sgst), fmtINR(r.igst), r.docs])}
          nums={[1, 2, 3, 4, 5]}
          foot={['TOTAL', fmtINR(tot(gst, 'taxable')), fmtINR(tot(gst, 'cgst')), fmtINR(tot(gst, 'sgst')), fmtINR(tot(gst, 'igst')), bills.length]} />
        <div className="warn-strip" style={{ marginTop: 12 }}>ℹ GSTR-1 JSON export + portal validation Phase P3 — slab rules already engine mein hain.</div>
      </>}

      {view === 'outstanding' && <Table cols={['Party', 'GSTIN', 'State', 'Balance (Dr)', 'Credit limit', 'Utilisation']}
        rows={partywise.map((p) => [p.name, p.gstin || 'Unregistered', p.stateCode, fmtINR(p.balance), p.creditLimit ? fmtINR(p.creditLimit) : '—',
          p.creditLimit ? Math.round((p.balance / p.creditLimit) * 100) + '%' : '—'])}
        nums={[3, 4, 5]} foot={['TOTAL', '', '', fmtINR(partywise.reduce((a, p) => a + p.balance, 0)), '', '']} />}

      {view === 'receipts' && <Table cols={['Receipt #', 'Date', 'Party', 'Amount', 'Mode', 'Against bill', 'Note']}
        rows={pays.slice().reverse().map((r) => [r.no, r.date, s.parties.find((p) => p.id === r.partyId)?.name || '—', fmtINR(r.amount), r.mode, s.bills.find((b) => b.id === r.forBillId)?.no || '—', r.note || ''])}
        nums={[3]}
        foot={['TOTAL RECEIVED', '', '', fmtINR(tot(pays, 'amount')), '', '', '']} />}

      {view === 'collections' && <Table cols={['Invoice', 'Party', 'Date', 'Total', 'Paid', 'Balance', 'Mode']}
        rows={bills.map((b) => [b.no, s.parties.find((p) => p.id === b.partyId)?.name || '—', b.date, fmtINR(b.grand), fmtINR(b.paid), fmtINR(b.grand - b.paid), b.mode])}
        nums={[3, 4, 5]} foot={['TOTAL', '', '', fmtINR(tot(bills.map((b) => ({ g: b.grand, p: b.paid })), 'g')), fmtINR(bills.reduce((a, b) => a + b.paid, 0)), '', '']} />}
    </>
  )
}
function Table({ cols, rows, nums = [], foot }) {
  return (
    <div className="card" style={{ padding: '18px 8px 8px' }}>
      <table className="cardtable">
        <thead><tr>{cols.map((c, i) => <th key={c} className={nums.includes(i) ? 'num' : ''}>{c}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} data-l={cols[j]} className={nums.includes(j) ? 'num' : ''}>{c}</td>)}</tr>)}</tbody>
        {foot && <tfoot><tr>{foot.map((c, j) => <td key={j} data-l={c === 'TOTAL' ? '' : cols[j]} className={`${nums.includes(j) ? 'num' : ''}`} style={{ borderTop: '2px solid var(--ink-900)', fontWeight: 800, fontFamily: 'var(--font-num)' }}>{c}</td>)}</tr></tfoot>}
      </table>
      {!rows.length && <p className="muted" style={{ padding: 14 }}>Is range mein koi data nahi. Bill banao ya date range badlo.</p>}
    </div>
  )
}
