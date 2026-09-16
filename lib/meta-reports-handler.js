const { requireStaffSession } = require('./admin-auth');
const { getAccount, resolveMetaSystemUserToken } = require('./account-store');
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
const {
  getGhlClientsPageData,
  getGhlSyncPreview,
  refreshSnapshotAndSyncMonth,
  setGhlListMembership,
  setMonthToplineSource,
  switchClientToplineSource,
  switchMonthToMetaSource,
  syncGhlMonthFromSnapshot,
  syncGhlYearFromSnapshot,
} = require('./meta-report-ghl-service');
const { safeRecordMetaReportGhlSyncRun } = require('./meta-report-ghl-sync-history');
const { resolveReportSlug, generateReportAccessToken } = require('./report-access');
const { getCurrentMonthKey } = require('./marketing-metrics');
const { fetchAdAccountCreatives } = require('./meta-ads-creatives');
const { applyStoredVideoUrls, archiveMissingVideos, getStoredVideo, hasBlobStore, listStoredVideos } = require('./meta-ads-blob');
const { getAdsCheckCache, setAdsCheckCache } = require('./meta-ads-check-cache');

function sendBinary(response, {
  statusCode = 200,
  body,
  contentType,
  headers = {},
}) {
  Object.entries(headers).forEach(([key, value]) => {
    response.setHeader(key, value);
  });
  response.setHeader('Content-Type', contentType);
  if (typeof response.status === 'function') {
    response.status(statusCode);
    response.send(body);
    return;
  }
  response.statusCode = statusCode;
  response.end(body);
}

function sendJson(response, statusCode, payload) {
  if (typeof response.status === 'function') {
    response.status(statusCode).json(payload);
    return;
  }
  response.writeHead(statusCode, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(payload));
}

