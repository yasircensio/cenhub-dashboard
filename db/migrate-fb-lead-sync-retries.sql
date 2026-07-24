CREATE TABLE IF NOT EXISTS fb_lead_sync_retries (
  id BIGSERIAL PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES accounts (client_id) ON DELETE CASCADE,
  contact_id TEXT NOT NULL,
  opportunity_id TEXT,
  trigger_source TEXT NOT NULL DEFAULT 'ghl-webhook',
  attempt INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 4,
  next_retry_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  last_status TEXT,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (client_id, contact_id)
);

  CREATE INDEX IF NOT EXISTS fb_lead_sync_retries_pending_next_idx
      ON fb_lead_sync_retries (next_retry_at)
      WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS fb_lead_retry_worker_heartbeats (
  id BIGSERIAL PRIMARY KEY,
  ran_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed INTEGER NOT NULL DEFAULT 0,
  updated INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  still_pending INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS fb_lead_retry_worker_heartbeats_ran_at_idx
  ON fb_lead_retry_worker_heartbeats (ran_at DESC);
