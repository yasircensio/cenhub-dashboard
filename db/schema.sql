CREATE TABLE IF NOT EXISTS accounts (
  client_id TEXT PRIMARY KEY,
  account_name TEXT NOT NULL,
  location_id TEXT,
  ghl_token_encrypted TEXT NOT NULL DEFAULT '',
  timezone TEXT NOT NULL DEFAULT 'Europe/Copenhagen',
  profit_field_id TEXT,
  facebook_client_id TEXT,
  default_ad_spend NUMERIC,
  new_leads_pipeline_id TEXT,
  sales_pipeline_id TEXT,
  after_sales_pipeline_id TEXT,
  win_pipeline_id TEXT,
  dedupe_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  metrics_model_set_at TIMESTAMPTZ,
  metrics_model_locked_at TIMESTAMPTZ,
  metrics_model_changed_at TIMESTAMPTZ,
  metrics_model_version INTEGER NOT NULL DEFAULT 1,
  ready_for_ghl BOOLEAN NOT NULL DEFAULT FALSE,
  meta_ad_account_id TEXT,
  meta_page_id TEXT,
  meta_pixel_id TEXT,
  meta_system_user_token_encrypted TEXT NOT NULL DEFAULT '',
  meta_page_access_token_encrypted TEXT NOT NULL DEFAULT '',
  meta_sync_status TEXT,
  meta_sync_error TEXT,
  meta_last_synced_at TIMESTAMPTZ,
  fb_lead_sync_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ghl_fb_lead_field_id TEXT,
  meta_report_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  meta_report_show_bottomline BOOLEAN NOT NULL DEFAULT FALSE,
  meta_report_fee_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  meta_report_fee_percent NUMERIC NOT NULL DEFAULT 20,
  meta_report_fee_mode TEXT,
  meta_report_marketing_fee_amount NUMERIC NOT NULL DEFAULT 0,
  meta_report_show_other BOOLEAN NOT NULL DEFAULT TRUE,
  meta_report_table_columns INTEGER NOT NULL DEFAULT 1,
  meta_report_spend_chart_type TEXT NOT NULL DEFAULT 'area',
  meta_report_scenario_trend_method TEXT NOT NULL DEFAULT 'recency_weighted',
  meta_report_scenario_month_window TEXT NOT NULL DEFAULT '6',
  meta_report_scenario_elasticity TEXT NOT NULL DEFAULT 'balanced',
  meta_report_scenario_smooth_uneven BOOLEAN NOT NULL DEFAULT TRUE,
  meta_report_scenario_blend_history BOOLEAN NOT NULL DEFAULT FALSE,
  meta_report_scenario_include_trend BOOLEAN NOT NULL DEFAULT FALSE,
  meta_report_scenario_caution_strong_months BOOLEAN NOT NULL DEFAULT FALSE,
  meta_report_budget_multiplier NUMERIC NOT NULL DEFAULT 2,
  meta_report_budget_baseline TEXT NOT NULL DEFAULT 'year',
  meta_report_access_token TEXT,
  meta_report_slug TEXT,
  meta_report_default_won_leads NUMERIC,
  meta_report_default_avg_lead_value NUMERIC,
  meta_report_default_avg_profit_per_won NUMERIC,
  meta_report_ghl_data_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  meta_report_topline_mode TEXT NOT NULL DEFAULT 'meta',
  meta_report_excel_sheet_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS accounts_location_id_idx
  ON accounts (location_id)
  WHERE location_id IS NOT NULL AND location_id <> '';

CREATE TABLE IF NOT EXISTS sync_snapshots (
  client_id TEXT PRIMARY KEY REFERENCES accounts (client_id) ON DELETE CASCADE,
  fetched_at TIMESTAMPTZ,
  opportunities JSONB NOT NULL DEFAULT '[]'::jsonb,
  pipelines JSONB NOT NULL DEFAULT '[]'::jsonb,
  users JSONB NOT NULL DEFAULT '[]'::jsonb,
  contact_count INTEGER NOT NULL DEFAULT 0,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  sync_error TEXT,
  sync_started_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sync_runs (
  id BIGSERIAL PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES accounts (client_id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running',
  error_message TEXT,
  opportunity_count INTEGER,
  source TEXT NOT NULL DEFAULT 'unknown'
);

CREATE INDEX IF NOT EXISTS sync_runs_client_id_started_at_idx
  ON sync_runs (client_id, started_at DESC);

CREATE TABLE IF NOT EXISTS meta_sync_runs (
  id BIGSERIAL PRIMARY KEY,
  client_id TEXT REFERENCES accounts (client_id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running',
  source TEXT NOT NULL DEFAULT 'unknown',
  error_message TEXT,
  this_month_spend NUMERIC,
  spend_date_stop DATE,
  metrics_client_id TEXT
);

CREATE INDEX IF NOT EXISTS meta_sync_runs_started_at_idx
  ON meta_sync_runs (started_at DESC);

CREATE INDEX IF NOT EXISTS meta_sync_runs_client_id_started_at_idx
  ON meta_sync_runs (client_id, started_at DESC);

CREATE TABLE IF NOT EXISTS meta_report_ghl_sync_runs (
  id BIGSERIAL PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES accounts (client_id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'success',
  source TEXT NOT NULL DEFAULT 'unknown',
  trigger TEXT NOT NULL DEFAULT 'unknown',
  error_message TEXT,
  detail JSONB
);

CREATE INDEX IF NOT EXISTS meta_report_ghl_sync_runs_started_at_idx
  ON meta_report_ghl_sync_runs (started_at DESC);

CREATE INDEX IF NOT EXISTS meta_report_ghl_sync_runs_client_id_started_at_idx
  ON meta_report_ghl_sync_runs (client_id, started_at DESC);

CREATE TABLE IF NOT EXISTS fb_lead_sync_runs (
  id BIGSERIAL PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES accounts (client_id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running',
  source TEXT NOT NULL DEFAULT 'unknown',
  mode TEXT NOT NULL DEFAULT 'recent',
  days INTEGER NOT NULL DEFAULT 2,
  dry_run BOOLEAN NOT NULL DEFAULT FALSE,
  meta_lead_count INTEGER,
  in_window INTEGER,
  updated_count INTEGER NOT NULL DEFAULT 0,
  skipped_has_id INTEGER NOT NULL DEFAULT 0,
  skipped_no_match INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  batch_offset INTEGER NOT NULL DEFAULT 0,
  batch_limit INTEGER,
  has_more BOOLEAN NOT NULL DEFAULT FALSE,
  error_message TEXT,
  rows JSONB NOT NULL DEFAULT '[]'::jsonb,
  leads_cache JSONB
);

CREATE INDEX IF NOT EXISTS fb_lead_sync_runs_client_id_started_at_idx
  ON fb_lead_sync_runs (client_id, started_at DESC);

CREATE INDEX IF NOT EXISTS fb_lead_sync_runs_started_at_idx
  ON fb_lead_sync_runs (started_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS accounts_meta_report_access_token_idx
  ON accounts (meta_report_access_token)
  WHERE meta_report_access_token IS NOT NULL AND meta_report_access_token <> '';

CREATE UNIQUE INDEX IF NOT EXISTS accounts_meta_report_slug_idx
  ON accounts (meta_report_slug)
  WHERE meta_report_slug IS NOT NULL AND meta_report_slug <> '';

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
  topline_source TEXT,
  manual_override BOOLEAN NOT NULL DEFAULT FALSE,
  ghl_leads INTEGER,
  ghl_won_leads INTEGER,
  ghl_total_revenue NUMERIC,
  ghl_total_profit NUMERIC,
  ghl_synced_at TIMESTAMPTZ,
  manual_leads INTEGER,
  meta_saved_won_leads NUMERIC,
  meta_saved_avg_lead_value NUMERIC,
  meta_saved_avg_profit_per_won NUMERIC,
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
