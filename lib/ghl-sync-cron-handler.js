const { listClientIds } = require('./account-store');
const { syncAllGhlInline } = require('./sync-batch');

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

async function handleGhlSyncCronRequest(request, response) {
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

  const source = 'vercel-cron';

  try {
    const clientIds = await listClientIds();
    if (!clientIds.length) {
      sendJson(response, 200, {
        success: true,
        synced: 0,
        failed: 0,
        results: [],
        message: 'No dashboard clients found.',
        schedule: '0 1 * * * UTC (~3:00 Copenhagen in DST)',
      });
      return;
    }

    const results = await syncAllGhlInline(clientIds, { source });
    const synced = results.filter((row) => row.success).length;
    const failed = results.filter((row) => !row.success).length;

    sendJson(response, 200, {
      success: failed === 0,
      synced,
      failed,
      results,
      clientIds,
      schedule: '0 1 * * * UTC (~3:00 Copenhagen in DST)',
    });
  } catch (error) {
    sendJson(response, 500, {
      error: error.message || 'GHL cron sync failed.',
    });
  }
}

module.exports = {
  handleGhlSyncCronRequest,
};
