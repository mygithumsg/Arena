# UMESH SMARTBILL — UI Blueprint (wireframes, tokens, API contract)

> **Visual target locked** ✅ to the user's reference dashboard (`docs/design-refs/`).
> Design language = **deep-emerald dark sidebar + soft off-white canvas + white 12px cards + green→teal gradient charts**. Same token set is reused by every screen (billing, reports, settings) so the app reads as one product, not a page collection.

## A. Design tokens (sampled from reference screenshot)

```css
:root{
  /* ---------- sidebar / chrome (always dark emerald) ---------- */
  --sb-900:#062A1E; --sb-850:#083123; --sb-800:#0A3828;          /* gradient top → bottom */
  --sb-card:#124735; --sb-card-hover:#17553F;
  --sb-ink:#FFFFFF; --sb-ink-2:rgba(255,255,255,.72); --sb-muted:rgba(255,255,255,.50);
  --sb-label:rgba(255,255,255,.38);   /* "WORKSPACE" — 11px/700/0.14em caps */
  --sb-line:rgba(255,255,255,.08);
  --sb-active:#0FA36C;                /* filled row = primary green */
  /* ---------- brand & semantic ---------- */
  --brand-700:#077C56; --brand-600:#0B9368; --brand-500:#0FA36C; /* primary, money, success */
  --brand-100:#E4F4EC; --brand-50:#F1FAF5;
  --teal-500:#13B79B;                 /* gradient partner of brand-500 */
  --violet-500:#7C6CF0; --violet-100:#EFEcFD;
  --amber-500:#E8A33D; --amber-100:#FCF3E4;   /* due / low stock / caution */
  --blue-500:#3E7BE8;  --blue-100:#E9F0FE;    /* collection / info */
  --danger-500:#D9534F; --danger-100:#FBEBEA; /* overdue, delete, bounced */
  --grad-primary:linear-gradient(135deg,var(--brand-600),var(--teal-500));
  --grad-bar:linear-gradient(180deg,#19B98A,#3FC9AE);
  --grad-bar-hot:linear-gradient(180deg,#0C8F60,#12A172);        /* "current period" bars */
  /* ---------- neutrals ---------- */
  --ink-900:#0C2A20; --ink-700:#1E4B3A; --ink-600:#3F5D53; --ink-500:#6B8378; --ink-400:#93A79E;
  --line:#E4EBE8; --line-2:#EDF2F0; --canvas:#F3F7F5; --surface:#FFFFFF; --surface-2:#F8FBFA;
  /* ---------- type ---------- */
  --font-ui:'Inter','Noto Sans Devanagari',system-ui,-apple-system,sans-serif;
  --font-num:'IBM Plex Mono',ui-monospace,monospace;  /* amounts, invoice no, HSN, qty */
  --fs-hero:24px; --fs-xl:17px; --fs-lg:15px; --fs-md:13.5px; --fs-sm:12.5px; --fs-xs:11px;
  /* KPI number: 26px / 700 / -0.01em / mono  */
  /* ---------- metrics ---------- */
  --sp:4px; --r-sm:8px; --r:12px; --r-lg:16px; --row-h:44px; --tap:44px;
  --sb-w:240px; --topbar-h:64px; --grid-gap:16px;
  --dur:180ms; --ease:cubic-bezier(.2,.7,.3,1);
  --shadow-1:0 1px 2px rgba(6,42,30,.05);
  --shadow-2:0 10px 30px rgba(6,42,30,.12);
}
[data-theme=dark]{ /* night counter mode — sidebar already dark, canvas inverts */
  --canvas:#05201A; --surface:#0A3226; --surface-2:#08281F; --line:#164936;
  --ink-900:#EAF6F0; --ink-600:#B6CFC3; --ink-500:#8FB0A1; --brand-500:#18C07F;
}
```

