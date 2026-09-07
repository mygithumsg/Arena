# UMESH SMARTBILL — Product + Development Plan

> **Status:** Draft v1 · **Date:** 07 Sep 2026 · **Repo branch:** `arena/01a07b23-arena`
> **Note:** Aapne feature-list ka photo bhejne ki baat ki thi, par workspace mein koi image file nahi aayi. Ye plan Indian GST billing apps (Vyapar, myBillBook, Okcredit, Marg, Busy) ke proven patterns par bana hai. Photo milte hi main is plan ko aapki exact list se match/correct kar dunga — jo feature extra hoga delete, jo missing hoga add.

---

## 1. Product Vision

**One-liner:** Dukaan ka billing 10 second mein, GST reports 1 click mein, udhaar ka hisaab 1 screen par — offline bhi chale.

**Target user (primary):**
- Kirana / general store, mobile & electronics, hardware & sanitary, garments, medical store, cosmetics, stationery, auto-parts, coaching/repair counters
- Turnover: ₹5 lakh – ₹10 crore · Owner + 1–5 staff
- Device: Android phone (primary), Windows laptop/desktop (billing counter), kabhi internet, aksar nahi

**Positioning (3 pillars):**
1. **Fast** — 3 tap / 5 keystroke se bill print. Koi multi-page wizard nahi.
2. **Correct** — GST, HSN, rounding, returns, TDS — sab rules ke hisaab se; GSTR-1 ready data.
3. **Safe** — Offline-first + auto backup. Internet gaya toh dukaan nahi rukegi.

**Name/brand:** `UMESH SMARTBILL` — logo mark: **"U₹"** (U + rupee). Tagline: *"Bill karo. Business badhao."*

---

## 2. Success Metrics

| Metric | Target (launch + 6 months) |
|---|---|
| Time to create 5-item bill (trained user) | ≤ 12 sec |
| Bill create → print/PDF share conversion | ≥ 85% |
| Offline bills successfully synced | ≥ 99.5% |
| Paid conversion (free → paid) | ≥ 6% |
| Monthly retention (paid shops) | ≥ 90% |
| GSTR-1 export accepted by GST portal | 100% (zero rework) |
| Crash-free sessions | ≥ 99.7% |

---

## 3. Roles & Permissions (RBAC)

| Role | Kar sakta hai | Kar nahi sakta |
|---|---|---|
| **Owner** | Sab kuch, plan/billing settings, delete, reports, staff salaries | — |
| **Manager** | Bills, purchases, approvals, stock, reports (owner ko hide kiye hue financial fields ke alawa) | Plan change, role change, hard-delete |
| **Billing Cashier** | Sale bills, retail KOT, collect payment, print/SMS, customer add | Rate change, discount > limit, delete, purchase |
| **Stock Person** | Purchase entry, stock-in/out, items & rates, physical stock count | Sale bills delete, payment entries |
| **Accountant (external)** | Ledger, payments, reports, GSTR export, journal | Bill create/edit/delete, stock entries |
| **Admin (SaaS)** | Tenant management, plans, support impersonation (audited) | Business data edit/delete |

**Permission granularity:** har module par `view / create / edit / delete / approve` + numeric guards (max discount %, rate-edit allowed, price below cost visible).

---

## 4. Feature Modules (Master List)

Priority: **P0** = MVP mein must · **P1** = v1.1 · **P2** = v1.2+ · **P3** = future/nice-to-have

### M1 — Onboarding & Business Profile (P0)
Trade name, legal name, GSTIN (auto-parse: state code, check digit), state + address, FSSAI / Drug License / Shop-Act no., bank details, UPI QR upload, logo, invoice theme, HSN-wise GST slab default, financial year start, language (EN/HI + Marathi/Gujarati/Tamil/Bengali shell), pincode-based state autocomplete, sample-data seeder for demo.

### M2 — Items / Products (P0)
SKU + barcode (EAN-13/Code-128), name + alias (Hindi/local name), brand, category tree (3 level), unit (PCS/KG/LTR/MTR/BOX/PACK/DZ) + unit-conversion packs, HSN/SAC + tax rate, MRP / Excl-GST price / cost price (multi price list: Retail, Wholesale, Dealer, Staff). **REQ-3/8: `wholesale_rate` + `retail_rate` har item par MANDATORY fields**, cost ke saath margin auto-dikhao, bulk set (±₹/±%) + CSV columns — both always maintained, no optional toggle. GST rate 0/0.25/3/5/12/18/28, item type (Goods/Service/Combo — combo BOM se stock consume), batch + expiry (mandatory for pharma), serial number tracking (electronics/phones — IMEI), variant matrix (size/colour), image, min/max reorder level, tax-inclusive toggle, returnable/non-returnable, active/inactive, bulk import via CSV/Excel, bulk rate update (%/fixed), low-stock & near-expiry flags.

### M3 — Inventory / Stock (P0 → P1 advanced)
Live stock ledger per item-per-batch-per-godown (P1), auto-deduct on sale / add on purchase, manual **Stock-in / Stock-out / Stock-transfer** (godown to godown, P1), **Physical stock count sheet** with variance + auto adjusting entry (P0-lite), purchase order (P1) → GRN against PO with short/excess handling, sales order → convert to invoice, negative-stock policy (block / warn / allow by role), dead & slow-moving tracker, reorder suggestions from last-90-day velocity, costing method: **FIFO** (default) with moving-average option (P1), stock valuation report at cost & at sale price, expiry report buckets (0–30/31–60/61–90/90+).

