import React, { useState } from 'react'
import { useApp, fmtINR, toast } from '../App.jsx'
import { inWords } from '../lib/calc.mjs'

// REQ-1/4/7/10: share — WhatsApp / SMS / Call / Email / PDF(print)
function useShareLinks(bill, party) {
  const s = useApp()
  const phone = (party?.phone || '').replace(/\D/g, '')
  const intl = phone.length === 10 ? '91' + phone : phone
  const bal = (bill.grand || 0) - (bill.paid || 0)
  const txt = bill.receipt
    ? `${s.company.legal} (Umesh Seeds)\nReceipt ${bill.no}\nPayment received: ${fmtINR(bill.amount)}\nMode: ${bill.mode} · ${bill.date}\nDhanyavaad! 🙏`
    : `${s.company.legal} (Umesh Seeds)\nBill ${bill.no} · ${bill.date}\nTotal: ${fmtINR(bill.grand)}\n${bal > 0 ? `Balance due: ${fmtINR(bill.grand - bill.paid)}` : 'Fully paid ✓'}\nDhanyavaad! 🙏`
  return {
    wa: intl ? `https://wa.me/${intl}?text=${encodeURIComponent(txt)}` : `https://wa.me/?text=${encodeURIComponent(txt + '\n' + (party?.name || ''))}`,
    sms: intl ? `sms:+${intl}?&body=${encodeURIComponent(txt)}` : null,
    call: intl ? `tel:+${intl}` : null,
    mail: party?.email ? `mailto:${party.email}?subject=${encodeURIComponent('Bill ' + bill.no)}&body=${encodeURIComponent(txt)}` : null,
    txt
  }
}

