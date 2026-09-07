# UMESH SMARTBILL — Billing, Tax & Rounding Rules (Engineering Spec)

Ye document developer ka single source of truth hai. Har rule ke saath **test case** chahiye — `taxEngine.spec.ts` mein golden fixtures.

---

## 1. Money representation

| Rule | Detail |
|---|---|
| Storage | `NUMERIC(14,2)` in DB; **integer paise (BIGINT)** preferred in API/JS to avoid float drift |
| In JS | never `0.1 + 0.2`. Use `bigint` paise or `big.js`/`decimal.js`. Round only at the last step |
| Precision | qty up to 3 decimals (KG: 1.250), rate up to 2, tax rate 2 (18.00), weight 3 |
| Display | `₹1,23,456.00` Indian grouping (lakh/crore), right-aligned, tabular mono font |

```ts
// canonical helpers
paise(x: number): bigint            // 1234.56 -> 123456n
fromPaise(p: bigint): string        // 123456n -> "1,234.56"
roundHalfUp(p: bigint, to: 1 | 0.5 | 0): bigint   // ₹1 / ₹0.50 / none
```

---

## 2. Invoice numbering

- Format: `{prefix}/{FY}/{seq}` → `USB/26-27/000421`
- `prefix` per document type + per branch (INV, RET, QUO, CHR, CRN, DN, PUR)
- FY = `26-27` (1 Apr → 31 Mar). Sequence resets to 1 on 1 Apr; old series never reused.
- **Server-authoritative**: client pre-fetches a block of 500 numbers (`allocateNumberBlock`) and consumes locally while offline → no gaps/duplicates.
- Gap detection: nightly job flags missing seq; UI shows "numbering integrity: OK / 2 gaps".
- Once **printed**, invoice becomes `amendment-locked`: edits create an internal revision (`rev`, `prev_hash`) — original PDF snapshot retained (tamper evidence).

---

## 3. Line-level calculation (order matters)

For each line `i`:

```
qty          = user qty (or qty_per_pack * packs)
gross_rate   = rate from price list (or manual override, guarded by role)
line_gross   = qty * gross_rate                            // paise
line_disc    = line_discount_pct ? round2(line_gross * pct/100) : flat_disc_value
taxable_i    = line_gross - line_disc                       // = "Taxable Value / Assessable Value"
```

## 4. Bill-level discount distribution

```
bill_disc_base = Σ taxable_i
bill_disc_total = round2(bill_disc_base * bill_disc_pct/100)
share_i   = round2(taxable_i * bill_disc_total / bill_disc_base)
#last line absorbs residual:
share_last = bill_disc_total - Σ share_i (others)
final_taxable_i = taxable_i - share_i
```
Rationale: GST law (Rule 34 + CBIC circulars) — discount in invoice reduces **taxable value**, so tax is recomputed per line after discount. Do **not** simply subtract discount from grand total.

## 5. Tax computation

```
taxable_total = Σ final_taxable_i
tax_i  = round2(final_taxable_i * rate_i/100)      // per line, per tax component
```

| Supply type | Condition | Components |
|---|---|---|
| Intra-state | supplier state == place-of-supply state | `CGST = tax/2`, `SGST = tax/2` |
| Inter-state | states differ (or export/SEZ/DEIH) | `IGST = tax` |
| UT with own legislature (J&K, Ladakh, Puducherry, Chandigarh, Delhi*, Andaman) | treat as IGST per rule | `IGST` |
| Nil / exempt | rate 0 or scheme | tax columns show `—`, HSN still printed |
| Composition dealer | `compound = taxable * comp_rate` | no tax shown to buyer; "Tax is payable on reverse charge basis by recipient" note |

**Half-split without drift:**
```
cgst = round2(tax_i / 2)
sgst = tax_i - cgst          // guarantees cgst+sgst == tax_i exactly
```

## 6. Charges (freight / packing / loading / transport / insurance / round-off)

| Charge | Taxable? | Handling |
|---|---|---|
| Freight / packing / loading when charged by us | Yes — **sec 15(2)(b)** — takes item's rate; **if mixed items with different slabs, highest slab applies** | add to taxable pro-rata; store original split in `DocumentCharge` |
| Insurance, handling, design/sales promotion | Yes (value-inclusion list) | same as freight |
| Actual AG/reimbursement against third-party invoice (e.g. courier bill passed at cost) | No, if documented | exempt row |
| Interest / late fee / penalty for delayed payment | **Exempt** (declared, must be shown separately, max 1000%/y loan-scope) | separate non-taxable row + note |
| Trade discount on invoice | reduces value | per §4 |
| Cash discount for *prompt* payment (post-supply) | no value reduction | must be in agreement + reversal of ITC on non-payment: model as Credit Note flow |
| Rounding off | — | on **grand total incl. tax**, per policy below |

```
sub_total   = Σ (final_taxable_i + taxable_charges_i)
total_tax   = Σ (cgst + sgst + igst + cess)
before_round= sub_total + total_tax + non_taxable_charges + cess_nonvat(if any) - bill_discount_already_in
grand       = round_off(before_round, policy)     // policy: nearest ₹1 | ₹0.5 | up | down | none
round_off_row = grand - before_round               // printed as separate line "Round Off"
```

