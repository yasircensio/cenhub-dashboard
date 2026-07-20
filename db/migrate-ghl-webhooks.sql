-- GHL marketplace webhook audit + dedupe
CREATE TABLE IF NOT EXISTS ghl_webhook_events (
  webhook_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  location_id TEXT,
  client_id TEXT,
  opportunity_id TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'received',
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS ghl_webhook_events_received_at_idx
  ON ghl_webhook_events (received_at DESC);

CREATE INDEX IF NOT EXISTS ghl_webhook_events_client_id_idx
  ON ghl_webhook_events (client_id, received_at DESC);
