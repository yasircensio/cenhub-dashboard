const { requireStaffSession } = require('./admin-auth');
const { getAccount } = require('./account-store');
const {
  deleteFbLeadSyncRuns,
  getFbLeadSyncDashboard,
  getFbLeadSyncRun,
  listFbLeadSyncRuns,
} = require('./fb-lead-sync-history');
const {
  DEFAULT_BATCH_LIMIT,
  getFbLeadSyncPreflight,
  syncMetaLeadIdsToGhl,
} = require('./meta-lead-ghl-sync');

function sendJson(response, statusCode, payload) {
  if (typeof response.status === 'function') {
    response.status(statusCode).json(payload);
    return;
  }
  response.writeHead(statusCode, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(payload));
}

function parseJsonBody(body) {
  if (!body) return {};
  if (typeof body === 'object') return body;
  try {
    return JSON.parse(body);
  } catch {
    const error = new Error('Invalid JSON body.');
    error.statusCode = 400;
    throw error;
  }
}

function parseFbLeadSyncPath(urlPath) {
  const normalized = String(urlPath || '').split('?')[0].replace(/\/+$/, '');
  const prefix = '/api/fb-lead-sync';
  if (normalized === prefix) return { kind: 'dashboard' };

  if (!normalized.startsWith(`${prefix}/`)) {
    return { kind: 'unknown' };
  }

  const remainder = normalized.slice(prefix.length + 1);
  const segments = remainder.split('/').filter(Boolean);
  if (!segments.length) return { kind: 'dashboard' };
  if (segments[0] === 'preflight') return { kind: 'preflight' };
  if (segments[0] === 'run') return { kind: 'run' };
  if (segments[0] === 'history') {
    if (segments.length >= 2 && /^\d+$/.test(segments[1])) {
      return { kind: 'history-run', runId: Number(segments[1]) };
    }
    return { kind: 'history' };
  }
  return { kind: 'unknown' };
}

async function handleFbLeadSyncRequest(request, response) {
  const method = (request.method || 'GET').toUpperCase();
  const pathInfo = parseFbLeadSyncPath(request.url || request.path || '/api/fb-lead-sync');
  const query = request.query || {};

  try {
    if (pathInfo.kind === 'dashboard') {
      if (method !== 'GET') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      await requireStaffSession(request);
      sendJson(response, 200, await getFbLeadSyncDashboard());
      return;
    }

    if (pathInfo.kind === 'preflight') {
      if (method !== 'GET') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      await requireStaffSession(request);
      const clientId = String(query.client || query.clientId || '').trim();
      if (!clientId) {
        sendJson(response, 400, { error: 'Missing client query parameter.' });
        return;
      }
      sendJson(response, 200, await getFbLeadSyncPreflight(clientId, {
        quick: query.quick === '1' || query.quick === 'true',
      }));
      return;
    }

    if (pathInfo.kind === 'history-run') {
      if (method === 'GET') {
        await requireStaffSession(request);
        const run = await getFbLeadSyncRun(pathInfo.runId);
        const account = await getAccount(run.clientId);
        sendJson(response, 200, {
          run: {
            ...run,
            locationId: account?.locationId || null,
          },
        });
        return;
      }
      if (method === 'DELETE') {
        await requireStaffSession(request, { adminOnly: true });
        const result = await deleteFbLeadSyncRuns({ runId: pathInfo.runId });
        sendJson(response, 200, { ok: true, ...result });
        return;
      }
      sendJson(response, 405, { error: 'Method not allowed' });
      return;
    }

    if (pathInfo.kind === 'history') {
      if (method === 'GET') {
        await requireStaffSession(request);
        const clientId = query.client ? String(query.client).trim() : null;
        sendJson(response, 200, await listFbLeadSyncRuns({
          clientId,
          limit: query.limit,
        }));
        return;
      }
      if (method === 'DELETE') {
        await requireStaffSession(request, { adminOnly: true });
        const clientId = query.client ? String(query.client).trim() : null;
        const result = await deleteFbLeadSyncRuns({ clientId });
        sendJson(response, 200, { ok: true, ...result });
        return;
      }
      sendJson(response, 405, { error: 'Method not allowed' });
      return;
    }

    if (pathInfo.kind === 'run') {
      if (method !== 'POST') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      await requireStaffSession(request);
      const body = parseJsonBody(request.body);
      const clientId = String(body.clientId || body.client || '').trim();
      if (!clientId) {
        sendJson(response, 400, { error: 'clientId is required.' });
        return;
      }

      const summary = await syncMetaLeadIdsToGhl(clientId, {
        mode: body.mode || 'recent',
        days: body.days,
        dryRun: Boolean(body.dryRun),
        force: Boolean(body.force),
        offset: body.batchOffset ?? body.offset ?? 0,
        limit: body.batchLimit ?? body.limit ?? DEFAULT_BATCH_LIMIT,
        runId: body.runId ?? null,
        previewRunId: body.previewRunId ?? null,
        source: 'admin',
        logHistory: true,
      });

      sendJson(response, 200, { summary });
      return;
    }

    sendJson(response, 404, { error: 'Not found' });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error.message || 'FB lead sync request failed.',
    });
  }
}

module.exports = {
  handleFbLeadSyncRequest,
  parseFbLeadSyncPath,
};
