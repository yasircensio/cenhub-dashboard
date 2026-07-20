const { getAccount, listClientIds, listMetaSyncableClientIds } = require('./account-store');
const { logMetaSyncRun } = require('./sync-history');
const { syncAllMetaInline } = require('./sync-batch');

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

async function listMetaCronClientIds() {
  const syncable = await listMetaSyncableClientIds();
  if (syncable.length) return syncable;

  const ids = await listClientIds();
  const withMeta = [];
  for (const clientId of ids) {
    const account = await getAccount(clientId);
    if (account?.metaAdAccountId) withMeta.push(clientId);
  }
  return withMeta;
}

async function logCronHeartbeat({ source, message, status = 'cron_tick' }) {
  try {
    await logMetaSyncRun(null, {
      status,
      source,
      errorMessage: message,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
    });
  } catch {
    // Heartbeat logging must not block sync.
  }
}

async function handleMetaSyncCronRequest(request, response) {
  if (request.method !== 'GET' && request.method !== 'POST') {
    sendJson(response, 405, { error: 'Method not allowed' });
    return;
  }

  if (!getCronSecret()) {
    sendJson(response, 503, {
      error: 'CRON_SECRET is not configured on Vercel. Add it under Project Settings → Environment Variables, then redeploy.',
    });
    return;
  }

  if (!isAuthorized(request)) {
    sendJson(response, 401, { error: 'Unauthorized' });
    return;
  }

  const source = request.headers?.['x-vercel-cron'] === '1' ? 'vercel-cron' : 'vercel-cron';

  try {
    const clientIds = await listMetaCronClientIds();
    if (!clientIds.length) {
      await logCronHeartbeat({
        source,
        message: 'Cron ran but no clients have a Meta ad account ID configured.',
        status: 'skipped',
      });
      sendJson(response, 200, {
        success: true,
        synced: 0,
        skipped: 0,
        failed: 0,
        results: [],
        message: 'No Meta-configured clients found.',
        schedule: '0 4 * * *',
      });
      return;
    }

    const results = await syncAllMetaInline(clientIds, { source });
    const synced = results.filter((row) => row.success).length;
    const skipped = results.filter((row) => row.skipped).length;
    const failed = results.filter((row) => !row.success && !row.skipped).length;

    await logCronHeartbeat({
      source,
      message: `Cron finished: ${synced} synced, ${skipped} skipped, ${failed} failed (${clientIds.length} clients).`,
      status: failed ? 'error' : 'success',
    });

    sendJson(response, 200, {
      success: failed === 0,
      synced,
      skipped,
      failed,
      results,
      clientIds,
    });
  } catch (error) {
    await logCronHeartbeat({
      source,
      message: error.message || 'Meta cron sync failed.',
      status: 'error',
    });
    sendJson(response, 500, {
      error: error.message || 'Meta cron sync failed.',
    });
  }
}

module.exports = {
  handleMetaSyncCronRequest,
};
