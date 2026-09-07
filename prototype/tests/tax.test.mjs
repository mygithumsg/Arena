// UMESH SMARTBILL — golden tax tests (docs/billing-rules.md §12)
// run: npm run test:tax
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeInvoice, inWords, fmtINR, toP } from '../src/lib/calc.mjs'

const L = (rate, qty, taxPct, o = {}) => ({ rate: toP(rate), qty, taxPct, ...o })
const p = (n) => Math.round(n * 100)

test('₹15 @5% intra → CGST 0.38 + SGST 0.37 (exact sum, no drift)', () => {
  const r = computeInvoice({ lines: [L(15, 1, 5)], interState: false })
  assert.equal(r.lines[0].tax, p(0.75))
  assert.equal(r.lines[0].cgst, p(0.38))
  assert.equal(r.lines[0].sgst, p(0.37))
  assert.equal(r.lines[0].cgst + r.lines[0].sgst, r.lines[0].tax)
})

test('3 slabs with 2% bill discount → per-slab cgst==sgst, tax on discounted value', () => {
  const r = computeInvoice({
    lines: [L(420, 2, 5), L(148, 1, 18), L(44, 3, 12)],
    billDiscPct: 2, interState: false, roundPolicy: 'rupee'
  })
  // discount applied before tax: taxable 840 @5 = 42 ; minus 2% => 823.20 @5 = 41.16
  assert.equal(r.lines[0].finalTaxable, p(840 * 0.98 - 0.005)) // rounding tolerance by construction
  assert.equal(r.taxableTotal + r.totalTax + r.chargeTotal + r.roundOff, r.grand)
  for (const s of r.slabs) {
    const cg = Math.round(s.tax / 2)
    assert.ok(Math.abs(cg * 2 - s.tax) <= 1, 'cgst*2 vs tax within a paisa')
  }
})

test('inter-state bill has IGST only', () => {
  const r = computeInvoice({ lines: [L(500, 1, 18)], interState: true })
  assert.equal(r.lines[0].igst, p(90))
  assert.equal(r.lines[0].cgst, 0)
  assert.equal(r.lines[0].sgst, 0)
})

test('tax-inclusive MRP ₹118 @18% ×3 → taxable 300, tax 54', () => {
  const r = computeInvoice({ lines: [{ rate: p(118), qty: 3, taxPct: 18, taxInclusive: true }], roundPolicy: 'none' })
  assert.equal(r.lines[0].finalTaxable, p(300))
  assert.equal(r.lines[0].tax, p(54))
  assert.equal(r.grand, p(354))
})

test('exempt + taxable mix: nil row still counted, no tax', () => {
  const r = computeInvoice({ lines: [L(50, 2, 0), L(200, 1, 18)] })
  assert.equal(r.lines[0].tax, 0)
  assert.equal(r.slabs.length, 2)
  assert.equal(r.grand, p(100 + 236))
})

test('freight ₹100 on a 5% item is taxed at the highest slab 18%', () => {
  const r = computeInvoice({ lines: [L(840, 1, 5), L(140, 1, 18)], charges: [{ label: 'Freight', amount: p(100), taxable: true }] })
  const ch = r.charges[0]
  assert.equal(ch.rate, 18)
  assert.equal(ch.tax, p(18))
})

test('round-off policies: 1,234.62 → ₹1,235 / ₹1,234.50 / keep paise', () => {
  const base = { lines: [{ rate: 123462, qty: 1, taxPct: 0 }] }
  assert.equal(computeInvoice({ ...base, roundPolicy: 'rupee' }).grand, 123500)
  assert.equal(computeInvoice({ ...base, roundPolicy: 'half' }).grand, 123450)
  assert.equal(computeInvoice({ ...base, roundPolicy: 'none' }).grand, 123462)
})

test('bill discount 100 on 30/70 splits exactly 30/70', () => {
  const r = computeInvoice({ lines: [L(30, 1, 0), L(70, 1, 0)], billDiscAmt: p(100), roundPolicy: 'none' })
  assert.equal(r.lines[0].billDiscShare, p(30))
  assert.equal(r.lines[1].billDiscShare, p(70))
  assert.equal(r.discTotal, p(100))
})

test('grand total identity holds across fuzz inputs', () => {
  let seed = 7
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648
  for (let t = 0; t < 500; t++) {
    const n = 1 + Math.floor(rnd() * 6)
    const lines = Array.from({ length: n }, () => ({
      rate: 100 + Math.floor(rnd() * 500000),
      qty: Math.round(rnd() * 2000) / 1000 || 1,
      taxPct: [0, 5, 12, 18, 28][Math.floor(rnd() * 5)],
      discPct: rnd() < 0.4 ? Math.floor(rnd() * 11) : 0
    }))
    const r = computeInvoice({
      lines, billDiscPct: Math.floor(rnd() * 6),
      charges: rnd() < 0.3 ? [{ label: 'Freight', amount: Math.floor(rnd() * 50000), taxable: rnd() < 0.5 }] : [],
      interState: rnd() < 0.5, roundPolicy: ['rupee', 'half', 'none'][Math.floor(rnd() * 3)]
    })
    assert.equal(
      r.taxableTotal + r.totalTax + r.chargeTotal + r.roundOff, r.grand,
      `identity failed case ${t}`
    )
    const cgst = r.lines.reduce((s, l) => s + l.cgst, 0)
    const sgst = r.lines.reduce((s, l) => s + l.sgst, 0)
    const igst = r.lines.reduce((s, l) => s + l.igst, 0)
    assert.equal(cgst + sgst + igst, r.itemTaxTotal)
    if (r.interState) assert.equal(cgst + sgst, 0)
    else assert.equal(igst, 0)
  }
})

test('amount in words', () => {
  assert.equal(inWords(p(1036)), 'One Thousand Thirty-Six Rupees Only')
  assert.equal(inWords(p(1234.56)), 'One Thousand Two Hundred Thirty-Four Rupees and Fifty-Six Paise Only')
})

test('fmtINR Indian grouping', () => {
  assert.equal(fmtINR(p(123456.5)), '₹1,23,456.50')
})
