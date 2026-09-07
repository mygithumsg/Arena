// ============================================================================
// UMESH SMARTBILL — tax & rounding engine (spec: docs/billing-rules.md)
// All money = integer PAISE to avoid float drift. Round only at each step.
// ============================================================================

export const toP = (n) => Math.round(Number(n) * 100)
export const fromP = (p) => p / 100

export function fmtINR(paise, { sign = false } = {}) {
  const neg = paise < 0
  const v = Math.abs(Math.round(paise))
  const rupee = Math.floor(v / 100)
  const p = String(v % 100).padStart(2, '0')
  const s = String(rupee)
  // Indian grouping: last 3, then pairs
  let out = ''
  if (s.length > 3) {
    out = s.slice(0, -3)
    out = out.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + s.slice(-3)
  } else out = s
  return `${neg ? '-' : sign ? '+' : ''}₹${out}.${p}`
}

const roundDiv = (n, d) => Math.round(n / d) // half-up on integers

/**
 * lines: [{ id, qty, rate (paise), discPct, discAmt (paise, overrides pct),
 *           taxPct, taxInclusive }]
 * billDiscPct/Amount applied on line taxables, pro-rata, last line absorbs residual.
 * charges: [{ label, amount (paise), taxable }] -> taxable at max item slab.
 */
export function computeInvoice({
  lines = [],
  billDiscPct = 0,
  billDiscAmt = 0,
  charges = [],
  interState = false,
  roundPolicy = 'rupee' // rupee | half | none
}) {
  // 1. gross & line discount
  const L = lines.map((ln) => {
    const qty = Number(ln.qty) || 0
    let gross = Math.round(qty * (ln.rate || 0))
    let taxPct = Number(ln.taxPct) || 0
    let taxable = gross
    if (ln.taxInclusive) {
      taxable = Math.round(gross / (1 + taxPct / 100))
    }
    const disc = ln.discAmt != null && ln.discAmt !== ''
      ? Math.max(0, Math.round(Number(ln.discAmt) || 0))
      : Math.round((taxable * (Number(ln.discPct) || 0)) / 100)
    taxable = Math.max(0, taxable - disc)
    return { ...ln, qty, gross, taxPct, discPct: Number(ln.discPct) || 0, discAmt: disc, taxable }
  })

  // 2. bill discount distributed pro-rata on line taxable values
  const base = L.reduce((s, l) => s + l.taxable, 0)
  let billDisc = billDiscAmt
    ? Math.round(Number(billDiscAmt) || 0)
    : Math.round((base * (Number(billDiscPct) || 0)) / 100)
  billDisc = Math.max(0, Math.min(billDisc, base))

  let shareSoFar = 0
  L.forEach((l, i) => {
    let share = 0
    if (billDisc > 0 && base > 0) {
      share = i === L.length - 1
        ? billDisc - shareSoFar
        : Math.round((l.taxable * billDisc) / base)
      shareSoFar += share
    }
    l.billDiscShare = share
    l.finalTaxable = Math.max(0, l.taxable - share)
    // 3. tax per line on final taxable (post-discount, per GST §4 rule)
    l.tax = Math.round((l.finalTaxable * l.taxPct) / 100)
    if (interState) {
      l.cgst = 0; l.sgst = 0; l.igst = l.tax
    } else {
      l.cgst = roundDiv(l.tax, 2)
      l.sgst = l.tax - l.cgst // sum exact, no 1-paisa drift
      l.igst = 0
    }
    l.amount = l.finalTaxable + l.tax
  })

  const subTotal = L.reduce((s, l) => s + l.gross, 0)
  const discTotal = L.reduce((s, l) => s + l.discAmt + l.billDiscShare, 0)
  const taxableTotal = L.reduce((s, l) => s + l.finalTaxable, 0)
  const itemTaxTotal = L.reduce((s, l) => s + l.tax, 0)

  // 4. charges: taxable ones take the HIGHEST slab among items (sec 15(2)(b))
  const maxSlab = L.reduce((m, l) => Math.max(m, l.taxPct), 0)
  const C = charges.map((c) => {
    const amount = Math.round(Number(c.amount) || 0)
    const taxable = !!c.taxable
    const rate = taxable ? maxSlab : 0
    const tax = taxable ? Math.round((amount * rate) / 100) : 0
    let cgst = 0, sgst = 0, igst = 0
    if (tax > 0) {
      if (interState) igst = tax
      else { cgst = roundDiv(tax, 2); sgst = tax - cgst }
    }
    return { label: c.label || 'Other charges', amount, taxable, rate, tax, cgst, sgst, igst }
  })
  const chargeTotal = C.reduce((s, c) => s + c.amount, 0)
  const chargeTax = C.reduce((s, c) => s + c.tax, 0)

  const totalTax = itemTaxTotal + chargeTax
  const beforeRound = taxableTotal + totalTax + chargeTotal
  // 5. round-off on grand total
  let grand = beforeRound
  if (roundPolicy === 'rupee') grand = roundDiv(beforeRound, 100) * 100
  else if (roundPolicy === 'half') grand = roundDiv(beforeRound, 50) * 50
  const roundOff = grand - beforeRound

  // slab summary (for invoice B2B group table + GSTR-1 export later)
  const slabMap = new Map()
  const addSlab = (rate, taxable, tax) => {
    const k = String(rate)
    const s = slabMap.get(k) || { rate: Number(rate), taxable: 0, tax: 0 }
    s.taxable += taxable; s.tax += tax
    slabMap.set(k, s)
  }
  L.forEach((l) => addSlab(l.taxPct, l.finalTaxable, l.tax))
  C.forEach((c) => { if (c.taxable) addSlab(c.rate, c.amount, c.tax) })
  const slabs = [...slabMap.values()].sort((a, b) => b.rate - a.rate)

  return {
    lines: L,
    charges: C,
    subTotal,
    discTotal,
    taxableTotal,
    itemTaxTotal,
    chargeTotal,
    chargeTax,
    totalTax,
    roundOff,
    grand,
    interState,
    slabs
  }
}

/** Amount in words, Indian numbering (invoice footer). */
export function inWords(paise) {
  const n = Math.floor(Math.abs(paise) / 100)
  const p = Math.abs(paise) % 100
  if (n === 0 && p === 0) return 'Zero Rupees Only'
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const two = (v) => (v < 20 ? ones[v] : tens[Math.floor(v / 10)] + (v % 10 ? '-' + ones[v % 10] : ''))
  const three = (v) => (v >= 100 ? ones[Math.floor(v / 100)] + ' Hundred' + (v % 100 ? ' ' + two(v % 100) : '') : two(v))
  let rest = n, words = ''
  const crore = Math.floor(rest / 10000000); rest %= 10000000
  const lakh = Math.floor(rest / 100000); rest %= 100000
  const thousand = Math.floor(rest / 1000); rest %= 1000
  const hun = rest
  if (crore) words += three(crore) + ' Crore '
  if (lakh) words += three(lakh) + ' Lakh '
  if (thousand) words += three(thousand) + ' Thousand '
  if (hun) words += three(hun) + ' '
  let out = (words.trim() || 'Zero') + ' Rupee' + (n !== 1 ? 's' : '')
  if (p) out += ' and ' + two(p) + ' Paise'
  return out + ' Only'
}
