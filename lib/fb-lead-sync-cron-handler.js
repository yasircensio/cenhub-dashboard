const fs = require('fs');
const path = require('path');
const { getAccount, listClientIds } = require('./account-store');
const { resolveMetaAccessToken } = require('./meta-token');
const { DEFAULT_SYNC_DAYS, syncMetaLeadIdsToGhl } = require('./meta-lead-ghl-sync');

function debugCronLog(message, data = {}, hypothesisId = 'A') {
  const entry = {
    sessionId: '7ba7fd',
    hypothesisId,
    location: 'lib/fb-lead-sync-cron-handler.js',
    message,
    data,
    timestamp: Date.now(),
  };
  // #region agent log
  fetch('http://127.0.0.1:7412/ingest/8036624f-bbd1-4142-b516-bb72c323b06c', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '7ba7fd' },
    body: JSON.stringify(entry),
  }).catch(() => {});
  try {
    fs.appendFileSync(
      path.join(__dirname, '..', '.cursor', 'debug-7ba7fd.log'),
      `${JSON.stringify(entry)}\n`,
    );
  } catch {
    // ignore
  }
  // #endregion
}

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
    debugCronLog('cron blocked: CRON_SECRET missing', {}, 'B');
    sendJson(response, 503, {
      error: 'CRON_SECRET is not configured. Add it in Vercel env vars and GitHub Actions secrets.',
    });
    return;
  }

  if (!isAuthorized(request)) {
    debugCronLog('cron blocked: unauthorized', { hasSecret: Boolean(getCronSecret()) }, 'B');
    sendJson(response, 401, { error: 'Unauthorized' });
    return;
  }

  const source = resolveCronSource(request);
  const startedAt = new Date().toISOString();
  const dryRun = String(request.query?.dryRun || request.query?.dry_run || '0') === '1';

  try {
    let clientIds = await listFbLeadSyncableClientIds();
    debugCronLog('cron started', {
      source,
      dryRun,
      syncableCount: clientIds.length,
      syncableClientIds: clientIds,
    }, 'C');
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
        schedule: '0 * * * * (Vercel Cron; GitHub Actions backup)',
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
            source: source === 'github-actions' ? 'github-actions' : (source === 'vercel-cron' ? 'vercel-cron' : source),
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
          debugCronLog('sync batch complete', {
            clientId,
            runId: lastSummary.runId,
            inWindow: lastSummary.inWindow,
            batchProcessed: lastSummary.batchProcessed,
            batchOffset: lastSummary.batchOffset,
            nextBatchOffset: lastSummary.nextBatchOffset,
            hasMore: lastSummary.hasMore,
            updated: lastSummary.updated,
            skippedHasId: lastSummary.skippedHasId,
            skippedNoMatch: lastSummary.skippedNoMatch,
            errors: lastSummary.errors,
          }, lastSummary.hasMore ? 'D' : 'E');
        } while (lastSummary?.hasMore);

        debugCronLog('client sync finished', {
          clientId,
          runId,
          batchesCompleted: true,
          totalUpdated,
          inWindow: lastSummary?.inWindow,
        }, 'D');

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

    debugCronLog('cron finished', {
      source,
      clientCount: clientIds.length,
      updated,
      failed,
      results: results.map((row) => ({
        clientId: row.clientId,
        success: row.success,
        inWindow: row.inWindow,
        updated: row.updated,
        hasMore: row.hasMore,
      })),
    }, 'A');
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
      schedule: '0 * * * * (Vercel Cron; GitHub Actions backup)',
    });
  } catch (error) {
    debugCronLog('cron error', { error: String(error?.message || error) }, 'B');
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
