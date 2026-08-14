#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { usePostgres } = require('../lib/db');
const { mergeOpportunityIntoSnapshot } = require('../lib/snapshot-merge');
const { getMonthRecord } = require('../lib/meta-report-store');
const { triggerMetaReportGhlSyncForOpportunity } = require('../lib/meta-report-ghl-webhook-hook');
const {
  cleanupStuckManualMonths,
  findStuckManualMonths,
} = require('../lib/meta-report-manual-cleanup');

const TEST_CLIENT = 'meta-ghl-e2e-test';
const DATA_FILE = path.join(__dirname, '..', '.data', 'multi-tenant-store.json');
const META_REPORTS_FILE = path.join(__dirname, '..', '.data', 'meta-reports-store.json');
const SYNC_MONTH_KEY = '2026-08';
const CLEANUP_MONTH_KEY = '2026-01';

function buildOpportunity({ id, createdAt, status, monetaryValue, profit, lastStatusChangeAt }) {
  return {
    id,
    pipelineId: 'pipe-new',
    status,
    createdAt,
    lastStatusChangeAt: lastStatusChangeAt || (status === 'won' ? createdAt : undefined),
    contactId: `contact-${id}`,
    monetaryValue,
    customFields: profit != null ? [{
      id: 'profit-field',
      fieldKey: 'opportunity.bundlinje',
      fieldValueNumber: profit,
    }] : [],
  };
}

function writeFixture({ monthKey, monthRecord, opportunities }) {
  const tenantStore = fs.existsSync(DATA_FILE)
    ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
    : {};
  tenantStore.accounts = tenantStore.accounts || {};
  tenantStore.snapshots = tenantStore.snapshots || {};

  tenantStore.accounts[TEST_CLIENT] = {
    client_id: TEST_CLIENT,
    account_name: 'Meta GHL E2E Test',
    timezone: 'Europe/Copenhagen',
    new_leads_pipeline_id: 'pipe-new',
    sales_pipeline_id: 'pipe-sales',
    dedupe_enabled: false,
    metrics_model_set_at: '2026-01-01T00:00:00.000Z',
    ready_for_ghl: true,
    meta_ad_account_id: 'act-e2e-test',
    meta_report_enabled: true,
    meta_report_ghl_data_enabled: true,
    meta_report_topline_mode: 'cenhub',
    profit_field_id: 'profit-field',
  };

  tenantStore.snapshots[TEST_CLIENT] = {
    fetched_at: new Date().toISOString(),
    sync_status: 'success',
    sync_error: null,
    pipelines: [{ id: 'pipe-new', name: 'New leads' }],
    users: [],
    contact_count: 0,
    opportunities: opportunities || [
      buildOpportunity({
        id: 'opp-1',
        createdAt: '2026-08-05T10:00:00.000Z',
        status: 'open',
        monetaryValue: 1000,
      }),
    ],
  };

  const metaStore = fs.existsSync(META_REPORTS_FILE)
    ? JSON.parse(fs.readFileSync(META_REPORTS_FILE, 'utf8'))
    : {};
  metaStore.months = metaStore.months || {};

  const bounds = monthKey === CLEANUP_MONTH_KEY
    ? { start: '2026-01-01', end: '2026-01-31' }
    : { start: '2026-08-01', end: '2026-08-31' };

  metaStore.months[`${TEST_CLIENT}::${monthKey}`] = {
    client_id: TEST_CLIENT,
    month_key: monthKey,
    period_start: bounds.start,
    period_end: bounds.end,
    published: true,
    updated_at: new Date().toISOString(),
    ...monthRecord,
  };

  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(tenantStore, null, 2));
  fs.writeFileSync(META_REPORTS_FILE, JSON.stringify(metaStore, null, 2));
}

