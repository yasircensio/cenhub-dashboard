-- Censio fee type: performance (% of profit) or marketing (fixed amount)
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS meta_report_fee_mode TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS meta_report_marketing_fee_amount NUMERIC NOT NULL DEFAULT 0;

-- Legacy clients with fee enabled default to performance fee mode
UPDATE accounts
SET meta_report_fee_mode = 'performance'
WHERE meta_report_fee_enabled = TRUE
  AND (meta_report_fee_mode IS NULL OR meta_report_fee_mode = '');
