-- =============================================================================
-- UMESH SMARTBILL  ·  Core schema v0.1  (PostgreSQL 16 · Prisma-mappable)
-- Conventions:
--   * every table: id uuid pk, tenant_id uuid not null, created_at/updated_at,
--     created_by/updated_by, version int default 1, deleted_at (soft delete)
--   * money  -> NUMERIC(14,2)  (API layer uses integer paise)
--   * stock qty -> NUMERIC(14,3); rates -> NUMERIC(14,4)
--   * every mutable monetary row carries version + updated_by for sync + audit
--   * append-only ledgers (stock_movements, ledger_entries, audit_logs) have
--     NO update/delete grant at app level
-- =============================================================================

-- ---------- tenancy & access ------------------------------------------------
CREATE TABLE tenants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text UNIQUE NOT NULL,
  name          text NOT NULL,
  plan          text NOT NULL DEFAULT 'free',      -- free|starter|business|pro
  seats         int  NOT NULL DEFAULT 1,
  status        text NOT NULL DEFAULT 'trial',     -- trial|active|grace|suspended
  trial_ends_at timestamptz,
  settings      jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE users (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id),
  full_name    text NOT NULL,
  phone        text UNIQUE,
  email        text UNIQUE,
  pin_hash     text,                               -- cashier switch PIN
  role         text NOT NULL,                      -- owner|manager|cashier|stock|accountant
  perms        jsonb NOT NULL DEFAULT '{}',        -- {max_disc_pct:5, edit_rate:false,...}
  active       boolean NOT NULL DEFAULT true,
  last_login_at timestamptz
);

CREATE TABLE devices (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id),
  user_id     uuid REFERENCES users(id),
  label       text,                                -- "Counter PC", "Owner Redmi"
  platform    text,                                -- web|android|ios|windows
  push_token  text,
  app_version text,
  last_sync_at timestamptz,
  revoked_at  timestamptz
);

CREATE TABLE audit_logs (
  id         bigserial PRIMARY KEY,
  tenant_id  uuid NOT NULL,
  user_id    uuid,
  device_id  uuid,
  action     text NOT NULL,      -- BILL_RATE_CHANGED | BACKUP_FAILED | ROLE_UPDATED
  entity     text, entity_id uuid,
  diff       jsonb,
  ip         inet,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- masters ---------------------------------------------------------
CREATE TABLE states (code text PRIMARY KEY, name_en text, name_hi text, gst_state_code char(2));

CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  parent_id uuid REFERENCES categories(id), name text NOT NULL,
  sort int DEFAULT 0, hsn_default text
);

CREATE TABLE brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  name text NOT NULL, country_of_origin text
);

CREATE TABLE units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  code text NOT NULL, name text NOT NULL, decimal_places smallint DEFAULT 0,
  base_unit_id uuid REFERENCES units(id), factor NUMERIC(14,6) DEFAULT 1  -- 1 BOX = 12 PCS
);

CREATE TABLE tax_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  name text NOT NULL,                -- "GST 18%", "Nil", "Exempt", "Composition 1%"
  rate NUMERIC(6,3) NOT NULL,        -- 18.000
  tax_type text NOT NULL,            -- gst|cess|taxable_no_gst|exempt
  hsn_digits smallint DEFAULT 4,     -- HSN length rule (4 or 6)
  effective_from date NOT NULL DEFAULT '2017-07-01',
  effective_to   date,                -- supports rate changes historically
  UNIQUE (tenant_id, name, rate, effective_from)
);

CREATE TABLE branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  name text NOT NULL, gstin text, state_code char(2), address jsonb,
  phone text, is_headquarters boolean DEFAULT true, active boolean DEFAULT true
);

CREATE TABLE godowns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  branch_id uuid REFERENCES branches(id), name text NOT NULL,
  address jsonb, is_default boolean DEFAULT false
);