### M4 — Parties (Customers + Suppliers) (P0)
Single "Party" table + role flag (Customer/Supplier/Both), GSTIN + unregistered flag, trade name vs legal name, state (place-of-supply), credit limit + days, opening balance (Dr/Cr), address book (ship-to/bill-to), contacts (multi phone/email for WhatsApp/SMS), default price list, PAN, bank/UPI, remarks & tags, per-party rate memory (last rate). **REQ-9 — `party_rates`: customer-wise Wholesale+Retail override** (custom rate > party price-list default > item rate), party detail mein rate-book grid, "last sold rate" auto-suggest, copy-rates-from-another-party (P2), party ledger with running balance, one-tap WhatsApp "payment reminder" template.

### M5 — Sales & Invoicing (P0 — core)
Document types: **GST Tax Invoice (B2B)**, **Retail Bill / Suspense Invoice (B2C)**, Proforma, **Quotation / Estimate**, Sales Order, **Credit Note (sales return)**, **Debit Note**, Delivery Challan (+ returnable), KOT/Token (P2), **Trial/Repeat Bill**, RCM invoice (P2), Purchase bill from same screen toggle.
Invoice features: **FROZEN-SNAPSHOT rule (REQ-11): `document_lines` copies rate/hsn/tax/item-name at bill time; catalog edits NEVER rewrite an existing invoice (line `rateFrom: party_custom|wholesale|retail|manual`); `created_at` + `bill_date` both stored, "Bill date / Computer-generated on" printed on paper**, auto/override invoice number with FY series, item add by search/barcode/scan-gun, line qty with unit fallback (`5x12 = 60`), line discount %, bill-level discount, per-line or bill-level tax mode, intra (CGST+SGST) vs inter (IGST) auto-decide from GSTIN/state, transport/other charges (taxable or exempt), packing/freight, round-off (normal / half-up / no-rounding), signature block, terms & conditions, "Received with thanks" for paid bills, customer PO ref, vehicle/loading info on challan, partial payment on bill itself, **Hold/Repeater bills** (bill top, add items later), duplicate/ reprint with audit trail, edit-with-reversal / **Modify+Edit (REQ-10): allowed until lock/period-close, recompute + `revision++`, audit trail + renumber guard for printed originals**, cancel with reason, bill-wise WhatsApp/SMS/email share, PDF + image (JPEG for WhatsApp) + **ZIP of month's PDFs**, e-Invoice (IRN/QR via NICv2 API, P1), e-Way Bill integration (P2), TCS/TDS on sale (P2), Cash Management (denomination-wise, tender cash vs expected change, P0-lite).

### M6 — Purchases (P0 basic / P1 full)
Bill entry (manual / PO-based / image-assisted scan P2), supplier + reference invoice no. + date (mandatory for input tax), item lines inheriting rate from last purchase, **auto-update cost price**, freight/other charges with tax split, purchase returns (debit note flow), bill vs payment 3-way view, input credit summary (IGST/CGST/SGST/Cess), rate-comparison across suppliers (P1), "Bill photo → OCR → draft entry" (P2), supplier outstanding aging.

### M7 — Payments & Receipts (P0)
**Every payment auto-creates a standalone Receipt / Payment Voucher record (REQ-5): own number `RCP/FY/n`, date, mode, in/out, allocated bills list, balance-after, print + WhatsApp/PDF** — cash vs credit vs bhugtan teeno ki apni register + receipt print hoti hai., mode (Cash, UPI, Card, Cheque/DD/NEFT/IMPS/Bank), reference no. + date, **multi-party allocation** (one receipt → many invoices: FIFO or manual), advance received/payment + later adjust, **part-payment against a bill**, cheque bounce handling (P1), bank-allied fields (cheque no., clearing date), daily cash **open/close (denomination + note count)**, expense against cash box, "Pay now" UPI QR on invoice PDF, auto-SMS "₹4,320 received — balance ₹1,200".

### M8 — Banking (P1)
Bank accounts + cash boxes ledger, bank statement import (CSV/MT940) with auto-match, cheque register (issue/receive, print-ready), bank reconciliation statement, UPI collect request links (P2), POS settlement import (P2).

### M9 — Expenses & Accounting-lite (P1)
Categories (Rent, Salary, Electricity, Commission, Transport, Marketing…) + sub-categories, recurring entries, voucher (Payment/Receipt/Journal/Contra/Expense), per-bill split across categories & cost centres, TDS deduction on rent/professional fees with 163/164 fields (P2), GST on expenses (RCM awareness), cost-centre / branch tag, **auto profit & loss** (income vs expense + inventory delta), journal entry editor with double-entry validation, period lock (post-GSTR filing), **year-end closing** → opening balances next FY.

### M10 — Reports (P0 for 8, P1 rest)
Every report: date/custom range, GST/expense heads, filter → CSV/XLSX/PDF, WhatsApp/PDF share, print layout, "compare previous period", drill-down to bill.
`Daily Sales (Z-rep)` · `Daywise / Itemwise / Partywise Sales` · `Sales Register` · `Purchase Register` · `Sales/ Purchase Return` · `GST: B2B, B2C, Zero-Rated, Nil/Exempt, HSN-Summary (8-digit), Tax Paid Summary, GSTR-1 JSON, GSTR-3B summary` · `Outstanding Ageing (0-30/31-60/61-90/90+)` · `Collection Report` · `Stock Summary / Ledgers / Batch-wise / Expiry / Valuation / Movement` · `Reorder / Dead Stock` · `Profit & Loss` · `Balance Sheet (P2)` · `Expense Summary` · `Staff-wise Sales & Commission (P1)` · `Cash Flow (P2)` · `Tax Audit / Turnover certificate (P2)` · `Audit / Activity log (P1)` · `Consolidated multi-branch (P2)`

