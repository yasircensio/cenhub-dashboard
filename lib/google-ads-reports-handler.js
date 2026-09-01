const { requireStaffSession } = require('./admin-auth');
const { getCurrentMonthKey } = require('./marketing-metrics');
const {
  buildClientYearPayload,
  refreshMonthGoogleData,
  saveMonthRecord,
  getPublicGoogleAdsReportPayload,
} = require('./google-ads-report-service');
const {
  getGoogleAdsReportsDashboard,
  provisionGoogleAdsReportClient,
  updateGoogleAdsReportSettings,
  getGoogleAdsReportClient,
  clientPublicFields,
} = require('./google-ads-report-store');
const { listGoogleAdsConversionActions } = require('./google-ads-query');

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

function parseGoogleAdsReportsPath(urlPath) {
  const normalized = String(urlPath || '').split('?')[0].replace(/\/+$/, '');
  const prefix = '/api/google-ads-reports';
  if (normalized === prefix) return { kind: 'dashboard' };
  if (!normalized.startsWith(`${prefix}/`)) return { kind: 'unknown' };

  const remainder = normalized.slice(prefix.length + 1);
  const segments = remainder.split('/').filter(Boolean);
  if (!segments.length) return { kind: 'dashboard' };
  if (segments[0] === 'provision') return { kind: 'provision' };
  if (segments[0] === 'public' && segments[1]) return { kind: 'public', token: segments[1] };
  if (segments[0] === 'clients' && segments[1]) {
    const clientId = segments[1];
    if (segments[2] === 'settings') return { kind: 'client-settings', clientId };
    if (segments[2] === 'conversion-actions') {
      return { kind: 'conversion-actions', clientId };
    }
    if (segments[2] === 'months' && segments[3]) {
      if (segments[4] === 'refresh') {
        return { kind: 'month-refresh', clientId, monthKey: segments[3] };
      }
      return { kind: 'month-save', clientId, monthKey: segments[3] };
    }
    return { kind: 'client-year', clientId };
  }
  return { kind: 'unknown' };
}

function getRequestBody(request) {
  if (request.body && typeof request.body === 'object') return request.body;
  return parseJsonBody(request.body);
}

async function handleGoogleAdsReportsRequest(request, response) {
  const method = (request.method || 'GET').toUpperCase();
  const pathInfo = parseGoogleAdsReportsPath(request.url || request.path || '/api/google-ads-reports');
  const query = request.query || {};

  try {
    if (pathInfo.kind === 'dashboard') {
      if (method !== 'GET') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      await requireStaffSession(request);
      const filter = String(query.filter || 'all');
      sendJson(response, 200, await getGoogleAdsReportsDashboard({ filter }));
      return;
    }

    if (pathInfo.kind === 'provision') {
      await requireStaffSession(request);
      if (method !== 'POST') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      const body = getRequestBody(request);
      const client = await provisionGoogleAdsReportClient(body);
      sendJson(response, 200, {
        clientId: client.clientId,
        accountName: client.accountName,
        googleCustomerId: client.googleCustomerId,
      });
      return;
    }

    if (pathInfo.kind === 'public') {
      if (method !== 'GET') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      sendJson(response, 200, await getPublicGoogleAdsReportPayload(
        pathInfo.token,
        query.year || getCurrentMonthKey().slice(0, 4),
      ));
      return;
    }

    if (pathInfo.kind === 'client-settings') {
      await requireStaffSession(request);
      if (method !== 'PATCH') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      const body = getRequestBody(request);
      const client = await updateGoogleAdsReportSettings(pathInfo.clientId, body);
      sendJson(response, 200, { settings: clientPublicLite(client) });
      return;
    }

    if (pathInfo.kind === 'client-year') {
      await requireStaffSession(request);
      if (method !== 'GET') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      const year = query.year || getCurrentMonthKey().slice(0, 4);
      sendJson(response, 200, await buildClientYearPayload(pathInfo.clientId, year));
      return;
    }

    if (pathInfo.kind === 'conversion-actions') {
      await requireStaffSession(request);
      if (method !== 'GET') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      const client = await getGoogleAdsReportClient(pathInfo.clientId);
      if (!client) {
        sendJson(response, 404, { error: 'Google Ads report client not found.' });
        return;
      }
      const listed = await listGoogleAdsConversionActions(client.googleCustomerId);
      sendJson(response, 200, {
        clientId: client.clientId,
        accountName: client.accountName,
        googleCustomerId: client.googleCustomerId,
        conversionActions: listed.conversionActions,
      });
      return;
    }

    if (pathInfo.kind === 'month-refresh') {
      await requireStaffSession(request);
      if (method !== 'POST') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      await refreshMonthGoogleData(pathInfo.clientId, pathInfo.monthKey, { force: true });
      sendJson(response, 200, await buildClientYearPayload(
        pathInfo.clientId,
        pathInfo.monthKey.slice(0, 4),
      ));
      return;
    }

    if (pathInfo.kind === 'month-save') {
      await requireStaffSession(request);
      if (method !== 'PUT') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      const body = getRequestBody(request);
      await saveMonthRecord(pathInfo.clientId, pathInfo.monthKey, body);
      sendJson(response, 200, await buildClientYearPayload(
        pathInfo.clientId,
        pathInfo.monthKey.slice(0, 4),
      ));
      return;
    }

    sendJson(response, 404, { error: 'Not found' });
  } catch (error) {
    const status = error.statusCode || error.status || 500;
    sendJson(response, status, { error: error.message || 'Google Ads reports request failed.' });
  }
}

function clientPublicLite(client) {
  const fields = clientPublicFields(client);
  return {
    ...fields,
    reportUrl: fields.reportUrl || null,
  };
}

module.exports = {
  handleGoogleAdsReportsRequest,
  parseGoogleAdsReportsPath,
};