-- ---------- items -----------------------------------------------------------
CREATE TABLE items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  sku text NOT NULL, barcode text, name text NOT NULL, alias text,
  brand_id uuid, category_id uuid, unit_id uuid NOT NULL,
  item_type text NOT NULL DEFAULT 'goods',          -- goods|service|combo|non_stock
  hsn_sac text, tax_rate_id uuid REFERENCES tax_rates(id),
  tax_inclusive boolean DEFAULT false,              -- price is MRP-inclusive
  mrp NUMERIC(14,4), cost_price NUMERIC(14,4), sale_price NUMERIC(14,4),
  scheme_text text, image_url text,
  track_stock boolean DEFAULT true, allow_negative boolean DEFAULT false,
  track_batch boolean DEFAULT false, track_expiry boolean DEFAULT false,
  track_serial boolean DEFAULT false,
  min_qty NUMERIC(14,3) DEFAULT 0, max_qty NUMERIC(14,3) DEFAULT 0, reorder_qty NUMERIC(14,3),
  gst_exempt boolean DEFAULT false, cess_rate NUMERIC(6,3) DEFAULT 0,
  returnable boolean DEFAULT true, active boolean DEFAULT true,
  attrs jsonb DEFAULT '{}',                          -- custom fields + combo BOM
  version int DEFAULT 1, created_at timestamptz DEFAULT now(), updated_at timestamptz,
  UNIQUE (tenant_id, sku)
);
CREATE INDEX ON items (tenant_id, lower(name) varchar_pattern_ops);
CREATE INDEX ON items (tenant_id, barcode);

CREATE TABLE item_prices (                                    -- price lists
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  list text NOT NULL,                                          -- retail|wholesale|dealer|staff
  rate NUMERIC(14,4) NOT NULL, tax_rate_id uuid, from_date date DEFAULT current_date,
  UNIQUE (tenant_id, item_id, list, from_date)
);

CREATE TABLE item_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  size text, colour text, sku text, barcode text,
  rate NUMERIC(14,4), mrp NUMERIC(14,4), active boolean DEFAULT true
);

CREATE TABLE stock_positions (            -- derived & reconciled, fast to read
  tenant_id uuid NOT NULL, item_id uuid NOT NULL,
  variant_id uuid, godown_id uuid,
  on_hand NUMERIC(14,3) NOT NULL DEFAULT 0,
  reserved NUMERIC(14,3) NOT NULL DEFAULT 0,
  available NUMERIC(14,3) GENERATED ALWAYS AS (on_hand - reserved) STORED,
  avg_cost NUMERIC(14,4) DEFAULT 0, value NUMERIC(16,2) DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (tenant_id, item_id, variant_id, godown_id)
);

CREATE TABLE batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  item_id uuid NOT NULL, variant_id uuid,
  batch_no text NOT NULL, mfg_date date, exp_date date,
  qty NUMERIC(14,3) NOT NULL DEFAULT 0, cost NUMERIC(14,4),
  godown_id uuid, pur_id uuid,
  UNIQUE (tenant_id, item_id, batch_no, godown_id)
);

CREATE TABLE serials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  item_id uuid NOT NULL, serial text NOT NULL,      -- IMEI / chassis
  status text NOT NULL DEFAULT 'in_stock',           -- in_stock|sold|returned|rma|wiped
  party_id uuid, bill_id uuid, warranty_till date, imei2 text,
  UNIQUE (tenant_id, item_id, serial)
);

CREATE TABLE stock_layers (               -- FIFO cost layers
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  item_id uuid NOT NULL, variant_id uuid, godown_id uuid, batch_id uuid,
  qty_in NUMERIC(14,3) NOT NULL, qty_left NUMERIC(14,3) NOT NULL,
  cost NUMERIC(14,4) NOT NULL, src_type text, src_id uuid, created_at timestamptz DEFAULT now()
);

CREATE TABLE stock_movements (            -- append-only truth
  id bigserial PRIMARY KEY, tenant_id uuid NOT NULL,
  item_id uuid NOT NULL, variant_id uuid, godown_id uuid, batch_id uuid, serial_id uuid,
  qty NUMERIC(14,3) NOT NULL,               -- signed: -ve out, +ve in
  rate NUMERIC(14,4), cost NUMERIC(14,4), balance_after NUMERIC(14,3),
  txn_type text NOT NULL,   -- sale|sale_return|purchase|purchase_return|adjust_in|adjust_out|transfer_in|transfer_out|count|consumption
  ref_type text, ref_id uuid, branch_id uuid,
  user_id uuid, device_id uuid, occurred_at timestamptz NOT NULL, sync_op_id uuid
);
CREATE INDEX ON stock_movements (tenant_id, item_id, occurred_at);
CREATE INDEX ON stock_movements (tenant_id, ref_type, ref_id);