### M11 — Notifications & Sharing (P1)
Templates (bill, receipt, reminder, delivery, offer) with variable merge (`{name}`, `{amount}`, `{due_date}`), WhatsApp (Cloud API / wa.me fallback), SMS (DLT-registered templates), email with PDF attach, **one-tap Call (`tel:`) / SMS (`sms:`) / WhatsApp `wa.me` from bill & party screens (REQ-1/7) — message template auto-fills shop name "Umesh Seeds", bill no, total, due; PDF attach via share sheet (Web Share API) ya manual forward,** **auto reminders** at D+3 / D+7 / overdue, push notification to staff app, low-stock & expiry daily digest, "today's sales ₹41,820 · 87 bills" nightly summary to owner.

### M12 — Printing & Hardware (P0 — make-or-break)
**REQ-2 MANDATE: ≥10 themes — ship 12 built-in UI themes** (Emerald, Teal, Ocean, Royal, Violet, Magenta, Cherry, Rose, Amber, Sand, Graphite, Midnight) — each = token-pack {sidebar, accent, gradient, canvas}, one click from top-bar picker, live-apply, per-device memory + **invoice paper accent tint**. Print sizes: A4-Standard, A4-Compact, **A4-with-logo, A5 Half-Page (REQ-10), 80mm thermal, 240mm thermal**, 3-inch Kashner/foil (pharma), KOT.
Print engines: **Windows raw-USB/EPL-ZPL & ESC/POS** (P1), **Bluetooth/USB printer via Web Bluetooth** (P1), **Cloud print (HP/Canon/Brother)** (P1), Android built-in + ESC/POS SDK (P1), PDF via browser (P0 fallback), **Silent auto-print** toggle, **print preview + A4-vs-thermal batch reprint**, barcode label printing (P1), voice "bill save ho gaya" (P2), bluetooth scan gun + weight scale (serial/USB HID) (P1), cash drawer kick (P2), KOT-to-kitchen routing (P2).

### M13 — Users, Devices, Security (P0)
User CRUD, per-device login + "logout all", role/permission matrix, 6-digit PIN for cashier switching, OTP login, JWT + refresh, AES-256 DB encryption at rest, TLS in transit, IP/day-based access rule for accountant, session audit log (who changed rate on bill X at 14:22), bill-lock after print, tamper check on offline data, daily auto-backup + manual, delete-account grace (30 days), GDPR/DPDP-ready data export & deletion.

### M14 — Settings (P0)
Invoice series + prefix per FY, default state/place-of-supply, rounding policy, discount limits, stock policy, tax default rules, price-list default, currency (INR; multi-currency P3), business hours, financial year, print defaults, share defaults, WhatsApp number binding, GST-return-period lock, custom fields (invoice header/lines, party), theme (light/dark, 6 accent colours), font size for shop-lit screens.

### M15 — Backup, Sync & Migration (P0 — non-negotiable)
Local encrypted snapshot every 20 changes + every 60 min, restore-from-file, cloud sync with conflict policy = **"server wins on ledger, client wins on draft"**, resumable queue, sync status indicator with per-bill retry, **one-tap restore from Google Drive/Dropbox**, import from **Vyapar / myBillBook / Tally / Busy / Excel** (items, parties, opening stock, FY carry-forward) (P1), export-all (XLSX + JSON) any time, no-data-hostage promise: full export free forever.

### M16 — SaaS, Plans, Support (P1)
Trial 14 days full-feature, plans (below), in-app upgrade via UPI/card, GST on subscription, reseller/white-label panel (P2), in-app help: contextual tooltips + 60-sec video per feature, **Hindi + English chat/voice support** + WhatsApp support line, ticket + status, feature-request vote board, uptime & sync health page.

### M17 — Future / Differentiators (P2–P3)
AI bill-from-photo (OCR) · Voice billing ("doo dukkaan 5 kilo aata") · auto price-suggestion from margin rules · **customer self-checkout QR** (scan, pay, done) · WhatsApp catalogue + order bot (mini-store link `umeshbill.in/u/shopname`) · loyalty points + birthday offers · supplier payment negotiation insights · cash-flow forecast · loan/COD referral partners · multi-branch + franchise consolidation · franchise POS mode · API + Zapier/n8n webhooks for eCom (Shopify/ONDC) sync · ONDC seller connector · offline Android TV/kiosk mode · Hindi-first UI + voice notes in ledger.

