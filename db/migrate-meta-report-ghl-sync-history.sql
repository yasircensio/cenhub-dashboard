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
