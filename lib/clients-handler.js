const { requireStaffSession } = require('./admin-auth');
const {
  checkSlugAvailable,
  createAccount,
  deleteAccount,
  getAccount,
  getSnapshot,
  listAccounts,
  listClientIds,
  normalizeClientId,
  setMetricsModel,
  suggestSlugFromName,
  toPublicSummary,
  updateAccount,
} = require('./account-store');
const { fetchPipelines } = require('./ghl-sync');
const { syncMetaMetrics } = require('./meta-sync-service');
const { syncAccount } = require('./sync-service');
const { computeClientAccessKey, isAccessKeyEnforced } = require('./client-access');
const { isInngestConfigured } = require('./inngest-client');
const { INLINE_SYNC_MAX_CLIENTS, queueSyncAll, syncAllInline } = require('./sync-batch');

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

function parseClientsPath(urlPath) {
  const normalized = String(urlPath || '').split('?')[0].replace(/\/+$/, '');
  const prefix = '/api/clients';
  if (normalized === prefix) {
    return { kind: 'root' };
  }
  if (!normalized.startsWith(`${prefix}/`)) {
    return { kind: 'unknown' };
  }

  const remainder = normalized.slice(prefix.length + 1);
  const segments = remainder.split('/').filter(Boolean);
  if (!segments.length) return { kind: 'root' };

  if (segments[0] === 'check-slug') {
    return { kind: 'check-slug' };
  }
  if (segments[0] === 'slugs') {
    return { kind: 'slugs' };
  }

  const clientId = normalizeClientId(segments[0]);
  if (segments.length === 1) {
    return { kind: 'account', clientId };
  }
  if (segments[1] === 'sync-pipelines') {
    return { kind: 'sync-pipelines', clientId };
  }
  if (segments[1] === 'sync') {
    return { kind: 'sync', clientId };
  }
  if (segments[1] === 'sync-meta') {
    return { kind: 'sync-meta', clientId };
  }
  if (segments[1] === 'metrics-model') {
    return { kind: 'metrics-model', clientId };
  }

  return { kind: 'unknown' };
}

async function getAccountDetail(clientId) {
  const account = await getAccount(clientId);
  if (!account) {
    const error = new Error('Account not found.');
    error.statusCode = 404;
    throw error;
  }
  const snapshot = await getSnapshot(clientId);
  const summary = toPublicSummary(account, snapshot);
  const accessKey = computeClientAccessKey(account.clientId);
  return {
    ...account,
    status: summary.status,
    lastSyncAt: snapshot?.fetched_at || null,
    lastSyncStatus: snapshot?.sync_status || null,
    lastSyncError: snapshot?.sync_error || null,
    pipelineCount: snapshot?.pipelines?.length || 0,
    opportunityCount: snapshot?.opportunities?.length || 0,
    previewKpis: summary.previewKpis,
    accessKeyEnforced: isAccessKeyEnforced(),
    accessKey: accessKey || null,
    clientUrl: accessKey ? `/${account.clientId}?key=${accessKey}` : `/${account.clientId}`,
  };
}

async function requireClientsAuth(request) {
  await requireStaffSession(request);
}

async function requireAdminClientsAuth(request) {
  await requireStaffSession(request, { adminOnly: true });
}

