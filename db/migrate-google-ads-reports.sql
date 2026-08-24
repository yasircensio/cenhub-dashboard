-- Google Ads reports (separate from Meta report tables)

CREATE TABLE IF NOT EXISTS google_ads_report_clients (
  id TEXT PRIMARY KEY,
  google_customer_id TEXT NOT NULL,
  account_name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  show_bottomline BOOLEAN NOT NULL DEFAULT FALSE,
  fee_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  fee_percent NUMERIC NOT NULL DEFAULT 20,
  fee_mode TEXT,
  marketing_fee_amount NUMERIC NOT NULL DEFAULT 0,
  default_won_leads NUMERIC,
  default_avg_lead_value NUMERIC,
  default_avg_profit_per_won NUMERIC,
  linked_meta_client_id TEXT,
  excel_sheet_url TEXT,
  spend_chart_type TEXT NOT NULL DEFAULT 'area',
  scenario_month_window TEXT NOT NULL DEFAULT '6',
  scenario_smooth_uneven BOOLEAN NOT NULL DEFAULT TRUE,
  scenario_blend_history BOOLEAN NOT NULL DEFAULT FALSE,
  scenario_include_trend BOOLEAN NOT NULL DEFAULT FALSE,
  budget_multiplier NUMERIC NOT NULL DEFAULT 2,
  budget_baseline TEXT NOT NULL DEFAULT 'year',
  timezone TEXT NOT NULL DEFAULT 'Europe/Copenhagen',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS google_ads_report_clients_customer_idx
  ON google_ads_report_clients (google_customer_id);

CREATE TABLE IF NOT EXISTS google_ads_report_months (
  id BIGSERIAL PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES google_ads_report_clients (id) ON DELETE CASCADE,
  month_key TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  google_spend NUMERIC,
  google_budget NUMERIC,
  google_impressions NUMERIC,
  google_clicks NUMERIC,
  google_conversions NUMERIC,
  google_sales NUMERIC,
  google_conversions_value NUMERIC,
  google_fetched_at TIMESTAMPTZ,
  won_leads NUMERIC,
  avg_lead_value NUMERIC,
  avg_profit_per_won NUMERIC,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS google_ads_report_months_client_month_idx
  ON google_ads_report_months (client_id, month_key);
