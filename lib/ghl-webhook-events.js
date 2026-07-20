const fs = require('fs');
const path = require('path');
const { query, usePostgres } = require('./db');

const DATA_DIR = path.join(__dirname, '..', '.data');
const FILE_STORE = path.join(DATA_DIR, 'multi-tenant-store.json');

function readLocalStore() {
  if (!fs.existsSync(FILE_STORE)) {
    return { ghlWebhookEvents: [] };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(FILE_STORE, 'utf8'));
    return { ghlWebhookEvents: parsed.ghlWebhookEvents || [] };
  } catch {
    return { ghlWebhookEvents: [] };
  }
}

function writeLocalStore(events) {
  const existing = fs.existsSync(FILE_STORE)
    ? JSON.parse(fs.readFileSync(FILE_STORE, 'utf8'))
    : {};
  existing.ghlWebhookEvents = events;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE_STORE, JSON.stringify(existing, null, 2));
}

async function recordGhlWebhookReceived(payload) {
  const webhookId = String(
    payload.webhookId
    || payload.webhook_id
    || `${payload.type || 'event'}:${payload.locationId || payload.location_id || 'unknown'}:${payload.id || payload.opportunityId || 'unknown'}:${payload.timestamp || payload.dateAdded || Date.now()}`,
  ).trim();

  const row = {
    webhook_id: webhookId,
    event_type: String(payload.type || payload.event || 'unknown'),
    location_id: payload.locationId || payload.location_id || null,
    client_id: payload.clientId || null,
    opportunity_id: payload.id || payload.opportunityId || null,
    status: 'received',
    error_message: null,
    received_at: new Date().toISOString(),
    processed_at: null,
  };

  if (usePostgres()) {
    try {
      await query`
        INSERT INTO ghl_webhook_events (
          webhook_id, event_type, location_id, client_id, opportunity_id, status
        ) VALUES (
          ${row.webhook_id}, ${row.event_type}, ${row.location_id},
          ${row.client_id}, ${row.opportunity_id}, ${row.status}
        )
      `;
      return { duplicate: false, webhookId };
    } catch (error) {
      if (/duplicate key|unique constraint/i.test(String(error.message || ''))) {
        return { duplicate: true, webhookId };
      }
      throw error;
    }
  }

  const store = readLocalStore();
  if (store.ghlWebhookEvents.some((entry) => entry.webhook_id === webhookId)) {
    return { duplicate: true, webhookId };
  }
  store.ghlWebhookEvents.unshift(row);
  store.ghlWebhookEvents = store.ghlWebhookEvents.slice(0, 500);
  writeLocalStore(store.ghlWebhookEvents);
  return { duplicate: false, webhookId };
}

async function markGhlWebhookProcessed(webhookId, { status = 'processed', errorMessage = null, clientId = null, opportunityId = null } = {}) {
  const id = String(webhookId || '').trim();
  if (!id) return;

  const processedAt = new Date().toISOString();

  if (usePostgres()) {
    await query`
      UPDATE ghl_webhook_events
      SET
        status = ${status},
        error_message = ${errorMessage},
        processed_at = ${processedAt},
        client_id = COALESCE(${clientId}, client_id),
        opportunity_id = COALESCE(${opportunityId}, opportunity_id)
      WHERE webhook_id = ${id}
    `;
    return;
  }

  const store = readLocalStore();
  const entry = store.ghlWebhookEvents.find((row) => row.webhook_id === id);
  if (entry) {
    entry.status = status;
    entry.error_message = errorMessage;
    entry.processed_at = processedAt;
    if (clientId) entry.client_id = clientId;
    if (opportunityId) entry.opportunity_id = opportunityId;
    writeLocalStore(store.ghlWebhookEvents);
  }
}

async function getGhlWebhookHealthSummary() {
  if (!usePostgres()) {
    return { configured: false };
  }

  try {
    const rows = await query`
      SELECT
        count(*) FILTER (WHERE status = 'failed')::int AS failed_count,
        count(*) FILTER (WHERE status = 'processed')::int AS processed_count,
        max(processed_at) AS last_processed_at,
        max(received_at) AS last_received_at
      FROM ghl_webhook_events
      WHERE received_at > NOW() - INTERVAL '24 hours'
    `;
    const row = rows[0] || {};
    return {
      configured: true,
      ok: (row.failed_count || 0) === 0,
      failedLast24h: row.failed_count || 0,
      processedLast24h: row.processed_count || 0,
      lastProcessedAt: row.last_processed_at || null,
      lastReceivedAt: row.last_received_at || null,
    };
  } catch (error) {
    if (/ghl_webhook_events/i.test(String(error.message || ''))) {
      return { configured: false, migrationRequired: true, error: error.message };
    }
    return { configured: true, ok: false, error: error.message };
  }
}

module.exports = {
  getGhlWebhookHealthSummary,
  markGhlWebhookProcessed,
  recordGhlWebhookReceived,
};