// Only proxy Meta's own CDN hosts through the ads-check download endpoint —
// it is a staff-only download helper, not a general-purpose URL fetcher.
function isAllowedAdsCheckDownloadUrl(rawUrl) {
  let parsedUrl;
  try {
    parsedUrl = new URL(String(rawUrl || ''));
  } catch {
    return false;
  }
  const isMetaCdnHost = /(^|\.)fbcdn\.net$|^graph\.facebook\.com$|(^|\.)cdninstagram\.com$/i.test(parsedUrl.hostname);
  const isCenhubBlobHost = /(^|\.)blob\.vercel-storage\.com$/i.test(parsedUrl.hostname);
  return parsedUrl.protocol === 'https:' && (isMetaCdnHost || isCenhubBlobHost);
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

  if (segments[0] === 'ghl-clients') {
    if (segments[1]) {
      return { kind: 'ghl-client', clientId: segments[1] };
    }
    return { kind: 'ghl-clients' };
  }

  if (segments[0] === 'clients' && segments[1]) {
    const clientId = segments[1];
    if (segments[2] === 'settings') {
      return { kind: 'client-settings', clientId };
    }
    if (segments[2] === 'ads-check') {
      if (segments[3] === 'download') {
        return { kind: 'ads-check-download', clientId };
      }
      if (segments[3] === 'media' && segments[4]) {
        return { kind: 'ads-check-media', clientId, videoId: segments[4] };
      }
      return { kind: 'ads-check', clientId };
    }
    if (segments[2] === 'sync-ghl-preview') {
      return { kind: 'sync-ghl-preview', clientId };
    }
    if (segments[2] === 'sync-ghl-year') {
      return { kind: 'sync-ghl-year', clientId };
    }
    if (segments[2] === 'switch-topline-source') {
      return { kind: 'switch-topline-source', clientId };
    }
    if (segments[2] === 'months' && segments[3]) {
      if (segments[4] === 'refresh') {
        return { kind: 'month-refresh', clientId, monthKey: segments[3] };
      }
      if (segments[4] === 'sync-ghl') {
        return { kind: 'month-sync-ghl', clientId, monthKey: segments[3] };
      }
      if (segments[4] === 'refresh-snapshot') {
        return { kind: 'month-refresh-snapshot', clientId, monthKey: segments[3] };
      }
      if (segments[4] === 'use-manual') {
        return { kind: 'month-use-manual', clientId, monthKey: segments[3] };
      }
      if (segments[4] === 'use-meta') {
        return { kind: 'month-use-meta', clientId, monthKey: segments[3] };
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

    if (pathInfo.kind === 'ghl-clients') {
      await requireStaffSession(request);
      if (method !== 'GET') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      sendJson(response, 200, await getGhlClientsPageData());
      return;
    }

    if (pathInfo.kind === 'ghl-client') {
      await requireStaffSession(request);
      if (method !== 'PATCH' && method !== 'PUT') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      const body = getRequestBody(request);
      const account = await setGhlListMembership(pathInfo.clientId, Boolean(body.enabled));
      sendJson(response, 200, {
        clientId: account.clientId,
        metaReportGhlDataEnabled: Boolean(account.metaReportGhlDataEnabled),
      });
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
          metaReportExcelSheetUrl: body.metaReportExcelSheetUrl,
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
            metaReportGhlDataEnabled: Boolean(account.metaReportGhlDataEnabled),
            metaReportToplineMode: account.metaReportToplineMode === 'cenhub' ? 'cenhub' : 'meta',
            metaReportExcelSheetUrl: require('./meta-report-excel-sheet-url').normalizeMetaReportExcelSheetUrl(
              account.metaReportExcelSheetUrl,
            ),
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

    if (pathInfo.kind === 'ads-check') {
      await requireStaffSession(request);
      if (method !== 'GET') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      const account = await getAccount(pathInfo.clientId, { includeSecrets: true });
      if (!account) {
        sendJson(response, 404, { error: 'Account not found.' });
        return;
      }
      const token = resolveMetaSystemUserToken(account);
      const activeOnly = String(query.scope || 'active') !== 'all';
      const cacheScope = activeOnly ? 'active' : 'all';
      const refresh = String(query.refresh || '') === '1' || Boolean(query.debugVideoLibrary);
      if (!refresh) {
        const cached = await getAdsCheckCache(account.clientId, cacheScope);
        if (cached) {
          sendJson(response, 200, { ...cached, cached: true });
          return;
        }
      }
      const storedPromise = listStoredVideos(account.clientId);
      const result = await fetchAdAccountCreatives(account.metaAdAccountId, token, {
        activeOnly,
        pageAccessToken: account.metaPageAccessToken || null,
        storedVideosPromise: storedPromise,
      });
      let storedByVideoId = await storedPromise;
      let archivedNow = [];
      if (activeOnly) {
        const archived = await archiveMissingVideos(account.clientId, result.creatives, {
          limit: 50,
          existing: storedByVideoId,
        });
        storedByVideoId = archived.existing || storedByVideoId;
        archivedNow = archived.stored || [];
      }
      result.creatives = applyStoredVideoUrls(result.creatives, storedByVideoId, { onlyActive: true });
      result.withDownloadableFile = result.creatives.filter((row) => row.videoUrl || row.imageUrl).length;
      const storedVideoCount = result.creatives.filter((row) => row.stored).length;
      let libraryVideoSample;
      if (query.debugVideoLibrary) {
        const { fetchAccountVideoLibrarySample } = require('./meta-ads-creatives');
        libraryVideoSample = await fetchAccountVideoLibrarySample(account.metaAdAccountId, token);
      }
      const payload = {
        ...result,
        libraryVideoSample,
        ok: true,
        clientId: account.clientId,
        accountName: account.accountName,
        metaAdAccountId: account.metaAdAccountId,
        scope: cacheScope,
        storedVideoCount,
        archivedNow,
        blobConfigured: hasBlobStore(),
        cached: false,
        fetchedAt: new Date().toISOString(),
      };
      if (!query.debugVideoLibrary) {
        await setAdsCheckCache(account.clientId, cacheScope, payload);
      }
      sendJson(response, 200, payload);
      return;
    }

    if (pathInfo.kind === 'ads-check-media') {
      try {
        await requireStaffSession(request);
      } catch (error) {
        sendJson(response, error.statusCode || 401, { error: error.message || 'Unauthorized.' });
        return;
      }
      if (method !== 'GET') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      const videoId = String(pathInfo.videoId || '').replace(/[^0-9]/g, '');
      if (!videoId) {
        sendJson(response, 400, { error: 'Missing video id.' });
        return;
      }
      const blob = await getStoredVideo(pathInfo.clientId, videoId);
      if (!blob?.url) {
        sendJson(response, 404, { error: 'Stored video not found.' });
        return;
      }
      const fileResponse = await fetch(blob.url, { headers: { Accept: 'video/mp4,*/*' } });
      if (!fileResponse.ok) {
        sendJson(response, 502, { error: 'Could not read stored video.' });
        return;
      }
      const body = Buffer.from(await fileResponse.arrayBuffer());
      sendBinary(response, {
        body,
        contentType: fileResponse.headers.get('content-type') || 'video/mp4',
        headers: {
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'private, max-age=86400',
          'Content-Disposition': `inline; filename="${videoId}.mp4"`,
          'Content-Length': String(body.length),
        },
      });
      return;
    }

    if (pathInfo.kind === 'ads-check-download') {
      await requireStaffSession(request);
      if (method !== 'GET') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      const rawUrl = String(query.url || '').trim();
      if (!isAllowedAdsCheckDownloadUrl(rawUrl)) {
        sendJson(response, 400, { error: 'Invalid or unsupported download url.' });
        return;
      }
      // Redirect straight to Meta's CDN instead of buffering the file through
      // this serverless function. Buffering was unreliable for larger files
      // here (responses were cut off with 0 bytes delivered), even though
      // direct requests to the same CDN URL complete instantly. Redirecting
      // lets the browser fetch the bytes directly from Meta.
      if (typeof response.status === 'function') {
        response.status(302);
        response.setHeader('Location', rawUrl);
        response.end();
        return;
      }
      response.writeHead(302, { Location: rawUrl });
      response.end();
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
        manualLeads: body.manualLeads,
        toplineSource: body.toplineSource,
        manualOverride: body.manualOverride,
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

    if (pathInfo.kind === 'sync-ghl-preview') {
      await requireStaffSession(request);
      if (method !== 'GET') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      const year = query.year || getCurrentMonthKey().slice(0, 4);
      sendJson(response, 200, await getGhlSyncPreview(pathInfo.clientId, year));
      return;
    }

    if (pathInfo.kind === 'sync-ghl-year') {
      await requireStaffSession(request);
      if (method !== 'POST') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      const body = getRequestBody(request);
      const year = query.year || body.year || getCurrentMonthKey().slice(0, 4);
      const startedAt = new Date().toISOString();
      try {
        const result = await syncGhlYearFromSnapshot(pathInfo.clientId, year, {
          skipManual: body.skipManual !== false,
          overwriteManual: Boolean(body.overwriteManual),
        });
        await safeRecordMetaReportGhlSyncRun(pathInfo.clientId, {
          trigger: 'manual_year',
          source: 'manual',
          result,
          startedAt,
          finishedAt: new Date().toISOString(),
          context: { year: Number(year) },
        });
        sendJson(response, 200, result);
      } catch (error) {
        await safeRecordMetaReportGhlSyncRun(pathInfo.clientId, {
          trigger: 'manual_year',
          source: 'manual',
          result: null,
          startedAt,
          finishedAt: new Date().toISOString(),
          error,
          context: { year: Number(year) },
        });
        throw error;
      }
      return;
    }

    if (pathInfo.kind === 'switch-topline-source') {
      await requireStaffSession(request);
      if (method !== 'POST') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      const body = getRequestBody(request);
      const account = await getAccount(pathInfo.clientId);
      if (!account) {
        sendJson(response, 404, { error: 'Account not found.' });
        return;
      }
      const year = query.year || body.year || getCurrentMonthKey(account.timezone).slice(0, 4);
      const mode = body.mode === 'cenhub' ? 'cenhub' : 'meta';
      const result = await switchClientToplineSource(pathInfo.clientId, year, mode, {
        skipManual: body.skipManual !== false,
        overwriteManual: Boolean(body.overwriteManual),
      });
      const updatedAccount = await getAccount(pathInfo.clientId);
      sendJson(response, 200, {
        ...result,
        settings: require('./meta-report-store').accountReportFields(updatedAccount),
      });
      return;
    }

    if (pathInfo.kind === 'month-sync-ghl') {
      await requireStaffSession(request);
      if (method !== 'POST') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      const body = getRequestBody(request);
      const startedAt = new Date().toISOString();
      try {
        const month = await syncGhlMonthFromSnapshot(pathInfo.clientId, pathInfo.monthKey, {
          overwriteManual: Boolean(body.overwriteManual),
        });
        await safeRecordMetaReportGhlSyncRun(pathInfo.clientId, {
          trigger: 'manual_month',
          source: 'manual',
          result: {
            monthKeys: [pathInfo.monthKey],
            synced: [pathInfo.monthKey],
            skipped: [],
            errors: [],
          },
          startedAt,
          finishedAt: new Date().toISOString(),
          context: { monthKey: pathInfo.monthKey },
        });
        const account = await getAccount(pathInfo.clientId);
        const monthPayload = await buildSingleMonthPayload(pathInfo.clientId, pathInfo.monthKey, {
          includeUnpublished: true,
          account,
        });
        sendJson(response, 200, { month, monthPayload });
      } catch (error) {
        await safeRecordMetaReportGhlSyncRun(pathInfo.clientId, {
          trigger: 'manual_month',
          source: 'manual',
          result: null,
          startedAt,
          finishedAt: new Date().toISOString(),
          error,
          context: { monthKey: pathInfo.monthKey },
        });
        throw error;
      }
      return;
    }

    if (pathInfo.kind === 'month-refresh-snapshot') {
      await requireStaffSession(request);
      if (method !== 'POST') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      const body = getRequestBody(request);
      const month = await refreshSnapshotAndSyncMonth(pathInfo.clientId, pathInfo.monthKey, {
        overwriteManual: Boolean(body.overwriteManual),
      });
      const account = await getAccount(pathInfo.clientId);
      const monthPayload = await buildSingleMonthPayload(pathInfo.clientId, pathInfo.monthKey, {
        includeUnpublished: true,
        account,
      });
      sendJson(response, 200, { month, monthPayload });
      return;
    }

    if (pathInfo.kind === 'month-use-manual') {
      await requireStaffSession(request);
      if (method !== 'POST') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      const month = await setMonthToplineSource(pathInfo.clientId, pathInfo.monthKey, 'manual');
      const account = await getAccount(pathInfo.clientId);
      const monthPayload = await buildSingleMonthPayload(pathInfo.clientId, pathInfo.monthKey, {
        includeUnpublished: true,
        account,
      });
      sendJson(response, 200, { month, monthPayload });
      return;
    }

    if (pathInfo.kind === 'month-use-meta') {
      await requireStaffSession(request);
      if (method !== 'POST') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      const month = await switchMonthToMetaSource(pathInfo.clientId, pathInfo.monthKey);
      const account = await getAccount(pathInfo.clientId);
      const monthPayload = await buildSingleMonthPayload(pathInfo.clientId, pathInfo.monthKey, {
        includeUnpublished: true,
        account,
      });
      sendJson(response, 200, { month, monthPayload });
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
  isAllowedAdsCheckDownloadUrl,
  parseMetaReportsPath,
  generateReportAccessToken,
};
