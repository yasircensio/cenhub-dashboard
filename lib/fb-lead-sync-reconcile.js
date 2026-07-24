const { getAccount, listClientIds } = require('./account-store');
const { pruneRoutineFbLeadSyncRuns } = require('./fb-lead-sync-history');
const { resolveMetaAccessToken } = require('./meta-token');
const { DEFAULT_SYNC_DAYS, syncMetaLeadIdsToGhl } = require('./meta-lead-ghl-sync');

async function listFbLeadSyncableClientIds() {
  const ids = await listClientIds();
  const syncable = [];
  for (const clientId of ids) {
    const account = await getAccount(clientId, { includeSecrets: true });
    if (!account?.fbLeadSyncEnabled) continue;
    if (!account?.metaPageId || !account?.ghlToken || !account?.locationId) continue;
    const hasPageToken = Boolean(String(account.metaPageAccessToken || '').trim());
    const hasMetaToken = Boolean(resolveMetaAccessToken(account).token);
    if (!hasPageToken && !hasMetaToken) continue;
    syncable.push(clientId);
  }
  return syncable;
}

async function runDailyFbLeadReconciliation({ clientIds = null, source = 'daily-reconcile' } = {}) {
  if (String(process.env.FB_LEAD_SYNC_DAILY_RECONCILE || '1').trim() === '0') {
    return { skipped: true, reason: 'FB_LEAD_SYNC_DAILY_RECONCILE=0' };
  }

  const ids = clientIds?.length ? clientIds : await listFbLeadSyncableClientIds();
  const results = [];

  for (const clientId of ids) {
    try {
      let runId = null;
      let offset = 0;
      let lastSummary = null;
      let totalUpdated = 0;
      let totalErrors = 0;

      do {
        lastSummary = await syncMetaLeadIdsToGhl(clientId, {
          mode: 'recent',
          days: DEFAULT_SYNC_DAYS,
          dryRun: false,
          source,
          logHistory: true,
          runId,
          offset,
        });
        runId = lastSummary.runId;
        offset = lastSummary.nextBatchOffset ?? offset + (lastSummary.batchProcessed || 0);
        totalUpdated += lastSummary.updated || 0;
        totalErrors += lastSummary.errors || 0;
      } while (lastSummary?.hasMore);

      results.push({
        clientId,
        runId,
        success: totalErrors === 0,
        updated: totalUpdated,
        errors: totalErrors,
      });
    } catch (error) {
      results.push({
        clientId,
        success: false,
        error: error.message || 'Daily FB lead reconcile failed.',
      });
    }
  }

  const pruned = await pruneRoutineFbLeadSyncRuns({ maxAgeHours: 24 });
  return {
    clientIds: ids,
    updated: results.reduce((sum, row) => sum + (row.updated || 0), 0),
    failed: results.filter((row) => !row.success).length,
    results,
    pruned,
  };
}

module.exports = {
  listFbLeadSyncableClientIds,
  runDailyFbLeadReconciliation,
};
