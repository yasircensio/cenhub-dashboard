ALTER TABLE meta_report_months
  ADD COLUMN IF NOT EXISTS meta_saved_won_leads NUMERIC,
  ADD COLUMN IF NOT EXISTS meta_saved_avg_lead_value NUMERIC,
  ADD COLUMN IF NOT EXISTS meta_saved_avg_profit_per_won NUMERIC;
