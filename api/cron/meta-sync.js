const { listMetaSyncableClientIds } = require('../lib/account-store');
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

module.exports = async function metaSyncCronHandler(request, response) {
  if (request.method !== 'GET' && request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!getCronSecret()) {
    response.status(503).json({
      error: 'CRON_SECRET is not configured on Vercel.',
    });
    return;
  }

  if (!isAuthorized(request)) {
    response.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const clientIds = await listMetaSyncableClientIds();
    if (!clientIds.length) {
      response.status(200).json({
        success: true,
        synced: 0,
        skipped: 0,
        failed: 0,
        results: [],
        message: 'No Meta-configured clients with a valid token.',
        schedule: process.env.META_SYNC_CRON || '*/2 * * * *',
      });
      return;
    }

    const results = await syncAllMetaInline(clientIds, { source: 'vercel-cron' });
    const synced = results.filter((row) => row.success).length;
    const skipped = results.filter((row) => row.skipped).length;
    const failed = results.filter((row) => !row.success && !row.skipped).length;

    response.status(200).json({
      success: failed === 0,
      synced,
      skipped,
      failed,
      results,
      clientIds,
    });
  } catch (error) {
    response.status(500).json({
      error: error.message || 'Meta cron sync failed.',
    });
  }
};
