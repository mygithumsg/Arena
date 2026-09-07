import React, { useState } from 'react'
import { useApp, fmtINR, toast, setPrint, adopt } from '../App.jsx'
import { editBill } from '../lib/store.mjs'
import { fromP, toP } from '../lib/calc.mjs'

// REQ-10 — Modify / Edit posted bill: recompute tax, revision++, stock + udhaar adjust.
export default function BillEdit({ bill, onClose }) {
  const s = useApp()
  const [lines, setLines] = useState(bill.lines.map((l) => ({ ...l, qty: Number(l.qty), rateR: fromP(l.rate) })))
  const [paid, setPaid] = useState(fromP(bill.paid))
  const [disc, setDisc] = useState(0)
  const save = () => {
    const r = editBill(s, bill.id, {
      lines: lines.map((l, i) => ({ itemId: l.itemId, qty: l.qty, rate: toP(l.rateR), discPct: Number(l.discPct) || 0, taxPct: l.taxPct, itemName: l.itemName, hsn: l.hsn })),
      billDiscPct: Number(disc) || 0,
      paid: toP(paid)
    })
    adopt(r.state)
    toast(`Bill ${bill.no} revised (rev ${r.bill.revision}) — tax recompute ho gaya`)
    onClose()
  }
  return (
    <div className="print-root" style={{ alignItems: 'center' }} onClick={onClose}>
      <div className="print-wrap editmodal" onClick={(e) => e.stopPropagation()}>
        <div className="print-bar"><b>✎ Modify — {bill.no}</b>
          <span className="muted">rate snapshot editable hai; purana rate hi print pe chhapa raha tha (REQ-11)</span>
          <button className="btn sm" style={{ marginLeft: 'auto' }} onClick={onClose}>×</button></div>
        <div style={{ padding: 14, maxHeight: '70vh', overflow: 'auto' }}>
          <table>
            <thead><tr><th>Item</th><th className="num">Qty</th><th className="num">Rate ₹</th><th className="num">Taxable</th><th className="num">Tax</th></tr></thead>
            <tbody>{lines.map((l, i) => {
              const t = (l.finalTaxable || 0) / 100, tx = (l.tax || 0) / 100
              return (
                <tr key={i}>
                  <td>{l.itemName || l.itemId}<div className="muted">HSN {l.hsn} · {l.taxPct}%</div></td>
                  <td><input className="inp num-i" style={{ height: 28, width: 64 }} type="number" step="0.001" value={l.qty}
                    onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, qty: e.target.value } : x)))} /></td>
                  <td><input className="inp num-i" style={{ height: 28, width: 84 }} type="number" step="0.01" value={l.rateR}
                    onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, rateR: e.target.value } : x)))} /></td>
                  <td className="num muted">{t.toFixed(2)}</td>
                  <td className="num muted">{tx.toFixed(2)}</td>
                </tr>
              )
            })}</tbody>
          </table>
          <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'flex-end' }}>
            <div className="field" style={{ width: 130 }}><label>Extra bill disc %</label>
              <input className="inp num-i" type="number" value={disc} onChange={(e) => setDisc(e.target.value)} /></div>
            <div className="field" style={{ width: 150 }}><label>Paid ₹</label>
              <input className="inp num-i" type="number" step="0.01" value={paid} onChange={(e) => setPaid(e.target.value)} /></div>
            <div className="muted" style={{ flex: 1 }}>Grand naya: <b style={{ fontFamily: 'var(--font-num)' }}>recompute on save</b></div>
            <button className="btn pri" onClick={save}>Save revision</button>
            <button className="btn" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}
