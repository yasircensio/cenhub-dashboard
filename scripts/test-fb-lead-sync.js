require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const {
  filterLeadsByDays,
  resolveModeOptions,
  resolveFbLeadFieldId,
  findFbLeadFieldDefinition,
  isFbLeadFieldDefinition,
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

  const defs = [
    { id: 'abc', name: 'Other field' },
    { id: 'xyz', name: 'Fb Lead id', fieldKey: 'contact.fb_lead_id' },
  ];
  assert(isFbLeadFieldDefinition(defs[1]), 'detect fb lead field by name');
  assert(findFbLeadFieldDefinition(defs, 'missing')?.id === 'xyz', 'find fb lead field by name when override missing');
  assert(findFbLeadFieldDefinition(defs, 'abc')?.id === 'abc', 'prefer configured field id when present');

  assert(parseFbLeadSyncPath('/api/fb-lead-sync').kind === 'dashboard', 'dashboard path');
  assert(parseFbLeadSyncPath('/api/fb-lead-sync/preflight').kind === 'preflight', 'preflight path');
  assert(parseFbLeadSyncPath('/api/fb-lead-sync/prepare').kind === 'prepare', 'prepare path');
  assert(parseFbLeadSyncPath('/api/fb-lead-sync/run').kind === 'run', 'run path');
  assert(parseFbLeadSyncPath('/api/fb-lead-sync/history').kind === 'history', 'history path');
  assert(parseFbLeadSyncPath('/api/fb-lead-sync/history/42').kind === 'history-run', 'history run path');
  assert(parseFbLeadSyncPath('/api/fb-lead-sync/history/42').runId === 42, 'history run id');

  const nowIso = new Date().toISOString();
  assert(isSuccessfulApplyRun({ startedAt: nowIso, status: 'success', dryRun: false, updated: 190 }), 'apply run counts');
  assert(!isSuccessfulApplyRun({ startedAt: nowIso, status: 'success', dryRun: true, updated: 190 }), 'dry run excluded');

  const { buildClientFbLeadDisplayStats } = require('../lib/fb-lead-sync-history');
  const applyStats = buildClientFbLeadDisplayStats(
    { status: 'success', dryRun: false, mode: 'recent', inWindow: 6, metaLeadCount: 191, skippedNoMatch: 0 },
    { status: 'success', dryRun: false, mode: 'backfill', inWindow: 191, metaLeadCount: 191, skippedNoMatch: 1 },
  );
  assert(applyStats.metaLeadCount90d === 191, 'meta leads use last backfill window, not recent inWindow');
  assert(applyStats.outstanding === 0, 'outstanding follows latest apply skippedNoMatch');

  const previewStats = buildClientFbLeadDisplayStats(
    { status: 'success', dryRun: true, mode: 'backfill', inWindow: 191, updated: 12 },
    { status: 'success', dryRun: true, mode: 'backfill', inWindow: 191, updated: 12 },
  );
  assert(previewStats.outstanding === 12, 'outstanding uses preview would-update count');

  console.log('FB lead sync tests passed.');
}

main();
