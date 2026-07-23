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
