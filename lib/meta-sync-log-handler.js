const { logMetaSyncRun } = require('./sync-history');
const { debugIngest } = require('./debug-ingest');

function sendJson(response, statusCode, payload) {
  if (typeof response.status === 'function') {
    response.status(statusCode).json(payload);
    return;
  }
  response.writeHead(statusCode, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(payload));
}

function getCronSecret() {
  return process.env.CRON_SECRET || '';
}

function isAuthorized(request) {
  const secret = getCronSecret();
  if (!secret) return false;
  const authHeader = request.headers?.authorization || request.headers?.Authorization || '';
  return authHeader === `Bearer ${secret}`;
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

async function handleMetaSyncLogRequest(request, response) {
  if ((request.method || 'POST') !== 'POST') {
    sendJson(response, 405, { error: 'Method not allowed' });
    return;
  }

  if (!getCronSecret()) {
    debugIngest('meta-sync-log-handler.js', 'CRON_SECRET missing on production API', {}, 'H1');
    sendJson(response, 503, {
      error: 'CRON_SECRET is not configured on Vercel Production. Add it, redeploy, then Inngest can write Meta sync logs.',
    });
    return;
  }

  if (!isAuthorized(request)) {
    sendJson(response, 401, { error: 'Unauthorized' });
    return;
  }

  try {
    const body = parseBody(request);
    const row = await logMetaSyncRun(body.clientId || null, {
      status: body.status,
      source: body.source,
      errorMessage: body.errorMessage,
      startedAt: body.startedAt,
      finishedAt: body.finishedAt,
      thisMonthSpend: body.thisMonthSpend,
      spendDateStop: body.spendDateStop,
      metricsClientId: body.metricsClientId,
    });
    sendJson(response, 200, row);
  } catch (error) {
    console.error('[meta-sync-log] failed:', error.message || error);
    sendJson(response, 500, {
      error: error.message || 'Failed to write Meta sync log.',
    });
  }
}

module.exports = {
  handleMetaSyncLogRequest,
};