**Rules of the house**
- Numbers always `--font-num`, right-aligned, `font-variant-numeric: tabular-nums`; amount never wraps; negatives red with `Dr/Cr` suffix in ledgers.
- Cards: `--surface`, 1px `--line`, `--r` radius, **no shadow** (shadow only on dropdown/modal/toast). 12px, never 24px pills.
- Icon chips: 40px square, `--r-sm` radius, tinted bg (`--brand-100/--amber-100/--violet-100/--blue-100`) + solid icon.
- Trend badges: 11px/700 + tiny arrow, bg tint of its colour, radius 6px (`↗ +12.5%`).
- Primary button = `--grad-primary`, white text, 36–40px height, includes a `kbd` chip (`F2`) when a shortcut exists. Ghost button = white + 1px `--line`.
- Sidebar is 240px always-on at ≥1280px; collapses to 72px icon rail at 1024px; becomes bottom-tab bar on mobile (5 items + center FAB).
- Motion: 150–200ms; bar chart bars grow from baseline (300ms, stagger 24ms); row insert slide-in; save = green flash + haptic, no confetti.
- Contrast ≥ 4.5:1 everywhere (shop screens sit under tube-light/sunlight); tap targets 44px.

---

## B. New Bill screen — desktop (the money screen)

```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ UMESH SMARTBILL   [GST Bill ▾]  Bill #: USB/26-27/000422   Date [07 Sep 2026 ▾]  ● Offline  │
│ ──────────────────────────────────────────────────────────────────────────────────────────  │
│ Party  [ Search customer / supplier…   ▾ ]  GSTIN: 22AAAAA0000A1Z5   Credit: ₹4,200 / 10,000│
│        F2                                     Place of supply: 22 (Chhattisgarh) → Intra     │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  [ 🔎 Add item — name / SKU / barcode (F1) , then Enter                          ]  [Scan]    │
│ ┌────┬──────────────────────────┬────────┬─────┬─────┬──────────┬─────────┬────────┬────────┐ │
│ │ Sr │ Item / HSN               │ Qty    │Unit │Rate │ Disc %   │ Taxable │ Tax    │ Amount │ │
│ ├────┼──────────────────────────┼────────┼─────┼─────┼──────────┼─────────┼────────┼────────┤ │
│ │ 1  │ Aashirvaad Atta 5kg      │[ 2   ]x[5]│PCS│420  │[  0.00 ]│ 840.00  │ 5%@42.00│ 882.00│ │
│ │    │ 1101 · GST 5%            │  10 kg │     │     │          │         │       ⋮ │        │ │
│ │ 2  │ Fortune Oil 1L           │[ 1   ]  │PCS│148  │[  5.00 ]│ 140.60  │18%@25.31│ 165.91│ │
│ │ 3  │ + add another line (Enter)                                                            │ │
│ └────┴──────────────────────────┴────────┴─────┴─────┴──────────┴─────────┴────────┴────────┘ │
│ + Bulk entry (12 items)   + Exempt item   + Custom line   + Discount coupon   [ Low stock: 2 ]│
├──────────────────────────────────────────────┬───────────────────────────────────────────────┤
│  Charges                                     │  Sub total                     980.60          │
│  [Freight        ][ 50 ][ Taxable ✓ ]  +     │  Bill discount   [ 2.00 % ]     -19.61          │
│  [Packing        ][  0 ][        ]           │  Taxable value                   960.99         │
│  Other: __________   Interest/late fee: ____  │  CGST 2.5%  12.01  │ SGST 2.5%  12.01          │
│                                              │  CGST 18%   25.31  │ SGST 18%   25.31          │
│  Payment (F9)  Cash [ 1200 ] UPI [ ] Cheq[ ]  │  Total tax                       74.64         │
│  Expected 1,054.95 → Change 145.05            │  Round off                          0.36       │
│                                              │  ─────────────────────────────────────────      │
│  🗒 Notes  📎 Attach  🚚 Vehicle              │  GRAND TOTAL          ₹ 1,036.00              │
│                                              │  Balance               ₹ 1,036.00               │
├──────────────────────────────────────────────┴───────────────────────────────────────────────┤
│ [Hold (F6)]  [Save (F5)]  [Save & Print (Ctrl+F5)]  [WhatsApp]  [PDF]  [SMS]      ⌘K Search   │
│ Shortcuts  F1 item · F2 party · F4 disc · F5 save · F6 hold · F7 pay · F9 tender · F11 del     │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```
Mobile version: same fields, bottom sheet for totals, row-swipe to delete, FAB `+` for add item, `Save & Print` sticky.

