-- Per-client Meta report table layout: 1 or 2 columns
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS meta_report_table_columns INTEGER NOT NULL DEFAULT 1;
