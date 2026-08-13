ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS meta_report_topline_mode TEXT NOT NULL DEFAULT 'meta';

UPDATE accounts
SET meta_report_topline_mode = 'meta'
WHERE meta_report_topline_mode IS NULL OR meta_report_topline_mode NOT IN ('meta', 'cenhub');
