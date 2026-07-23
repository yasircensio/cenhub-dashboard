require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const {
  filterLeadsByDays,
  resolveModeOptions,
  resolveFbLeadFieldId,
  BACKFILL_DAYS,
  DEFAULT_SYNC_DAYS,
} = require('../lib/meta-lead-ghl-sync');
const { mergeAuditRows, isSuccessfulApplyRun } = require('../lib/fb-lead-sync-history');
const { parseFbLeadSyncPath } = require('../lib/fb-lead-sync-handler');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function main() {
  const recent = resolveModeOptions('recent');
  assert(recent.mode === 'recent', 'recent mode key');
  assert(recent.days === DEFAULT_SYNC_DAYS, 'recent days default');

  const backfill = resolveModeOptions('backfill');
  assert(backfill.mode === 'backfill', 'backfill mode key');
  assert(backfill.days === BACKFILL_DAYS, 'backfill days');

  const unknown = resolveModeOptions('unknown-mode');
  assert(unknown.mode === 'recent', 'unknown mode falls back to recent');

  const now = Date.now();
  const leads = [
    { id: '1', created_time: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '2', created_time: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '3', created_time: new Date(now - 100 * 24 * 60 * 60 * 1000).toISOString() },
  ];
  const recentLeads = filterLeadsByDays(leads, 2);
  assert(recentLeads.length === 1, '2-day window filters old leads');
  const backfillLeads = filterLeadsByDays(leads, 90);
  assert(backfillLeads.length === 2, '90-day window keeps two leads');

  const merged = mergeAuditRows(
    [{ status: 'updated', metaLeadId: 'a' }],
    [{ status: 'would_update', metaLeadId: 'b' }, { status: 'already_correct', metaLeadId: 'c' }],
  );
  assert(merged.length === 2, 'mergeAuditRows keeps actionable rows only');

  const fieldId = resolveFbLeadFieldId({ ghlFbLeadFieldId: 'custom-field' });
  assert(fieldId === 'custom-field', 'resolveFbLeadFieldId prefers account override');

  assert(parseFbLeadSyncPath('/api/fb-lead-sync').kind === 'dashboard', 'dashboard path');
  assert(parseFbLeadSyncPath('/api/fb-lead-sync/preflight').kind === 'preflight', 'preflight path');
  assert(parseFbLeadSyncPath('/api/fb-lead-sync/run').kind === 'run', 'run path');
  assert(parseFbLeadSyncPath('/api/fb-lead-sync/history').kind === 'history', 'history path');
  assert(parseFbLeadSyncPath('/api/fb-lead-sync/history/42').kind === 'history-run', 'history run path');
  assert(parseFbLeadSyncPath('/api/fb-lead-sync/history/42').runId === 42, 'history run id');

  const nowIso = new Date().toISOString();
  assert(isSuccessfulApplyRun({ startedAt: nowIso, status: 'success', dryRun: false, updated: 190 }), 'apply run counts');
  assert(!isSuccessfulApplyRun({ startedAt: nowIso, status: 'success', dryRun: true, updated: 190 }), 'dry run excluded');

  console.log('FB lead sync tests passed.');
}

main();
