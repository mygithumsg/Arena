// ============================================================================
// UMESH SMARTBILL — local-first store (prototype: localStorage, v1: Dexie+sync)
// ============================================================================
import { toP } from './calc.mjs'

const KEY = 'umesh_smartbill_v1'

// ---- seed catalogue (agri / seeds vertical) --------------------------------
const P = toP
export const seedState = () => ({
  company: {
    name: 'UMESH SMARTBILL', legal: 'Umesh Krishi Beej Bhandar',
    gstin: '22AAAAA0000A1Z5', stateCode: '22', stateName: 'Chhattisgarh',
    addr: 'Main Bazaar Road, Ambikapur, Surguja, CG – 497001',
    phone: '+91 90000 00000', upi: 'umeshseeds@okhdfcbank',
    bank: 'HDFC Bank ••••1234 · IFSC HDFC0001234', licence: 'CG/SEED/LIC/2024/4471'
  },
  prefs: { roundPolicy: 'rupee', prefix: 'USB', fy: '26-27', nextSeq: 143, language: 'en' },
  taxSlabs: [0, 0.25, 3, 5, 12, 18, 28],
  items: [
    { id: 'ITM01', sku: 'ATTA5', name: 'Aashirvaad Atta 5kg', unit: 'PCS', hsn: '1101', taxPct: 5, rate: P(420), retail: P(450), wholesale: P(420), mrp: P(455), stock: 24, min: 10, kind: 'grocery' },
    { id: 'ITM02', sku: 'OIL1', name: 'Fortune Sunflower Oil 1L', unit: 'PCS', hsn: '1512', taxPct: 18, rate: P(148), retail: P(158), wholesale: P(148), mrp: P(165), stock: 40, min: 12, kind: 'grocery' },
    { id: 'ITM03', sku: 'SUG1', name: 'Sugar 1kg', unit: 'PCS', hsn: '1701', taxPct: 5, rate: P(44), retail: P(46), wholesale: P(44), mrp: P(48), stock: 60, min: 20, kind: 'grocery' },
    { id: 'ITM04', sku: 'RICE25', name: 'Sona Masoori Rice 25kg Bag', unit: 'BAG', hsn: '1006', taxPct: 5, rate: P(1350), retail: P(1395), wholesale: P(1350), mrp: P(1450), stock: 9, min: 10, kind: 'grocery' },
    { id: 'ITM05', sku: 'DAL1', name: 'Toor Dal 1kg', unit: 'PCS', hsn: '0713', taxPct: 5, rate: P(168), retail: P(175), wholesale: P(168), mrp: P(180), stock: 35, min: 15, kind: 'grocery' },
    { id: 'ITM06', sku: 'SEEDMUST', name: 'Mustard Seed Pioneer 450g Pkt', unit: 'PCS', hsn: '1207', taxPct: 5, rate: P(1150), retail: P(1195), wholesale: P(1150), mrp: P(1250), stock: 6, min: 8, kind: 'seed' },
    { id: 'ITM07', sku: 'SEEDWHEAT', name: 'Wheat Seed HD-3086 40kg', unit: 'BAG', hsn: '1001', taxPct: 12, rate: P(1480), retail: P(1530), wholesale: P(1480), mrp: P(1550), stock: 22, min: 10, kind: 'seed' },
    { id: 'ITM08', sku: 'FERTDAP', name: 'DAP Fertilizer 50kg', unit: 'BAG', hsn: '3105', taxPct: 12, rate: P(2100), retail: P(2160), wholesale: P(2100), mrp: P(2200), stock: 4, min: 15, kind: 'fert' },
    { id: 'ITM09', sku: 'SVC5', name: 'Service: Farm Advisory (per visit)', unit: 'TRIP', hsn: '9983', taxPct: 18, rate: P(500), retail: P(600), wholesale: P(500), mrp: 0, stock: 0, min: 0, kind: 'svc', service: true }
  ],
  parties: [
    { id: 'GST01', kind: 'customer', name: 'Gupta General Store', gstin: '22AAGCG1234F1Z2', stateCode: '22', creditLimit: P(50000), balance: P(12400), phone: '90000 11111', priceMode: 'retail', customRates: {} },
    { id: 'GST02', kind: 'customer', name: 'Sharma Agro Inputs', gstin: '23AAECS5678K1Z9', stateCode: '23', creditLimit: P(80000), balance: P(45200), phone: '90000 22222', priceMode: 'wholesale', customRates: { ITM01: P(410), ITM02: P(143) } },
    { id: 'GST03', kind: 'supplier', name: 'Krisha Distributors Raipur', gstin: '22AAFCK9012M1ZP', stateCode: '22', creditLimit: 0, balance: -P(18500), phone: '90000 33333', priceMode: 'wholesale', customRates: {} },
    { id: 'CASH', kind: 'customer', name: 'Walk-in / Cash Counter', gstin: '', stateCode: '22', creditLimit: 0, balance: 0, phone: '', priceMode: 'retail', customRates: {} }
  ],
  bills: [],
  payments: [],
  dayCloses: []
})