-- ---------- parties ---------------------------------------------------------
CREATE TABLE parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  code text, name text NOT NULL, legal_name text,
  kind text NOT NULL,                       -- customer|supplier|both
  gstin text, gst_registered boolean DEFAULT true, pan text,
  state_code char(2), address jsonb NOT NULL DEFAULT '{}',
  phone text, phone2 text, email text, whatsapp_opt_in boolean DEFAULT true,
  credit_limit NUMERIC(14,2) DEFAULT 0, credit_days smallint DEFAULT 0,
  opening_balance NUMERIC(14,2) DEFAULT 0, opening_side text DEFAULT 'dr',
  price_list text DEFAULT 'retail', tags text[], notes text,
  blocked boolean DEFAULT false, active boolean DEFAULT true,
  version int DEFAULT 1, created_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, code)
);
CREATE INDEX ON parties (tenant_id, lower(name) varchar_pattern_ops);
CREATE INDEX ON parties (tenant_id, phone);

CREATE TABLE party_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  party_id uuid NOT NULL, purpose text NOT NULL,  -- bill_to|ship_to
  label text, gstin text, state_code char(2), address jsonb NOT NULL,
  is_default boolean DEFAULT true
);

CREATE TABLE party_rates (                 -- "last rate" memory per party
  tenant_id uuid NOT NULL, party_id uuid NOT NULL, item_id uuid NOT NULL,
  rate NUMERIC(14,4), last_txn_at timestamptz,
  PRIMARY KEY (tenant_id, party_id, item_id)
);

-- ---------- documents (all 12 types on one spine) ---------------------------
CREATE TABLE doc_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  branch_id uuid, doc_type text NOT NULL, prefix text NOT NULL, fy text NOT NULL,
  next_seq bigint NOT NULL DEFAULT 1,
  UNIQUE (tenant_id, branch_id, doc_type, fy)
);

CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  branch_id uuid REFERENCES branches(id),
  doc_type text NOT NULL,     -- sale_invoice|retail_bill|quotation|sales_order|purchase|purchase_order|grn|delivery_challan|credit_note|debit_note|payment_in|payment_out|journal|expense|stock_transfer|count_sheet
  number text NOT NULL, number_seq bigint,
  fy text NOT NULL, status text NOT NULL DEFAULT 'draft',
  -- draft|posted|part_paid|paid|cancelled|amended|printed|locked
  party_id uuid REFERENCES parties(id),
  bill_to_address jsonb, ship_to_address jsonb, place_of_supply char(2),
  inter_state boolean GENERATED ALWAYS AS (place_of_supply <> (address->>'state_code')) STORED,
  issue_date date NOT NULL, due_date date,
  ref_no text, ref_date date,            -- customer PO / supplier bill no.
  subtotal NUMERIC(14,2), disc_amount NUMERIC(14,2) DEFAULT 0,
  taxable_value NUMERIC(14,2), tax_amount NUMERIC(14,2) DEFAULT 0,
  cess_amount NUMERIC(14,2) DEFAULT 0,
  non_taxable_charges NUMERIC(14,2) DEFAULT 0,
  round_off NUMERIC(14,2) DEFAULT 0, grand_total NUMERIC(14,2) NOT NULL,
  paid_amount NUMERIC(14,2) DEFAULT 0, balance_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  amount_in_words text,
  transport jsonb,                        -- vehicle, lr no, from/to, ewb_no, distance
  einvoice jsonb,                         -- {irn, signed_qr, ack_no, ack_date, status}
  ewaybill jsonb,
  notes text, terms text, internal_notes text,
  origin_type text, origin_id uuid,      -- quotation -> invoice lineage
  revision int DEFAULT 1, prev_id uuid, printed_at timestamptz, print_count int DEFAULT 0,
  pdf_url text, image_url text,
  sync_op_id uuid UNIQUE,                -- idempotency key (client-generated)
  locked_at timestamptz, period_lock boolean DEFAULT false,
  created_by uuid, updated_by uuid, version int DEFAULT 1,
  created_at timestamptz DEFAULT now(), updated_at timestamptz, deleted_at timestamptz,
  UNIQUE (tenant_id, doc_type, fy, number)
);
CREATE INDEX ON documents (tenant_id, doc_type, issue_date DESC);
CREATE INDEX ON documents (tenant_id, party_id, balance_amount DESC) WHERE balance_amount > 0;
CREATE INDEX ON documents USING gin (tenant_id, to_tsvector('simple', coalesce(notes,'')));

