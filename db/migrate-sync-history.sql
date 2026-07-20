-- Sync history: Meta run log + source on GHL runs
ALTER TABLE sync_runs
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'unknown';

CREATE TABLE IF NOT EXISTS meta_sync_runs (
  id BIGSERIAL PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES accounts (client_id) ON DELETE CASCADE,
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
