#!/usr/bin/env node
/**
 * End-to-end smoke test for webhook-first FB lead sync (uses production Neon via .env).
 * Simulates OpportunityCreate → retry queue → retry worker → dashboard summary.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const { query, usePostgres } = require('../lib/db');
const { getAccount, listClientIds } = require('../lib/account-store');
const { triggerFbLeadSyncForOpportunity } = require('../lib/fb-lead-sync-webhook-hook');
const {
  enqueueFbLeadSyncRetry,
  processDueFbLeadSyncRetries,
  listDueFbLeadSyncRetries,
} = require('../lib/fb-lead-sync-retry-queue');
const { buildCronSummary24h, getFbLeadSyncDashboard } = require('../lib/fb-lead-sync-history');
const { handleFbLeadSyncRetryRequest } = require('../lib/fb-lead-sync-retry-handler');

const DEBUG_LOG = path.join(__dirname, '..', '.cursor', 'debug-7ba7fd.log');
const INGEST = 'http://127.0.0.1:7412/ingest/8036624f-bbd1-4142-b516-bb72c323b06c';

function debugLog(location, message, data = {}, hypothesisId = 'E2E') {
  const entry = {
    sessionId: '7ba7fd',
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
    runId: 'e2e-test',
  };
  try {
    fs.appendFileSync(DEBUG_LOG, `${JSON.stringify(entry)}\n`);
  } catch {
    // ignore
  }
  fetch(INGEST, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '7ba7fd' },
    body: JSON.stringify(entry),
  }).catch(() => {});
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function findEnabledClient() {
  for (const clientId of await listClientIds()) {
    const account = await getAccount(clientId, { includeSecrets: true });
    if (account?.fbLeadSyncEnabled && account?.ghlToken && account?.metaPageId) {
      return account;
    }
  }
  return null;
}

async function insertSyntheticWebhookEvent(account, opportunityId, contactId) {
  if (!usePostgres()) return;
  const webhookId = `e2e-test:${account.clientId}:${opportunityId}:${Date.now()}`;
  await query`
    INSERT INTO ghl_webhook_events (
      webhook_id, event_type, location_id, client_id, opportunity_id, status, processed_at
    ) VALUES (
      ${webhookId},
      'OpportunityCreate',
      ${account.locationId},
      ${account.clientId},
      ${opportunityId},
      'processed',
      NOW()
    )
    ON CONFLICT (webhook_id) DO NOTHING
  `;
  return webhookId;
}

async function forceDueRetry(clientId, contactId, opportunityId) {
  const past = new Date(Date.now() - 60 * 1000).toISOString();
  await enqueueFbLeadSyncRetry({
    clientId,
    contactId,
    opportunityId,
    attempt: 1,
    nextRetryAt: past,
    triggerSource: 'e2e-test',
  });
}

async function bumpEnqueuedRetryToDue(clientId, contactId) {
  if (!usePostgres()) return false;
  const past = new Date(Date.now() - 60 * 1000).toISOString();
  const rows = await query`
    UPDATE fb_lead_sync_retries
    SET next_retry_at = ${past}, updated_at = NOW()
    WHERE client_id = ${clientId}
      AND contact_id = ${contactId}
      AND status = 'pending'
    RETURNING id
  `;
  return rows.length > 0;
}

async function mockRetryHandlerRequest() {
  const mockRes = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
    },
    writeHead(code, _headers) {
      this.statusCode = code;
    },
    end(payload) {
      this.body = JSON.parse(payload);
    },
  };
  await handleFbLeadSyncRetryRequest(
    { method: 'GET', headers: { authorization: `Bearer ${process.env.CRON_SECRET || ''}` }, query: {} },
    mockRes,
  );
  return { statusCode: mockRes.statusCode, body: mockRes.body };
}

async function main() {
  assert(usePostgres(), 'DATABASE_URL required for E2E test');
  debugLog('test-fb-lead-sync-e2e.js:start', 'E2E test starting', {});

  const account = await findEnabledClient();
  assert(account, 'No fbLeadSyncEnabled client with GHL + Meta config found');

  const testOppId = `e2e-opp-${Date.now()}`;
  const testContactId = `e2e-contact-${Date.now()}`;

  debugLog('test-fb-lead-sync-e2e.js:client', 'Using test client', {
    clientId: account.clientId,
    accountName: account.accountName,
  }, 'H1');

  const webhookId = await insertSyntheticWebhookEvent(account, testOppId, testContactId);
  debugLog('test-fb-lead-sync-e2e.js:webhook-event', 'Synthetic OpportunityCreate inserted', {
    webhookId,
  }, 'H3');

  const hookResult = await triggerFbLeadSyncForOpportunity(
    account,
    { id: testOppId, contactId: testContactId },
    { eventType: 'OpportunityCreate', webhookId },
  );
  debugLog('test-fb-lead-sync-e2e.js:webhook-hook', 'triggerFbLeadSyncForOpportunity result', {
    hookResult,
  }, 'H1');

  assert(
    hookResult.enqueued || hookResult.done || hookResult.synced,
    `Expected webhook hook to enqueue or complete, got: ${JSON.stringify(hookResult)}`,
  );

  if (!hookResult.enqueued) {
    await forceDueRetry(account.clientId, testContactId, testOppId);
    debugLog('test-fb-lead-sync-e2e.js:force-retry', 'Forced due retry row', {}, 'H2');
  } else {
    const bumped = await bumpEnqueuedRetryToDue(account.clientId, testContactId);
    debugLog('test-fb-lead-sync-e2e.js:bump-retry', 'Bumped enqueued retry to due now', { bumped }, 'H2');
    assert(bumped, 'Expected pending retry row after webhook enqueue');
  }

  const dueBefore = await listDueFbLeadSyncRetries({ limit: 10 });
  debugLog('test-fb-lead-sync-e2e.js:due-before', 'Due retries before worker', {
    count: dueBefore.length,
    ids: dueBefore.map((r) => r.contactId),
  }, 'H2');

  const workerResult = await processDueFbLeadSyncRetries({ limit: 5 });
  debugLog('test-fb-lead-sync-e2e.js:worker', 'processDueFbLeadSyncRetries result', workerResult, 'H2');

  assert(workerResult.processed >= 1, `Worker should process due retry, got processed=${workerResult.processed}`);

  const summaryBefore = await buildCronSummary24h();
  debugLog('test-fb-lead-sync-e2e.js:summary', 'buildCronSummary24h after test', summaryBefore, 'H3');

  assert(summaryBefore.totalOpportunitiesCreated >= 1, 'Dashboard should count synthetic OpportunityCreate');
  assert(summaryBefore.totalWorkerPolls >= 0, 'Worker polls should be a number');

  const dashboard = await getFbLeadSyncDashboard();
  const dashSummary = dashboard.summary?.cronSummary24h || {};
  debugLog('test-fb-lead-sync-e2e.js:dashboard', 'getFbLeadSyncDashboard cronSummary24h', dashSummary, 'H3');

  assert(dashSummary.totalOpportunitiesCreated >= 1, 'Dashboard API should expose opps created');

  let cronHttp = null;
  if (process.env.CRON_SECRET) {
    cronHttp = await mockRetryHandlerRequest();
    debugLog('test-fb-lead-sync-e2e.js:cron-http', 'Mock retry handler HTTP', cronHttp, 'H4');
    assert(cronHttp.statusCode === 200, `Retry handler should return 200, got ${cronHttp.statusCode}`);
  } else {
    debugLog('test-fb-lead-sync-e2e.js:cron-http', 'Skipped CRON_SECRET mock HTTP test', {}, 'H4');
  }

  const prodBase = (process.env.PREFLIGHT_BASE_URL || 'https://cenhub-dashboard.vercel.app').replace(/\/$/, '');
  const prodRes = await fetch(`${prodBase}/api/fb-lead-sync-retries`);
  const prodBodyText = await prodRes.text();
  let prodBody = {};
  try {
    prodBody = JSON.parse(prodBodyText);
  } catch {
    prodBody = { raw: prodBodyText.slice(0, 200) };
  }
  debugLog('test-fb-lead-sync-e2e.js:prod-cron', 'Production retry endpoint (no auth)', {
    status: prodRes.status,
    body: prodBody,
  }, 'H5');
  assert(prodRes.status === 401 || prodRes.status === 503, `Production endpoint should reject unauth (401/503), got ${prodRes.status}`);

  if (process.env.CRON_SECRET) {
    const prodAuthRes = await fetch(`${prodBase}/api/fb-lead-sync-retries`, {
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    const prodAuthBody = await prodAuthRes.json().catch(() => ({}));
    debugLog('test-fb-lead-sync-e2e.js:prod-cron-auth', 'Production retry endpoint (auth)', {
      status: prodAuthRes.status,
      body: prodAuthBody,
    }, 'H5');
    assert(prodAuthRes.status === 200, `Authed production retry should return 200, got ${prodAuthRes.status}`);
  }

  console.log('\nFB lead sync E2E test passed.\n');
  console.log('Summary snapshot:');
  console.log(`  Client: ${account.accountName} (${account.clientId})`);
  console.log(`  Webhook hook: ${JSON.stringify(hookResult)}`);
  console.log(`  Worker: processed=${workerResult.processed} updated=${workerResult.updated}`);
  console.log(`  Dashboard 24h: opps=${dashSummary.totalOpportunitiesCreated} webhookSyncs=${dashSummary.totalWebhookSyncs} workerPolls=${dashSummary.totalWorkerPolls} updated=${dashSummary.totalUpdated}`);
  debugLog('test-fb-lead-sync-e2e.js:done', 'E2E test passed', { dashSummary }, 'E2E');

  if (usePostgres()) {
    await query`DELETE FROM fb_lead_sync_retries WHERE client_id = ${account.clientId} AND contact_id = ${testContactId}`;
    const runIds = [
      hookResult.outcome?.runId,
      ...(workerResult.results || []).map((r) => r.outcome?.runId),
    ].filter(Boolean);
    for (const runId of runIds) {
      await query`DELETE FROM fb_lead_sync_runs WHERE id = ${runId}`;
    }
    if (webhookId) {
      await query`DELETE FROM ghl_webhook_events WHERE webhook_id = ${webhookId}`;
    }
    console.log('  Cleaned up E2E test rows from history.');
  }
}

main().catch((error) => {
  debugLog('test-fb-lead-sync-e2e.js:error', error.message, { stack: error.stack }, 'E2E');
  console.error('E2E test failed:', error.message);
  process.exit(1);
});
