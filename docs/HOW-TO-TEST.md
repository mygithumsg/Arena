# UMESH SMARTBILL — App kaise check karenge (Testing Playbook)

Do level ka testing: **A) Abhi ka prototype** (aap khud browser/phone mein) aur **B) Real app ka QA process** (jab P0/P1 build hoga). Prototype ke saath automated test bhi already chal raha hai (`npm run test:tax` → 11/11 pass).

---

## A. Prototype khud kaise verify karein (15 minute ka round)

### 1. Billing math — sabse important (Tally/Excel se tally)
Bill screen par ye exact bill banao aur expected value se match karo:

| Test | Kaise | Expected (sahi answer) |
|---|---|---|
| **T1 basic** | Atta 5kg qty 2 @₹420 (GST 5%) | Taxable ₹840.00 · tax ₹42.00 · **₹882.00** |
| **T2 line disc** | + Fortune Oil 1L qty 1 @₹148, line Disc 5%, GST 18% | line taxable ₹140.60 · tax ₹25.31 |
| **T3 bill disc** | Bill discount 2% (top-right box) | discount pro-rata dono lines par; taxable ₹960.99 |
| **T4 freight** | + Freight ₹50 "taxable @ max slab" | freight ka tax **18%** pe = ₹9 (5% pe nahi!) |
| **T5 round-off** | Round policy Nearest ₹1 | grand ₹1,086.00 (₹1,085.95 + ₹0.05 round off line dikhegi) |
| **T6 IGST** | Party = Sharma Agro (MP, state 23) | CGST/SGST gayab, **IGST** dikhe — auto-detect |
| **T7 odd-paisa** | Sirf ₹15 ka item @5% intra | CGST 0.38 + SGST 0.37 = 0.75 (₹1 drift nahi) |
| **T8 credit** | Payment mode Credit, paid 0 | bill status **Due**, Customer screen ka balance badha, dashboard "Total Due" badha |
| **T9 stock** | Bill save karo | Items screen pe qty kam (24→22). Low stock badge update |
| **T10 over-limit** | Gupta Store ka limit cross karo | amber warning strip "Credit limit exceed" |

**Golden rule:** har bill ka `taxable + tax + charges + round-off = grand` hona chahiye — ye engine mein 500 random cases par automated verify hota hai (fuzz test).

### 2. Print / PDF test
- Save & Print → A4 preview: GSTIN, place-of-supply, HSN, slab-wise tax table, amount-in-words check karo
- "80mm thermal" toggle → 32-column layout, totals sahi, cut karne layak compact
- Browser Print (Ctrl+P) → "Save as PDF" → **PDF mein sirf invoice aana chahiye, poora app nahi**
- Printer ho toh: print settings mein margins = Default/None, scale = 100%

### 3. Reports consistency (sabse common bug-yehi fail hota hai)
- Reports → Daywise: aaj ke 3 bills ka total = dashboard "Today's Sales" **to the paisa**
- Itemwise: ek item ka Qty = aaj uske kitte bika
- Outstanding: Customer screen ka total = Daywise ke Credit column ka sum
- Date range change karo → sab reports ek saath badlein (stale data = fail)
- Export CSV → Excel mein kholke SUM() se match

### 4. Offline / data safety (prototype: localStorage)
- Bill banao → page refresh → bill abhi bhi hona chahiye
- Network off (DevTools → Offline) → app khula, bill bana, save hua
- Sidebar "Reset demo data" → fresh seed

### 5. Mobile check
- Phone se preview URL kholo (ya DevTools → device toolbar 390px)
- Bottom nav chale, New Bill ek haath se ban jaye, koi text cut/overlap na ho, tap-targets 44px

### 6. UI polish pass (reference design se compare)
Sidebar #062A1E + active row green · cards white/12px radius/no shadow · saare amounts mono font right-aligned · badges (↗ +12.5%, ● Live, ● Paid) colors reference se match · mobile pe sab 2-col grid.

---

## B. Real app ke liye QA process (jab P0/P1 code hoga)

| Layer | Kya check | Kab | Har feature ke saath |
|---|---|---|---|
| **Unit** | tax engine 200+ golden cases (`docs/billing-rules.md §12`), round-off, HSN rules, in-words | CI, har PR |
| **Property/fuzz** | identity `taxable+tax+charges+round=grand` 10k random bills | CI |
| **API** | idempotent sync (same `client_op_id` do baar bhejo → 1 hi bill), numbering gaps, RBAC (cashier rate change kare → 403) | CI |
| **E2E** | Playwright: login → bill → print → PDF snapshot → sync | Nightly |
| **Hardware rig** | 6 printers (Epson/Casio/Rongda/POSBI/Kashner/Zen) × A4/80mm/240mm, scan gun,weighing scale | Release se pehle |
| **Legal/CA audit** | 1 mahine ka dummy data → GSTR-1 JSON → portal par upload → nil rework | v1 se pehle |
| **Pilot (sabse asli)** | **3 dukaane, 14 din**: 1 din ke saare *paper bills* app mein daalo → end-of-day total paper se milna chahiye; staff se chhupake use karo → kahan atke, wahi design bug hai | P1 exit criteria |
| **Load** | 50k items + 100k invoices: search <150ms, bill save <250ms, report <2s | P2 |

**Sign-off checklist (release gate):** math zero-error · print sahi 6 printers par · offline 100/100 sync · pilot 3/3 shops "Tally chhod di" bolein. 🙂

---

## Prototype kaise chalate hain
```bash
cd prototype && npm install
npm run dev        # dev mode (HMR) on :5173
npm start          # production build + static preview — Arena preview panel isi ko serve karta hai
npm run check      # = 11 tax golden tests + SSR smoke render (poora app render hota hai without browser)
```

**Regression note (07 Sep):** preview blank-crash ka asli reason TDZ tha — `App()` mein `const s = useApp()` declare hone se *pehle* ek `useEffect` ki deps array `s` padh rahi thi. `npm run check` ka smoke test isi class ke errors ko bina browser pakad leta hai — isliye ye har change se pehle green hona chahiye.
Reset data: sidebar ke neeche "↺ Reset demo data". Demo seed bills bhi generate hote hain pehli baar open par.