### M18 — Krishi / Seeds & Agri-input Vertical (P1 — added after seeing your reference: `Umesh Seeds · Sehore`)
Your mock shows seed SKUs (`Crystal Moong Samrat CMS-05`, `Seminis Tomato Abhilash STA-106`) sold in **Bag/Packet** with **min-stock alerts** — so the app is being built for a **seed / agri-input retailer-dealer**, not generic retail. Features that this category genuinely needs (generic billing apps skip them, so this is our moat):
- **Lot / Batch + germination data:** lot no., germination %, physical purity %, moisture %, **best-before + "sowing-window" date**, label declarations printed on invoice for the lot sold (Seed Act / Minimum Seed Certification & Standards Act style disclosure).
- **Variety master:** crop → hybrid/variety → company/brand (Seminis, Nuziveedu, Mahyco, Crystal, Bt…) → pack size (100g / 500g / 1kg / 5kg / 1000-seed pouch). Same variety, many packs = one item + variants with pack-wise rate & MRP.
- **MRP ceiling + Legal Metrology:** block rate above MRP; print MRP/max retail, net qty & unit, importer/packer details on bill.
- **Season logic:** Kharif / Rabi / Zaid windows per crop + per district; season-wise price list, season-start opening stock snapshot, end-of-season leftover → **return-to-company / exchange claim sheet** (dealer returns are how seed shops survive).
- **Scheme & offer engine:** "buy 10 bags get 1 free", combo (seed + micronutrient), company Schemes/rebate with proof, quantity-slab auto-price (dealer 10+ = ₹X), **farmer-level schemes** (subsidy voucher, soil-health-card-linked discount), credit up to sowing+harvest cycle (`credit_days` variable, per-season interest flag off for farmer goodwill).
- **Dealer ↔ farmer ledger:** party types `Farmer / Retailer / Institutional (FPO, Agri Univ, State Seed Corp)`; farmer KYC (Aadhaar-masked, Khasra no., village, block, phone), **harvest-linked due dates** (Kharif dues after Oct, Rabi after Apr), crop-wise credit aging, khata/udahi book view in Hindi.
- **Secondary sales & company reporting:** who bought what in which village (companies pay dealers for this data), **company-wise sales & claim report**, seed licence number (State Seed Licence) + FSSAI/DL on invoice header, lot traceability report (lot → all farmers who got it → recall list in one click).
- **Advisory value-adds (retention):** SMS/WhatsApp per crop stage ("Tor seed 45 days — apply 2nd top dressing"), sowing-window reminders to farmers of your village list, new-variety launch announcement, weather/mandi-price strip on dashboard (P3, via public API).
- **Units & fractional sale:** Bag 25kg / Packet / Kg / Gram / Loose (weighing-scale input P2); seed-by-weight conversion table; decimal qty for gram-packs.
- **Reports (add to M10):** `Lot-wise stock & expiry` · `Season sales vs last season` · `Crop-wise & brand-wise margin` · `Company scheme/claim pending` · `Dealer returns (exchange) register` · `Village-wise sales map` · `Farmer outstanding by crop` · `Germination complaint log (with lot + farmer + resolution)` · `Sowing-window calendar vs stock`.


---

## 4B. Requirements Traceability — aapki 11 features (WhatsApp photos, 07 Sep) ✅

> Aapke bheje list ka har point map kiya gaya hai. Status: ✅ plan+prototype dono mein live · 🔧 plan mein, build pending

| # | Aapki requirement (as written) | Plan module | Prototype |
|---|---|---|---|
| 1 | **Poora software keyboard se chale** (Marg Book jaisa) | M5 "speed contract" + §5 shortcuts | ✅ F1 search, F2 party, F4 discount, F5 save & print, F6 hold, F9 payment mode, Enter = next field, ↑↓ rows, `⌘K` global |
| 2 | **Theme kam se kam 10** | M14 settings + naya **M12T Theme system (12 themes)** | ✅ 12 themes live (Emerald/Teal/Ocean/Royal/Violet/Magenta/Cherry/Rose/Amber/Sand/Graphite/Midnight) |
| 3 | **Wholesale aur Retail dono** | M2: har item par `wholesale_rate + retail_rate` | ✅ bill par `Price: [Retail ◯ Wholesale ◯]` toggle — rate auto-swap |
| 4 | **SMS + WhatsApp par bill bhejo, PDF mein bhi** | M11 sharing + M12 PDF | ✅ Share: WhatsApp / SMS / Call / Email / Save PDF (preview se) |
| 5 | **Cash / Credit / Bhugtan alag-alag + payment ka record alag** | M7: payment = apna **Receipt record** (`RCP/FY/n`) | ✅ Payment In → receipt number milta hai, print-SMS-share hota hai; daywise/cash reports cash vs credit vs collected alag |
| 6 | **Web + Mobile, 1+ mobile & 2+ PC, kahin se bhi** | M15 sync + plan seats | ✅ responsive app; seats = 1 mobile + 2 PC default (Business plan) |
| 7 | **Bill ke baad Call/SMS/WhatsApp + PDF bhejna** | M11 auto + manual share | ✅ same as 4 (post-save screen par hi buttons) |
| 8 | **Item me Wholesale + Retail rate rakhna** | M2 price lists | ✅ Items screen par dono rate columns editable |
| 9 | **Har Customer ke liye alag Wholesale/Retail rate** | M4 `party_rates` | ✅ Customers → "Custom rates" se per-party override; **custom > party-list default** |
| 10 | **A4, A5, Thermal print; WhatsApp share; "Umesh Seeds" naam; Modify/Edit** | M5 + M12 + edit-with-reversal | ✅ A4/A5/80mm/240mm preview+print, company name header, **Edit Bill** (line qty/rate, recompute) |
| 11 | **Purane invoice par naya rate auto-apply NA ho; bill banane ki date dikhe** | M5 frozen-snapshot rule | ✅ invoice lines rate **copy** karke store karte hain (rateFrom tag ke saath); Items ka rate badalne se purana bill nahi badalta; invoice par `Bill date` + `Bana was: <timestamp>` |

**M12T — Theme system (P0):** theme = `{ sidebar colors, accent, gradient pair, canvas }` ka token-pack; built-in **12** (≥10 mandated), live preview + per-printer accent option, user CSS override (P2). Invoice paper theme isi accent se tint hota hai (rules/box header) — brand consistency.

---

## 5. Screen Map (App Navigation)

