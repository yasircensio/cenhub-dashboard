const assert = require('assert');
const {
  buildMetaReportGhlSyncLogEntry,
  deriveStatus,
  listMetaReportGhlSyncRuns,
  logMetaReportGhlSyncRun,
  normalizeSkipped,
} = require('../lib/meta-report-ghl-sync-history');

function main() {
  assert.strictEqual(deriveStatus({ result: { skipped: true, reason: 'not_cenhub_report' } }), 'skipped');
  assert.strictEqual(deriveStatus({ result: { synced: ['2026-08'], errors: [] } }), 'success');
  assert.strictEqual(deriveStatus({ result: { synced: ['2026-08'], errors: [{ monthKey: '2026-07', message: 'fail' }] } }), 'partial');
  assert.strictEqual(deriveStatus({ result: { synced: [], errors: [{ monthKey: '2026-07', message: 'fail' }] } }), 'error');
  assert.strictEqual(deriveStatus({ result: null, error: new Error('boom') }), 'error');

  assert.deepStrictEqual(
    normalizeSkipped(['2026-01', { monthKey: '2026-02', reason: 'manual_override' }]),
    [
      { monthKey: '2026-01', reason: 'unknown' },
      { monthKey: '2026-02', reason: 'manual_override' },
    ],
  );

  const skippedEntry = buildMetaReportGhlSyncLogEntry({
    trigger: 'webhook',
    source: 'ghl-webhook',
    result: { skipped: true, reason: 'meta_mode' },
    startedAt: '2026-08-14T10:00:00.000Z',
    finishedAt: '2026-08-14T10:00:01.000Z',
  });
  assert.strictEqual(skippedEntry.status, 'skipped');
  assert.strictEqual(skippedEntry.detail.skipReason, 'meta_mode');

  const partialEntry = buildMetaReportGhlSyncLogEntry({
    trigger: 'full_snapshot',
    source: 'full-ghl-sync',
    result: {
      synced: ['2026-08'],
      skipped: ['2026-07'],
      errors: [{ monthKey: '2026-06', message: 'no data' }],
      attempted: 3,
    },
    startedAt: '2026-08-14T10:00:00.000Z',
    finishedAt: '2026-08-14T10:00:02.000Z',
    context: { parentSource: 'vercel-cron' },
  });
  assert.strictEqual(partialEntry.status, 'partial');
  assert.strictEqual(partialEntry.detail.synced.length, 1);
  assert.strictEqual(partialEntry.detail.skipped[0].monthKey, '2026-07');
}

async function testRoundTrip() {
  const { usePostgres } = require('../lib/db');
  if (usePostgres()) {
    console.log('Meta report GHL sync history round-trip skipped (DATABASE_URL set).');
    return;
  }

  await logMetaReportGhlSyncRun('meta-ghl-history-test', buildMetaReportGhlSyncLogEntry({
    trigger: 'webhook',
    source: 'ghl-webhook',
    result: {
      monthKeys: ['2026-08'],
      synced: ['2026-08'],
      skipped: [{ monthKey: '2026-07', reason: 'manual_override' }],
      errors: [],
    },
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    context: { opportunityId: 'opp-test' },
  }));

  const listed = await listMetaReportGhlSyncRuns({ clientId: 'meta-ghl-history-test', limit: 5 });
  assert.strictEqual(listed.type, 'meta-report-ghl');
  assert.ok(listed.runs.length >= 1);
  assert.strictEqual(listed.runs[0].clientId, 'meta-ghl-history-test');
  assert.strictEqual(listed.runs[0].source, 'ghl-webhook');
  assert.strictEqual(listed.summary.schedule, 'Webhook + after GHL snapshot sync');
}

async function run() {
  main();
  await testRoundTrip();
  console.log('Meta report GHL sync history tests passed.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
