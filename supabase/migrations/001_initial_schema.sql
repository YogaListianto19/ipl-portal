-- ============================================================
-- IPL Portal — Initial Schema
-- G-Land Katapang Residence | Blok Rossela
-- Run this in Supabase SQL Editor
-- ============================================================

-- Residents (warga + pengurus) — diisi via sync Excel
CREATE TABLE IF NOT EXISTS residents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR NOT NULL,
  blok        VARCHAR NOT NULL UNIQUE,    -- "Rossela 01" — primary matching key
  mobile      VARCHAR NOT NULL UNIQUE,    -- username login (nomor HP)
  pw_hash     VARCHAR NOT NULL,           -- bcrypt hash dari web_password Odoo
  role        VARCHAR NOT NULL DEFAULT 'resident'
              CHECK (role IN ('resident','admin','treasurer','chairman')),
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Invoices IPL (from account.move out_invoice)
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number  VARCHAR NOT NULL UNIQUE,
  invoice_date    DATE,
  month_period    VARCHAR NOT NULL,        -- "April", "Maret", etc
  year_period     VARCHAR NOT NULL,        -- "2026", "2025"
  resident_name   VARCHAR,                -- dari Odoo (untuk display fallback)
  blok            VARCHAR,                -- matching key ke residents
  amount_total    DECIMAL(15,2) NOT NULL,
  amount_due      DECIMAL(15,2) DEFAULT 0, -- 0 jika sudah lunas
  status          VARCHAR NOT NULL DEFAULT 'Not Paid'
                  CHECK (status IN ('Paid','Not Paid')),
  resident_id     UUID REFERENCES residents(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Expenses (from account.move vendor bill) — visible to all residents
CREATE TABLE IF NOT EXISTS expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number     VARCHAR NOT NULL UNIQUE,
  bill_date       DATE,
  due_date        DATE,
  vendor_name     VARCHAR,
  description     VARCHAR,
  amount_total    DECIMAL(15,2) NOT NULL,
  amount_due      DECIMAL(15,2) DEFAULT 0,
  payment_status  VARCHAR NOT NULL DEFAULT 'not_paid'
                  CHECK (payment_status IN ('paid','not_paid','partial','in_payment')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Sync logs
CREATE TABLE IF NOT EXISTS sync_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_at             TIMESTAMPTZ DEFAULT now(),
  synced_by           VARCHAR,
  file_name           VARCHAR,
  residents_new       INTEGER DEFAULT 0,
  residents_updated   INTEGER DEFAULT 0,
  invoices_new        INTEGER DEFAULT 0,
  invoices_updated    INTEGER DEFAULT 0,
  expenses_new        INTEGER DEFAULT 0,
  expenses_updated    INTEGER DEFAULT 0,
  status              VARCHAR DEFAULT 'success',
  notes               TEXT
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_invoices_resident_id ON invoices(resident_id);
CREATE INDEX IF NOT EXISTS idx_invoices_blok        ON invoices(blok);
CREATE INDEX IF NOT EXISTS idx_invoices_status      ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_period      ON invoices(year_period, month_period);
CREATE INDEX IF NOT EXISTS idx_residents_blok       ON residents(blok);
CREATE INDEX IF NOT EXISTS idx_residents_mobile     ON residents(mobile);
CREATE INDEX IF NOT EXISTS idx_residents_role       ON residents(role);
CREATE INDEX IF NOT EXISTS idx_expenses_date        ON expenses(bill_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_status      ON expenses(payment_status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_date       ON sync_logs(sync_at DESC);

-- ============================================================
-- Auto-update updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER residents_updated_at
  BEFORE UPDATE ON residents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
