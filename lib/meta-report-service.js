const { computeMetaReportMetrics } = require('./meta-report-calculator');
const { fetchInsightsForTimeRange } = require('./meta-insights');
const { resolveMetaAccessToken, verifyMetaAccessToken } = require('./meta-token');
const { getAccount, resolveMetaSystemUserToken } = require('./account-store');
const {
  accountReportFields,
  clampReportYear,
  classifyCustomInputStatus,
  effectiveFeeEnabledForMonth,
  ensureMonthRecord,
  getAllowedReportYears,
  getMonthRecord,
  getYearMonthKeys,
  saveMetaSnapshot,
  saveMonthRecord,
  yearHasReportData,
} = require('./meta-report-store');

const META_STALE_MS = 24 * 60 * 60 * 1000;

function buildMonthPayload(account, monthRecord, { includeUnpublished = false } = {}) {
  if (!monthRecord) return null;
  if (!includeUnpublished && monthRecord.published === false) return null;

  const settings = accountReportFields(account);
  const feeMode = settings.metaReportFeeMode;
  const metrics = computeMetaReportMetrics({
    spend: monthRecord.metaSpend,
    cpm: monthRecord.metaCpm,
    impressions: monthRecord.metaImpressions,
    reach: monthRecord.metaReach,
    clicks: monthRecord.metaClicks,
    leads: monthRecord.metaLeads,
    wonLeads: monthRecord.wonLeads,
    avgLeadValue: monthRecord.avgLeadValue,
    avgProfitPerWon: monthRecord.avgProfitPerWon,
    showBottomline: settings.metaReportShowBottomline,
    feeEnabled: effectiveFeeEnabledForMonth(settings, monthRecord),
    feeMode: effectiveFeeEnabledForMonth(settings, monthRecord) ? feeMode : null,
    feePercent: settings.metaReportFeePercent,
    marketingFeeAmount: settings.metaReportMarketingFeeAmount,
    lineItems: monthRecord.lineItems,
  });

  return {
    monthKey: monthRecord.monthKey,
    periodStart: monthRecord.periodStart,
    periodEnd: monthRecord.periodEnd,
    metaFetchedAt: monthRecord.metaFetchedAt,
    published: monthRecord.published !== false,
    ...metrics,
  };
}

async function buildSingleMonthPayload(clientId, monthKey, options = {}) {
  const buildStart = Date.now();
  const account = options.account || await getAccount(clientId);
  if (!account) {
    const error = new Error('Account not found.');
    error.statusCode = 404;
    throw error;
  }

  await ensureMonthRecord(clientId, monthKey, account, account.timezone);
  const record = await getMonthRecord(clientId, monthKey);
  const payload = record ? buildMonthPayload(account, record, options) : null;
  const buildMs = Date.now() - buildStart;
  // #region agent log
  try {
    const fs = require('fs');
    const path = require('path');
    fs.appendFileSync(path.join(__dirname, '..', '.cursor', 'debug-b952dc.log'), `${JSON.stringify({
      sessionId: 'b952dc',
      hypothesisId: 'A',
      location: 'meta-report-service.js:buildSingleMonthPayload',
      message: 'buildSingleMonthPayload done',
      data: { clientId, monthKey, buildMs, hasPayload: Boolean(payload) },
      timestamp: Date.now(),
    })}\n`);
  } catch {
    // ignore
  }
  // #endregion
  return payload;
}

