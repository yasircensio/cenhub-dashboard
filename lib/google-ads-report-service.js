const { computeMetaReportMetrics } = require('./meta-report-calculator');
const { monthBoundsIso } = require('./marketing-metrics');
const { fetchGoogleAdsMonthMetrics } = require('./google-ads-query');
const {
  clampReportYear,
  clientPublicFields,
  ensureGoogleAdsReportShareLink,
  ensureMonthRecord,
  getAllowedReportYears,
  getGoogleAdsReportClient,
  getYearMonthKeys,
  monthPeriodMatchesKey,
  saveGoogleAdsMonthRecord,
  saveGoogleAdsSnapshot,
  yearHasReportData,
  googleAdsReportUrl,
} = require('./google-ads-report-store');

const GOOGLE_STALE_MS = 24 * 60 * 60 * 1000;

function roundMoney(value) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed * 100) / 100;
}

function isGoogleSnapshotStale(record) {
  if (!record?.googleFetchedAt) return true;
  const fetchedAt = new Date(record.googleFetchedAt).getTime();
  if (Number.isNaN(fetchedAt)) return true;
  return Date.now() - fetchedAt > GOOGLE_STALE_MS;
}

function clientSettings(client) {
  const fields = clientPublicFields(client);
  return {
    googleAdsReportEnabled: fields.googleAdsReportEnabled,
    googleAdsReportShowBottomline: fields.googleAdsReportShowBottomline,
    googleAdsReportFeeEnabled: fields.googleAdsReportFeeEnabled,
    googleAdsReportFeePercent: fields.googleAdsReportFeePercent,
    googleAdsReportFeeMode: fields.googleAdsReportFeeMode,
    googleAdsReportMarketingFeeAmount: fields.googleAdsReportMarketingFeeAmount,
    googleAdsReportDefaultWonLeads: fields.googleAdsReportDefaultWonLeads,
    googleAdsReportDefaultAvgLeadValue: fields.googleAdsReportDefaultAvgLeadValue,
    googleAdsReportDefaultAvgProfitPerWon: fields.googleAdsReportDefaultAvgProfitPerWon,
    googleAdsReportSlug: fields.googleAdsReportSlug,
    googleAdsReportAccessToken: fields.googleAdsReportAccessToken,
    googleAdsReportExcelSheetUrl: fields.googleAdsReportExcelSheetUrl,
    googleAdsReportSpendChartType: fields.googleAdsReportSpendChartType,
    googleAdsReportScenarioMonthWindow: fields.googleAdsReportScenarioMonthWindow,
    googleAdsReportScenarioSmoothUneven: fields.googleAdsReportScenarioSmoothUneven,
    googleAdsReportScenarioBlendHistory: fields.googleAdsReportScenarioBlendHistory,
    googleAdsReportScenarioIncludeTrend: fields.googleAdsReportScenarioIncludeTrend,
    googleAdsReportBudgetMultiplier: fields.googleAdsReportBudgetMultiplier,
    googleAdsReportBudgetBaseline: fields.googleAdsReportBudgetBaseline,
    googleCustomerId: fields.googleCustomerId,
    googleCustomerLabel: fields.googleCustomerLabel,
  };
}

function deriveGoogleRates({ spend, clicks, impressions, conversions }) {
  const cpc = clicks > 0 ? roundMoney(spend / clicks) : 0;
  const ctr = impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0;
  const costPerLead = conversions > 0 ? roundMoney(spend / conversions) : 0;
  return { cpc, ctr, costPerLead };
}

function buildMonthPayload(client, monthRecord) {
  if (!monthRecord) return null;
  const bounds = monthBoundsIso(monthRecord.monthKey);
  const periodAligned = monthPeriodMatchesKey(
    monthRecord.monthKey,
    monthRecord.periodStart,
    monthRecord.periodEnd,
  );
  const settings = clientSettings(client);
  const spend = periodAligned ? Number(monthRecord.googleSpend) || 0 : 0;
  const impressions = periodAligned ? Number(monthRecord.googleImpressions) || 0 : 0;
  const clicks = periodAligned ? Number(monthRecord.googleClicks) || 0 : 0;
  const conversions = periodAligned ? Number(monthRecord.googleConversions) || 0 : 0;
  const budget = periodAligned ? Number(monthRecord.googleBudget) || 0 : 0;
  const sales = periodAligned ? Number(monthRecord.googleSales) || 0 : 0;
  const conversionsValue = periodAligned ? Number(monthRecord.googleConversionsValue) || 0 : 0;
  const rates = deriveGoogleRates({ spend, clicks, impressions, conversions });

  const feeMode = settings.googleAdsReportFeeMode
    || (settings.googleAdsReportFeeEnabled ? 'performance' : null);
  const metrics = computeMetaReportMetrics({
    spend,
    impressions,
    clicks,
    leads: conversions,
    wonLeads: monthRecord.wonLeads,
    avgLeadValue: monthRecord.avgLeadValue,
    avgProfitPerWon: monthRecord.avgProfitPerWon,
    showBottomline: settings.googleAdsReportShowBottomline,
    feeEnabled: Boolean(settings.googleAdsReportShowBottomline && feeMode),
    feeMode,
    feePercent: settings.googleAdsReportFeePercent,
    marketingFeeAmount: settings.googleAdsReportMarketingFeeAmount,
  });

  return {
    monthKey: monthRecord.monthKey,
    periodStart: periodAligned ? monthRecord.periodStart : bounds.start,
    periodEnd: periodAligned ? monthRecord.periodEnd : bounds.end,
    googleFetchedAt: periodAligned ? monthRecord.googleFetchedAt : null,
    published: monthRecord.published !== false,
    google: {
      spend,
      budget,
      impressions,
      clicks,
      conversions,
      sales,
      conversionsValue,
      ...rates,
    },
    ...metrics,
  };
}

