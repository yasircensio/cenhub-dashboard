const { computeMetaReportMetrics } = require('./meta-report-calculator');
const { monthBoundsIso } = require('./marketing-metrics');
const { fetchInsightsForTimeRange } = require('./meta-insights');
const { resolveMetaAccessToken, verifyMetaAccessToken } = require('./meta-token');
const { getAccount, resolveMetaSystemUserToken } = require('./account-store');
const {
  accountReportFields,
  clampReportYear,
  classifyCustomInputStatus,
  effectiveFeeEnabledForMonth,
  ensureMetaReportShareLink,
  ensureMonthRecord,
  getAllowedReportYears,
  getYearMonthKeys,
  saveMetaSnapshot,
  saveMonthRecord,
  yearHasReportData,
} = require('./meta-report-store');

const META_STALE_MS = 24 * 60 * 60 * 1000;

function buildMonthPayload(account, monthRecord, { includeUnpublished = false } = {}) {
  if (!monthRecord) return null;
  if (!includeUnpublished && monthRecord.published === false) return null;

  const bounds = monthBoundsIso(monthRecord.monthKey);
  const periodAligned = monthRecord.periodStart === bounds.start
    && monthRecord.periodEnd === bounds.end;

  const settings = accountReportFields(account);
  const feeMode = settings.metaReportFeeMode;
  const metrics = computeMetaReportMetrics({
    spend: periodAligned ? monthRecord.metaSpend : null,
    cpm: periodAligned ? monthRecord.metaCpm : null,
    impressions: periodAligned ? monthRecord.metaImpressions : null,
    reach: periodAligned ? monthRecord.metaReach : null,
    clicks: periodAligned ? monthRecord.metaClicks : null,
    leads: periodAligned ? monthRecord.metaLeads : null,
    wonLeads: monthRecord.wonLeads,
    avgLeadValue: monthRecord.avgLeadValue,
    avgProfitPerWon: monthRecord.avgProfitPerWon,
    showBottomline: settings.metaReportShowBottomline,
    feeEnabled: effectiveFeeEnabledForMonth(settings, monthRecord),
    feeMode: effectiveFeeEnabledForMonth(settings, monthRecord) ? feeMode : null,
    feePercent: settings.metaReportFeePercent,
    marketingFeeAmount: settings.metaReportMarketingFeeAmount,
  });

  return {
    monthKey: monthRecord.monthKey,
    periodStart: periodAligned ? monthRecord.periodStart : bounds.start,
    periodEnd: periodAligned ? monthRecord.periodEnd : bounds.end,
    metaFetchedAt: periodAligned ? monthRecord.metaFetchedAt : null,
    published: monthRecord.published !== false,
    ...metrics,
  };
}

async function buildSingleMonthPayload(clientId, monthKey, options = {}) {
  const account = options.account || await getAccount(clientId);
  if (!account) {
    const error = new Error('Account not found.');
    error.statusCode = 404;
    throw error;
  }

  const record = await ensureMonthRecord(clientId, monthKey, account, account.timezone);
  const payload = record ? buildMonthPayload(account, record, options) : null;
  return payload;
}

async function buildClientYearPayload(clientId, year, options = {}) {
  let account = await getAccount(clientId);
  if (!account) {
    const error = new Error('Account not found.');
    error.statusCode = 404;
    throw error;
  }

  if (options.includeUnpublished && account.metaAdAccountId) {
    account = await ensureMetaReportShareLink(clientId);
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
  const records = await Promise.all(
    monthKeys.map((monthKey) => ensureMonthRecord(clientId, monthKey, account, account.timezone)),
  );
  const months = {};
  monthKeys.forEach((monthKey, index) => {
    const payload = buildMonthPayload(account, records[index], options);
    if (payload) months[monthKey] = payload;
  });

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
    accountName: account.accountName || account.clientId,
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

  const existing = await ensureMonthRecord(clientId, monthKey, account, account.timezone);
  if (!force && existing && !isMetaSnapshotStale(existing)) {
    return existing;
  }

  const bounds = monthBoundsIso(monthKey);
  if (existing.periodStart !== bounds.start || existing.periodEnd !== bounds.end) {
    await saveMonthRecord(clientId, monthKey, {
      periodStart: bounds.start,
      periodEnd: bounds.end,
    });
  }

  const since = bounds.start;
  const until = bounds.end;
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

async function refreshYearToDateForClient(clientId) {
  const account = await getAccount(clientId);
  if (!account?.metaReportEnabled) return { skipped: true, reason: 'report_disabled' };
  const year = clampReportYear(undefined, account.timezone);
  const monthKeys = getYearMonthKeys(year, account.timezone);
  const months = [];
  for (const monthKey of monthKeys) {
    try {
      const record = await refreshMonthMetaData(clientId, monthKey, { force: true });
      months.push({ success: true, monthKey, leads: record?.metaLeads, spend: record?.metaSpend });
    } catch (error) {
      months.push({ success: false, monthKey, error: error.message || String(error) });
    }
  }
  return { success: months.every((row) => row.success), clientId, year, months };
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

async function refreshAllEnabledYearToDate() {
  const { listMetaReportEnabledClientIds } = require('./meta-report-store');
  const clientIds = await listMetaReportEnabledClientIds();
  const results = [];
  for (const clientId of clientIds) {
    results.push(await refreshYearToDateForClient(clientId));
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
  refreshAllEnabledYearToDate,
  refreshCurrentMonthForClient,
  refreshMonthMetaData,
  refreshYearToDateForClient,
  saveMonthRecord,
};
