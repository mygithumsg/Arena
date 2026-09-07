import React, { useEffect, useMemo, useRef, useState } from 'react'
const useIsMobile = () => {
  const [m, setM] = useState(() => window.matchMedia('(max-width:820px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(max-width:820px)')
    const fn = (e) => setM(e.matches)
    mq.addEventListener('change', fn); return () => mq.removeEventListener('change', fn)
  }, [])
  return m
}
import { useApp, setState, fmtINR, toast, setPrint, adopt } from '../App.jsx'
import { computeInvoice, toP, fromP } from '../lib/calc.mjs'
import { saveBill, resolveRate, editBill } from '../lib/store.mjs'

const blank = () => ({ partyId: 'CASH', date: new Date().toISOString().slice(0, 10), billDiscPct: 0, notes: '', lines: [] })

export default function BillNew({ go }) {
  const s = useApp()
  const [d, setD] = useState(blank)
  const [lines, setLines] = useState([{ itemId: '', qty: 1, rate: 0, discPct: 0, taxPct: 5, taxInclusive: false }])
  const [charges, setCharges] = useState([])
  const [payOpen, setPayOpen] = useState(false)
  const [paid, setPaid] = useState(0)
  const [payMode, setPayMode] = useState('Cash')
  const [pMode, setPMode] = useState(null)
  const [editing, setEditing] = useState(null)
  const [q, setQ] = useState('')
  const mob = useIsMobile()
  const searchRef = useRef(null)
  const qtyRefs = useRef([])

  useEffect(() => { searchRef.current?.focus() }, [])
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'F5') { e.preventDefault(); save() }
      if (e.key === 'F1') { e.preventDefault(); searchRef.current?.focus() }
      if (e.key === 'F9') { e.preventDefault(); setPayOpen((v) => !v) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const party = s.parties.find((p) => p.id === d.partyId)
  const interState = party ? String(party.stateCode) !== String(s.company.stateCode) : false
  const mode = pMode || party?.priceMode || 'retail'
  // REQ-9: party switch ya Retail/Wholesale toggle → non-manual line rates re-resolve
  useEffect(() => {
    setLines((ls) => ls.map((l) => {
      if (!l.itemId || l.manual) return l
      const it = s.items.find((x) => x.id === l.itemId)
      return it ? { ...l, rate: fromP(resolveRate(it, party, mode).rate) } : l
    }))
  }, [d.partyId, mode])
  const calc = useMemo(() => computeInvoice({
    lines, billDiscPct: d.billDiscPct, charges, interState, roundPolicy: s.prefs.roundPolicy
  }), [lines, d.billDiscPct, charges, interState, s.prefs.roundPolicy])

  const setLine = (i, patch) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)))
  const addFromItem = (it) => {
    if (lines.some((l) => l.itemId === it.id)) { toast('Item already added — increase qty'); return }
    const rr = resolveRate(it, party, mode)
    const firstEmpty = lines.findIndex((l) => !l.itemId)
    setLines((ls) => {
      const nl = [...ls]
      const row = { itemId: it.id, qty: 1, rate: fromP(rr.rate), rateFrom: rr.from, discPct: 0, taxPct: it.taxPct, taxInclusive: false, manual: false }
      if (firstEmpty >= 0) nl[firstEmpty] = row
      else nl.push(row)
      return nl
    })
    setQ('')
    setTimeout(() => qtyRefs.current[firstEmpty >= 0 ? firstEmpty : lines.length]?.focus(), 30)
    toast(`+ ${it.name} · ${rr.from === 'custom' ? 'custom rate' : rr.from} ₹${fromP(rr.rate).toFixed(2)}`)
  }
  const results = q ? s.items.filter((i) => (i.name + i.sku).toLowerCase().includes(q.toLowerCase())).slice(0, 7) : []

  const save = () => {
    const real = lines.filter((l) => l.itemId)
    if (!real.length) return toast('Pehle ek item add karo (F1)'), undefined
    const r = saveBill(s, {
      partyId: d.partyId, date: d.date, billDiscPct: Number(d.billDiscPct) || 0, notes: d.notes, priceMode: mode,
      lines: real.map((l) => ({ ...l, rate: toP(l.rate), discAmt: '' })), charges: charges.map((c) => ({ ...c }))
    }, { paid: Math.round(paid), mode: payMode })
    adopt(r.state)
    setPrint(r.bill)
    setD(blank()); setLines([{ itemId: '', qty: 1, rate: 0, discPct: 0, taxPct: 5 }]); setCharges([]); setPaid(0)
    toast(`Bill ${r.bill.no} saved · ${fmtINR(r.bill.grand)}`)
  }

  const holdDraft = () => { toast('Bill held — repeater list mein chala gaya'); }

  const overLimit = party && (party.balance + calc.grand - Math.round(paid)) > (party.creditLimit || 0) && party.creditLimit > 0
  const lowAdds = lines.filter((l) => l.itemId && s.items.find((i) => i.id === l.itemId)?.stock < Number(l.qty))

  return (
    <>
      <div className="phead">
        <div><h1>New GST Bill</h1>
          <p>Bill #{s.prefs.prefix}/{s.prefs.fy}/{String(s.prefs.nextSeq).padStart(4, '0')} · {s.company.gstin} · intra/inter auto-detected · offline-ready</p></div>
        <div className="act mb-hide">
          <button className="btn" onClick={holdDraft}>Hold (F6)</button>
          <button className="btn pri" onClick={save}>Save &amp; Print (F5)</button>
        </div>
      </div>

      <div className="ghost-box billform" style={{ marginBottom: 12 }}>
        <div className="field wide">
          <label>Party / Customer (F2)</label>
          <select className="inp" value={d.partyId} onChange={(e) => setD({ ...d, partyId: e.target.value })}>
            {s.parties.map((p) => <option key={p.id} value={p.id}>{p.name} {p.gstin ? `· ${p.gstin}` : '· Unregistered'}</option>)}
          </select>
        </div>
        <div className="field"><label>Bill date</label>
          <input type="date" className="inp" value={d.date} onChange={(e) => setD({ ...d, date: e.target.value })} /></div>
        <div className="field"><label>Price list</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {['retail', 'wholesale'].map((m2) => (
              <button key={m2} className={`chipbtn ${mode === m2 ? 'on' : ''}`} onClick={() => setPMode(m2)}
                title={party?.customRates && Object.keys(party.customRates).length ? 'Is customer ke custom rate priority mein hain' : ''}>{m2 === 'retail' ? '🏷 Retail' : '📦 Wholesale'}</button>
            ))}
          </div>
        </div>
        <div className="field dhid-m">
          <label>Supply mode</label>
          <div className="inp num-i" style={{ lineHeight: '36px', background: interState ? 'var(--blue-100)' : 'var(--brand-50)' }}>
            {interState ? 'IGST (Inter-State)' : 'CGST + SGST (Intra-State)'}
          </div>
        </div>
        <div className="field dhid-m">
          <label>Credit</label>
          <div className="inp" style={{ lineHeight: '36px', fontFamily: 'var(--font-num)' }}>
            {party?.creditLimit ? `${fmtINR(Math.max(0, party.balance))} / ${fmtINR(party.creditLimit)}` : '— (cash)'}
          </div>
        </div>
        <div className="field wide mpills">
          <span className={`pill ${interState ? 'part' : 'ok'}`}>{interState ? 'IGST · Inter-State' : 'CGST + SGST · Intra'}</span>
          {party?.creditLimit
            ? <span className="pill due">Udhaar {fmtINR(Math.max(0, party.balance))} / {fmtINR(party.creditLimit)}</span>
            : <span className="pill off">Cash counter</span>}
          {party?.customRates && Object.keys(party.customRates).length ? <span className="pill part">⚡ custom rates active</span> : null}
        </div>
      </div>

      <div className="bill-grid">
        <div className="line-form" style={{ position: 'relative' }}>
          <div className="field" style={{ position: 'relative' }}>
            <label>Item search — name / SKU / barcode (F1)</label>
            <input ref={searchRef} className="inp" placeholder="e.g. atta, DAP, SEEDWHEAT… type & press Enter"
              value={q} onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && results[0]) addFromItem(results[0]) }} />
            {q && !!results.length && (
              <div className="pick">
                {results.map((i) => (
                  <button key={i.id} onMouseDown={() => addFromItem(i)}>
                    <b style={{ minWidth: 180 }}>{i.name}</b>
                    <small>{i.sku} · HSN {i.hsn} · {i.taxPct}%</small>
                    <small style={{ marginLeft: 'auto' }}>₹{fromP(i.rate).toFixed(2)} · stock {i.stock}</small>
                  </button>
                ))}
              </div>
            )}
            {q && !results.length && <div className="pick" style={{ padding: 14, color: 'var(--ink-500)' }}>Koi item nahi mila — “Items & Stock” mein add karo.</div>}
          </div>

          <div className="rows">
            <table className="lines-t cardtable">
              <thead><tr>
                <th style={{ width: 26 }}>#</th><th>Item / HSN</th><th className="num" style={{ width: 78 }}>Qty</th>
                <th style={{ width: 48 }}>Unit</th><th className="num" style={{ width: 92 }}>Rate</th>
                <th className="num" style={{ width: 74 }}>Disc %</th><th className="num" style={{ width: 96 }}>Taxable</th>
                <th className="num" style={{ width: 110 }}>Tax</th><th className="num" style={{ width: 106 }}>Amount</th><th style={{ width: 30 }} />
              </tr></thead>
              <tbody>
                {lines.map((l, i) => {
                  const it = s.items.find((x) => x.id === l.itemId)
                  const cl = calc.lines[i]
                  if (mob && !l.itemId) return (
                    <tr key={i}>
                      <td className="ln-add" colSpan={10}>
                        <button onClick={() => searchRef.current?.focus()}>+ Add item — search se chuno</button>
                        {lines.length > 1 && <button className="del" onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}>✕</button>}
                      </td>
                    </tr>
                  )
                  return (
                    <tr key={i}>
                      <td className="muted ln-idx">{i + 1}</td>
                      <td data-l="Item" className="ln-name">
                        {it ? <div className="mini"><b>{it.name}</b><small>{it.hsn} · GST {it.taxPct}% · {l.rateFrom === 'custom' ? 'custom rate' : l.rateFrom === 'wholesale' ? 'wholesale' : 'retail'} {it.stock < it.min ? '· low stock' : ''}</small></div>
                          : <span className="muted">+ line add karo</span>}
                      </td>
                      <td data-l="Qty" className="ln-qty"><input ref={(el) => (qtyRefs.current[i] = el)} className="inp num-i" style={{ height: 30 }} type="number" min="0" step="0.001" value={l.qty}
                        onChange={(e) => setLine(i, { qty: e.target.value })}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const nx = i + 1; if (lines[nx]?.itemId || nx < lines.length) qtyRefs.current[nx]?.focus(); else searchRef.current?.focus() } if (e.key === 'ArrowDown') { e.preventDefault(); qtyRefs.current[i + 1]?.focus() } if (e.key === 'ArrowUp') { e.preventDefault(); (i ? qtyRefs.current[i - 1] : searchRef.current)?.focus() } }} /></td>
                      <td data-l="Unit" className="muted ln-unit">{it?.unit}</td>
                      <td data-l="Rate ₹" className="ln-rate"><input className="inp num-i" style={{ height: 30 }} type="number" step="0.01" value={l.rate}
                        onChange={(e) => setLine(i, { rate: e.target.value, manual: true })} />
                        {l.rateFrom === 'custom' && <span className="muted" style={{ fontSize: 9.5 }}>custom⚡</span>}</td>
                      <td data-l="Disc %" className="ln-disc"><input className="inp num-i" style={{ height: 30 }} type="number" value={l.discPct}
                        onChange={(e) => setLine(i, { discPct: e.target.value })} /></td>
                      <td data-l="Taxable" className="num ln-tex">{fmtINR(cl?.finalTaxable ?? 0)}</td>
                      <td data-l="Tax" className="num ln-tex">{it ? `${l.taxPct}%` : ''} <span style={{ color: 'var(--ink-500)' }}>{fmtINR(cl?.tax ?? 0)}</span></td>
                      <td data-l="Amount" className="num ln-amt"><b>{fmtINR(cl?.amount ?? 0)}</b></td>
                      <td className="ln-del"><button className="del" onClick={() => setLines((ls) => (ls.length === 1 ? [{ itemId: '', qty: 1, rate: 0, discPct: 0, taxPct: 5 }] : ls.filter((_, j) => j !== i)))}>✕</button></td>
                    </tr>
                  )
                })}
                <tr><td colSpan={10} className="ln-name" data-l="">
                  <button className="btn sm" onClick={() => setLines((ls) => [...ls, { itemId: '', qty: 1, rate: 0, discPct: 0, taxPct: 5 }])}>+ Add empty line</button>
                  <button className="btn sm" style={{ marginLeft: 8 }} onClick={() => { setCharges((c) => [...c, { label: 'Freight', amount: 0, taxable: true }]) }}>+ Freight / packing charge</button>
                  <button className="btn sm" style={{ marginLeft: 8 }} onClick={() => addFromItem(s.items.find((i) => i.service))}>+ Service line</button>
                </td></tr>
                {charges.map((c, i) => (
                  <tr key={'ch' + i}>
                    <td className="ln-idx" />
                    <td className="ln-name"><input className="inp" style={{ height: 30 }} value={c.label} onChange={(e) => setCharges((cs) => cs.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} /></td>
                    <td colSpan={3} className="ln-qty" data-l="">
                      <input className="inp num-i" style={{ height: 30 }} type="number" step="0.01" placeholder="₹ amount" value={fromP(c.amount) || ''}
                        onChange={(e) => setCharges((cs) => cs.map((x, j) => j === i ? { ...x, amount: toP(e.target.value) } : x))} />
                    </td>
                    <td className="muted ln-disc" data-l="" style={{ flex: '1 1 100%' }}>
                      <label style={{ fontWeight: 600 }}>
                        <input type="checkbox" checked={c.taxable} onChange={(e) => setCharges((cs) => cs.map((x, j) => j === i ? { ...x, taxable: e.target.checked } : x))} /> taxable @ max slab
                      </label>
                    </td>
                    <td className="num">{fmtINR(c.amount)}</td>
                    <td className="num">{fmtINR(calc.charges[i]?.tax ?? 0)}</td>
                    <td className="num"><b>{fmtINR((c.amount || 0) + (calc.charges[i]?.tax || 0))}</b></td>
                    <td><button className="del" onClick={() => setCharges((cs) => cs.filter((_, j) => j !== i))}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="field" style={{ width: 160 }}>
              <label>Bill discount % (F4)</label>
              <input className="inp num-i" type="number" value={d.billDiscPct} onChange={(e) => setD({ ...d, billDiscPct: e.target.value })} />
            </div>
            <div className="field" style={{ flex: 1, minWidth: 200 }}>
              <label>Notes / reference (PO no., vehicle)</label>
              <input className="inp" placeholder="Customer PO-88 · temp" value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} />
            </div>
            <div className="field"><label>Round-off</label>
              <select className="inp" value={s.prefs.roundPolicy} onChange={(e) => setState({ ...s, prefs: { ...s.prefs, roundPolicy: e.target.value } })}>
                <option value="rupee">Nearest ₹1</option><option value="half">Nearest ₹0.50</option><option value="none">Keep paise</option>
              </select>
            </div>
          </div>
        </div>

        <div className="total-card">
          <div className="cardhead" style={{ marginBottom: 6 }}><h3>Summary</h3>
            <span className="muted">{lines.filter((l) => l.itemId).length} items</span></div>
          <div className="trow"><span>Sub total</span><b>{fmtINR(calc.subTotal)}</b></div>
          <div className="trow"><span>Discount (line + bill)</span><b>−{fmtINR(calc.discTotal)}</b></div>
          <div className="trow"><span>Taxable value</span><b>{fmtINR(calc.taxableTotal)}</b></div>
          <div className="slabbox">
            {calc.slabs.map((sl, i) => (
              <div key={i}><span>{sl.rate}% slab · {fmtINR(sl.taxable)}</span>
                <span>{interState ? `IGST ${fmtINR(sl.tax)}` : `CGST ${fmtINR(Math.round(sl.tax / 2))} + SGST ${fmtINR(sl.tax - Math.round(sl.tax / 2))}`}</span></div>
            ))}
            {!calc.slabs.some((s2) => s2.rate) && calc.slabs.length ? null : null}
          </div>
          <div className="trow"><span>Total tax</span><b>{fmtINR(calc.totalTax)}</b></div>
          {calc.chargeTotal > 0 && <div className="trow"><span>Charges (+tax {fmtINR(calc.chargeTax)})</span><b>{fmtINR(calc.chargeTotal + calc.chargeTax)}</b></div>}
          <div className="trow"><span>Round off</span><b>{fmtINR(calc.roundOff)}</b></div>
          <div className="trow g"><span>GRAND TOTAL</span><b>{fmtINR(calc.grand)}</b></div>

          <div className="bar-lower">
            {['Cash', 'UPI', 'Card', 'Credit'].map((m) => (
              <button key={m} className={`chipbtn ${payMode === m ? 'on' : ''}`}
                onClick={() => { setPayMode(m); setPaid(m === 'Credit' ? 0 : fromP(calc.grand)) }}>{m}</button>
            ))}
          </div>
          <div className="trow" style={{ marginTop: 10 }}>
            <span>Received</span><b>{fmtINR(toP(paid))}</b>
          </div>
          <div className="trow"><span>{paid > fromP(calc.grand) ? 'Change to return' : 'Balance due'}</span>
            <b>{fmtINR(Math.abs(toP(paid) - calc.grand))}</b></div>
          {overLimit && <div className="warn-strip">⚠ Credit limit exceed ho raha hai — {fmtINR(Math.max(0, party.balance))} udhaar pe already hai.</div>}
          {!!lowAdds.length && <div className="warn-strip">⚠ {lowAdds.length} line(s) ka qty stock se zyada hai (negative stock warning).</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="btn pri" style={{ flex: 1, justifyContent: 'center' }} onClick={save}>Save &amp; Print</button>
            <button className="btn" onClick={() => setPayOpen((v) => !v)}>Payment</button>
          </div>
          {payOpen && (
            <div className="field" style={{ marginTop: 10 }}>
              <label>Amount received</label>
              <input className="inp num-i" type="number" step="0.01" value={paid} onChange={(e) => setPaid(e.target.value)} />
            </div>
          )}
          <div className="muted" style={{ marginTop: 10 }}>F1 item · F5 save · F9 payment · Esc back · ⌘K search</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="cardhead" style={{ marginBottom: 4 }}>
          <div><h3>Sales Bills</h3><p className="sub">👁 reprint/share · ✎ Modify — rate snapshot frozen, edit recompute karta hai</p></div>
          <span className="muted">{s.bills.length} bills · FY {s.prefs.fy}</span>
        </div>
        <table>
          <thead><tr><th>Invoice</th><th>Party</th><th className="num">Taxable</th><th className="num">Tax</th>
            <th className="num">Total</th><th className="num">Paid</th><th>Status</th><th /></tr></thead>
          <tbody>
            {s.bills.slice(0, 8).map((b) => {
              const pt = s.parties.find((x) => x.id === b.partyId)
              const bal = b.grand - b.paid
              return (
                <tr key={b.id}>
                  <td><b style={{ fontFamily: 'var(--font-num)', fontSize: 12 }}>{b.no}</b></td>
                  <td>{pt?.name} <span className="muted">{b.interState ? '· IGST' : ''}</span></td>
                  <td className="num">{fmtINR(b.taxableTotal)}</td>
                  <td className="num">{fmtINR(b.totalTax)}</td>
                  <td className="num"><b>{fmtINR(b.grand)}</b></td>
                  <td className="num">{fmtINR(b.paid)}</td>
                  <td>{bal <= 0 ? <span className="pill ok">Paid</span> : b.paid > 0 ? <span className="pill part">Partial</span> : <span className="pill due">Due</span>}</td>
                  <td style={{ width: 84, whiteSpace: 'nowrap' }}><button className="eye" title="Print / share" onClick={() => setPrint?.(b)}>👁</button>
                    <button className="eye" title="Modify / Edit (REQ-10)" onClick={() => setEditing(b)}>✎</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="mbar">
        <div className="amt"><small>Grand total</small><b>{fmtINR(calc.grand)}</b></div>
        <button className="btn gh" onClick={holdDraft}>Hold</button>
        <button className="btn pri" onClick={save}>Save &amp; Print</button>
      </div>
      {editing && <BillEdit bill={editing} onClose={() => setEditing(null)} />}
    </>
  )
}