### Mobile New Bill (3 states)
```
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│ ←  New GST Bill   ⋮     │  │ 🔎 atta 5kg          ✕  │  │ Bill · USB/26-27/422    │
│ ● Offline · 3 items     │  │ Aashirvaad Atta 5kg     │  │ ─────────────────────────  │
│ Party  [Guest ▾]     ⌄  │  │  1101 · 5% · ₹420  ✔︎   │  │ 2  Aashirvaad Atta 5kg    │
│ ┌─────────────────────┐ │  │ Fortune Sunflower 1L    │  │    ₹420 ×2        882.00  │
│ │2 Aashirvaad Atta 5kg│ │  │ Fortune Oil 5L          │  │ 1  Fortune Oil 1L         │
│ │  ₹420 × 2     882.00│ │  │ [Recent] Atta 5kg, Oil… │  │    ₹148 ×1        165.91  │
│ │  [−][ 2 ][+]        │ │  └─────────────────────────┘  │ ─────────────────────────  │
│ └─────────────────────┘ │  │                             │ [ + Add item ]              │
│ 1 Fortune Oil 1L 165.91 │  │                             │                             │
│ ─────────────────────────  │                           │  TOTAL ₹1,036.00  ▼         │
│ Discount 2% · Tax 74.64  │                             │  [ Save & Print  ⌁ ]        │
│ TOTAL ₹1,036.00  ▼       │                             └─────────────────────────┘   │
│ [Hold][Save&Print]       │  (totals expand into CGST/SGST slab table)                 │
└─────────────────────────┘
```

## C. Dashboard — 1:1 with the reference design (locked)

```
┌─ SIDEBAR 240px ──┬─ TOPBAR 64px ───────────────────────────────────────────────────────────────┐
│  UMESH          │ [🔍 Search bill, customer or item…        ⌘K]  [हिंदी|EN]  🔔  [UK Umesh   │
│   S·M·A·R·T·B·I·L·L│                                                              Kumar · Admin ⊕] │
│ ┌──────────────┐ ├──────────────────────────────────────────────────────────────────────────────┤
│ │US Umesh Seeds│ │  Hello, Umesh!                                     [₹ Record Payment]        │
│ │Main Branch · │ │  See a complete snapshot of today's business.      [+ New Bill   F2]          │
│ │Sehore      ⌄ │ │  ┌──────────────────┬─────────────────┬──────────────────┬─────────────────┐  │
│ └──────────────┘ │  │▤ Today's Sales   │◎ Total Due     │📈 This Month's   │🛍 Today's       │  │
│ WORKSPACE        │  │     ↗ +12.5%│    │    ⌄ View        │    ↗ +8.2%      │  Collection ●Live│  │
│ ▸ Dashboard ●    │  │ ₹19,385          │ ₹39,705         │ ₹79,811         │ ₹13,400         │  │
│ ▸ Sales Bills  F2│  │ 2 bills created… │ Outstanding from│ Better than last│ Stock value ₹4L │  │
│ ▸ Customers      │  │                  │ 8 customers     │ month           │                 │  │
│ ▸ Items & Stock  │  └──────────────────┴─────────────────┴──────────────────┴─────────────────┘  │
│ ▸ Payments       │  ┌─ Sales Performance ───────────────────────┐ ┌─ Quick Actions ───────────┐  │
│ ▸ Reports        │  │ Gross sales over the last 7 days          │ │ Your essential daily tasks │  │
│                  │  │            7-day sales        ₹79,811     │ │ ▤ Create New Bill       ›  │  │
│                  │  │ ₹20,433 ┤                     ██  ██      │ │   Retail or wholesale invoice  │
│                  │  │ ₹10,216 ┤   ▄▄  ▄▄  ▄▄ ▄   ▄  ██  ██  ▁  │ │ ₹ Record Payment          ›  │  │
│                  │  │       0 ┤ ▄▄ ▄ ▄▄ ▄ ▄▄ ▄ ██  ██       │ │ 👥 View Customers         ›  │  │
│                  │  │          Tue Wed Thu Fri Sat Sun Mon     │ │   Cash, UPI or bank entry  │  │
│ ✦ SMART TIP      │  │ ● Total Sales   ↗ Steady growth this week │ │ 📊 View Reports           ›  │  │
│ 4 items are      │  └───────────────────────────────────────────┘ └───────────────────────────┘  │
│ running low.     │  ┌─ Recent Bills ────────────────────────────┐ ─ Low Stock         (4) ───┐  │
│ Reorder them on  │  │ INVOICE      CUSTOMER         DATE    AMT  │ │ Replenishment needed soon │  │
│ time. [View     │  │ USB-2026-0142 Shree Balaji    07 Sept ₹13,…│ │ ⬡ Crystal Moong Samrat   3│  │
│ stock ›]         │  │             Krishi Kendra       2026 ●Paid │ │   CMS-05 · Min. 8    Bag │  │
│ ⚙ Settings       │  │             9876543210              👁     │ │ ⬡ Seminis Tomato Abhi.  5│  │
│ 🛡 Your data is  │  └───────────────────────────────────────────┘ │   STA-106 · Min. 10 Packet│  │
│   secure         │                                                 └───────────────────────────┘  │
└──────────────────┴──────────────────────────────────────────────────────────────────────────────┘
```

