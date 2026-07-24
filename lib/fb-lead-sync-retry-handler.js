const { processDueFbLeadSyncRetries } = require('./fb-lead-sync-retry-queue');

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
      error: 'CRON_SECRET is not configured. Add it in Vercel env vars and cron-job.org headers.',
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
    sendJson(response, 200, {
      success: true,
      ...result,
      schedule: 'Every 5 minutes (cron-job.org retry worker)',
    });
  } catch (error) {
    sendJson(response, 500, {
      error: error.message || 'FB lead sync retry worker failed.',
    });
  }
}

module.exports = {
  handleFbLeadSyncRetryRequest,
};
