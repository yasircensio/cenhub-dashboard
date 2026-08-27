-- One Google Ads report client can link to at most one Meta report client, and vice versa.

CREATE UNIQUE INDEX IF NOT EXISTS google_ads_report_clients_linked_meta_idx
  ON google_ads_report_clients (linked_meta_client_id)
  WHERE linked_meta_client_id IS NOT NULL;