**Layout math:** content max-width 1240px, 12-col grid, gap 16px → KPI row = 4×3 · chart 8 + quick actions 4 · table 8 + low-stock 4. Card padding 18/20px, title 15px/700, sub-label 12px `--ink-500`, KPI number 26px mono 700, sidebar item height 40px, icon chip 18px glyph.

**Grid blocks (component → data):**
| Block | Component | Feed | Role visibility |
|---|---|---|---|
| Greeting + 2 actions | `PageHeader` | user name, `?scope=today` | all |
| 4 KPI | `StatCard` ×4 | `kpis[]` | cashier: `Bills today` instead of margin/stock value |
| Bar chart 7/30/90d | `TrendChart` | `series[]` | owner/manager |
| Quick actions | `ActionList` | static + `perms` | per role |
| Recent bills | `DataTable(compact)` | `/documents?limit=8` | all (cashier sees only own) |
| Low stock | `AlertList` | `/stock/alerts?type=reorder` | owner/manager/stock |

**Data contract (one call, cached 30s, SSE-patched live):**
```jsonc
GET /api/v1/dashboard?scope=today&prev=7d
{ "greeting":"Hello, Umesh!", "branch":"Main Branch · Sehore",
  "kpis":[ {"key":"sales_today","label":"Today's Sales","value":19385,"trend":12.5,
            "icon":"receipt","sub":"2 bills created today"},
          {"key":"total_due","label":"Total Due","value":39705,"icon":"wallet",
            "sub":"Outstanding from 8 customers","action":{"label":"View","href":"/reports/outstanding"}},
          {"key":"sales_mtd","label":"This Month's Sale","value":79811,"trend":8.2,
            "icon":"chart","sub":"Better than last month"},
          {"key":"collection_today","label":"Today's Collection","value":13400,"live":true,
            "icon":"inbox","sub":"Stock value ₹4,12,640"} ],
  "series":{"chart":"bar","labels":["Tue","Wed","Thu","Fri","Sat","Sun","Mon"],
            "values":[4120,6880,9540,13210,5240,20433,19385],"total":79811,
            "highlight":["Sun","Mon"],"note":"Steady growth this week"},
  "quick_actions":[{"icon":"receipt","label":"Create New Bill","desc":"Retail or wholesale invoice",
                    "href":"/bills/new","kbd":"F2"}, "…"],
  "recent_bills":[{"invoice":"USB-2026-0142","party":"Shree Balaji Krishi Kendra",
                   "party_phone":"9876543210","date":"2026-09-07","amount":13400,"status":"paid"}],
  "alerts":{"low_stock":{"count":4,"items":[{"item":"Crystal Moong Samrat","sku":"CMS-05",
             "stock":3,"min":8,"unit":"Bag"}]}} }
```
Every tile, bar, row and badge is clickable → deep-links into the matching pre-filtered report. No decorative dead cards.