CREATE TABLE document_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  line_no int NOT NULL,
  item_id uuid, variant_id uuid, batch_id uuid, serial_id uuid,
  description text, unit_id uuid, qty NUMERIC(14,3) NOT NULL,
  packs int, qty_per_pack NUMERIC(14,3),
  rate NUMERIC(14,4) NOT NULL, gross_amount NUMERIC(14,2),
  disc_pct NUMERIC(6,3) DEFAULT 0, disc_amount NUMERIC(14,2) DEFAULT 0,
  taxable_value NUMERIC(14,2) NOT NULL,
  hsn_sac text, tax_rate NUMERIC(6,3), tax_amount NUMERIC(14,2) DEFAULT 0,
  cess NUMERIC(14,2) DEFAULT 0, cgst NUMERIC(14,2) DEFAULT 0,
  sgst NUMERIC(14,2) DEFAULT 0, igst NUMERIC(14,2) DEFAULT 0,
  tax_split jsonb,                        -- full per-tax breakdown for exports
  tax_inclusive boolean DEFAULT false,
  returned_qty NUMERIC(14,3) DEFAULT 0,   -- for credit-note lineage
  attrs jsonb DEFAULT '{}',
  UNIQUE (document_id, line_no)
);
CREATE INDEX ON document_lines (tenant_id, item_id);

CREATE TABLE document_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  document_id uuid NOT NULL,
  kind text NOT NULL,        -- freight|packing|loading|insurance|courier|interest|rounding|other
  label text, basis text NOT NULL,     -- flat|pct_per_line|pct_of_total
  value NUMERIC(14,2) NOT NULL,
  taxable boolean NOT NULL DEFAULT true, tax_rate NUMERIC(6,3), tax_amount NUMERIC(14,2) DEFAULT 0,
  allocation jsonb            -- how distributed across lines (audit of §6 rule)
);

-- ---------- payments & ledger ----------------------------------------------
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  direction text NOT NULL,      -- in|out
  party_id uuid, date date NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  mode text NOT NULL,           -- cash|upi|card|cheque|neft|imps|bank|wallet|adjust
  ref_no text, bank_id uuid, cash_box_id uuid, instrument_no text, clearing_date date,
  status text DEFAULT 'cleared',  -- pending|cleared|bounced
  notes text, sync_op_id uuid UNIQUE, created_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE payment_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  payment_id uuid NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  document_id uuid NOT NULL, amount NUMERIC(14,2) NOT NULL,
  advance_use boolean DEFAULT false,
  UNIQUE (payment_id, document_id)
);

CREATE TABLE cash_boxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  branch_id uuid, name text NOT NULL, opening_balance NUMERIC(14,2) DEFAULT 0,
  session_started_at timestamptz, session_ended_at timestamptz,
  expected NUMERIC(14,2), counted NUMERIC(14,2), difference NUMERIC(14,2),
  denominations jsonb                -- {2000:5, 500:40, 100:120, ...}
);

CREATE TABLE banks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  name text NOT NULL, account_no text, ifsc text, branch text, kind text DEFAULT 'current',
  upi_vpa text, reconcile_start date
);
CREATE TABLE bank_txns (
  id bigserial PRIMARY KEY, tenant_id uuid NOT NULL, bank_id uuid NOT NULL,
  txn_date date NOT NULL, narr text, ref text, debit NUMERIC(14,2), credit NUMERIC(14,2),
  balance NUMERIC(14,2), matched_payment_id uuid, matched_at timestamptz, import_batch uuid
);

CREATE TABLE expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  parent_id uuid, name text NOT NULL, gst_treatment text DEFAULT 'none', tds_section text
);
CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  date date NOT NULL, category_id uuid, party_id uuid, document_id uuid,
  amount NUMERIC(14,2) NOT NULL, tax_amount NUMERIC(14,2) DEFAULT 0,
  tds_amount NUMERIC(14,2) DEFAULT 0, payment_id uuid,
  vendor_bill_no text, vendor_bill_date date, attachment_url text,
  split jsonb, note text, created_by uuid
);

CREATE TABLE ledger_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  code text, name text NOT NULL, group text NOT NULL,
  -- assets|liabilities|income|expense|bank|cash|party|inventory
  party_id uuid, is_system boolean DEFAULT false, opening NUMERIC(14,2) DEFAULT 0
);
CREATE TABLE ledger_entries (            -- double-entry spine (P3, exists from day 1)
  id bigserial PRIMARY KEY, tenant_id uuid NOT NULL,
  voucher_type text NOT NULL, voucher_id uuid NOT NULL, date date NOT NULL,
  account_id uuid NOT NULL, debit NUMERIC(14,2) DEFAULT 0, credit NUMERIC(14,2) DEFAULT 0,
  party_id uuid, item_id uuid, branch_id uuid, fy text NOT NULL,
  narration text, created_at timestamptz DEFAULT now(),
  CHECK (debit >= 0 AND credit >= 0 AND (debit = 0 OR credit = 0))
);
CREATE INDEX ON ledger_entries (tenant_id, account_id, date);

