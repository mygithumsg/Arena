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
    : `Umesh Seeds (${s.company.legal})\nBill ${bill.no} · ${bill.date}\nTotal: ${fmtINR(bill.grand)}\n${bal > 0 ? `Balance due: ${fmtINR(bill.grand - bill.paid)}` : 'Fully paid ✓'}\nDhanyavaad! 🙏`
  return {
    wa: intl ? `https://wa.me/${intl}?text=${encodeURIComponent(txt)}` : `https://wa.me/?text=${encodeURIComponent(txt + '\n' + (party?.name || ''))}`,
    sms: intl ? `sms:+${intl}?&body=${encodeURIComponent(txt)}` : null,
    call: intl ? `tel:+${intl}` : null,
    mail: party?.email ? `mailto:${party.email}?subject=${encodeURIComponent('Bill ' + bill.no)}&body=${encodeURIComponent(txt)}` : null,
    txt
  }
}

const fmtDay = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
const fmtTm = (d) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

function Head({ s, title, bill, paidFull }) {
  return (
    <>
      <div className="acc" />
      <div className="ih">
        <div className="logo">U₹</div>
        <div className="co">
          <h1>UMESH SEEDS</h1>
          <p className="tl">SEEDS · FERTILIZERS · PLANT PROTECTION{s.company.branch ? ` · ${s.company.branch}` : ''}</p>
          <p className="ad"><b>{s.company.legal}</b> · {s.company.addr}<br />
            GSTIN <b>{s.company.gstin}</b> · State {s.company.stateCode} ({s.company.stateName}) · Ph {s.company.phone} · Seed Lic. {s.company.licence}</p>
        </div>
        <div className="doc">
          <div className="t">{title}</div>
          <div className="st"><span>Invoice No</span><b>{bill.no}</b></div>
          <div className="st"><span>Date</span><b>{fmtDay(bill.date)}</b></div>
          <span className={`tag ${paidFull ? 'p' : 'o'}`}>{paidFull ? 'PAID ✓' : bill.paid > 0 ? 'PART PAID' : bill.receipt ? 'RECEIVED' : 'DUE'}</span>
        </div>
      </div>
    </>
  )
}