export default function InvoicePrint({ bill, onClose }) {
  const s = useApp()
  const [paper, setPaper] = useState('a4')
  const party = s.parties.find((p) => p.id === bill.partyId) || { name: '—' }
  const links = useShareLinks(bill, party)
  const item = (id) => s.items.find((i) => i.id === id) || { name: '', hsn: '', unit: '', taxPct: 0 }
  const taxByComp = (k) => (bill.lines || []).reduce((a, l) => a + (l[k] || 0), 0) + (bill.charges || []).reduce((a, c) => a + (c[k] || 0), 0)
  const date = new Date(bill.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const created = bill.createdAt ? new Date(bill.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : date
  const share = (kind) => {
    if (kind === 'copy') { navigator.clipboard?.writeText(links.txt); return toast('Summary copied — WhatsApp par paste karein') }
    const url = links[kind]
    if (!url) return toast('Is party ka phone/email record mein nahi hai')
    window.open(url, '_blank')
  }

  /* ---------- RECEIPT (REQ-5) ---------- */
  if (bill.receipt) {
    const R = (
      <div className="inv a4" style={{ maxWidth: 520, margin: '0 auto' }}>
        <div className="ih"><div className="logo">U₹</div>
          <div><b>UMESH SMARTBILL</b><small>{s.company.legal} · {s.company.addr}<br />GSTIN {s.company.gstin} · {s.company.phone}</small></div>
          <div className="right"><b>PAYMENT RECEIPT</b><br />{bill.no}<br />{date}</div></div>
        <div style={{ fontSize: 13, margin: '18px 0', lineHeight: 1.9 }}>
          Received with thanks <b>{fmtINR(bill.amount)}</b> ({inWords(bill.amount)})<br />
          from <b>{party.name}</b> · Mode: <b>{bill.mode}</b>{bill.forBillId && <> against bill <b>{s.bills.find((b) => b.id === bill.forBillId)?.no}</b></>}<br />
          Party balance after this payment: <b>{fmtINR(Math.max(0, party.balance))} Dr</b>
          {bill.note && <><br />Note: {bill.note}</>}
        </div>
        <div className="foot" style={{ marginTop: 30 }}>
          <div>Keep this receipt for records.<br />Subject to Ambikapur jurisdiction.</div>
          <div className="sign">For {s.company.legal}<br /><br /><i>Authorised Signatory</i></div>
        </div>
        <div className="gen"><span>Computer-generated receipt · {created}</span><span>UMESH SMARTBILL · Umesh Seeds</span></div>
      </div>
    )
    return <Shell paper={paper} setPaper={setPaper} onClose={onClose} share={share} links={links} bill={bill} receipt>{R}</Shell>
  }

  /* ---------- THERMAL 80 / 240 ---------- */
  if (paper === 'th' || paper === 't240') {
    return (
      <Shell paper={paper} setPaper={setPaper} onClose={onClose} share={share} links={links} bill={bill}>
        <div className={`inv th ${paper === 't240' ? 'th240' : ''}`}>
          <h4>UMESH SMARTBILL · Umesh Seeds</h4>
          <div className="r" style={{ textAlign: 'center' }}>{s.company.legal}<br />{s.company.addr}<br />GSTIN {s.company.gstin} · {s.company.phone}</div>
          <hr />
          <div className="l"><span>{bill.no}</span><span>{date}</span></div>
          <div className="l"><span>Cust</span><span>{party.name}</span></div>
          {party.gstin && <div className="l"><span>GSTIN</span><span>{party.gstin}</span></div>}
          <div className="l"><span>Supply</span><span>{bill.interState ? 'IGST (inter)' : 'CGST+SGST'}</span></div>
          <hr />
          {(bill.lines || []).map((l, i) => {
            const it = item(l.itemId)
            return (
              <div key={i} style={{ marginBottom: 4 }}>
                <div>{i + 1}. {l.itemName || it.name}</div>
                <div className="l"><span>{l.qty} {it.unit} @ {fmtINR(l.rate)}</span><span>{fmtINR(l.amount)}</span></div>
                <div className="l"><span style={{ fontSize: 9 }}>HSN {l.hsn || it.hsn} · {l.taxPct}%</span><span style={{ fontSize: 9 }}>{fmtINR(l.tax)}</span></div>
              </div>
            )
          })}
          <hr />
          <div className="l"><span>Taxable</span><span>{fmtINR(bill.taxableTotal)}</span></div>
          {bill.discTotal > 0 && <div className="l"><span>Discount</span><span>-{fmtINR(bill.discTotal)}</span></div>}
          {bill.interState
            ? <div className="l"><span>IGST</span><span>{fmtINR(taxByComp('igst'))}</span></div>
            : <><div className="l"><span>CGST</span><span>{fmtINR(taxByComp('cgst'))}</span></div>
              <div className="l"><span>SGST</span><span>{fmtINR(taxByComp('sgst'))}</span></div></>}
          {(bill.charges || []).map((c, i) => <div key={i} className="l"><span>{c.label}</span><span>{fmtINR(c.amount + c.tax)}</span></div>)}
          {bill.roundOff !== 0 && <div className="l"><span>Round off</span><span>{fmtINR(bill.roundOff)}</span></div>}
          <hr />
          <div className="l" style={{ fontSize: 13 }}><span>GRAND TOTAL</span><span>{fmtINR(bill.grand)}</span></div>
          <div className="l"><span>Paid ({bill.mode})</span><span>{fmtINR(bill.paid)}</span></div>
          {bill.grand - bill.paid > 0 && <div className="l"><span>Balance</span><span>{fmtINR(bill.grand - bill.paid)}</span></div>}
          <hr />
          <div className="t">Bill date {date} · bana {created}{bill.revision > 1 ? ` · rev ${bill.revision}` : ''}<br />Thank you · Visit again · UPI: {s.company.upi}</div>
        </div>
      </Shell>
    )
  }

  /* ---------- A4 / A5 ---------- */
  return (
    <Shell paper={paper} setPaper={setPaper} onClose={onClose} share={share} links={links} bill={bill}>
      <div className="inv a4">
        <div className="ih">
          <div className="logo">U₹</div>
          <div><b>UMESH SMARTBILL</b>
            <small>{s.company.legal} · <b>Umesh Seeds</b> — {s.company.addr}<br />
              GSTIN: <b>{s.company.gstin}</b> · State {s.company.stateCode} ({s.company.stateName}) · Ph {s.company.phone}<br />
              Seed Licence: {s.company.licence}</small></div>
          <div className="right"><b>TAX INVOICE</b> · {bill.paid >= bill.grand ? 'PAID' : 'ORIGINAL (BUYER)'}<br />
            Invoice No: {bill.no}<br />Bill Date: {date}<br />Mode: {bill.mode === 'Credit' ? 'Credit' : 'Paid — ' + bill.mode}
            {bill.revision > 1 && <><br /><b>REVISED (rev {bill.revision})</b></>}</div>
        </div>
        <div className="cols">
          <div><label>Bill To</label><br /><b>{party.name}</b><br />
            {party.gstin ? `GSTIN ${party.gstin}` : 'Unregistered'}<br />State code {party.stateCode}</div>
          <div><label>Details</label><br />
            Place of supply: <b>{party.stateCode}</b> ({bill.interState ? 'Inter-State → IGST' : 'Intra-State → CGST + SGST'})<br />
            Price basis: <b>{bill.priceMode || 'retail'}</b> · Currency INR</div>
        </div>
        <table>
          <thead><tr><th style={{ width: 20 }}>#</th><th>Item / Description</th><th>HSN</th><th>Unit</th>
            <th className="num">Qty</th><th className="num">Rate</th><th className="num">Disc</th>
            <th className="num">Taxable</th><th className="num">Tax</th><th className="num">Amount</th></tr></thead>
          <tbody>
            {(bill.lines || []).map((l, i) => {
              const it = item(l.itemId)
              return (
                <tr key={i}>
                  <td>{i + 1}</td><td><b>{l.itemName || it.name}</b></td>
                  <td style={{ fontFamily: 'var(--font-num)' }}>{l.hsn || it.hsn}</td>
                  <td>{it.unit}</td><td className="num">{l.qty}</td>
                  <td className="num">{fmtINR(l.rate)}</td>
                  <td className="num">{l.discPct ? l.discPct + '%' : l.discAmt ? fmtINR(l.discAmt) : '—'}</td>
                  <td className="num">{fmtINR(l.finalTaxable)}</td>
                  <td className="num">{l.taxPct}% · {fmtINR(l.tax)}</td>
                  <td className="num"><b>{fmtINR(l.amount)}</b></td>
                </tr>
              )
            })}
            {(bill.charges || []).map((c, i) => (
              <tr key={'c' + i}>
                <td colSpan={7}><i>{c.label}{c.taxable ? ` (taxable @ ${c.rate}%)` : ' (exempt)'}</i></td>
                <td className="num">{fmtINR(c.amount)}</td>
                <td className="num">{c.tax ? fmtINR(c.tax) : '—'}</td>
                <td className="num"><b>{fmtINR(c.amount + c.tax)}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="tot">
          <div className="l">
            <b style={{ fontSize: 10.5 }}>Tax summary by slab</b>
            <table style={{ marginTop: 4 }}>
              <thead><tr><th>Rate</th><th className="num">Taxable</th><th className="num">CGST</th><th className="num">SGST</th><th className="num">IGST</th></tr></thead>
              <tbody>{(bill.slabs || []).map((sl, i) => (
                <tr key={i}><td>{sl.rate}%</td><td className="num">{fmtINR(sl.taxable)}</td>
                  <td className="num">{bill.interState ? '—' : fmtINR(Math.round(sl.tax / 2))}</td>
                  <td className="num">{bill.interState ? '—' : fmtINR(sl.tax - Math.round(sl.tax / 2))}</td>
                  <td className="num">{bill.interState ? fmtINR(sl.tax) : '—'}</td></tr>
              ))}</tbody>
            </table>
            <div style={{ marginTop: 8 }}><b>Amount in words:</b> {inWords(bill.grand)}</div>
          </div>
          <div className="r">
            <div><span>Sub total</span><span>{fmtINR(bill.subTotal)}</span></div>
            {bill.discTotal > 0 && <div><span>Discount</span><span>-{fmtINR(bill.discTotal)}</span></div>}
            <div><span>Taxable value</span><span>{fmtINR(bill.taxableTotal)}</span></div>
            {bill.interState
              ? <div><span>IGST</span><span>{fmtINR(taxByComp('igst'))}</span></div>
              : <><div><span>CGST</span><span>{fmtINR(taxByComp('cgst'))}</span></div>
                <div><span>SGST</span><span>{fmtINR(taxByComp('sgst'))}</span></div></>}
            {bill.roundOff !== 0 && <div><span>Round off</span><span>{fmtINR(bill.roundOff)}</span></div>}
            <div className="grand"><span>GRAND TOTAL</span><span>{fmtINR(bill.grand)}</span></div>
            <div><span>Paid ({bill.mode})</span><span>{fmtINR(bill.paid)}</span></div>
            <div><span><b>Balance due</b></span><span><b>{fmtINR(bill.grand - bill.paid)}</b></span></div>
          </div>
        </div>
        <div className="foot">
          <div><b>Bank / UPI</b><br />{s.company.bank}<br />UPI: {s.company.upi}
            <br /><span style={{ color: '#666' }}>Goods once sold will not be taken back without MRP/lot proof. Subject to Ambikapur jurisdiction.</span></div>
          <div className="qr">UPI<br />QR</div>
          <div className="sign">For {s.company.legal}<br /><br /><i>Authorised Signatory</i></div>
        </div>
        {/* REQ-11: bill date + created-at stamp + frozen-rate note */}
        <div className="gen">
          <span><b>Bill date:</b> {date} · <b>Banaya gaya:</b> {created} by Umesh{bill.editedAt ? ` · edited ${new Date(bill.editedAt).toLocaleString('en-IN')}` : ''}</span>
          <span>Rate snapshot frozen at bill time — naye catalog rates is invoice par nahi lagenge · Computer-generated invoice</span>
        </div>
      </div>
    </Shell>
  )
}

function Shell({ paper, setPaper, onClose, share, bill, receipt, children }) {
  return (
    <div className="print-root" onClick={onClose}>
      <div className={`print-wrap ${paper === 'a5' ? 'a5' : ''}`} style={paper === 't240' ? { width: '248mm' } : paper === 'th' ? { width: '84mm' } : undefined}
        onClick={(e) => e.stopPropagation()}>
        <div className="print-bar" style={{ flexWrap: 'wrap' }}>
          <b style={{ fontSize: 13 }}>{receipt ? 'Receipt preview' : 'Invoice preview'}</b>
          <span className="muted">{paper === 'a4' ? 'A4 · GST' : paper === 'a5' ? 'A5 half' : paper === 'th' ? '80mm thermal' : '240mm thermal'}</span>
          <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
            {[['a4', 'A4'], ['a5', 'A5'], ['th', '80mm'], ['t240', '240mm']].map(([k, l]) => (
              <button key={k} className={`chipbtn ${paper === k ? 'on' : ''}`} style={{ height: 28 }} onClick={() => setPaper(k)}>{l}</button>
            ))}
          </div>
          <div className="sharebar" style={{ marginLeft: 'auto' }}>
            <button className="btn sm" onClick={() => share('wa')}>💬 WhatsApp</button>
            <button className="btn sm" onClick={() => share('sms')}>✉ SMS</button>
            <button className="btn sm" onClick={() => share('call')}>📞 Call</button>
            <button className="btn sm" onClick={() => share('copy')}>⧉ Copy</button>
            <button className="btn sm pri" onClick={() => window.print()}>🖨 PDF / Print</button>
            <button className="btn sm" onClick={onClose}>Close</button>
          </div>
        </div>
        <div className="print-body">{children}</div>
      </div>
    </div>
  )
}
