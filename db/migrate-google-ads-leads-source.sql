ALTER TABLE google_ads_report_clients
  ADD COLUMN IF NOT EXISTS leads_source TEXT NOT NULL DEFAULT 'google';

ALTER TABLE google_ads_report_months
  ADD COLUMN IF NOT EXISTS manual_leads NUMERIC;
