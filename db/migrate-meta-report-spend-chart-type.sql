ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS meta_report_spend_chart_type TEXT NOT NULL DEFAULT 'area';
