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
          <div className="word" style={{ marginTop: '4mm' }}>Amount in words: <span>{inWords(bill.amount)}</span> only.</div>
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

  /* ---------- A4 / A5 — professional GST tax invoice ---------- */
  const NCOL = bill.interState ? 8 : 9
  return (
    <Shell paper={paper} setPaper={setPaper} onClose={onClose} share={share} links={links} bill={bill}>
      <div className={`inv ${paper}`}>
        <Head s={s} title="TAX INVOICE" bill={bill} paidFull={paidFull} />
        <div className="meta">
          <div><div className="k">Bill Date · बिल दिनांक</div><div className="v">{date}</div></div>
          <div><div className="k">Created · बनाया गया</div><div className="v">{created} by Umesh</div></div>
          <div><div className="k">Payment</div><div className="v">{bill.mode === 'Credit' ? 'Udhaar · Credit' : 'Paid · ' + bill.mode}</div></div>
          <div><div className="k">Price Basis{bill.revision > 1 ? ' · REVISED' : ''}</div><div className="v">{(bill.priceMode || 'retail')} rate{bill.revision > 1 ? ` · rev ${bill.revision}` : ''}</div></div>
        </div>
        <div className="cols">
          <div>
            <div className="h">Bill To · ग्राहक</div>
            <b>{party.name}</b>
            <div className="s">{party.gstin ? `GSTIN ${party.gstin}` : 'Unregistered'} · State {party.stateCode}{party.phone ? ` · Ph ${party.phone}` : ''}<br />{party.addr || '—'}</div>
          </div>
          <div>
            <div className="h">Supply Details · आपूर्ति</div>
            <div className="s">Place of supply: <b>{party.stateCode}</b> — {bill.interState ? 'Inter-State → IGST' : 'Intra-State → CGST + SGST'}<br />
              Reverse charge: <b>No</b> · Transport/vehicle: <b>{bill.notes || '—'}</b>{bill.editedAt ? <><br />Modified on: <b>{fmtTm(bill.editedAt)}</b> (original rates stay frozen)</> : null}</div>
          </div>
        </div>
        <table className="tab">
          <thead>
            <tr>
              <th style={{ width: '3.5%' }}>#</th>
              <th style={{ width: '29%' }}>Description of Goods · HSN / GST</th>
              <th style={{ width: '9%' }}>Unit·Qty</th>
              <th style={{ width: '9%' }}>Rate ₹</th>
              <th style={{ width: '7%' }}>Disc</th>
              <th style={{ width: '12%' }}>Taxable ₹</th>
              {bill.interState ? <th style={{ width: '11%' }}>IGST</th> : <><th style={{ width: '10%' }}>CGST</th><th style={{ width: '10%' }}>SGST</th></>}
              <th style={{ width: '12%' }}>Amount ₹</th>
            </tr>
            {!bill.interState && <tr className="g"><th colSpan={6}>ASSESSABLE VALUE</th><th colSpan={2}>TAX BREAKUP</th><th>TOTAL</th></tr>}
            {bill.interState && <tr className="g"><th colSpan={6}>ASSESSABLE VALUE</th><th>TAX</th><th>TOTAL</th></tr>}
          </thead>
          <tbody>
            {(bill.lines || []).map((l, i) => {
              const it = item(l.itemId)
              const cg = Math.round((l.tax || 0) / 2), sg = (l.tax || 0) - cg
              const half = l.taxPct / 2
              return (
                <tr key={i}>
                  <td className="mono" style={{ color: '#8aa197' }}>{i + 1}</td>
                  <td><span className="nm">{l.itemName || it.name}</span>
                    <span className="sub">HSN {l.hsn || it.hsn} · GST {l.taxPct}% · {l.rateFrom === 'custom' ? 'custom ⚡ rate' : l.rateFrom === 'wholesale' ? 'wholesale rate' : 'retail rate'}</span></td>
                  <td className="mono">{it.unit} · {l.qty}</td>
                  <td className="mono">{fmtINR(l.rate)}</td>
                  <td className="mono">{l.discPct ? l.discPct + '%' : l.discAmt ? fmtINR(l.discAmt) : '—'}</td>
                  <td className="mono">{fmtINR(l.finalTaxable)}</td>
                  {bill.interState
                    ? <td className="mono">{l.taxPct}% · {fmtINR(l.tax)}</td>
                    : <><td className="mono">{half}% · {fmtINR(cg)}</td><td className="mono">{half}% · {fmtINR(sg)}</td></>}
                  <td className="mono"><b>{fmtINR(l.amount)}</b></td>
                </tr>
              )
            })}
            {(bill.charges || []).map((c, i) => (
              <tr key={'c' + i}>
                <td className="mono" style={{ color: '#8aa197' }}>•</td>
                <td><span className="nm" style={{ fontWeight: 600 }}>{c.label}</span>
                  <span className="sub">{c.taxable ? `Freight/packing — taxable @ max slab ${c.rate || 18}%` : 'Non-taxable charge'}</span></td>
                <td colSpan={3} />
                <td className="mono">{fmtINR(c.amount)}</td>
                {bill.interState
                  ? <td className="mono">{c.tax ? fmtINR(c.tax) : '—'}</td>
                  : <><td className="mono">{c.tax ? fmtINR(Math.round(c.tax / 2)) : '—'}</td><td className="mono">{c.tax ? fmtINR(c.tax - Math.round(c.tax / 2)) : '—'}</td></>}
                <td className="mono"><b>{fmtINR(c.amount + c.tax)}</b></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={NCOL - 3} style={{ textAlign: 'right', fontWeight: 800, letterSpacing: '.08em' }}>TOTALS</td>
              <td className="mono"><b>{fmtINR(bill.taxableTotal)}</b></td>
              <td colSpan={bill.interState ? 1 : 2} className="mono" style={{ textAlign: 'right' }}>incl. tax {fmtINR(bill.totalTax)}</td>
              <td className="mono"><b>{fmtINR(bill.grand)}</b></td>
            </tr>
          </tfoot>
        </table>
        <div className="tot">
          <div className="slab">
            <div className="h">Tax Summary by Slab · {bill.interState ? 'IGST' : 'CGST + SGST'}</div>
            <table>
              <thead><tr><th>Rate</th><th>Taxable</th><th>CGST</th><th>SGST</th><th>IGST</th><th>Total</th></tr></thead>
              <tbody>{(bill.slabs || []).map((sl, i) => (
                <tr key={i}><td>{sl.rate}%</td><td>{fmtINR(sl.taxable)}</td>
                  <td>{bill.interState ? '—' : fmtINR(Math.round(sl.tax / 2))}</td>
                  <td>{bill.interState ? '—' : fmtINR(sl.tax - Math.round(sl.tax / 2))}</td>
                  <td>{bill.interState ? fmtINR(sl.tax) : '—'}</td>
                  <td><b>{fmtINR(sl.taxable + sl.tax)}</b></td></tr>
              ))}</tbody>
            </table>
            <div className="word">Amount in words: <span>{inWords(bill.grand)}</span> only — payable per terms above.</div>
          </div>
          <div className="box">
            <div className="row"><span className="k">Sub total</span><span className="v">{fmtINR(bill.subTotal)}</span></div>
            {bill.discTotal > 0 && <div className="row d"><span className="k">Discount</span><span className="v">−{fmtINR(bill.discTotal)}</span></div>}
            <div className="row"><span className="k">Taxable value</span><span className="v">{fmtINR(bill.taxableTotal)}</span></div>
            {bill.interState
              ? <div className="row"><span className="k">IGST</span><span className="v">{fmtINR(taxByComp('igst'))}</span></div>
              : <><div className="row"><span className="k">CGST</span><span className="v">{fmtINR(taxByComp('cgst'))}</span></div>
                <div className="row"><span className="k">SGST</span><span className="v">{fmtINR(taxByComp('sgst'))}</span></div></>}
            {(bill.charges || []).map((c, i) => <div key={i} className="row"><span className="k">{c.label}{c.tax ? ' + tax' : ''}</span><span className="v">{fmtINR(c.amount + c.tax)}</span></div>)}
            {bill.roundOff !== 0 && <div className="row d"><span className="k">Round off</span><span className="v">{fmtINR(bill.roundOff)}</span></div>}
            <div className="row gr"><span className="k">Grand Total · कुल</span><span className="v">{fmtINR(bill.grand)}</span></div>
            <div className="row"><span className="k">Paid ({bill.mode === 'Credit' ? 'Udhaar' : bill.mode})</span><span className="v">{fmtINR(bill.paid)}</span></div>
            <div className={`row bal ${bal <= 0 ? 'z' : ''}`}><span className="k">{bal <= 0 ? 'Settled ✓' : 'Balance due'}</span><span className="v">{fmtINR(Math.max(0, bal))}</span></div>
          </div>
        </div>
        <div className="foot">
          <div>
            <div className="h">Bank / UPI — pay to “Umesh Seeds”</div>
            <div className="l">{s.company.bank}<br />UPI ID: <b>{s.company.upi}</b><br />Payee name: <b>{s.company.legal}</b></div>
          </div>
          <div className="upiqr">UPI QR<br/>(scan &amp; pay)<br />{s.company.upi}</div>
          <div className="sign">
            <div className="l">For {s.company.legal}<br />{s.company.gstin}</div>
            <div className="l2">Authorised Signatory</div>
          </div>
        </div>
        <div className="decl">
          <b>Declaration:</b> 1. Seeds/fertilizers are sold as-is per pack MRP &amp; lot — goods once sold cannot be taken back without bill, MRP &amp; unopened pack proof.
          2. Sowing, storage &amp; usage as per pack instructions is the buyer's responsibility; warranty limited to manufacturer.
          3. Interest @ 18% p.a. applies on overdue credit. 4. Subject to {s.company.stateName || 'Madhya Pradesh'} jurisdiction only.
        </div>
        {/* REQ-11: bill date + created-at + frozen-rate note */}
        <div className="gen">
          <span>ℹ <b>Bill date:</b> {date} · <b>Banaya gaya:</b> {created} by Umesh{bill.editedAt ? ` · last modified ${fmtTm(bill.editedAt)}` : ''}</span>
          <span>Rates frozen at billing — नए catalog rate इस invoice पर apply नहीं होंगे · Computer-generated · UMESH SEEDS</span>
        </div>
        {paidFull ? <div className="stamp paid">PAID<small>{fmtDay(bill.date)}</small></div> : bal > 0 ? <div className="stamp due">DUE<small>{fmtINR(bal)}</small></div> : null}
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
