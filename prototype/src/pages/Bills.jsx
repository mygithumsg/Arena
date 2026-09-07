import React, { useState } from 'react'
import { useApp, fmtINR } from '../App.jsx'
import InvoicePrint from '../components/InvoicePrint.jsx'

export default function Bills() {
  const s = useApp()
  const [v, setV] = useState(null)
  return (
    <>
      <div className="phead"><div><h1>Sales Bills</h1><p>FY {s.prefs.fy} · {s.bills.length} invoices · click 👁 to reprint</p></div></div>
      <div className="card" style={{ padding: '18px 8px 8px' }}>
        <table className="cardtable">
          <thead><tr><th>Invoice</th><th>Party</th><th>Date</th><th className="num">Taxable</th><th className="num">Tax</th>
            <th className="num">Total</th><th className="num">Paid</th><th>Status</th><th /></tr></thead>
          <tbody>{s.bills.map((b) => (
            <tr key={b.id}>
              <td data-l="Invoice" className="num"><b>{b.no}</b></td>
              <td data-l="Party">{s.parties.find((p) => p.id === b.partyId)?.name}</td>
              <td data-l="Date" className="muted">{b.date}</td>
              <td data-l="Taxable" className="num">{fmtINR(b.taxableTotal)}</td>
              <td data-l="Tax" className="num">{fmtINR(b.totalTax)}</td>
              <td data-l="Total" className="num"><b>{fmtINR(b.grand)}</b></td>
              <td data-l="Paid" className="num">{fmtINR(b.paid)}</td>
              <td data-l="Status">{b.grand - b.paid <= 0 ? <span className="pill ok">Paid</span> : b.paid ? <span className="pill part">Partial</span> : <span className="pill due">Due</span>}</td>
              <td><button className="eye" onClick={() => setV(b)}>👁</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {v && <InvoicePrint bill={v} onClose={() => setV(null)} />}
    </>
  )
}