async function refreshMonthGoogleData(clientId, monthKey, { force = false } = {}) {
  const client = await getGoogleAdsReportClient(clientId);
  if (!client?.googleCustomerId) {
    const error = new Error('Google Ads customer ID is not configured.');
    error.statusCode = 404;
    throw error;
  }
  const existing = await ensureMonthRecord(client.clientId, monthKey, client);
  if (!force && existing && !isGoogleSnapshotStale(existing)) {
    return existing;
  }
  const bounds = monthBoundsIso(monthKey);
  const metrics = await fetchGoogleAdsMonthMetrics(
    client.googleCustomerId,
    bounds.start,
    bounds.end,
  );
  const totals = metrics.totals || {};
  return saveGoogleAdsSnapshot(client.clientId, monthKey, {
    spend: totals.spend,
    budget: totals.budget,
    impressions: totals.impressions,
    clicks: totals.clicks,
    conversions: totals.conversions,
    sales: totals.sales || 0,
    conversionsValue: totals.conversionsValue,
  });
}

async function buildClientYearPayload(clientId, year, { includeUnpublished = true } = {}) {
  let client = await getGoogleAdsReportClient(clientId);
  if (!client) {
    const error = new Error('Google Ads client not found.');
    error.statusCode = 404;
    throw error;
  }
  client = await ensureGoogleAdsReportShareLink(client.clientId);

  const allowedYears = getAllowedReportYears(client.timezone);
  const resolvedYear = clampReportYear(year, client.timezone);
  const previousYear = allowedYears[1];
  const previousYearHasData = await yearHasReportData(client.clientId, previousYear);
  const monthKeys = getYearMonthKeys(resolvedYear, client.timezone);
  const records = await Promise.all(
    monthKeys.map((monthKey) => ensureMonthRecord(client.clientId, monthKey, client)),
  );
  const months = {};
  monthKeys.forEach((monthKey, index) => {
    const record = records[index];
    if (!includeUnpublished && record?.published === false) return;
    const payload = buildMonthPayload(client, record);
    if (payload) months[monthKey] = payload;
  });

  return {
    clientId: client.clientId,
    accountName: client.accountName,
    reportKind: 'google-ads',
    year: resolvedYear,
    currentYear: allowedYears[0],
    reportUrl: googleAdsReportUrl(client),
    settings: clientSettings(client),
    months,
    monthKeys,
    years: allowedYears.map((entryYear) => ({
      year: entryYear,
      available: entryYear === allowedYears[0] ? true : previousYearHasData || true,
    })),
    previousYearHasData,
  };
}

async function getPublicGoogleAdsReportPayload(token, year) {
  const { getGoogleAdsClientByReportToken } = require('./report-access');
  const client = await getGoogleAdsClientByReportToken(token);
  if (!client?.enabled) {
    const error = new Error('Report not found.');
    error.statusCode = 404;
    throw error;
  }
  return buildClientYearPayload(client.clientId, year, { includeUnpublished: false });
}

async function buildSingleMonthPayload(clientId, monthKey) {
  const client = await getGoogleAdsReportClient(clientId);
  if (!client) {
    const error = new Error('Google Ads client not found.');
    error.statusCode = 404;
    throw error;
  }
  const record = await ensureMonthRecord(client.clientId, monthKey, client);
  return buildMonthPayload(client, record);
}

async function saveMonthRecord(clientId, monthKey, input = {}) {
  const record = await saveGoogleAdsMonthRecord(clientId, monthKey, input);
  const client = await getGoogleAdsReportClient(clientId);
  return buildMonthPayload(client, record);
}

async function refreshYearToDateForClient(clientId) {
  const client = await getGoogleAdsReportClient(clientId);
  if (!client?.enabled) return { skipped: true, reason: 'report_disabled' };
  const year = clampReportYear(undefined, client.timezone);
  const monthKeys = getYearMonthKeys(year, client.timezone);
  const months = [];
  for (const monthKey of monthKeys) {
    try {
      const record = await refreshMonthGoogleData(client.clientId, monthKey, { force: true });
      months.push({
        success: true,
        monthKey,
        conversions: record?.googleConversions,
        spend: record?.googleSpend,
      });
    } catch (error) {
      months.push({ success: false, monthKey, error: error.message || String(error) });
    }
  }
  return { success: months.every((row) => row.success), clientId, year, months };
}

async function refreshAllEnabledYearToDate() {
  const { listGoogleAdsReportEnabledClientIds } = require('./google-ads-report-store');
  const clientIds = await listGoogleAdsReportEnabledClientIds();
  const results = [];
  for (const clientId of clientIds) {
    results.push(await refreshYearToDateForClient(clientId));
  }
  return results;
}

module.exports = {
  GOOGLE_STALE_MS,
  buildClientYearPayload,
  buildMonthPayload,
  buildSingleMonthPayload,
  getPublicGoogleAdsReportPayload,
  refreshAllEnabledYearToDate,
  refreshMonthGoogleData,
  refreshYearToDateForClient,
  saveMonthRecord,
};
