const { listMetaSyncableClientIds } = require('./account-store');
const { logMetaSyncRun } = require('./sync-history');
const { syncMetaMetrics } = require('./meta-sync-service');

function normalizeBearerToken(value) {
  return String(value || '').trim();
}

function sendJson(response, statusCode, payload) {
  if (typeof response.status === 'function') {
    response.status(statusCode).json(payload);
    return;
  }
  response.writeHead(statusCode, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(payload));
}

function getAllowedAuthTokens() {
  const tokens = [
    process.env.INNGEST_EVENT_KEY,
    process.env.CRON_SECRET,
    process.env.META_SYNC_INTERNAL_SECRET,
  ]
    .map(normalizeBearerToken)
    .filter(Boolean);
  return [...new Set(tokens)];
}

function isAuthorized(request) {
  const allowed = getAllowedAuthTokens();
  if (!allowed.length) return false;
  const authHeader = normalizeBearerToken(
    (request.headers?.authorization || request.headers?.Authorization || '').replace(/^Bearer\s+/i, ''),
  );
  return allowed.includes(authHeader);
}

function parseBody(request) {
  if (request.body == null || request.body === '') return {};
  if (typeof request.body === 'object') return request.body;
  try {
    return JSON.parse(String(request.body));
  } catch {
    return {};
  }
}

async function runMetaSyncInngestJob({ runId = null, schedule = null } = {}) {
  const tickAt = new Date().toISOString();
  await logMetaSyncRun(null, {
    status: 'cron_tick',
    source: 'inngest',
    errorMessage: `Inngest Meta cron fired (run ${runId || 'direct'}, schedule: ${schedule || 'unknown'}).`,
    startedAt: tickAt,
    finishedAt: tickAt,
  });

  const clientIds = await listMetaSyncableClientIds();
  if (!clientIds.length) {
    const emptyAt = new Date().toISOString();
    await logMetaSyncRun(null, {
      status: 'skipped',
      source: 'inngest',
      errorMessage: 'Inngest Meta cron ran but no syncable clients (check META_SYSTEM_USER_TOKEN and meta ad account IDs).',
      startedAt: emptyAt,
      finishedAt: emptyAt,
    });
    return { synced: 0, skipped: 0, failed: 0, clientIds: [], schedule };
  }

  const results = [];
  for (const clientId of clientIds) {
    try {
      const syncResult = await syncMetaMetrics(clientId, { source: 'inngest' });
      results.push({
        clientId,
        success: Boolean(syncResult.success),
        skipped: Boolean(syncResult.skipped),
        reason: syncResult.reason || null,
      });
    } catch (error) {
      results.push({
        clientId,
        success: false,
        skipped: false,
        reason: error.message || 'Meta sync failed.',
      });
    }
  }

  const synced = results.filter((row) => row.success).length;
  const skipped = results.filter((row) => row.skipped).length;
  const failed = results.filter((row) => !row.success && !row.skipped).length;

  const finishAt = new Date().toISOString();
  await logMetaSyncRun(null, {
    status: failed ? 'error' : 'success',
    source: 'inngest',
    errorMessage: `Inngest Meta cron finished: ${synced} synced, ${skipped} skipped, ${failed} failed.`,
    startedAt: finishAt,
    finishedAt: finishAt,
  });

  return { synced, skipped, failed, clientIds, results, schedule, runId };
}

async function handleMetaSyncInngestRequest(request, response) {
  if ((request.method || 'POST') !== 'POST') {
    sendJson(response, 405, { error: 'Method not allowed' });
    return;
  }

  if (!getAllowedAuthTokens().length) {
    sendJson(response, 503, {
      error: 'No auth token configured (set INNGEST_EVENT_KEY, CRON_SECRET, or META_SYNC_INTERNAL_SECRET).',
    });
    return;
  }

  if (!isAuthorized(request)) {
    sendJson(response, 401, { error: 'Unauthorized' });
    return;
  }

  try {
    const body = parseBody(request);
    const result = await runMetaSyncInngestJob({
      runId: body.runId || null,
      schedule: body.schedule || null,
    });
    sendJson(response, 200, result);
  } catch (error) {
    console.error('[meta-sync-inngest]', error.message || error);
    sendJson(response, 500, {
      error: error.message || 'Meta sync Inngest job failed.',
    });
  }
}

module.exports = {
  handleMetaSyncInngestRequest,
  runMetaSyncInngestJob,
};
