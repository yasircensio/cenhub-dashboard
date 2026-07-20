-- Allow system-level Meta cron heartbeat rows (client_id NULL)
ALTER TABLE meta_sync_runs
  ALTER COLUMN client_id DROP NOT NULL;
