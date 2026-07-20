const { getAccount, listClientIds, listMetaSyncableClientIds } = require('../lib/account-store');
const { logMetaSyncRun } = require('../lib/sync-history');
const { syncAllMetaInline } = require('../lib/sync-batch');

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

module.exports = async function metaSyncCronHandler(request, response) {
  if (request.method !== 'GET' && request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!getCronSecret()) {
    response.status(503).json({
      error: 'CRON_SECRET is not configured on Vercel. Add it under Project Settings → Environment Variables, then redeploy.',
    });
    return;
  }

  if (!isAuthorized(request)) {
    response.status(401).json({ error: 'Unauthorized' });
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
      response.status(200).json({
        success: true,
        synced: 0,
        skipped: 0,
        failed: 0,
        results: [],
        message: 'No Meta-configured clients found.',
        schedule: '*/2 * * * *',
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

    response.status(200).json({
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
    response.status(500).json({
      error: error.message || 'Meta cron sync failed.',
    });
  }
};
