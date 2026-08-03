const { processDueFbLeadSyncRetries, recordRetryWorkerHeartbeat } = require('./fb-lead-sync-retry-queue');

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

async function handleFbLeadSyncRetryRequest(request, response) {
  if (request.method !== 'GET' && request.method !== 'POST') {
    sendJson(response, 405, { error: 'Method not allowed' });
    return;
  }

  if (!getCronSecret()) {
    sendJson(response, 503, {
      error: 'CRON_SECRET is not configured. Add it in Vercel env vars.',
    });
    return;
  }

  if (!isAuthorized(request)) {
    sendJson(response, 401, { error: 'Unauthorized' });
    return;
  }

  try {
    const limit = request.query?.limit;
    const result = await processDueFbLeadSyncRetries({ limit });
    await recordRetryWorkerHeartbeat({
      processed: result.processed,
      updated: result.updated,
      failed: result.failed,
      stillPending: result.stillPending,
    });

    sendJson(response, 200, {
      success: true,
      ...result,
      schedule: 'Every 5 minutes (Vercel cron)',
    });
  } catch (error) {
    const message = error.message || 'FB lead sync retry worker failed.';
    const statusCode = /fb_lead_sync_retries/i.test(message) && /does not exist|relation/i.test(message)
      ? 503
      : 500;
    sendJson(response, statusCode, {
      error: message,
      hint: statusCode === 503
        ? 'Run npm run migrate:fb-lead-sync-retries against Neon (or redeploy — production auto-creates the table on first call).'
        : undefined,
    });
  }
}

module.exports = {
  handleFbLeadSyncRetryRequest,
};