```
SIDEBAR (desktop, 240px, dark emerald — exactly like reference)   BOTTOM NAV (mobile)
├─ [business switcher card: US Umesh Seeds · Main Branch · Sehore ▾]  ├─ Home
├─ WORKSPACE                                                       ├─ Bill  [+ center FAB]
│   Dashboard · Sales Bills (F2) · Customers · Items & Stock ·      ├─ Items
│   Payments · Reports                                              ├─ Parties
├─ OPERATIONS   Purchase · Stock Adjust · Day Close · Purchase Orders└─ Reports
├─ MANAGE       Expenses & Accounting · Templates & Printing ·
│               Users & Roles · Backup & Sync
├─ [✦ SMART TIP box — one actionable insight, e.g. "4 items low on stock"]
└─  Settings  ·   Your data is secure
   TOP BAR: [🔍 search ⌘K] · [हिंदी | EN] · [🔔] · [avatar · name · role] · [⊕ New Bill]
```

**Key screens (38 total):**
1. Splash → OTP login → **Business setup wizard (5 steps)**
2. **Dashboard** (today's sales / collections / udhaar / low-stock / expiring / pending PO — 6 tiles + 30-day sparkline + 4 "act now" alerts)
3. **New Bill** — search bar top (name/SKU/barcode), item list, qty stepper, right/bottom summary (tax split, discount, round-off, tender & change), sticky footer: `Save & Print` `Hold` `Share`
4. Bill list / search (`Ctrl+K` global search) → Bill detail (edit/duplicate/reprint/cancel/pay)
5. **New Purchase bill** (same component, mode switch)
6. Items list (inline edit, swipe actions) → Item detail (variants, batches, price lists, stock by godown, history chart)
7. Party list → Party detail (ledger, outstanding, bills, credit note, WhatsApp)
8. Payment in/out with allocation table
9. **Reports hub** (18 cards) → report viewer (sticky filters, totals row, drill-down)
10. **Print template designer** (drag blocks: logo / party / items / totals / terms / QR) with live preview on selected paper size
11. Backup & Sync status screen
12. Settings groups (Business · Billing · Inventory · Payment · Printing · Users · Notifications)
13. Subscription / plan screen
14. App-lock & staff PIN switch screen
15. Empty states + offline banner (persistent, dismissable, never blocks bill)

**Interaction rules (speed contract):**
- Bill screen: `F1` item search · `F2` party · `F4` discount · `F5` save & print · `F6` hold · `F9` payment mode · `F11` delete line · `Ctrl+K` global search · `↑↓` navigate · `Enter` commit qty · `Esc` back
- Zero mandatory field outside: party (optional for retail), rate, qty, tax
- Any action reachable in ≤ 2 taps from Home; bill creation ≤ 3 screens max

---

## 6. Database Schema (core, Prisma-style)

Full SQL/DDL: see `docs/schema.sql`. Core entities (26 → 40 tables with accounting):

```
Company ─┬─ Branch ── Godown
         ├─ User ── Role ── Permission ─┐
         ├─ DeviceToken, AuditLog, BackupJob
         ├─ Category, Brand, Unit, TaxRate (slab+type)
         ├─ Item ─┬─ ItemVariant ── ItemPrice(list × rate)
         │        ├─ ItemBatch(batchNo, mfg, exp, qty, cost, godown)
         │        ├─ ItemSerial(imei, customer, warranty till)
         │        └─ ItemStock(godown, qty, reserved, avgCost)
         ├─ Party ─┬─ PartyAddress ─ PartyContact
         │         └─ PartyCredit(limit, days) ─ PartyPriceList
         ├─ PriceList(Retail/Wholesale/Dealer)
         ├─ Document(header) ──┬─ DocumentLine
         │   type: SALE_INVOICE │   tax split rows (CGST/SGST/IGST/Cess)
         │   RETAIL_BILL QUO   ├─ DocumentDiscount / DocumentCharge
         │   SO PO GRN CHALLAN  └─ DocumentPaymentLink → Payment ─ Allocation
         │   CREDIT_NOTE DEBIT_NOTE PAYMENT_IN PAYMENT_OUT JOURNAL
         ├─ StockMovement(qty, rate, refType, refId, balanceAfter)  ← immutable ledger
         ├─ ExpenseCategory, Expense, Voucher, LedgerAccount, LedgerEntry
         ├─ Bank ── BankTxn ── BankRecon
         ├─ PrintTemplate(render JSON) ── PrintLog
         ├─ NotificationTemplate, MessageLog(channel, status)
         ├─ Subscription(plan, seats, invoiceRef)
         └─ SyncQueue(clientOpId, version, status)  ← offline sync spine
```

**Non-negotiable design rules**
1. `Document` + `DocumentLine` generic across all 12 doc types → one place for tax/rounding/print logic; type-specific fields in `jsonb meta` + typed view.
2. **Money as integer paise (`BIGINT`)** or `NUMERIC(14,2)`; never float.
3. **Stock is derived, not stored-authoritative:** `item_stock.qty = SUM(stock_movements)` nightly reconcile; movement rows are append-only (never update/delete).
4. Every monetary row carries `version`, `created_by`, `updated_by`, `synced_at` → conflict detection + audit.
5. Soft delete + period lock: locked FY is immutable (guards against post-filing edits).
6. `client_op_id` UUID generated on device = idempotency key for offline→server sync.

---

## 7. Calculation & GST Rules (must match law, tested exhaustively)

Full doc: `docs/billing-rules.md`. Headlines:
- Per-line tax on **taxable value after line discount**; bill discount distributed pro-rata across lines by value (GST law view) and tax recomputed per line.
- Tax-inclusive MRP → back-calc: `taxable = total / (1 + rate)`; rounding per line, then bill round-off.
- **Round-off options:** to nearest ₹1 / ₹0.50 / none — applied on total **tax**, per law.
- Place-of-supply = ship-to state → same state = CGST+SGST, else IGST.
- CGST/SGST split must sum exactly to IGST-equivalent (no ₹1 drift) — last-line absorb rule.
- HSN summary thresholds: turnover >₹5cr → 6-digit HSN + invoice-level; ≤₹5cr → 4-digit HSN + value-wise ranges; services → SAC.
- Credit/debit note: `invoice_type`, `ref_invoice_no/date`, `note_type` (sales return vs price change) — feeds GSTR-1 table 9C.
- e-Invoice (IRN) applicable when turnover > ₹10cr (current threshold) — QR on invoice, 64-char IRN.
- e-Way Bill needed when consignment > ₹50,000 (inward & outward), validity by distance.
- Retail (B2C) simplified invoice: mandatory fields if invoice > ₹2.5 lakh (or state rule); else name/address optional.
- TCS @1% under sec 206C(1H) when turnover > ₹10cr and single-buyer sales > ₹50 lakh (state which slabs you'll cover in v1).
- Zero/Nil exempt items still need HSN + "Not Applicable" tax column.
- Financial-year numbering: series resets on 1 Apr, e.g. `USB/26-27/000421`.

---

## 8. Technical Architecture

### Recommended (Option A) — Web-first PWA + native shell
```
UI        React 19 + TypeScript + Vite, Tailwind + shadcn/ui, TanStack Query + Table,
          dnd-kit (template designer), react-hook-form + zod
Offline   IndexedDB via Dexie + local-first sync (crdts Yjs or custom vector-clock),
          Workbox service worker, Comlink worker for tax calc & PDF
Server    Node 22 + Fastify (or Next.js route handlers), Prisma, PostgreSQL 16 + pgvector(later),
          Redis (queue, rate-limit, presence), BullMQ jobs (PDF, sync, reminders, GSTR export)
Files     S3-compatible (R2) for logo/PDF/backup, signed URLs
PDF/Print React-PDF for A4/thermal (single source of truth) + Puppeteer microservice for
          pixel-exact A4 (P1); ESC/POS + ZPL renderers server-side for thermal
Auth      OTP (MSG91/Twilio) + JWT access 15m / refresh 30d, device binding, TOTP for owner
Mobile    Capacitor shell (same PWA) → Play Store v1; native ESC/POS + Bluetooth plugin
Realtime  SSE for sync status + multi-device refresh (WebSocket later)
Infra     Vercel/Fly.io + Neon/RDS; Terraform-lite; GitHub Actions CI (lint→typecheck→vitest→playwright→e2e) → preview
Observ.   Sentry (FE+BE), OpenTelemetry traces, Metabase/Superset on replica for product analytics
Testing   Vitest unit (tax engine: 200+ golden cases), fast-check property tests on rounding,
          Playwright e2e (bill → print → PDF byte-snapshot), k6 load on sync endpoint
```

### Option B — Mobile-first (better if 90% use = phone)
Flutter (Dart 3) + `drift/SQLite` + Riverpod; backend **Supabase/Postgres + RLS** or .NET 8 Minimal API; ESC/POS via `flutter_bluetooth_printer`/native; shared Dart calc engine; web later via Flutter Web for reports only.

**My recommendation:** **Option A** — ek codebase, laptop billing counter + phone, PWA install, Play Store via Capacitor, aur web-based reports/CA access free mein mil jaata hai. Option B tabhi agar aapko Bluetooth-heavy pharma/hardware counter chahiye with 100% offline Android.

**NFR targets:** app-open < 2.5s (offline) · bill save < 250ms · 10k items / 100k invoices per tenant smooth (virtualized tables + indexes) · sync endpoint p95 < 800ms · RPO 1 day → later 15 min · **RTO < 4 hours** · 99.5% API uptime · tenant isolation = schema-per-tenant *or* `tenant_id` + Postgres RLS (start RLS, move hot tenants to dedicated schema).

---

## 9. Design System — ✅ LOCKED to reference dashboard (`docs/design-refs/`)

**Reference DNA:** deep-emerald dark sidebar (always-on) + soft off-white canvas + white 12px cards with 1px borders + green→teal gradient data-viz + IBM Plex Mono for all money. Tokens: `docs/ui-mockups.md §A`.

- **Palette:** sidebar `#062A1E→#0A3828` (subtle vertical gradient), sidebar card `#124735`, active nav row `#0FA36C`; canvas `#F3F7F5`, surface `#FFFFFF`, hairline `#E4EBE8`; ink `#0C2A20 / #1E4B3A / #6B8378`; primary+money `#0FA36C` (`#077C56` hover); chart gradient `#19B98A→#3FC9AE` (last-2 bars darkened `#0C8F60`); semantic tints — udhaar/low-stock amber `#E8A33D/#FCF3E4`, info blue `#3E7BE8/#E9F0FE`, trend violet `#7C6CF0/#EFECFD`, overdue red `#D9534F/#FBEBEA`. No indigo brand, no pure-white background.
- **Type:** `Inter` for UI (24px page greeting / 17px card title 700 / 13.5px body / 11px 700 0.14em sidebar section labels) · `IBM Plex Mono` for every amount, invoice number, HSN, qty (`tabular-nums`, right-aligned) · `Noto Sans Devanagari` for the हिंदी mode. Devanagari + Latin sit on the same baseline — no reflow.
- **Card anatomy (dashboard pattern = the app pattern):** white, 12px radius, 1px `#E4EBE8`, 18–20px padding, **no shadow** (shadow only for popovers/modals). Title 15px/700 left + muted sub-line 12px; optional right-side badge (`↗ +12.5%`, `● Live`, `⌄ View`).
- **StatCard:** 40px tinted icon chip (brand/amber/violet/blue 100 tints) + label + trend badge + 26px mono number + muted context line. Exactly 4 per row.
- **Buttons:** primary = `linear-gradient(135deg,#0B9368,#13B79B)`, white, 40px, includes `kbd` chip (`F2`) when a shortcut exists; secondary ghost = white + 1px hairline; danger red reserved for delete/void. Primary action always bottom-right on desktop, full-width sticky on mobile.
- **Chart:** rounded-top 12px bars, 8px gap, `y` axis with 3 light gridlines + currency labels, legend dot below, insight line at bottom-right (`↗ Steady growth this week`). 7d/30d/90d segmented control top-right.
- **Lists:** Recent Bills = compact `DataTable` (invoice / customer + phone / date / amount / status pill / 👁). Status pills = Paid(green) · Due(amber) · Partial(blue) · Cancelled(grey).
- **Chrome (every screen):** search pill with `⌘K` · language toggle `हिंदी | EN` · bell with dot · avatar + name + role chip · business/branch switcher card in sidebar top · `Settings` + "Your data is secure" trust line at sidebar bottom.
- **Motion:** 150–200ms `cubic-bezier(.2,.7,.3,1)`; bars grow from baseline, 24ms stagger; row insert slide-in; save success = 300ms green flash + haptic + optional voice cue. No confetti, no parallax.
- **A11y:** ≥4.5:1 contrast, 44px tap targets, full keyboard flow on the bill screen, `aria-live="polite"` on totals, focus ring = 2px `#0FA36C` offset 2px. Dark mode (`[data-theme=dark]`) inverts the canvas only — sidebar stays, since shop screens sit under tube-light/sunlight and must never go low-contrast.
- **Invoice paper design:** same green as accent, but print-safe: black ink for data, thin rules, logo + firm block header, 2-col party block, items table (Sr/Item/HSN/UOM/Qty/Rate/Disc/Taxable/Tax/Amount), right totals box with per-slab CGST/SGST/IGST rows, amount in words, declaration + signature, bank/UPI QR footer. Thermal 80mm = 32-char mono lines with `======` rules; KOT = no tax at all.

---

## 10. Monetization & Packaging

| Plan | Price (per year, +GST) | Limits |
|---|---|---|
| **SmartBill Free** | ₹0 | 100 bills/mo, 1 user, 100 items, branded invoice, local backup only |
| **Starter** | **₹1,499** | Unlimited bills, **1 device (mobile ya PC)**, unlimited items, all themes, WhatsApp/SMS credits extra, Drive backup |
| **Business** | **₹2,999** | **3 devices = 2 PC + 1 mobile (REQ-6 default)** + extra user, purchase/PO, full reports, GSTR-1 export, cloud print, auto reminders, priority support |
| **Pro / CA** | **₹3,999** | 10 users, multi-godown, accounting (vouchers, P&L, B/S), TDS/TCS, e-Invoice, API + webhooks, accountant login, audit log |
| Add-ons | — | Extra user ₹499/yr · Extra branch ₹999/yr · WhatsApp credits · SMS pack · e-Invoice per-use · Onboarding visit (paid, local partner) |

Other revenue: reseller/white-label (₹15k setup + 30% share), payment collection (0.4–0.9% MDR-near-UPI handle), loan/insurance referrals (compliance-heavy — P3), CA partner referrals. **Churn defence:** data-export-is-free promise + annual prepay discount + bill-print habit loop.

---

## 11. Delivery Roadmap

| Phase | Weeks | Scope | Exit criteria (definition of done) |
|---|---|---|---|
| **P0 — Foundation** | 1–2 | Design system, auth+OTP, Company/Item/Party/Tax CRUD, invoice number engine, **tax+rounding engine with 200 golden tests**, local-first store (Dexie), CSV import | A cashier with zero training can create+save 5-item bill in <40s on laptop, offline, in airplane mode |
| **P1 — MVP (billable)** | 3–6 | New Bill screen + F-key shortcuts, retail & GST invoice, A4 + thermal print/PDF, hold/repeater, payment-in on bill, dashboard, 8 core reports, backup/restore, day close, itemwise+partywise+outstanding | 3 real pilot shops billing daily for 2 weeks; **zero manual Tally re-entry**; GSTR-1 JSON accepted on portal |
| **P2 — Sell it** | 7–10 | Purchase + GRN + PO, stock adjust/physical count, credit notes, reminders (WhatsApp/SMS), templates designer, SaaS plans + UPI billing, sync conflict UI, audit log, Play Store beta (Capacitor) | Paid customers onboarded; sync success ≥99.5%; support tickets < 5/day/100 users |
| **P3 — Pro** | 11–14 | Accounting vouchers + P&L + B/S, TDS/TCS, RCM, e-Invoice (IRN/QR), bank statements + recon, expiry & batch reports (pharma pack), staff commission, 5 Indian languages, Excel/Busy/Tally migration | An accountant can close FY & file without leaving app; 100 paying tenants |
| **P4 — Scale** | 15+ | Multi-branch/godown, e-Way Bill, API + webhooks, ONDC/Shopify sync, AI bill-from-photo, self-checkout QR, loyalty, white-label panel, franchise mode | NDR-driven expansion; 2+ tenants on >₹10cr GST rules |

**Team:** 1 full-stack lead (you) + 1 FE + 1 BE + designer (part-time) + CA/GST consultant (retainer) + 1 support onboarding at P2.
**Solo-adjusted timeline:** P0+P1 ≈ 8–10 weeks if one strong dev; MVP demo-able in **2 weeks**.
**Process:** weekly build demo to 3 shop owners; every feature ships behind a flag; no schema change without migration + rollback test.

---

## 12. Top 12 Risks & Mitigations

| # | Risk | Mitigation |
|---|---|---|
| 1 | **Tax/rounding bug → wrong GSTR → trust gone** | Golden-case test suite, property tests, "recalculate from source" repair job, CA consultant sign-off before v1 |
| 2 | Thermal printers behave differently per brand (80mm drift, cut codes) | Printer compatibility matrix, test rig with 6 models (Epson, Casio, Rongda, POSBI, Kashner, Zen series), plain-ESC/POS + PDF fallback always |
| 3 | Offline sync conflicts (same bill, two devices) | Idempotent `client_op_id`, append-only ledgers, LWW for descriptive fields, server-authoritative numbering with pre-fetched number blocks |
| 4 | Invoice number gaps / tampering after audit | Per-FY server blocks of 500 numbers, gap report, printed-copy amendment log, period lock |
| 5 | Data loss on a phone crash | Local + cloud + Drive triple backup, restore rehearsal onboarding, nightly integrity checksum |
| 6 | GST law/rate change mid-year | Rates & rules in a **versioned config table** (effective_from), not hardcoded; in-app changelog |
| 7 | Slow app with 50k items | Indexed virtual lists, search in SQLite/IndexedDB with trigram + prefix index, worker offload, item cache warm on app open |
| 8 | Free-to-paid friction / piracy | License per device + soft grace, "unlimited trial, but cloud sync & reminders paid" model (less piracy than lockout) |
| 9 | Support load from non-tech users | Setup wizard + "we do first bill with you on WhatsApp video" + Hindi tooltips + auto-diagnostic zip on report-a-problem |
| 10 | Feature creep (17 modules = 3 apps) | P0/P1 gate: no P2 feature merges until P1 exit metrics green; "nice-to-have" board reviewed monthly |
| 11 | DPDP / data handling & UPI security | Minimal PII, encryption at rest, no card data, PCI-free flow (redirect to gateway), audit-log-only access to business data |
| 12 | Competitors ship same features | Compete on **offline robustness + print reliability + Hindi support + price**, not on feature count |

---

## 13. Decisions locked so far

| # | Decision | Status | Locked value |
|---|---|---|---|
| 1 | App name / brand | ✅ | **UMESH SMARTBILL** — wordmark two-line in sidebar, "UMESH" 700 + "SMARTBILL" letterspaced 11px |
| 2 | Business vertical | ✅ | **Krishi — seed & agri-input dealer** (from your reference: `Umesh Seeds`, `Sehore` branch, seed SKUs, Bag/Packet units, low-stock alerts) → M18 becomes a P1 pillar, not an add-on |
| 3 | Dashboard / UI design language | ✅ | Exactly as your screenshot: dark-emerald sidebar + white 12px cards + green KPI/stat cards + gradient bar chart + Quick Actions + Recent Bills + Low Stock. Tokens in `ui-mockups.md §A` |
| 4 | Language | ✅ | Hindi + English toggle in top bar (`हिंदी | EN`), Devanagari-first labels for farmer/party screens |
| 5 | Trust cues | ✅ | Sidebar footer "🛡 Your data is secure" + Smart-Tip box (one actionable insight/day) — keep both, they build habit |
| 6 | Feature-list photo | ⏳ pending | Re-attach → I diff it against M1–M18 and cut/add |
| 7 | Main device | ⏳ default A | **Web-first PWA (laptop counter + phone)**, Android shell later |
| 8 | GST registered? | ⏳ assume yes | Full B2B GST invoice engine + GSTR-1 export |
| 9 | Multi-branch / users | ⏳ assume 1 branch, 3 users | Reference shows a branch switcher → build the switcher UI now, data model already supports N branches |

## 14. Open questions (reply in one line each, I'll fold into the plan)
1. **Seed licence number / State Seed Corp tie-up** kya hai? (invoice header + lot-traceability format isi pe depend karta hai)
2. **Company schemes/exchange returns** — seed companies (Seminis/Mahyco/Crystal type) se claim aur end-of-season exchange chalta hai? (haan → M18 ka scheme engine P1 se P0 chala jaayega)
3. **Farmer ko udhaar (khata)** dena hai harvest ke baad tak? (haan → credit + due-date engine day-1 must)
4. **Thermal printer** use hoga ya normal A4/kashner? (billing counter ka hardware = print engine priority)
5. **Ek dukaan ya 2-3 branches / dealers?** (reference mein branch switcher hai — sync scope yahin set hota hai)
6. Abhi **plan chahiye ya working MVP** (Next.js + Dexie, 2 din mein is dashboard + bill screen + 80mm/A4 print, real PDF) — bolo toh P0+P1 coding shuru kar deta hoon.

> Default (koi reply na aaye toh): **Option A web-first PWA, GST-registered, 1 branch + 3 users, seed/agri vertical ON, Phase P0+P1 MVP first, UI = reference design tokens.**
