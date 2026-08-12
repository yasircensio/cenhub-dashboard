const { dedupeOpportunities } = require('./opportunity-dedupe');
const { buildPipelineSlots } = require('./pipeline-slots');
const { computeWinMetrics, getWinOpportunities } = require('./metrics-model');
const { buildPeriodKpis } = require('./dashboard-data');
const { monthBoundsIso } = require('./marketing-metrics');
const { getSnapshot, getAccount } = require('./account-store');
const { findBundlinjeField } = require('./bundlinje-field');

const DEFAULT_PROFIT_FIELD_ID = process.env.CENHUB_PROFIT_FIELD_ID || '2YAu8bEKpOUSXwfYljWT';
const DEFAULT_TIMEZONE = process.env.DASHBOARD_TIMEZONE || 'Europe/Copenhagen';

function parseAmount(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const parsed = Number.parseFloat(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getProfit(opportunity, profitFieldId) {
  const field = findBundlinjeField(opportunity.customFields, profitFieldId);
  if (!field) return 0;
  return parseAmount(
    field.fieldValueNumber
    ?? field.fieldValueString
    ?? field.fieldValue
    ?? field.value,
  );
}

function matchesPipelineFilter(opportunity, pipelineIds) {
  if (!pipelineIds.length) return true;
  if (pipelineIds.includes(opportunity.pipelineId)) return true;
  if (
    opportunity._dedupe?.merged
    && opportunity._dedupe.afterSalePipelineId
    && pipelineIds.includes(opportunity._dedupe.afterSalePipelineId)
  ) {
    return true;
  }
  return false;
}

function sumWonBundlinje(rawOpportunities, accountContext, filters, profitFieldId) {
  const wonOpportunities = getWinOpportunities(rawOpportunities, accountContext, filters, {
    applyDateFilter: true,
  });
  let total = 0;
  for (const opportunity of wonOpportunities) {
    total += getProfit(opportunity, profitFieldId);
  }
  return total;
}

function buildAccountContext(account) {
  const slots = buildPipelineSlots(account);
  return {
    ...account,
    slots,
    profitFieldId: account.profitFieldId || DEFAULT_PROFIT_FIELD_ID,
  };
}

function buildMonthFilters(accountContext, monthKey) {
  const bounds = monthBoundsIso(monthKey);
  const pipelineIds = accountContext.slots?.defaultPipelineIds || [];
  return {
    pipelineIds,
    status: 'all',
    source: 'all',
    assignedTo: 'all',
    dateField: 'createdAt',
    dateFrom: bounds.start,
    dateTo: bounds.end,
    timeZone: accountContext.timezone || DEFAULT_TIMEZONE,
  };
}

function filterOpportunities(opportunities, filters, { applyDate = true } = {}) {
  return opportunities.filter((opportunity) => {
    if (!matchesPipelineFilter(opportunity, filters.pipelineIds)) return false;
    if (!applyDate || (!filters.dateFrom && !filters.dateTo)) return true;
    const createdAt = opportunity.createdAt ? new Date(opportunity.createdAt) : null;
    if (!createdAt || Number.isNaN(createdAt.getTime())) return false;
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: filters.timeZone || DEFAULT_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const calendarDate = formatter.format(createdAt);
    if (filters.dateFrom && calendarDate < filters.dateFrom) return false;
    if (filters.dateTo && calendarDate > filters.dateTo) return false;
    return true;
  });
}

function roundMoney(value) {
  return Math.round(parseAmount(value) * 100) / 100;
}

function aggregateFromSnapshot(snapshot, account, monthKey) {
  if (!snapshot?.fetched_at) {
    return {
      leads: 0,
      wonLeads: 0,
      totalRevenue: 0,
      totalProfit: 0,
      avgLeadValue: 0,
      avgProfitPerWon: 0,
      hasData: false,
      snapshotFetchedAt: null,
    };
  }

  const accountContext = buildAccountContext(account);
  const filters = buildMonthFilters(accountContext, monthKey);
  const rawOpportunities = snapshot.opportunities || [];
  const pipelines = snapshot.pipelines || [];
  const { opportunities } = dedupeOpportunities(rawOpportunities, pipelines, {
    afterSalesPipelineId: accountContext.slots.afterSalesPipelineId,
    funnelPipelineIds: accountContext.slots.funnelPipelineIds,
    dedupeEnabled: accountContext.slots.dedupeEnabled,
  });

  const baseOpportunities = filterOpportunities(opportunities, filters, { applyDate: false });
  const { totalLeads } = buildPeriodKpis(baseOpportunities, filters);
  const { clientsWon, wonRevenue } = computeWinMetrics(rawOpportunities, accountContext, filters);
  const totalProfit = sumWonBundlinje(
    rawOpportunities,
    accountContext,
    filters,
    accountContext.profitFieldId,
  );

  const wonLeads = clientsWon;
  const avgLeadValue = wonLeads > 0 ? roundMoney(wonRevenue / wonLeads) : 0;
  const avgProfitPerWon = wonLeads > 0 ? roundMoney(totalProfit / wonLeads) : 0;
  const hasData = totalLeads > 0 || wonLeads > 0 || totalProfit > 0 || wonRevenue > 0;

  return {
    leads: totalLeads,
    wonLeads,
    totalRevenue: roundMoney(wonRevenue),
    totalProfit: roundMoney(totalProfit),
    avgLeadValue,
    avgProfitPerWon,
    hasData,
    snapshotFetchedAt: snapshot.fetched_at || snapshot.fetchedAt || null,
  };
}

async function aggregateGhlMonthForReport(clientId, monthKey) {
  const account = await getAccount(clientId);
  if (!account) {
    const error = new Error('Account not found.');
    error.statusCode = 404;
    throw error;
  }

  const snapshot = await getSnapshot(clientId);
  return aggregateFromSnapshot(snapshot, account, monthKey);
}

function canUseGhlForMonth(result) {
  return Boolean(result?.hasData);
}

module.exports = {
  aggregateFromSnapshot,
  aggregateGhlMonthForReport,
  canUseGhlForMonth,
};
