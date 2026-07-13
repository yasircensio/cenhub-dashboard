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
  sync_error TEXT
);

CREATE TABLE IF NOT EXISTS sync_runs (
  id BIGSERIAL PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES accounts (client_id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running',
  error_message TEXT,
  opportunity_count INTEGER
);

CREATE INDEX IF NOT EXISTS sync_runs_client_id_started_at_idx
  ON sync_runs (client_id, started_at DESC);

-- Staff auth (see db/migrate-staff-auth.sql for full migration)
