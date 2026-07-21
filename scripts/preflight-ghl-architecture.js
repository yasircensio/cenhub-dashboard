#!/usr/bin/env node
/**
 * Preflight checks for GHL webhook + snapshot architecture.
 * Run against production: node scripts/preflight-ghl-architecture.js
 * Or locally: npm run preflight:ghl
 */
require('dotenv').config();

const BASE_URL = (process.env.PREFLIGHT_BASE_URL || 'https://cenhub-dashboard.vercel.app').replace(/\/$/, '');

async function fetchJson(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, options);
  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
  }
  return { ok: response.ok, status: response.status, body };
}

function pass(label, detail = '') {
  console.log(`  ✓ ${label}${detail ? ` — ${detail}` : ''}`);
}

function fail(label, detail = '') {
  console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
  return false;
}

async function checkHealth() {
  console.log('\nHealth (/api/health)');
  const { ok, body } = await fetchJson('/api/health');
  if (!ok) return fail('health endpoint', `HTTP ${body?.status || 'error'}`);

  let sectionOk = true;
  pass('health endpoint reachable');
  const ghlSync = body?.checks?.ghlSync || body?.ghlSync || {};
  const database = body?.checks?.database || body?.database || {};
  const ghlWebhooks = body?.checks?.ghlWebhooks || body?.ghlWebhooks || {};

  const readSource = ghlSync.readSource;
  if (readSource === 'snapshot') {
    pass('dashboard read source', readSource);
  } else {
    sectionOk = fail('dashboard read source', readSource || 'unknown') && sectionOk;
  }

  if (ghlSync.webhookEnabled) {
    pass('webhooks enabled');
  } else {
    sectionOk = fail('webhooks enabled', 'false or missing') && sectionOk;
  }

  if (database.ok) pass('database');
  else sectionOk = fail('database', database.error || 'not ok') && sectionOk;

  const clients = ghlSync.clients || [];
  for (const client of clients) {
    if (client.stale || client.empty) {
      sectionOk = fail(`snapshot ${client.clientId}`, `stale=${client.stale} empty=${client.empty}`) && sectionOk;
    } else {
      pass(`snapshot ${client.clientId}`, `${client.opportunityCount} opps, ${client.ageHours}h old`);
    }
  }

  const webhooks = ghlWebhooks;
  if (webhooks.configured) {
    if (webhooks.ok) pass('webhook events (24h)', `${webhooks.processedLast24h} processed`);
    else sectionOk = fail('webhook events (24h)', `${webhooks.failedLast24h} failed`) && sectionOk;
  } else {
    pass('webhook events table', webhooks.migrationRequired ? 'migration required' : 'not configured');
  }

  return sectionOk;
}

async function checkWebhookPing() {
  console.log('\nWebhook ping (GET /api/ghl-webhook)');
  const { status, body } = await fetchJson('/api/ghl-webhook');
  if (status === 405) {
    pass('webhook GET ping', 'not deployed yet (405 — redeploy for GET health ping)');
    return true;
  }
  if (status !== 200 || !body?.ok) return fail('webhook GET ping', `HTTP ${status}`);
  pass('webhook GET ping', body.inngest ? 'Inngest configured' : 'inline fallback');
  return true;
}

async function main() {
  console.log(`GHL architecture preflight — ${BASE_URL}`);
  let allOk = true;

  allOk = (await checkHealth()) && allOk;
  allOk = (await checkWebhookPing()) && allOk;

  console.log(allOk ? '\nAll preflight checks passed.\n' : '\nSome preflight checks failed.\n');
  process.exit(allOk ? 0 : 1);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
