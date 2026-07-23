ALTER TABLE fb_lead_sync_runs
  ADD COLUMN IF NOT EXISTS leads_cache JSONB;