async function buildClientYearPayload(clientId, year, options = {}) {
  const buildStart = Date.now();
  let monthQueryCount = 0;
  const account = await getAccount(clientId);
  if (!account) {
    const error = new Error('Account not found.');
    error.statusCode = 404;
    throw error;
  }

  const allowedYears = getAllowedReportYears(account.timezone);
  let resolvedYear = clampReportYear(year, account.timezone);
  const previousYear = allowedYears[1];
  const previousYearHasData = await yearHasReportData(clientId, previousYear, {
    requirePublished: !options.includeUnpublished,
  });

  // Public/client reports: never land on an empty previous year.
  if (!options.includeUnpublished && resolvedYear === previousYear && !previousYearHasData) {
    resolvedYear = allowedYears[0];
  }

  const monthKeys = getYearMonthKeys(resolvedYear, account.timezone);
  const months = {};
  for (const monthKey of monthKeys) {
    monthQueryCount += 1;
    await ensureMonthRecord(clientId, monthKey, account, account.timezone);
    const record = await getMonthRecord(clientId, monthKey);
    const payload = buildMonthPayload(account, record, options);
    if (payload) months[monthKey] = payload;
  }

  const buildMs = Date.now() - buildStart;
  // #region agent log
  try {
    const fs = require('fs');
    const path = require('path');
    fs.appendFileSync(path.join(__dirname, '..', '.cursor', 'debug-b952dc.log'), `${JSON.stringify({
      sessionId: 'b952dc',
      hypothesisId: 'A',
      location: 'meta-report-service.js:buildClientYearPayload',
      message: 'buildClientYearPayload done',
      data: { clientId, year: resolvedYear, monthKeys: monthKeys.length, monthQueryCount, buildMs },
      timestamp: Date.now(),
    })}\n`);
  } catch {
    // ignore
  }
  // #endregion

  const currentYear = allowedYears[0];
  // Admin (includeUnpublished) can always open previous year for backfill.
  // Public/client reports disable previous year when it has no published Meta data.
  const years = allowedYears.map((entryYear) => ({
    year: entryYear,
    available: entryYear === currentYear
      ? true
      : (options.includeUnpublished ? true : previousYearHasData),
  }));

  return {
    clientId: account.clientId,
    accountName: account.accountName,
    year: resolvedYear,
    currentYear,
    settings: accountReportFields(account),
    months,
    monthKeys,
    years,
    previousYearHasData,
  };
}

function isMetaSnapshotStale(record) {
  if (!record?.metaFetchedAt) return true;
  const fetchedAt = new Date(record.metaFetchedAt).getTime();
  if (Number.isNaN(fetchedAt)) return true;
  return Date.now() - fetchedAt > META_STALE_MS;
}

async function resolveMetaTokenForAccount(account) {
  const token = resolveMetaSystemUserToken(account);
  if (!token) {
    throw new Error('Meta system user token is not configured for this client.');
  }
  const verified = await verifyMetaAccessToken(token, { adAccountId: account.metaAdAccountId });
  if (!verified.ok) {
    throw new Error(verified.reason || 'Meta token verification failed.');
  }
  return verified.token;
}

async function refreshMonthMetaData(clientId, monthKey, { force = false } = {}) {
  const account = await getAccount(clientId, { includeSecrets: true });
  if (!account?.metaAdAccountId) {
    throw new Error('Meta ad account ID is not configured.');
  }

  await ensureMonthRecord(clientId, monthKey, account, account.timezone);
  const existing = await getMonthRecord(clientId, monthKey);
  if (!force && existing && !isMetaSnapshotStale(existing)) {
    return existing;
  }

  const since = existing.periodStart;
  const until = existing.periodEnd;
  const token = await resolveMetaTokenForAccount(account);
  const insights = await fetchInsightsForTimeRange(account.metaAdAccountId, token, {
    since,
    until,
  });

  return saveMetaSnapshot(clientId, monthKey, {
    spend: insights.spend,
    cpm: insights.cpm,
    impressions: insights.impressions,
    reach: insights.reach,
    clicks: insights.clicks,
    leads: insights.leads,
  });
}

async function refreshCurrentMonthForClient(clientId) {
  const account = await getAccount(clientId);
  if (!account?.metaReportEnabled) return { skipped: true, reason: 'report_disabled' };
  const { getCurrentMonthKey } = require('./marketing-metrics');
  const monthKey = getCurrentMonthKey(account.timezone);
  try {
    const record = await refreshMonthMetaData(clientId, monthKey, { force: true });
    return { success: true, clientId, monthKey, record };
  } catch (error) {
    return { success: false, clientId, monthKey, error: error.message || String(error) };
  }
}

async function refreshAllEnabledCurrentMonths() {
  const { listMetaReportEnabledClientIds } = require('./meta-report-store');
  const clientIds = await listMetaReportEnabledClientIds();
  const results = [];
  for (const clientId of clientIds) {
    results.push(await refreshCurrentMonthForClient(clientId));
  }
  return results;
}

async function getPublicReportPayload(token, year) {
  const { requireReportAccess } = require('./report-access');
  const account = await requireReportAccess(token);
  return buildClientYearPayload(account.clientId, year, { includeUnpublished: false });
}

module.exports = {
  META_STALE_MS,
  buildClientYearPayload,
  buildMonthPayload,
  buildSingleMonthPayload,
  getPublicReportPayload,
  isMetaSnapshotStale,
  refreshAllEnabledCurrentMonths,
  refreshCurrentMonthForClient,
  refreshMonthMetaData,
  saveMonthRecord,
};