-- ---------- reporting support ------------------------------------------------
CREATE TABLE tax_slab_summaries (          -- materialized per period for GST reports
  tenant_id uuid NOT NULL, period text NOT NULL,   -- '2026-09' or FY '26-27'
  gst_type text, rate NUMERIC(6,3), hsn text,
  taxable_value NUMERIC(14,2), cgst NUMERIC(14,2), sgst NUMERIC(14,2), igst NUMERIC(14,2), cess NUMERIC(14,2),
  doc_count int, refreshed_at timestamptz DEFAULT now(),
  PRIMARY KEY (tenant_id, period, gst_type, rate, hsn)
);
CREATE TABLE daily_sales_closures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  branch_id uuid, close_date date NOT NULL, user_id uuid,
  bill_count int, gross NUMERIC(14,2), discount NUMERIC(14,2), tax NUMERIC(14,2),
  cash NUMERIC(14,2), upi NUMERIC(14,2), card NUMERIC(14,2), credit NUMERIC(14,2),
  cash_box_id uuid, variance NUMERIC(14,2), closed_at timestamptz, reopened_at timestamptz,
  UNIQUE (tenant_id, branch_id, close_date)
);

-- ---------- printing, messaging, sync ---------------------------------------
CREATE TABLE print_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  name text NOT NULL, paper text NOT NULL,       -- a4|a5|80mm|240mm|kashner|kot
  doc_types text[] NOT NULL DEFAULT '{sale_invoice}',
  layout jsonb NOT NULL, css text, is_default boolean DEFAULT false,
  version int DEFAULT 1
);
CREATE TABLE message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  kind text NOT NULL,        -- bill|receipt|reminder|delivery|offer|low_stock
  channel text NOT NULL,     -- whatsapp|sms|email|push
  body text NOT NULL, dlt_template_id text, variables text[] , is_default boolean
);
CREATE TABLE message_logs (
  id bigserial PRIMARY KEY, tenant_id uuid NOT NULL,
  template_kind text, channel text, to_number text, document_id uuid,
  status text, provider_msg_id text, error text, sent_at timestamptz DEFAULT now()
);
CREATE TABLE sync_queue (                  -- client mirror (also server-side mirror)
  id bigserial PRIMARY KEY, tenant_id uuid NOT NULL, device_id uuid,
  op_id uuid NOT NULL UNIQUE, entity text NOT NULL, entity_id uuid,
  op text NOT NULL, payload jsonb NOT NULL, base_version int,
  status text NOT NULL DEFAULT 'pending',    -- pending|sent|acked|conflict|failed
  attempts smallint DEFAULT 0, last_error text,
  client_ts timestamptz NOT NULL, server_ts timestamptz
);
CREATE TABLE backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  device_id uuid, kind text NOT NULL,      -- auto|manual|cloud|drive
  url text, size_bytes bigint, checksum text, row_count jsonb,
  status text, created_at timestamptz DEFAULT now()
);
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  plan text NOT NULL, seats int NOT NULL, cycle text NOT NULL,
  starts_at timestamptz, ends_at timestamptz,
  amount NUMERIC(14,2), gst NUMERIC(14,2), gateway text, gateway_ref text,
  invoice_url text, auto_renew boolean DEFAULT true, status text NOT NULL
);
CREATE TABLE number_blocks (              -- offline-safe invoice numbering
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  device_id uuid NOT NULL, doc_type text NOT NULL, fy text NOT NULL,
  start_seq bigint NOT NULL, size int NOT NULL, used_seq bigint NOT NULL DEFAULT 0,
  leased_until timestamptz
);

-- ---------- constraints worth enforcing in DB ------------------------------
ALTER TABLE documents ADD CONSTRAINT doc_totals_check CHECK (
  grand_total = taxable_value + tax_amount + cess_amount + non_taxable_charges
                + disc_amount * -1 + round_off);
ALTER TABLE documents ADD CONSTRAINT doc_paid_check CHECK (paid_amount >= 0 AND paid_amount <= grand_total + 0.01);
ALTER TABLE document_lines ADD CONSTRAINT line_tax_check CHECK (tax_amount >= 0 AND taxable_value >= 0);
ALTER TABLE tax_rates ADD CONSTRAINT rate_range CHECK (rate >= 0 AND rate <= 60);
ALTER TABLE parties ADD CONSTRAINT gstin_format CHECK (
  gstin IS NULL OR gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$');