**v1.1 additions to the same grid (visual language unchanged):**
Row-4 `Payment mix donut` (UPI/Cash/Card/Credit) + `Top items today` · Row-5 `Udhaar ageing stacked bar (0-30/31-60/61-90/90+)` + `Expiry radar` + `Day-close & backup status` · Season strip for agri vertical (`Kharif 2026 · 41 days to sowing window`) — see `PLAN.md §M18`.

**Responsive contract:** ≥1280 as above · 1024–1279 sidebar → 72px icon rail (labels on hover), KPI 2×2 · 768–1023 chart full-width above quick-actions · <768 = mobile app: bottom tabs (Home/Bill/Items/Parties/Reports) + center `+` FAB, KPI as horizontal snap carousel, quick actions 2×2, search in top bar → full-screen sheet.
## D. Invoice PDF (A4, what the customer receives)
```
        LOGO        UMESH SMARTBILL                          TAX INVOICE — ORIGINAL (BUYER)
                    Shree Enterprises, Main Bazaar Road,      Invoice No : USB/26-27/000422
                    Ambikapur, Surguja, CG – 497001            Date       : 07/09/2026
                    GSTIN: 22ABCDE1234F1Z5  Ph: +91 9xxxxx     Due date   : 07/09/2026
                    State code 22 · FSSAI 100…                 Mode: Credit · Ref: PO-88
 Bill To ──────────────────────────────────────────────────────────────────────────────────────
 Raj Kirana Store, Station Road, Singrauli (MP) — 23      Place of supply: 23 (Madhya Pradesh)
 GSTIN 23FGHIJ5678K2Z9
──────────────────────────────────────────────────────────────────────────────────────────────────
# Item                 HSN    Unit  Qty     Rate    Disc%   Taxable   Tax       Amount
1 Aashirvaad Atta 5kg  1101   PCS     2    420.00    0.00    840.00  5% 42.00    882.00
2 Fortune Oil 1L       1512   PCS     1    148.00    5.00    140.60  18% 25.31   165.91
3 Delivery service     9965   Trip    1     50.00    0.00     50.00  18%  9.00     59.00
──────────────────────────────────────────────────────────────────────────────────────────────────
 Freight (taxable, included above) 50.00                    Taxable value ......... 1,030.60
 Bill discount 2% ................................ -20.61   Discount .............. -20.61
                                                            CGST 2.5% ............. 12.01
 IGST 5% ........................... 48.85                   SGST 2.5% ............. 12.01
 IGST 18% .......................... 65.35                   IGST total ............ 114.20
                                                            Round off ............. -0.04
                                                            GRAND TOTAL ......... ₹ 1,136.00
 Amount in words: One thousand one hundred thirty-six rupees only.
 UPI: shree@okhdfcbank  [QR]   Bank: HDFC 5555 •••• 1234 IFSC HDFC0001234
 Terms: Goods once sold will not be taken back. Payment due within 15 days. Subject to Ambikapur jurisdiction.
                                        For Shree Enterprises                     Authorised Signatory
        HSN 1101 @5% 840.00 42.00 | 1512 @18% 140.60 25.31 | 9965 @18% 50.00 9.00 | Total 1,030.60 156.21
        Computer-generated invoice · No signature if emailed · Printed 07/09/2026 14:22 by Umesh
```
Thermal 80mm (same data, 32 cols) and 240mm for garments; KOT drops GST entirely.

