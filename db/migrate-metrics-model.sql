-- Run once on existing Postgres databases before deploying metrics model support.
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS win_pipeline_id TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS metrics_model_set_at TIMESTAMPTZ;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS metrics_model_locked_at TIMESTAMPTZ;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS metrics_model_changed_at TIMESTAMPTZ;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS metrics_model_version INTEGER NOT NULL DEFAULT 1;

UPDATE accounts
SET
  win_pipeline_id = COALESCE(win_pipeline_id, after_sales_pipeline_id),
  metrics_model_set_at = COALESCE(
    metrics_model_set_at,
    CASE WHEN dedupe_enabled OR after_sales_pipeline_id IS NOT NULL THEN created_at END
  )
WHERE metrics_model_set_at IS NULL;
