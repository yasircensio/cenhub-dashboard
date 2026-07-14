ALTER TABLE sync_snapshots
  ADD COLUMN IF NOT EXISTS sync_started_at TIMESTAMPTZ;