// demo history so dashboard has life on first open
export function seedDemo(state) {
  if (state.bills.length) return state
  const out = []
  let seq = 100
  for (let d = 6; d >= 0; d--) {
    const n = 4 + ((d * 3) % 5)
    for (let i = 0; i < n; i++) {
      const dt = new Date(); dt.setDate(dt.getDate() - d)
      const items = state.items.filter((x) => !x.service)
      const l1 = items[(d + i) % items.length]
      const l2 = items[(d + i + 3) % items.length]
      const qty1 = 1 + ((i + d) % 3), qty2 = 1 + (i % 2)
      const bill = buildBill({
        company: state.company, prefs: { ...state.prefs, nextSeq: ++seq },
        partyId: state.parties[i % 3].id, date: dt.toISOString().slice(0, 10),
        lines: [
          { itemId: l1.id, qty: qty1, rate: l1.rate, discPct: i % 2 ? 2 : 0, taxPct: l1.taxPct },
          { itemId: l2.id, qty: qty2, rate: l2.rate, discPct: 0, taxPct: l2.taxPct }
        ],
        billDiscPct: 0, charges: [], interState: state.parties[i % 3].stateCode !== '22',
        roundPolicy: 'rupee'
      })
      out.push({ ...bill, paid: i % 3 === 0 ? 0 : bill.grand, mode: i % 3 === 0 ? 'Credit' : 'UPI' })
    }
  }
  state.bills = out
  return state
}

// ---- pure helpers shared by store + screens --------------------------------
import { computeInvoice } from './calc.mjs'

// rate resolution (REQ-9 > REQ-3/8): party custom rate > party price-mode default
export function resolveRate(item, party, priceMode) {
  const mode = priceMode || party?.priceMode || 'retail'
  const cust = party?.customRates?.[item.id]
  if (cust != null && cust !== '') return { rate: Math.round(Number(cust) || 0), from: 'custom' }
  const v = mode === 'wholesale' ? (item.wholesale ?? item.rate) : (item.retail ?? item.rate)
  return { rate: Math.round(Number(v) || 0), from: mode }
}

// FROZEN SNAPSHOT (REQ-11): rates/qty/tax are COPIED into the bill at save time.
// Editing catalog rates NEVER rewrites a saved invoice.
export function buildBill({ company, prefs, partyId, date, lines, billDiscPct = 0, billDiscAmt = 0, charges = [], interState, roundPolicy = 'rupee', notes = '', priceMode, createdAt }) {
  const calcLines = lines.map((l) => ({ ...l }))
  const calc = computeInvoice({
    lines: calcLines, billDiscPct, billDiscAmt, charges,
    interState: !!interState, roundPolicy
  })
  const seq = String(prefs.nextSeq).padStart(4, '0')
  const no = `${prefs.prefix}/${prefs.fy}/${seq}`
  return {
    id: 'B' + Date.now() + Math.floor(Math.random() * 999),
    no, date, partyId, priceMode: priceMode || 'retail',
    createdAt: createdAt || new Date().toISOString(),
    lines: calc.lines,
    charges: calc.charges,
    subTotal: calc.subTotal, discTotal: calc.discTotal, taxableTotal: calc.taxableTotal,
    totalTax: calc.totalTax, chargeTotal: calc.chargeTotal, roundOff: calc.roundOff,
    grand: calc.grand, slabs: calc.slabs, interState: !!interState,
    paid: calc.grand, mode: 'Cash', notes, revision: 1
  }
}

// ---- persistence -------------------------------------------------------------
export function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* corrupt -> reseed */ }
  const s = seedDemo(seedState())
  save(s); return s
}
export function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* quota */ }
}
export function reset() { localStorage.removeItem(KEY) }

// ---- business ops -------------------------------------------------------------
export function saveBill(state, billDraft, { paid, mode, advance } = {}) {
  const inter = (() => {
    const p = state.parties.find((x) => x.id === billDraft.partyId)
    return p ? String(p.stateCode) !== String(state.company.stateCode) : false
  })()
  const bill = buildBill({
    company: state.company, prefs: state.prefs, interState: inter,
    roundPolicy: state.prefs.roundPolicy, ...billDraft
  })
  bill.lines = bill.lines.map((l) => ({ ...l, itemName: state.items.find((i) => i.id === l.itemId)?.name || '' }))
  bill.paid = Math.max(0, Math.round(paid))
  bill.mode = mode || 'Cash'
  if (advance) bill.advance = true
  const next = {
    ...state,
    prefs: { ...state.prefs, nextSeq: state.prefs.nextSeq + 1 },
    bills: [bill, ...state.bills],
    items: state.items.map((it) => {
      const q = bill.lines.filter((l) => l.itemId === it.id).reduce((s, l) => s + (Number(l.qty) || 0), 0)
      return q && !it.service ? { ...it, stock: Math.round((it.stock - q) * 1000) / 1000 } : it
    }),
    parties: state.parties.map((pt) => pt.id === bill.partyId
      ? { ...pt, balance: Math.round(pt.balance + (bill.grand - bill.paid)) } : pt)
  }
  save(next)
  return { state: next, bill }
}