async function handleClientsRequest(request, response) {
  const method = request.method || 'GET';
  const headers = request.headers || {};
  const query = request.query || {};
  const pathInfo = parseClientsPath(request.url || request.path || '/api/clients');

  try {
    if (pathInfo.kind === 'check-slug') {
      if (method !== 'GET') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      await requireClientsAuth(request);
      const slug = query.slug || query.clientId || '';
      const result = await checkSlugAvailable(slug);
      sendJson(response, 200, result);
      return;
    }

    if (pathInfo.kind === 'slugs') {
      if (method !== 'GET') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      await requireClientsAuth(request);
      const clients = await listAccounts();
      sendJson(response, 200, {
        slugs: clients.map((client) => client.clientId),
      });
      return;
    }

    if (pathInfo.kind === 'root') {
      if (method === 'GET') {
        await requireClientsAuth(request);
        const clients = await listAccounts();
        sendJson(response, 200, { clients });
        return;
      }
      if (method === 'POST') {
        const body = parseJsonBody(request.body);
        if (body.action === 'sync-all') {
          await requireAdminClientsAuth(request);
          const clientIds = await listClientIds();

          if (clientIds.length <= INLINE_SYNC_MAX_CLIENTS) {
            const results = await syncAllInline(clientIds);
            const failed = results.filter((row) => !row.success);
            sendJson(response, 200, {
              queued: false,
              inline: true,
              results,
              count: clientIds.length,
              message: failed.length
                ? `${failed.length} sync(s) failed`
                : 'All clients synced',
            });
            return;
          }

          if (isInngestConfigured()) {
            const queued = await queueSyncAll({ source: 'admin' });
            sendJson(response, 202, {
              queued: true,
              batchId: queued.batchId,
              clientIds: queued.clientIds,
              count: queued.count,
              message: 'Sync jobs queued. Each client syncs in its own background job.',
            });
            return;
          }

          const results = await syncAllInline(clientIds);
          sendJson(response, 200, {
            queued: false,
            inline: true,
            fallback: true,
            results,
            message: 'Inngest is not configured — synced clients in this request.',
          });
          return;
        }
        await requireAdminClientsAuth(request);
        const clientId = normalizeClientId(body.clientId || suggestSlugFromName(body.accountName));
        const account = await createAccount({
          clientId,
          accountName: body.accountName || clientId,
          locationId: body.locationId || null,
          ghlToken: body.ghlToken || '',
          timezone: body.timezone,
          profitFieldId: body.profitFieldId,
          facebookClientId: body.facebookClientId || clientId,
          defaultAdSpend: body.defaultAdSpend,
          newLeadsPipelineId: body.newLeadsPipelineId || null,
          salesPipelineId: body.salesPipelineId || null,
          afterSalesPipelineId: body.afterSalesPipelineId || null,
          dedupeEnabled: body.dedupeEnabled,
          readyForGhl: Boolean(body.readyForGhl),
        });
        sendJson(response, 201, { account: await getAccountDetail(account.clientId) });
        return;
      }
      sendJson(response, 405, { error: 'Method not allowed' });
      return;
    }

    if (pathInfo.kind === 'account') {
      if (method === 'GET') {
        await requireClientsAuth(request);
        sendJson(response, 200, { account: await getAccountDetail(pathInfo.clientId) });
        return;
      }
      if (method === 'PUT') {
        await requireClientsAuth(request);
        const body = parseJsonBody(request.body);
        await updateAccount(pathInfo.clientId, {
          accountName: body.accountName,
          locationId: body.locationId,
          ghlToken: body.ghlToken,
          clearGhlToken: Boolean(body.clearGhlToken),
          timezone: body.timezone,
          profitFieldId: body.profitFieldId,
          facebookClientId: body.facebookClientId,
          defaultAdSpend: body.defaultAdSpend,
          newLeadsPipelineId: body.newLeadsPipelineId,
          salesPipelineId: body.salesPipelineId,
          afterSalesPipelineId: body.afterSalesPipelineId,
          dedupeEnabled: body.dedupeEnabled,
          readyForGhl: body.readyForGhl,
          metaAdAccountId: body.metaAdAccountId,
          metaPageId: body.metaPageId,
          metaPixelId: body.metaPixelId,
          metaSystemUserToken: body.metaSystemUserToken,
          metaPageAccessToken: body.metaPageAccessToken,
          clearMetaSystemUserToken: Boolean(body.clearMetaSystemUserToken),
          clearMetaPageAccessToken: Boolean(body.clearMetaPageAccessToken),
        });
        sendJson(response, 200, { account: await getAccountDetail(pathInfo.clientId) });
        return;
      }
      if (method === 'DELETE') {
        await requireAdminClientsAuth(request);
        const result = await deleteAccount(pathInfo.clientId);
        sendJson(response, 200, result);
        return;
      }
      sendJson(response, 405, { error: 'Method not allowed' });
      return;
    }

    if (pathInfo.kind === 'sync-pipelines') {
      if (method !== 'POST') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      await requireClientsAuth(request);
      const account = await getAccount(pathInfo.clientId, { includeSecrets: true });
      if (!account) {
        sendJson(response, 404, { error: 'Account not found.' });
        return;
      }
      if (!account.ghlToken) {
        sendJson(response, 400, { error: 'Missing GHL token for this account.' });
        return;
      }
      if (!account.locationId) {
        sendJson(response, 400, { error: 'Missing GHL location ID for this account.' });
        return;
      }
      const pipelines = await fetchPipelines(account.ghlToken, account.locationId);
      sendJson(response, 200, { pipelines });
      return;
    }

    if (pathInfo.kind === 'sync') {
      if (method !== 'POST') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      await requireClientsAuth(request);
      const result = await syncAccount(pathInfo.clientId, { source: 'manual' });
      sendJson(response, 200, result);
      return;
    }

    if (pathInfo.kind === 'sync-meta') {
      if (method !== 'POST') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      await requireClientsAuth(request);
      const body = parseJsonBody(request.body);
      const metaPatch = {};
      if (body.metaAdAccountId !== undefined) metaPatch.metaAdAccountId = body.metaAdAccountId;
      if (body.metaPageId !== undefined) metaPatch.metaPageId = body.metaPageId;
      if (body.metaPixelId !== undefined) metaPatch.metaPixelId = body.metaPixelId;
      if (body.facebookClientId !== undefined) metaPatch.facebookClientId = body.facebookClientId;
      if (body.metaSystemUserToken) metaPatch.metaSystemUserToken = body.metaSystemUserToken;
      if (body.metaPageAccessToken) metaPatch.metaPageAccessToken = body.metaPageAccessToken;
      if (body.clearMetaSystemUserToken) metaPatch.clearMetaSystemUserToken = true;
      if (Object.keys(metaPatch).length) {
        await updateAccount(pathInfo.clientId, metaPatch);
      }
      const result = await syncMetaMetrics(pathInfo.clientId, {
        clearAccountTokenOverride: Boolean(body.clearMetaSystemUserToken),
        source: 'manual',
      });
      sendJson(response, 200, {
        ...result,
        account: await getAccountDetail(pathInfo.clientId),
      });
      return;
    }

    if (pathInfo.kind === 'metrics-model') {
      if (method !== 'POST') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      await requireClientsAuth(request);
      const body = parseJsonBody(request.body);
      const account = await setMetricsModel(pathInfo.clientId, {
        dedupeEnabled: body.dedupeEnabled,
        winPipelineId: body.winPipelineId || null,
        afterSalesPipelineId: body.afterSalesPipelineId,
        confirmSlug: body.confirmSlug,
        acknowledgeImpact: Boolean(body.acknowledgeImpact),
      });
      sendJson(response, 200, { account: await getAccountDetail(account.clientId) });
      return;
    }

    sendJson(response, 404, { error: 'Not found' });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error.message || 'Request failed.',
    });
  }
}

module.exports = {
  handleClientsRequest,
  parseClientsPath,
};