## E. Reports: Itemwise Sales + Outstanding (pattern for all 18 reports)
```
┌ Reports ▸ Itemwise Sales ─────────────────────────────────────────────────────────────────────┐
│ 01 Sep 2026 → 07 Sep 2026  ▾ FY▾  Branch▾  Category▾  Item▾  [Compare prev period] [XLSX][PDF]│
│ ┌──────────────────────┬────────┬───────┬──────────┬──────────┬─────────┬────────┬──────────┐  │
│ │ Item                 │ HSN    │ Qty   │ Gross    │ Disc     │ Taxable │ Tax    │ Net      │  │
│ ├──────────────────────┼────────┼───────┼──────────┼──────────┼─────────┼────────┼──────────┤  │
│ │ Fortune Oil 1L       │ 1512   │ 132   │ 19,536   │ -390.72  │19,145.28│3,446.15│22,591.43 │  │
│ │ Aashirvaad Atta 5kg  │ 1101   │ 268   │112,560   │ -1,125   │111,435  │5,571.75│117,006.75│  │
│ ▸ drill to 41 bills    │        │       │          │          │         │        │  [→]     │  │
│ └──────────────────────┴────────┴───────┴──────────┴──────────┴─────────┴────────┴──────────┘  │
│ TOTAL                                    Qty 400  Gross 132,096  Disc 1,516  Net 139,598       │
│ (click any row → bills → line detail; every number drillable to source document)               │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘

┌ Reports ▸ Party Outstanding ──────────────────────────────────────────────────────────────────┐
│ As on 07 Sep 2026 · Aging: [0-30] [31-60] [61-90] [90+]  [Send reminder] [Collect]            │
│ Party              Total    0-30    31-60   61-90   90+    Last paid   Credit limit  ⚑          │
│ Raj Kirana       42,180   12,000   18,180   12,000   0     12 Aug      50,000        —         │
│ Anil Traders     18,400    4,400    14,000    0       0     28 Jul      15,000      OVER LIMIT  │
│ Guest/Suspense    2,900    2,900     0        0        0     —            —          block sale  │
```

## F. Print template designer
```
┌ Templates ▸ "A4 Standard" [80mm thermal ▾] ─────────────────────────────────────────────────┐
│  [Blocks]        [ Canvas: 80mm preview, live with real bill USB/422 ]      [Properties]      │
│  ▢ Logo          ┌────────────────────────────────┐   Font      [ Inter ▾ ] 12pt              │
│  ▢ Firm block    │        UMESH SMARTBILL         │   Alignment [ centre ▾ ]                  │
│  ▢ Party block   │  Shree Enterprises · GSTIN 22…  │   Columns toggles:                        │
│  ▢ Item table    │  Bill USB/26-27/422  07/09/26   │    ☑ HSN ☑ Disc ☑ Tax ☐ Batch ☐ Serial   │
│  ▢ Totals box    ├────────────────────────────────┤   Divider style ─ / ═ / ▬                 │
│  ▢ Terms         │ #Item        Qty  Rate  Amount │   Header text · Footer text · Signature   │
│  ▢ Bank+QR       │ …                              │   Show "Original/Duplicate", tax per slab  │
│  ▢ Footer        └────────────────────────────────┘   [Auto-print after save] [Silent print]    │
│  Drag to reorder · click block to edit · device test-print ▸ [Rongda 80mm ✓]                   │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## G. REST/JSON contract (v1 — used by web, PWA, Android)

```
POST   /api/v1/auth/otp/request   {phone}
POST   /api/v1/auth/otp/verify    {phone, code, device:{label,platform}}  -> {access, refresh}
GET    /api/v1/bootstrap?since=   -> company+users+masters+templates+next numbers (one call, cached)
GET    /api/v1/items?q=atta&limit=25&cursor=   -> {rows:[{id,sku,name,unit,rate,mrp,hsn,tax,stock,batches}],cursor}
POST   /api/v1/items/import (csv/xlsx, dryRun=true → error report)
GET    /api/v1/parties?q=98…      POST /api/v1/parties/{id}/ledger?from=&to=
POST   /api/v1/documents          {doc_type, party_id, lines[], charges[], payments[], client_op_id}
                                   -> 201 {id, number, totals, stock_delta}  (idempotent on client_op_id)
POST   /api/v1/documents/{id}/cancel|duplicate|reprint|revise
POST   /api/v1/documents/{id}/hold  -> repeater list
PATCH  /api/v1/documents/{id}/lock
GET    /api/v1/documents/{id}/pdf?size=80mm|a4&variant=image|pdf  -> signed url
POST   /api/v1/payments           {direction, party_id, allocations[]}
POST   /api/v1/stock/adjust       {item_id, godown_id, qty|new_qty, reason, batch_id}
POST   /api/v1/stock/count-sheet  {items[], commit=true}
GET    /api/v1/reports/{key}?group=item|party|day&filters&format=json|csv|xlsx
GET    /api/v1/gst/gstr1?period=2026-09&format=json  -> portal-ready JSON (+ validation report)
GET    /api/v1/dashboard/summary
POST   /api/v1/messages/send      {kind, document_id|party_id, channel}
POST   /api/v1/print/jobs         {template_id, document_ids[], printer_hint}
POST   /api/v1/sync/push          {ops:[{op_id,entity,op,payload,base_version}]}
   ->  {acked:[op_id], conflicts:[{op_id, server_row, resolution}]}