export default function InvoicePrint({ bill, onClose }) {
  const s = useApp()
  const [paper, setPaper] = useState('a4')
  const party = s.parties.find((p) => p.id === bill.partyId) || { name: '—' }
  const links = useShareLinks(bill, party)
  const item = (id) => s.items.find((i) => i.id === id) || { name: '', hsn: '', unit: '', taxPct: 0 }
  const taxByComp = (k) => (bill.lines || []).reduce((a, l) => a + (l[k] || 0), 0) + (bill.charges || []).reduce((a, c) => a + (c[k] || 0), 0)
  const date = fmtDay(bill.date)
  const created = bill.createdAt ? fmtTm(bill.createdAt) : date
  const bal = (bill.grand || 0) - (bill.paid || 0)
  const paidFull = !bill.receipt && bal <= 0
  const share = (kind) => {
    if (kind === 'copy') { navigator.clipboard?.writeText(links.txt); return toast('Summary copied — WhatsApp par paste karein') }
    const url = links[kind]
    if (!url) return toast('Is party ka phone/email record mein nahi hai')
    window.open(url, '_blank')
  }

  /* ---------- RECEIPT (REQ-5) ---------- */
  if (bill.receipt) {
    return (
      <Shell paper={paper} setPaper={setPaper} onClose={onClose} share={share} bill={bill} receipt>
        <div className="inv" style={{ width: '120mm', minHeight: '170mm', padding: '7mm' }}>
          <Head s={s} title="PAYMENT RECEIPT" bill={bill} paidFull />
          <div className="meta" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
            <div><div className="k">Receipt No</div><div className="v">{bill.no}</div></div>
            <div><div className="k">Date</div><div className="v">{date}</div></div>
            <div><div className="k">Mode</div><div className="v">{bill.mode}</div></div>
          </div>
          <div className="box" style={{ marginTop: '5mm' }}>
            <div className="row"><span className="k">Received with thanks from</span><span className="v"><b>{party.name}</b></span></div>
            {party.phone && <div className="row"><span className="k">Phone</span><span className="v">{party.phone}</span></div>}
            {bill.forBillId && <div className="row"><span className="k">Against bill</span><span className="v">{s.bills.find((b) => b.id === bill.forBillId)?.no || '—'}</span></div>}
            <div className="row gr"><span className="k">Amount received</span><span className="v">{fmtINR(bill.amount)}</span></div>
            <div className="row"><span className="k">Balance after this payment</span><span className="v">{fmtINR(Math.max(0, party.balance))} Dr</span></div>
            {bill.note && <div className="row"><span className="k">Note</span><span className="v">{bill.note}</span></div>}
          </div>
          <div className="word" style={{ marginTop: '4mm' }}>Amount in words: <span>{inWords(bill.amount)}</span></div>
          <div className="foot" style={{ gridTemplateColumns: '1fr .9fr' }}>
            <div><div className="h">Note</div><div className="l">Keep this receipt for your records.<br />Subject to {s.company.stateName || 'Madhya Pradesh'} jurisdiction.</div></div>
            <div className="sign"><div className="l">For {s.company.legal}</div><div className="l2">Authorised Signatory</div></div>
          </div>
          <div className="gen"><span>ℹ <b>Received:</b> {created} · by Umesh</span><span>Computer-generated receipt · UMESH SEEDS</span></div>
        </div>
      </Shell>
    )
  }

  /* ---------- THERMAL 80 / 240 ---------- */
  if (paper === 'th' || paper === 't240') {
    return (
      <Shell paper={paper} setPaper={setPaper} onClose={onClose} share={share} links={links} bill={bill}>
        <div className={`inv th ${paper === 't240' ? 'th240' : ''}`}>
          <h4>UMESH SEEDS</h4>
          <div className="sub">{s.company.legal}{s.company.branch ? ` · ${s.company.branch}` : ''}<br />GSTIN {s.company.gstin} · Ph {s.company.phone}</div>
          <hr className="solid" />
          <div className="l"><span>{bill.no}</span><span>{date}</span></div>
          <div className="l"><span>Cust</span><span>{party.name}</span></div>
          {party.gstin && <div className="l"><span>GSTIN</span><span>{party.gstin}</span></div>}
          <div className="l"><span>Supply</span><span>{bill.interState ? 'IGST (inter)' : 'CGST+SGST'}</span></div>
          {bill.revision > 1 && <div className="l"><span>Revision</span><span>rev {bill.revision}</span></div>}
          <hr />
          {(bill.lines || []).map((l, i) => {
            const it = item(l.itemId)
            return (
              <div key={i} style={{ marginBottom: '1.2mm' }}>
                <div style={{ textAlign: 'left' }}>{i + 1}. {l.itemName || it.name}</div>
                <div className="l"><span>{l.qty} {it.unit} @ {fmtINR(l.rate)}</span><span>{fmtINR(l.amount)}</span></div>
                <div className="l"><span style={{ fontSize: '6.4pt' }}>HSN {l.hsn || it.hsn} · {l.taxPct}% {l.rateFrom === 'custom' ? '· cust⚡' : ''}</span><span style={{ fontSize: '6.4pt' }}>{fmtINR(l.tax)}</span></div>
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
          <div className="gbox"><div className="l"><span>TOTAL</span><span>{fmtINR(bill.grand)}</span></div></div>
          <div className="l"><span>Paid ({bill.mode})</span><span>{fmtINR(bill.paid)}</span></div>
          {bal > 0 && <div className="l"><span>BALANCE DUE</span><span>{fmtINR(bal)}</span></div>}
          <hr className="solid" />
          <div className="t">★ {paidFull ? 'PAID — DHANYAVAAD, PHIR AAIYEGA' : bal > 0 ? 'KRIPYA SHIGRA BHUGTAN KAREIN' : 'PART PAID'} ★<br />
            Bill date {date} · bana {created} · rate frozen{bill.revision > 1 ? ` · rev ${bill.revision}` : ''}<br />UPI: {s.company.upi}</div>
        </div>
      </Shell>
    )
  }

  /* ---------- A4 / A5 — Tally-style GST tax invoice (classic print) ---------- */
  const cgT = taxByComp('cgst'), sgT = taxByComp('sgst'), igT = taxByComp('igst')
  const gross = (bill.grand || 0) - (bill.roundOff || 0)
  return (
    <Shell paper={paper} setPaper={setPaper} onClose={onClose} share={share} links={links} bill={bill}>
      <div className={`inv tly ${paper}`}>
        <div className="thd">
          <div className="tname">Umesh Seeds</div>
          <div className="tlegal">{s.company.legal}{s.company.branch ? ` · ${s.company.branch}` : ''}</div>
          <div className="taddr">{s.company.addr}</div>
          <div className="tgst">GSTIN: <b>{s.company.gstin}</b> · Ph: <b>{s.company.phone}</b> · State Code: <b>{s.company.stateCode}</b> ({s.company.stateName}) · Seed Lic.: {s.company.licence}</div>
          <div className="ttitle">TAX INVOICE</div>
        </div>
        <div className="tinfo">
          <div className="c wide"><span className="k">M/s</span><span className="v"><b>{party.name}</b>{party.addr ? ` — ${party.addr}` : ''} · {party.gstin ? `GSTIN ${party.gstin}` : 'Unregistered'}{party.phone ? ` · ${party.phone}` : ''}</span></div>
          <div className="c"><span className="k">Invoice No.</span><span className="v">{bill.no}</span></div>
          <div className="c"><span className="k">Date</span><span className="v">{date}</span></div>
          <div className="c"><span className="k">Payment</span><span className="v">{bill.mode === 'Credit' ? 'Credit' : 'Paid · ' + bill.mode}</span></div>
          <div className="c"><span className="k">Place of Supply</span><span className="v">{party.stateCode} — {bill.interState ? 'Inter-State (IGST)' : 'Intra-State (CGST+SGST)'}</span></div>
          <div className="c"><span className="k">Rate Basis</span><span className="v">{(bill.priceMode || 'retail')} rates{bill.revision > 1 ? ` · REVISED (rev ${bill.revision})` : ''}</span></div>
          <div className="c"><span className="k">Notes / Vehicle</span><span className="v">{bill.notes || '—'}{bill.editedAt ? ` · modified ${fmtTm(bill.editedAt)}` : ''}</span></div>
        </div>
        <table className="tab">
          <thead>
            <tr>
              <th style={{ width: '3%' }}>No.</th>
              <th style={{ width: '26%' }}>Description of Goods</th>
              <th style={{ width: '7%' }}>HSN/SAC</th>
              <th style={{ width: '5%' }}>Unit</th>
              <th style={{ width: '7%' }}>Qty</th>
              <th style={{ width: '10%' }}>Rate</th>
              <th style={{ width: '6%' }}>Disc</th>
              <th style={{ width: '11%' }}>Taxable</th>
              {bill.interState ? <th style={{ width: '10%' }}>IGST</th> : <><th style={{ width: '8%' }}>CGST</th><th style={{ width: '8%' }}>SGST</th></>}
              <th style={{ width: '11%' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {(bill.lines || []).map((l, i) => {
              const it = item(l.itemId)
              const cg = Math.round((l.tax || 0) / 2), sg = (l.tax || 0) - cg
              const half = l.taxPct / 2
              return (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td className="dl"><span className="nm">{l.itemName || it.name}</span>
                    <span className="sub">GST {l.taxPct}% · {l.rateFrom === 'custom' ? 'custom ⚡ rate' : l.rateFrom === 'wholesale' ? 'wholesale rate' : 'retail rate'}</span></td>
                  <td className="mono">{l.hsn || it.hsn}</td>
                  <td>{it.unit}</td>
                  <td className="mono">{l.qty}</td>
                  <td className="mono">{fmtINR(l.rate)}</td>
                  <td className="mono">{l.discPct ? l.discPct + '%' : l.discAmt ? fmtINR(l.discAmt) : '—'}</td>
                  <td className="mono">{fmtINR(l.finalTaxable)}</td>
                  {bill.interState
                    ? <td className="mono">{l.taxPct}%<br />{fmtINR(l.tax)}</td>
                    : <><td className="mono">{half}%<br />{fmtINR(cg)}</td><td className="mono">{half}%<br />{fmtINR(sg)}</td></>}
                  <td className="mono"><b>{fmtINR(l.amount)}</b></td>
                </tr>
              )
            })}
            {(bill.charges || []).map((c, i) => (
              <tr key={'c' + i}>
                <td>{(bill.lines || []).length + i + 1}</td>
                <td className="dl"><span className="nm">{c.label}</span>
                  <span className="sub">{c.taxable ? `Freight/other — taxable @ ${c.rate || 18}%` : 'Non-taxable charge'}</span></td>
                <td className="mono">—</td><td>—</td><td>1</td><td className="mono">{fmtINR(c.amount)}</td><td>—</td>
                <td className="mono">{fmtINR(c.amount)}</td>
                {bill.interState
                  ? <td className="mono">{c.tax ? fmtINR(c.tax) : '—'}</td>
                  : <><td className="mono">{c.tax ? fmtINR(Math.round(c.tax / 2)) : '—'}</td><td className="mono">{c.tax ? fmtINR(c.tax - Math.round(c.tax / 2)) : '—'}</td></>}
                <td className="mono"><b>{fmtINR(c.amount + c.tax)}</b></td>
              </tr>
            ))}
            <tr className="tlytot">
              <td colSpan={6} style={{ textAlign: 'right', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase' }}>Total</td>
              <td className="mono">{bill.discTotal ? '‒' + fmtINR(bill.discTotal).replace('\u20b9', '\u20b9') : '—'}</td>
              <td className="mono"><b>{fmtINR(bill.taxableTotal)}</b></td>
              {bill.interState
                ? <td className="mono"><b>{fmtINR(igT)}</b></td>
                : <><td className="mono"><b>{fmtINR(cgT)}</b></td><td className="mono"><b>{fmtINR(sgT)}</b></td></>}
              <td className="mono"><b>{fmtINR(gross)}</b></td>
            </tr>
          </tbody>
        </table>
        <div className="tsum">
          <div className="h">Tax Summary (Rate-wise)</div>
          <table>
            <thead><tr><th style={{ width: '8%' }}>Rate</th><th>Taxable Value</th><th>CGST</th><th>SGST</th><th>IGST</th><th>Tax Amount</th></tr></thead>
            <tbody>{(bill.slabs || []).map((sl, i) => (
              <tr key={i}><td>{sl.rate}%</td><td className="mono">{fmtINR(sl.taxable)}</td>
                <td className="mono">{bill.interState ? '—' : fmtINR(Math.round(sl.tax / 2))}</td>
                <td className="mono">{bill.interState ? '—' : fmtINR(sl.tax - Math.round(sl.tax / 2))}</td>
                <td className="mono">{bill.interState ? fmtINR(sl.tax) : '—'}</td>
                <td className="mono"><b>{fmtINR(sl.tax)}</b></td></tr>
            ))}
            <tr><td colSpan={5} style={{ textAlign: 'right', fontWeight: 700 }}>Total Tax</td><td className="mono"><b>{fmtINR(bill.totalTax)}</b></td></tr></tbody>
          </table>
        </div>
        <div className="twords">
          {paidFull ? <span className="stamp paid">PAID<small>{fmtDay(bill.date)}</small></span> : bal > 0 ? <span className="stamp due">DUE<small>{fmtINR(bal)}</small></span> : null}
          <div className="w"><span className="k">Amount in Words:</span> <span>{inWords(bill.grand)}</span></div>
          <div className="g"><span className="k">Grand Total</span><b>{fmtINR(bill.grand)}</b>
            <small>{bill.roundOff ? `incl. round off ${fmtINR(bill.roundOff)}` : 'inclusive of all taxes'}</small></div>
        </div>
        <div className="tfoot">
          <div>
            <div className="k">Bank / UPI Details</div>
            <div className="l">{s.company.bank}<br />UPI ID: <b>{s.company.upi}</b><br />Payee: <b>Umesh Seeds</b></div>
            <div className="upiqr">UPI QR<br />(scan &amp; pay)</div>
          </div>
          <div>
            <div className="k">Terms &amp; Conditions / Declaration</div>
            <div className="l">
              1. Goods once sold cannot be taken back without bill, MRP &amp; unopened pack proof.<br />
              2. Sowing, storage &amp; usage as per pack instructions is the buyer's responsibility; manufacturer's warranty only.<br />
              3. Interest @ 18% p.a. on overdue credit bills. E&amp;OE.<br />
              4. <b>Rates frozen at billing time</b> — नए catalog rate इस invoice पर apply नहीं होंगे।<br />
              5. Subject to {s.company.stateName || 'Madhya Pradesh'} jurisdiction only.
            </div>
          </div>
          <div className="sign">
            <div className="k">Institute's Signature</div>
            <div className="l" style={{ marginTop: 'auto' }}>For <b>Umesh Seeds</b><br />{s.company.gstin}</div>
            <div className="sig">Authorised Signatory</div>
          </div>
        </div>
        <div className="tcopy">Original for the Customer · Computer-generated invoice — no signature required if dispatched digitally</div>
        {/* REQ-11: bill date + created stamp (kept outside the ruled sheet, Tally-style footer line) */}
        <div className="gen">
          <span>Bill date: <b>{date}</b> · Banaya gaya: <b>{created}</b> by Umesh{bill.editedAt ? ` · last modified ${fmtTm(bill.editedAt)}` : ''} · rev {bill.revision || 1}</span>
          <span>Printed {fmtTm(new Date())} · Page 1/1 · UMESH SMARTBILL</span>
        </div>
      </div>
    </Shell>
  )
}

const PAGE_SIZE = { a4: 'A4 portrait', a5: 'A5 portrait', th: '80mm auto', t240: '240mm auto' }
const PAGE_MARGIN = { a4: '9mm 10mm', a5: '6mm 7mm', th: '2.5mm 2mm', t240: '3mm 3mm' }

function Shell({ paper, setPaper, onClose, share, bill, receipt, children }) {
  return (
    <div className="print-root" onClick={onClose} style={paper === 'th' || paper === 't240' ? { background: '#54615b', alignItems: 'center' } : undefined}>
      <style>{`@media print{@page{size:${PAGE_SIZE[paper]};margin:${PAGE_MARGIN[paper]}}}`}</style>
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