## 7. Round-off policies (user-selectable in Settings)
1. `NEAREST_RUPEE` (default) — `2.5 → 3`, `2.4 → 2` (half-up)
2. `HALF_RUPEE` — nearest 0.50 (retail)
3. `NONE` — keep paise (B2B preferred by CAs)
4. `UP`, `DOWN` — for MRP-locked retailers (legal metrology: cannot exceed MRP)

## 8. Tax-inclusive (MRP) billing
```
if line.tax_inclusive:
    gross_rate = MRP * qty
    taxable_i  = round2(gross_rate / (1 + rate/100))
    tax_i      = gross_rate - taxable_i
else:
    taxable_i  = rate * qty
    tax_i      = round2(taxable_i * rate/100)
```
MRP ceiling check: warn if computed total > Σ(MRP × qty) → Legal Metrology (PC&R) Rules violation.

## 9. Returns / Credit Notes
- `credit_note.type ∈ {SALES_RETURN, PRICE_DIFFERENCE, EXTRA_DISCOUNT, SHORT_SUPPLY}`
- Sales return → reversal of tax on returned qty at **original invoice rate**; restocks items with original batch; refund or adjust to party ledger.
- Price difference → no stock movement, only value+tax reversal (GSTR-1 table 9B/9C).
- Debit note: for sales returns *received from* supplier's price change, or interest recovery.
- Cap: rule per GST — 6-month window / one filing cycle for ITC reversal notice (show warning, don't hard-block).

## 10. Payments & Allocation
```
apply_amount = min(paid, oldest_unpaid_amount) in FIFO unless manual
outstanding_party = Σ unpaid + interest_flag? no interest engine in v1 (add P3)
advance > bill  → PartyAdvance balance (never negative ledger without role allow)
part_payment    → bill.status = PART_PAID (paid_amount, balance_amount)
refund          → negative PaymentIn or PaymentOut with ref_type = CREDIT_NOTE
```
Status machine: `DRAFT → POSTED → (PART_PAID | PAID) → CANCELLED | AMENDED`; only `POSTED` moves stock. `DRAFT` = hold bill.

## 11. Inventory rules
- Movement on post: `qty -ve` for sale, `+ve` for purchase, `±ve` adjust.
- `reserved_qty` from Sales Order/Quotation (optional setting) → `available = on_hand - reserved`.
- Costing: **FIFO** with batch layers (`stock_layers` rows); COGS = consumed layers' cost. Moving average as alternate.
- Negative stock: `BLOCK` (default for serial/batch items) / `WARN` / `ALLOW` per role.
- Physical count variance → auto Stock-in/Stock-out vouchers with reason code + user + timestamp (never silent adjust).
- Serial (IMEI) items: exact qty match required, serials must be `IN` before `SOLD`.
- Batch/expiry: FEFO pick order suggestion; near-expiry (≤90d) flagged in bill with "check expiry" warning; expired batch **blocked from sale** (configurable) + auto saleable-return workflow (pharma).

## 12. Golden test fixtures (ship with MVP)
Must have ≥ 200 cases; these 12 are mandatory:

| # | Case | Expected |
|---|---|---|
| 1 | 3 items 5%/12%/18%, intra, bill disc 2% | per-line tax sums exactly to `total_tax`; cgst==sgst |
| 2 | Odd tax: ₹101 @18% intra | tax=18.18 → cgst 9.09 + sgst 9.09 |
| 3 | ₹15 @5% odd split | cgst 0.38 + sgst 0.37 = 0.75 (no 0.38+0.38) |
| 4 | Inter-state single item | IGST only, no CGST/SGST columns |
| 5 | Tax-inclusive MRP ₹118 @18% ×3 | taxable 300, tax 54, grand 354, round_off 0 |
| 6 | Exempt item + taxable item mixed | "Nil/Exempt" row, HSN printed, total fine |
| 7 | Freight ₹100 taxable@18% on 5% item | freight taxed at **18%** (highest slab), items unchanged |
| 8 | Freight on single-slab 12% bill | taxed at 12% |
| 9 | Round-off: total 1,234.625 | grand 1,235 (NEAREST) / 1,234.50 (HALF) / 1,234.63 (NONE) |
| 10 | Bill disc 100 on 2 lines 30/70 | shares 30/70 exactly, no 1-rupee drift |
| 11 | Credit note for 1 of 5 returned qty | tax reversed at original rate; stock +1 that batch |
| 12 | Two devices offline create bills simultaneously | unique numbers, both sync, no overwrite; ledger Σ matches |

## 13. Print-layout correctness checklist (every template)
GSTIN + "Regular / Composition" · invoice type + original-for-buyer/duplicate-for-recipient · invoice no/date · **place of supply with state code** · HSN (4/6 digit per turnover rule) · taxable value & tax shown **separately per slab** (5/12/18/28 group table for B2B) · CGST/SGST/IGST rows + amount in words (for challan/e-invoice QR) · e-invoice QR (IRN) if applicable · supplier declaration + signature + name · "computer generated invoice" footer · transport/vehicle for challan · page x-of-y with repeated header.

## 14. Localization
- Numerals & date format `DD MMM YYYY` (EN) / `12 सितंबर 2026` (HI)
- Tax labels: CGST/SGST/IGST + Hindi subtitle optional
- Units in Hindi (`नंग/इकाई`, `किग्रा`, `लीटर`); state names bilingual
- Amount in words both EN + HI (invoice needs one — user setting)
