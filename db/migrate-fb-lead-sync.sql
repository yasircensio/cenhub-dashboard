ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS fb_lead_sync_enabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS ghl_fb_lead_field_id TEXT;

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
  rows JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS fb_lead_sync_runs_client_id_started_at_idx
  ON fb_lead_sync_runs (client_id, started_at DESC);

CREATE INDEX IF NOT EXISTS fb_lead_sync_runs_started_at_idx
  ON fb_lead_sync_runs (started_at DESC);
