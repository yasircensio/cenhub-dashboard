const { requireStaffSession } = require('./admin-auth');
const { getAccount } = require('./account-store');
const {
  listMetaReportClients,
  getMetaReportsDashboard,
  getCustomValuesOverview,
  provisionMetaReportClient,
  updateMetaReportSettings,
} = require('./meta-report-store');
const {
  buildClientYearPayload,
  buildSingleMonthPayload,
  refreshMonthMetaData,
  saveMonthRecord,
  getPublicReportPayload,
} = require('./meta-report-service');
const { resolveReportSlug, generateReportAccessToken } = require('./report-access');
const { getCurrentMonthKey } = require('./marketing-metrics');

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

function parseMetaReportsPath(urlPath) {
  const normalized = String(urlPath || '').split('?')[0].replace(/\/+$/, '');
  const prefix = '/api/meta-reports';
  if (normalized === prefix) return { kind: 'dashboard' };

  if (!normalized.startsWith(`${prefix}/`)) {
    return { kind: 'unknown' };
  }

  const remainder = normalized.slice(prefix.length + 1);
  const segments = remainder.split('/').filter(Boolean);
  if (!segments.length) return { kind: 'dashboard' };

  if (segments[0] === 'public' && segments[1]) {
    return { kind: 'public', token: segments[1] };
  }

  if (segments[0] === 'provision') {
    return { kind: 'provision' };
  }

  if (segments[0] === 'custom-values') {
    return { kind: 'custom-values' };
  }

  if (segments[0] === 'clients' && segments[1]) {
    const clientId = segments[1];
    if (segments[2] === 'settings') {
      return { kind: 'client-settings', clientId };
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

async function handleMetaReportsRequest(request, response) {
  const method = (request.method || 'GET').toUpperCase();
  const pathInfo = parseMetaReportsPath(request.url || request.path || '/api/meta-reports');
  const query = request.query || {};

  try {
    if (pathInfo.kind === 'dashboard') {
      if (method !== 'GET') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      await requireStaffSession(request);
      const filter = String(query.filter || 'all');
      sendJson(response, 200, await getMetaReportsDashboard({ filter }));
      return;
    }

    if (pathInfo.kind === 'provision') {
      await requireStaffSession(request);
      if (method !== 'POST') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      const body = getRequestBody(request);
      const account = await provisionMetaReportClient(body);
      sendJson(response, 200, {
        clientId: account.clientId,
        accountName: account.accountName,
        metaAdAccountId: account.metaAdAccountId,
        reportUrl: account.metaReportAccessToken
          ? `/report/${account.metaReportAccessToken}`
          : null,
      });
      return;
    }

    if (pathInfo.kind === 'custom-values') {
      await requireStaffSession(request);
      if (method !== 'GET') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      const year = query.year || getCurrentMonthKey().slice(0, 4);
      sendJson(response, 200, await getCustomValuesOverview(year));
      return;
    }

    if (pathInfo.kind === 'public') {
      if (method !== 'GET') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      const account = await getPublicReportPayload(pathInfo.token, query.year);
      sendJson(response, 200, account);
      return;
    }

    if (pathInfo.kind === 'client-settings') {
      await requireStaffSession(request);
      if (method === 'PATCH' || method === 'PUT') {
        const body = getRequestBody(request);
        const account = await updateMetaReportSettings(pathInfo.clientId, {
          metaReportEnabled: body.metaReportEnabled,
          metaReportShowBottomline: body.metaReportShowBottomline,
          metaReportFeeEnabled: body.metaReportFeeEnabled,
          metaReportFeePercent: body.metaReportFeePercent,
          metaReportFeeMode: body.metaReportFeeMode,
          metaReportMarketingFeeAmount: body.metaReportMarketingFeeAmount,
          metaReportTableColumns: body.metaReportTableColumns,
          metaReportSpendChartType: body.metaReportSpendChartType,
          metaReportScenarioMonthWindow: body.metaReportScenarioMonthWindow,
          metaReportScenarioSmoothUneven: body.metaReportScenarioSmoothUneven,
          metaReportScenarioBlendHistory: body.metaReportScenarioBlendHistory,
          metaReportScenarioIncludeTrend: body.metaReportScenarioIncludeTrend,
          metaReportScenarioCautionStrongMonths: body.metaReportScenarioCautionStrongMonths,
          metaReportBudgetMultiplier: body.metaReportBudgetMultiplier,
          metaReportBudgetBaseline: body.metaReportBudgetBaseline,
          metaReportDefaultWonLeads: body.metaReportDefaultWonLeads,
          metaReportDefaultAvgLeadValue: body.metaReportDefaultAvgLeadValue,
          metaReportDefaultAvgProfitPerWon: body.metaReportDefaultAvgProfitPerWon,
          metaReportSlug: body.metaReportSlug,
          rotateAccessToken: Boolean(body.rotateAccessToken),
        });

        let monthPayload = null;
        if (body.monthKey) {
          monthPayload = await buildSingleMonthPayload(pathInfo.clientId, body.monthKey, {
            includeUnpublished: true,
            account,
          });
        }

        sendJson(response, 200, {
          clientId: account.clientId,
          monthPayload,
          settings: {
            metaReportEnabled: account.metaReportEnabled,
            metaReportShowBottomline: account.metaReportShowBottomline,
            metaReportFeeEnabled: account.metaReportFeeEnabled,
            metaReportFeePercent: account.metaReportFeePercent,
            metaReportFeeMode: account.metaReportFeeMode,
            metaReportMarketingFeeAmount: account.metaReportMarketingFeeAmount,
            metaReportTableColumns: Number(account.metaReportTableColumns) === 2 ? 2 : 1,
            metaReportSpendChartType: require('./meta-report-chart-type').normalizeMetaReportSpendChartType(
              account.metaReportSpendChartType,
            ),
            metaReportScenarioMonthWindow: require('./meta-report-scenario-settings').normalizeMetaReportScenarioMonthWindow(
              account.metaReportScenarioMonthWindow,
            ),
            metaReportScenarioSmoothUneven: require('./meta-report-scenario-settings').normalizeScenarioPillValue(
              account.metaReportScenarioSmoothUneven, true,
            ),
            metaReportScenarioBlendHistory: require('./meta-report-scenario-settings').normalizeScenarioPillValue(
              account.metaReportScenarioBlendHistory, false,
            ),
            metaReportScenarioIncludeTrend: require('./meta-report-scenario-settings').normalizeScenarioPillValue(
              account.metaReportScenarioIncludeTrend, false,
            ),
            metaReportScenarioCautionStrongMonths: require('./meta-report-scenario-settings').normalizeScenarioPillValue(
              account.metaReportScenarioCautionStrongMonths, false,
            ),
            metaReportBudgetMultiplier: require('./meta-report-scenario-settings').normalizeMetaReportBudgetMultiplier(
              account.metaReportBudgetMultiplier,
            ),
            metaReportBudgetBaseline: require('./meta-report-scenario-settings').normalizeMetaReportBudgetBaseline(
              account.metaReportBudgetBaseline,
            ),
            metaReportSlug: resolveReportSlug(account),
            metaReportAccessToken: account.metaReportAccessToken,
            metaReportDefaultWonLeads: account.metaReportDefaultWonLeads,
            metaReportDefaultAvgLeadValue: account.metaReportDefaultAvgLeadValue,
            metaReportDefaultAvgProfitPerWon: account.metaReportDefaultAvgProfitPerWon,
            reportUrl: account.metaReportAccessToken
              ? `/report/${account.metaReportAccessToken}`
              : null,
          },
        });
        return;
      }
      sendJson(response, 405, { error: 'Method not allowed' });
      return;
    }

    if (pathInfo.kind === 'client-year') {
      await requireStaffSession(request);
      if (method !== 'GET') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      const account = await getAccount(pathInfo.clientId);
      if (!account) {
        sendJson(response, 404, { error: 'Account not found.' });
        return;
      }
      const year = query.year || getCurrentMonthKey(account.timezone).slice(0, 4);
      const payload = await buildClientYearPayload(pathInfo.clientId, year, {
        includeUnpublished: true,
      });
      sendJson(response, 200, {
        ...payload,
        reportUrl: account.metaReportAccessToken
          ? `/report/${account.metaReportAccessToken}`
          : null,
      });
      return;
    }

    if (pathInfo.kind === 'month-save') {
      await requireStaffSession(request);
      if (method === 'GET') {
        const monthPayload = await buildSingleMonthPayload(pathInfo.clientId, pathInfo.monthKey, {
          includeUnpublished: true,
        });
        sendJson(response, 200, { monthPayload });
        return;
      }
      if (method !== 'PUT' && method !== 'PATCH') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      const body = getRequestBody(request);
      const month = await saveMonthRecord(pathInfo.clientId, pathInfo.monthKey, {
        periodStart: body.periodStart,
        periodEnd: body.periodEnd,
        wonLeads: body.wonLeads,
        avgLeadValue: body.avgLeadValue,
        avgProfitPerWon: body.avgProfitPerWon,
        published: body.published,
      });
      const account = await getAccount(pathInfo.clientId);
      const monthPayload = await buildSingleMonthPayload(pathInfo.clientId, pathInfo.monthKey, {
        includeUnpublished: true,
        account,
      });
      sendJson(response, 200, {
        month,
        monthPayload,
      });
      return;
    }

    if (pathInfo.kind === 'month-refresh') {
      await requireStaffSession(request);
      if (method !== 'POST') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      const month = await refreshMonthMetaData(pathInfo.clientId, pathInfo.monthKey, {
        force: true,
      });
      const account = await getAccount(pathInfo.clientId);
      const monthPayload = await buildSingleMonthPayload(pathInfo.clientId, pathInfo.monthKey, {
        includeUnpublished: true,
        account,
      });
      sendJson(response, 200, {
        month,
        monthPayload,
      });
      return;
    }

    sendJson(response, 404, { error: 'Not found' });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    sendJson(response, statusCode, { error: error.message || 'Request failed.' });
  }
}

module.exports = {
  handleMetaReportsRequest,
  parseMetaReportsPath,
  generateReportAccessToken,
};
