const { requireStaffSession } = require('./admin-auth');
const {
  deleteGhlSyncRuns,
  deleteMetaSyncRuns,
  listGhlSyncRuns,
  listMetaSyncRuns,
} = require('./sync-history');
const {
  deleteMetaReportGhlSyncRuns,
  listMetaReportGhlSyncRuns,
} = require('./meta-report-ghl-sync-history');

function sendJson(response, statusCode, payload) {
  if (typeof response.status === 'function') {
    response.status(statusCode).json(payload);
    return;
  }
  response.writeHead(statusCode, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(payload));
}

async function handleSyncHistoryRequest(request, response) {
  const method = (request.method || 'GET').toUpperCase();

  if (method !== 'GET' && method !== 'DELETE') {
    sendJson(response, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const query = request.query || {};
    const type = String(query.type || 'ghl').toLowerCase();
    const clientId = query.client ? String(query.client).trim() : null;
    const limit = query.limit;

    if (method === 'DELETE') {
      await requireStaffSession(request, { adminOnly: true });
      if (type === 'meta-report-ghl' || type === 'meta-reports') {
        const result = await deleteMetaReportGhlSyncRuns({ clientId });
        sendJson(response, 200, {
          ok: true,
          type: 'meta-report-ghl',
          deleted: result.deleted,
          clientId: result.clientId || null,
        });
        return;
      }
      if (type === 'meta') {
        const result = await deleteMetaSyncRuns({ clientId });
        sendJson(response, 200, {
          ok: true,
          type: 'meta',
          deleted: result.deleted,
          clientId: result.clientId || null,
        });
        return;
      }
      if (type === 'ghl' || type === 'cenhub') {
        const result = await deleteGhlSyncRuns({ clientId });
        sendJson(response, 200, {
          ok: true,
          type: 'ghl',
          deleted: result.deleted,
          clientId: result.clientId || null,
        });
        return;
      }
      sendJson(response, 400, { error: 'Invalid type. Use ghl, meta, or meta-report-ghl.' });
      return;
    }

    await requireStaffSession(request);

    if (type === 'meta-report-ghl' || type === 'meta-reports') {
      sendJson(response, 200, await listMetaReportGhlSyncRuns({ clientId, limit }));
      return;
    }

    if (type === 'meta') {
      sendJson(response, 200, await listMetaSyncRuns({ clientId, limit }));
      return;
    }

    if (type === 'ghl' || type === 'cenhub') {
      sendJson(response, 200, await listGhlSyncRuns({ clientId, limit }));
      return;
    }

    sendJson(response, 400, { error: 'Invalid type. Use ghl, meta, or meta-report-ghl.' });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error.message || 'Failed to load sync history.',
    });
  }
}

module.exports = {
  handleSyncHistoryRequest,
};
