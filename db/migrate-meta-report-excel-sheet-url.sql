ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS meta_report_excel_sheet_url TEXT;
