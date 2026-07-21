#!/usr/bin/env node
/**
 * Replay ghl_webhook_events stuck in status=received (e.g. before Inngest resync).
 * Usage: node scripts/replay-stuck-ghl-webhooks.js
 */
require('dotenv').config();

const { query, usePostgres } = require('../lib/db');
const { processGhlOpportunityWebhookSafe } = require('../lib/ghl-webhook-processor');

async function main() {
  if (!usePostgres()) {
    console.error('DATABASE_URL required.');
    process.exit(1);
  }

  const rows = await query`
    SELECT webhook_id, event_type, location_id, opportunity_id
    FROM ghl_webhook_events
    WHERE status = 'received'
    ORDER BY received_at ASC
  `;

  if (!rows.length) {
    console.log('No stuck webhook events.');
    return;
  }

  let ok = 0;
  let failed = 0;
  for (const row of rows) {
    const payload = {
      type: row.event_type,
      locationId: row.location_id,
      id: row.opportunity_id,
      webhookId: row.webhook_id,
    };
    try {
      const result = await processGhlOpportunityWebhookSafe(payload);
      console.log('OK', row.event_type, row.opportunity_id || row.location_id, result.action || result);
      ok += 1;
    } catch (error) {
      console.error('FAIL', row.event_type, row.webhook_id, error.message);
      failed += 1;
    }
  }

  console.log(`Replay done: ${ok} ok, ${failed} failed. Run npm run preflight:ghl`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