GET    /api/v1/sync/pull?since=<vector-clock>
POST   /api/v1/backups            {kind}   GET /api/v1/backups/{id}/restore?dryRun=true
GET    /api/v1/migrate/{source}/mapping   POST /api/v1/migrate/{source}  (vyapar|mybillbook|tally|busy|xlsx)
```

**Realtime:** `GET /api/v1/events` (SSE) → `{type:'sync.status'|'doc.created'|'stock.alert'|'print.result', ...}`
**Errors:** `{code:'BILL_LOCKED'|'NEGATIVE_STOCK'|'GSTIN_INVALID'|'PERIOD_LOCKED'|'NUMBER_BLOCK_EXHAUSTED', message, field, hint}` — every code mapped to an on-screen hint with a "Fix" action.

## H. Front-end component inventory (build order)
`DataTable` (virtual, sticky totals, saved views, XLSX/PDF export) · `ItemSearchBox` (trigram, barcode, keyboard) · `QtyStepper` (`2x12`) · `MoneyInput`/`MoneyCell` · `PartyPicker` · `TaxSummaryCard` (slab table) · `TenderPanel` (denominations + change) · `DocFormShell` (shared by 12 doc types) · `PrintPreview` (80mm/A4 iframe, live) · `HoldRack` · `StatusPill` · `OfflineBanner` · `SyncQueuePanel` · `EmptyState` · `ConfirmDelete(with reason)` · `ReportViewer` · `AgingBar` · `Sparkline` · `WizardStep` · `FileDropImporter` · `TemplateCanvas` · `AuditDiffModal`.

## I0. Requirements → UI features map (11-point checklist, all shipped in prototype)
| REQ | UI affordance | Where |
|---|---|---|
| 1 keyboard-first | F1/F2/F4/F5/F6/F9/F10(themes)/⌘K + Enter chains qty→qty→search | bill screen |
| 2 ≥10 themes | 12 token-pack themes, live-apply, invoice accent tints | top-bar ◑ Theme / F10 |
| 3 wholesale+retail | `🏷 Retail / 📦 Wholesale` price-list chips per bill; rate auto-swap | bill header row |
| 4/7 SMS/WhatsApp/PDF | Share bar: 💬WhatsApp · ✉SMS · 📞Call · ⧉Copy · 🖨PDF | every invoice/receipt preview |
| 5 cash/credit/payment+record | Payments = separate `RCP-####` receipt records tab + Payment-against-bill select + khata ledger | Customers / Reports |
| 6 web+mobile, 1 mobile+2 PC | responsive PWA (bottom nav <820px), devices table in schema | whole app |
| 8 item dual rates | Items table = Retail ₹ + Wholesale ₹ inline columns | Items & Stock |
| 9 per-customer rates | "Custom rates ⚡" rate-book modal; priority custom > mode; `custom⚡` badge on lines | Customers |
| 10 A4/A5/thermal + edit | preview toggle A4 / A5 / 80mm / 240mm; ✎ Modify → revision++, recompute, stock+udhaar adjust | print overlay / bill list |
| 11 frozen rate + dates | line snapshot at save; catalog edits never rewrite bills; footer: `Bill date … Banaya gaya …` + REVISED stamp | invoice gen strip |

## I. P0 acceptance checklist (Definition of Done)
- [ ] Airplane mode: create → save → print → share works end to end; 100 bills queued and sync in one go with correct numbers
- [ ] 5-item bill by keyboard in ≤ 12s (timed, trained user)
- [ ] 200 golden tax cases green, incl. every odd-split case in `docs/billing-rules.md §12`
- [ ] GSTR-1 JSON validates on GST portal (no rework)
- [ ] Outstanding / Itemwise / Daywise reports match bill totals to the paisa
- [ ] Auto backup every 60 min + restore rehearsal documented in onboarding
- [ ] A4 + 80mm templates render byte-identical for the same bill (snapshot test)
