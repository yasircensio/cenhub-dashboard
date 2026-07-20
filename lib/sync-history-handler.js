const { requireStaffSession } = require('./admin-auth');
const { listGhlSyncRuns, listMetaSyncRuns } = require('./sync-history');

function sendJson(response, statusCode, payload) {
  if (typeof response.status === 'function') {
    response.status(statusCode).json(payload);
    return;
  }
  response.writeHead(statusCode, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(payload));
}

async function handleSyncHistoryRequest(request, response) {
  if ((request.method || 'GET') !== 'GET') {
    sendJson(response, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    await requireStaffSession(request, { adminOnly: true });
    const query = request.query || {};
    const type = String(query.type || 'ghl').toLowerCase();
    const clientId = query.client ? String(query.client).trim() : null;
    const limit = query.limit;

    if (type === 'meta') {
      sendJson(response, 200, await listMetaSyncRuns({ clientId, limit }));
      return;
    }

    if (type === 'ghl' || type === 'cenhub') {
      sendJson(response, 200, await listGhlSyncRuns({ clientId, limit }));
      return;
    }

    sendJson(response, 400, { error: 'Invalid type. Use ghl or meta.' });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error.message || 'Failed to load sync history.',
    });
  }
}

module.exports = {
  handleSyncHistoryRequest,
};
