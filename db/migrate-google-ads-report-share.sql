-- Google Ads report client share links (slug + access token)

ALTER TABLE google_ads_report_clients
  ADD COLUMN IF NOT EXISTS report_slug TEXT,
  ADD COLUMN IF NOT EXISTS access_token TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS google_ads_report_clients_slug_idx
  ON google_ads_report_clients (report_slug)
  WHERE report_slug IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS google_ads_report_clients_access_token_idx
  ON google_ads_report_clients (access_token)
  WHERE access_token IS NOT NULL;