async function testWebhookSyncUpdatesGhlMonth() {
  writeFixture({
    monthKey: SYNC_MONTH_KEY,
    monthRecord: {
      topline_source: 'ghl',
      manual_override: false,
      ghl_leads: 1,
      ghl_won_leads: 0,
      ghl_total_revenue: 0,
      ghl_total_profit: 0,
      won_leads: 0,
      avg_lead_value: 0,
      avg_profit_per_won: 0,
      ghl_synced_at: '2026-08-01T00:00:00.000Z',
    },
  });

  await mergeOpportunityIntoSnapshot(TEST_CLIENT, buildOpportunity({
    id: 'opp-2',
    createdAt: '2026-08-12T10:00:00.000Z',
    status: 'won',
    monetaryValue: 5000,
    profit: 1200,
  }));

  const account = await require('../lib/account-store').getAccount(TEST_CLIENT);
  const result = await triggerMetaReportGhlSyncForOpportunity(account, buildOpportunity({
    id: 'opp-2',
    createdAt: '2026-08-12T10:00:00.000Z',
    status: 'won',
    monetaryValue: 5000,
    profit: 1200,
  }));

  assert.ok(result.synced.includes(SYNC_MONTH_KEY), 'expected month to sync from webhook hook');

  const month = await getMonthRecord(TEST_CLIENT, SYNC_MONTH_KEY);
  assert.strictEqual(month.toplineSource, 'ghl');
  assert.strictEqual(month.ghlWonLeads, 1);
  assert.strictEqual(month.wonLeads, 1);
  assert.strictEqual(month.ghlTotalRevenue, 5000);
}

async function testWebhookSkipsManualMonth() {
  writeFixture({
    monthKey: SYNC_MONTH_KEY,
    monthRecord: {
      topline_source: 'manual',
      manual_override: true,
      won_leads: 99,
      avg_lead_value: 111,
      avg_profit_per_won: 22,
      meta_saved_won_leads: 1,
      meta_saved_avg_lead_value: 5000,
      meta_saved_avg_profit_per_won: 1200,
    },
  });

  const account = await require('../lib/account-store').getAccount(TEST_CLIENT);
  const result = await triggerMetaReportGhlSyncForOpportunity(account, buildOpportunity({
    id: 'opp-2',
    createdAt: '2026-08-12T10:00:00.000Z',
    status: 'won',
    monetaryValue: 5000,
    profit: 1200,
  }));

  assert.ok(
    result.skipped.some((row) => row.monthKey === SYNC_MONTH_KEY && row.reason === 'manual_override'),
    'manual month should be skipped',
  );

  const month = await getMonthRecord(TEST_CLIENT, SYNC_MONTH_KEY);
  assert.strictEqual(month.toplineSource, 'manual');
  assert.strictEqual(month.wonLeads, 99);
}

async function testCleanupRestoresMetaForStuckManualMonth() {
  writeFixture({
    monthKey: CLEANUP_MONTH_KEY,
    opportunities: [
      buildOpportunity({
        id: 'opp-1',
        createdAt: '2026-08-05T10:00:00.000Z',
        status: 'open',
        monetaryValue: 1000,
      }),
    ],
    monthRecord: {
      topline_source: 'manual',
      manual_override: true,
      won_leads: 42,
      avg_lead_value: 100,
      avg_profit_per_won: 10,
      meta_saved_won_leads: 3,
      meta_saved_avg_lead_value: 51000,
      meta_saved_avg_profit_per_won: 41000,
    },
  });

  const stuck = await findStuckManualMonths({ clientId: TEST_CLIENT });
  assert.strictEqual(stuck.length, 1);
  assert.strictEqual(stuck[0].monthKey, CLEANUP_MONTH_KEY);

  const result = await cleanupStuckManualMonths({ clientId: TEST_CLIENT, dryRun: false });
  assert.strictEqual(result.restored.length, 1);

  const month = await getMonthRecord(TEST_CLIENT, CLEANUP_MONTH_KEY);
  assert.strictEqual(month.toplineSource, 'meta');
  assert.strictEqual(month.manualOverride, false);
  assert.strictEqual(month.wonLeads, 3);
  assert.strictEqual(month.avgLeadValue, 51000);
}

async function main() {
  if (usePostgres()) {
    console.log('Meta report GHL webhook e2e tests skipped (DATABASE_URL set — run locally without Postgres).');
    return;
  }

  await testWebhookSyncUpdatesGhlMonth();
  await testWebhookSkipsManualMonth();
  await testCleanupRestoresMetaForStuckManualMonth();
  console.log('Meta report GHL webhook e2e tests passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
