-- Meta Client Reports module
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS meta_report_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS meta_report_show_bottomline BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS meta_report_fee_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS meta_report_fee_percent NUMERIC NOT NULL DEFAULT 20;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS meta_report_access_token TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS meta_report_default_won_leads NUMERIC;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS meta_report_default_avg_lead_value NUMERIC;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS meta_report_default_avg_profit_per_won NUMERIC;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS meta_report_show_other BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS meta_report_table_columns INTEGER NOT NULL DEFAULT 1;

CREATE UNIQUE INDEX IF NOT EXISTS accounts_meta_report_access_token_idx
  ON accounts (meta_report_access_token)
  WHERE meta_report_access_token IS NOT NULL AND meta_report_access_token <> '';

CREATE TABLE IF NOT EXISTS meta_report_months (
  id BIGSERIAL PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES accounts (client_id) ON DELETE CASCADE,
  month_key TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  meta_spend NUMERIC,
  meta_cpm NUMERIC,
  meta_impressions NUMERIC,
  meta_reach NUMERIC,
  meta_clicks NUMERIC,
  meta_leads INTEGER,
  meta_fetched_at TIMESTAMPTZ,
  won_leads NUMERIC,
  avg_lead_value NUMERIC,
  avg_profit_per_won NUMERIC,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS meta_report_months_client_month_idx
  ON meta_report_months (client_id, month_key);

CREATE TABLE IF NOT EXISTS meta_report_line_items (
  id BIGSERIAL PRIMARY KEY,
  meta_report_month_id BIGINT NOT NULL REFERENCES meta_report_months (id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS meta_report_line_items_month_id_idx
  ON meta_report_line_items (meta_report_month_id, sort_order ASC);
