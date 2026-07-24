const { getAccount, listClientIds } = require('./account-store');
const { pruneRoutineFbLeadSyncRuns } = require('./fb-lead-sync-history');
const { resolveMetaAccessToken } = require('./meta-token');
const { DEFAULT_SYNC_DAYS, syncMetaLeadIdsToGhl } = require('./meta-lead-ghl-sync');

const CRON_SCHEDULE_LABEL = 'Every hour (cron-job.org)';

function getCronSecret() {
  return process.env.CRON_SECRET || '';
}

function isAuthorized(request) {
  const secret = getCronSecret();
  if (!secret) return false;

  const authHeader = request.headers?.authorization || request.headers?.Authorization || '';
  if (authHeader === `Bearer ${secret}`) return true;

  const querySecret = request.query?.secret;
  return querySecret === secret;
}

function sendJson(response, statusCode, payload) {
  if (typeof response.status === 'function') {
    response.status(statusCode).json(payload);
    return;
  }
  response.writeHead(statusCode, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(payload));
}

function resolveCronSource(request) {
  const header = request.headers?.['x-cron-source'] || request.headers?.['X-Cron-Source'] || '';
  if (header) return String(header);
  if (request.headers?.['x-vercel-cron'] === '1') return 'vercel-cron';
  return 'http-cron';
}

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

async function handleFbLeadSyncCronRequest(request, response) {
  if (request.method !== 'GET' && request.method !== 'POST') {
    sendJson(response, 405, { error: 'Method not allowed' });
    return;
  }

  if (!getCronSecret()) {
    sendJson(response, 503, {
      error: 'CRON_SECRET is not configured. Add it in Vercel env vars and cron-job.org headers.',
    });
    return;
  }

  if (!isAuthorized(request)) {
    sendJson(response, 401, { error: 'Unauthorized' });
    return;
  }

  const source = resolveCronSource(request);
  const startedAt = new Date().toISOString();
  const dryRun = String(request.query?.dryRun || request.query?.dry_run || '0') === '1';

  try {
    let clientIds = await listFbLeadSyncableClientIds();
    const onlyClient = request.query?.client ? String(request.query.client).trim() : '';
    if (onlyClient) {
      clientIds = clientIds.filter((id) => id === onlyClient);
      if (!clientIds.length) {
        sendJson(response, 404, {
          error: `Client "${onlyClient}" is not enabled or configured for FB lead sync (needs fbLeadSyncEnabled, metaPageId, GHL token, Meta token).`,
        });
        return;
      }
    }

    if (!clientIds.length) {
      sendJson(response, 200, {
        success: true,
        source,
        startedAt,
        finishedAt: new Date().toISOString(),
        synced: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
        results: [],
        message: 'No clients with FB lead sync enabled and configured.',
        schedule: CRON_SCHEDULE_LABEL,
      });
      return;
    }

    const results = [];
    for (const clientId of clientIds) {
      try {
        let runId = null;
        let offset = 0;
        let lastSummary = null;
        let totalUpdated = 0;
        let totalSkippedHasId = 0;
        let totalSkippedNoMatch = 0;
        let totalErrors = 0;
        const allRows = [];

        do {
          lastSummary = await syncMetaLeadIdsToGhl(clientId, {
            mode: 'recent',
            days: DEFAULT_SYNC_DAYS,
            dryRun,
            source,
            logHistory: true,
            runId,
            offset,
          });
          runId = lastSummary.runId;
          offset = lastSummary.nextBatchOffset ?? offset + (lastSummary.batchProcessed || 0);
          totalUpdated += lastSummary.updated || 0;
          totalSkippedHasId += lastSummary.skippedHasId || 0;
          totalSkippedNoMatch += lastSummary.skippedNoMatch || 0;
          totalErrors += lastSummary.errors || 0;
          allRows.push(...(lastSummary.rows || []).filter(
            (row) => row.status === 'updated' || row.status === 'error',
          ));
        } while (lastSummary?.hasMore);

        results.push({
          clientId,
          runId,
          success: totalErrors === 0,
          updated: totalUpdated,
          skippedHasId: totalSkippedHasId,
          skippedNoMatch: totalSkippedNoMatch,
          errors: totalErrors,
          inWindow: lastSummary?.inWindow,
          metaLeadCount: lastSummary?.metaLeadCount,
          hasMore: false,
          batchProcessed: lastSummary?.batchProcessed,
          rows: allRows,
        });
      } catch (error) {
        results.push({
          clientId,
          success: false,
          error: error.message || 'FB lead sync failed.',
        });
      }
    }

    const updated = results.reduce((sum, row) => sum + (row.updated || 0), 0);
    const failed = results.filter((row) => !row.success).length;
    const pruned = await pruneRoutineFbLeadSyncRuns({ maxAgeHours: 24 });

    sendJson(response, failed ? 500 : 200, {
      success: failed === 0,
      source,
      startedAt,
      finishedAt: new Date().toISOString(),
      mode: 'recent',
      days: DEFAULT_SYNC_DAYS,
      dryRun,
      clientIds,
      updated,
      failed,
      results,
      pruned,
      schedule: CRON_SCHEDULE_LABEL,
    });
  } catch (error) {
    sendJson(response, 500, {
      error: error.message || 'FB lead sync cron failed.',
      source,
      startedAt,
    });
  }
}

module.exports = {
  handleFbLeadSyncCronRequest,
  listFbLeadSyncableClientIds,
};