export function daySummary(state, dateStr) {
  const bills = state.bills.filter((b) => b.date === dateStr)
  const sum = (k) => bills.reduce((s, b) => s + (b[k] || 0), 0)
  const credit = bills.reduce((s, b) => s + (b.grand - b.paid), 0)
  return {
    count: bills.length, gross: sum('grand'), discount: sum('discTotal'),
    tax: sum('totalTax'), credit, collected: sum('grand') - credit,
    byMode: bills.reduce((m, b) => { m[b.mode] = (m[b.mode] || 0) + b.grand; return m }, {})
  }
}
export function last7Days(state) {
  const out = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    out.push({ key, label: d.toLocaleDateString('en-IN', { weekday: 'short' }), total: daySummary(state, key).gross })
  }
  return out
}
export const lowStock = (state) => state.items.filter((i) => !i.service && i.stock < i.min)

// ---- REQ-5: har payment ka APNA receipt record (RCP no.), alag print/share ----
export function recordPayment(state, { partyId, amount, mode = 'Cash', forBillId = null, date = new Date().toISOString().slice(0, 10), note = '' }) {
  const amt = Math.max(0, Math.round(Number(amount) || 0))
  const payments = state.payments || []
  const receipt = {
    id: 'R' + Date.now(), no: `${state.prefs.prefix}-RCP-${String(payments.length + 101).padStart(4, '0')}`,
    date, partyId, amount: amt, mode, forBillId, note, createdAt: new Date().toISOString()
  }
  let bills = state.bills
  if (forBillId) bills = state.bills.map((b) => (b.id === forBillId ? { ...b, paid: Math.min(b.grand, b.paid + amt) } : b))
  const next = {
    ...state, payments: [...payments, receipt], bills,
    parties: state.parties.map((p) => (p.id === partyId ? { ...p, balance: p.balance - amt } : p))
  }
  save(next)
  return { state: next, receipt }
}

// ---- REQ-10: Modify/Edit posted bill — recompute, revision++, stock+ledger adjust ----
export function editBill(state, billId, patch) {
  const old = state.bills.find((b) => b.id === billId)
  if (!old) return { state }
  const lines = (patch.lines || old.lines).map((l) => ({ ...l }))
  const calc = computeInvoice({
    lines: lines.map((l) => ({ ...l, rate: Math.round(Number(l.rate) || 0), discAmt: l.discAmt ?? '' })),
    billDiscPct: patch.billDiscPct ?? 0, charges: patch.charges ?? old.charges ?? [],
    interState: old.interState, roundPolicy: state.prefs.roundPolicy
  })
  const updated = {
    ...old, ...patch,
    lines: calc.lines, charges: calc.charges,
    subTotal: calc.subTotal, discTotal: calc.discTotal, taxableTotal: calc.taxableTotal,
    totalTax: calc.totalTax, chargeTotal: calc.chargeTotal, roundOff: calc.roundOff, grand: calc.grand,
    slabs: calc.slabs, paid: Math.min(calc.grand, Math.round(patch.paid ?? old.paid)),
    revision: (old.revision || 1) + 1, editedAt: new Date().toISOString()
  }
  const delta = (b) => b.lines.reduce((m, l) => { if (l.itemId) m[l.itemId] = (m[l.itemId] || 0) + (Number(l.qty) || 0); return m }, {})
  const dOld = delta(old), dNew = delta(updated)
  const items = state.items.map((it) => {
    const d = (dNew[it.id] || 0) - (dOld[it.id] || 0)
    return d ? { ...it, stock: Math.round((it.stock - d) * 1000) / 1000 } : it
  })
  const balD = (updated.grand - updated.paid) - (old.grand - old.paid)
  const next = {
    ...state, items,
    bills: state.bills.map((b) => (b.id === billId ? updated : b)),
    parties: state.parties.map((p) => (p.id === updated.partyId ? { ...p, balance: p.balance + balD } : p)),
    audit: [...(state.audit || []), { t: new Date().toISOString(), what: `BILL_EDITED ${old.no} rev ${updated.revision}` }]
  }
  save(next)
  return { state: next, bill: updated }
}
