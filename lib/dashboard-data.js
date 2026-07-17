const { dedupeOpportunities } = require('./opportunity-dedupe');
const { buildPipelineSlots } = require('./pipeline-slots');
const {
  computeWinMetrics,
  describeMetricsModel,
  getWinOpportunities,
  getWonDate,
} = require('./metrics-model');
const {
  DEFAULT_ACCOUNT_ID,
  getAccount,
  getEnvBackedDefaults,
  getSnapshot,
  normalizeClientId,
} = require('./account-store');
const {
  getDashboardCache,
  isCacheFresh,
  setDashboardCache,
} = require('./dashboard-cache');
const { fetchGhlData } = require('./ghl-sync');

const { findBundlinjeField } = require('./bundlinje-field');
const DEFAULT_PROFIT_FIELD_ID = process.env.CENHUB_PROFIT_FIELD_ID || '2YAu8bEKpOUSXwfYljWT';
const DEFAULT_TIMEZONE = process.env.DASHBOARD_TIMEZONE || 'Europe/Copenhagen';

const calendarDateFormatterCache = new Map();

function getCalendarDateFormatter(timeZone = DEFAULT_TIMEZONE) {
  if (!calendarDateFormatterCache.has(timeZone)) {
    calendarDateFormatterCache.set(timeZone, new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }));
  }
  return calendarDateFormatterCache.get(timeZone);
}

function parseAmount(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  const raw = String(value).trim();
  if (!raw) return 0;

  const cleaned = raw.replace(/[^\d,.-]/g, '');
  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');

  let normalized = cleaned;
  if (hasComma && hasDot) {
    normalized = cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')
      ? cleaned.replace(/\./g, '').replace(',', '.')
      : cleaned.replace(/,/g, '');
  } else if (hasDot && /^-?\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    normalized = cleaned.replace(/\./g, '');
  } else if (hasComma) {
    normalized = cleaned.replace(',', '.');
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getProfit(opportunity, profitFieldId = DEFAULT_PROFIT_FIELD_ID) {
  const field = findBundlinjeField(opportunity.customFields, profitFieldId);
  if (!field) return 0;

  return parseAmount(
    field.fieldValueNumber ??
    field.fieldValueString ??
    field.fieldValue ??
    field.value
  );
}

function getMonetary(opportunity) {
  return parseAmount(opportunity.monetaryValue);
}

function getSource(opportunity) {
  const raw = opportunity.source
    || opportunity.attributions?.[0]?.adSource
    || opportunity.attributions?.[0]?.utmSource
    || opportunity.attributions?.[0]?.medium
    || 'Unknown';

  return String(raw).trim().toLowerCase() || 'unknown';
}

function getDateValue(opportunity, field) {
  const value = opportunity[field];
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getCalendarDateString(date, timeZone = DEFAULT_TIMEZONE) {
  if (!date) return null;
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return null;
  return getCalendarDateFormatter(timeZone).format(value);
}

function isCalendarDateInRange(date, dateFrom, dateTo, timeZone = DEFAULT_TIMEZONE) {
  const calendarDate = getCalendarDateString(date, timeZone);
  if (!calendarDate) return false;
  if (dateFrom && calendarDate < dateFrom) return false;
  if (dateTo && calendarDate > dateTo) return false;
  return true;
}

function getWeekKey(date) {
  const copy = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(copy.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((copy - yearStart) / 86400000) + 1) / 7);
  return `${copy.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

const STALE_SNAPSHOT_MS = 24 * 60 * 60 * 1000;

function isSnapshotStale(fetchedAt) {
  if (!fetchedAt) return true;
  return Date.now() - new Date(fetchedAt).getTime() > STALE_SNAPSHOT_MS;
}

async function resolveAccountContext(query) {
  let account = null;
  const locationId = query.location_id || query.locationId || null;

  if (locationId) {
    account = await getAccount(locationId, {
      byLocationId: true,
      includeSecrets: true,
    });
    if (!account) {
      const error = new Error(`No dashboard account configured for GHL location "${locationId}".`);
      error.statusCode = 404;
      throw error;
    }
  } else if (query.client) {
    const clientId = normalizeClientId(query.client);
    account = await getAccount(clientId, { includeSecrets: true });
    if (!account) {
      // Only the default account may fall back to env-backed config;
      // unknown slugs must not leak the default tenant's data.
      if (clientId === DEFAULT_ACCOUNT_ID) {
        account = getEnvBackedDefaults(clientId);
      } else {
        const error = new Error(`No dashboard account found for "${clientId}".`);
        error.statusCode = 404;
        throw error;
      }
    }
  } else {
    account = await getAccount(DEFAULT_ACCOUNT_ID, { includeSecrets: true });
    if (!account) {
      account = getEnvBackedDefaults(DEFAULT_ACCOUNT_ID);
    }
  }

  const slots = buildPipelineSlots(account);
  return {
    ...account,
    slots,
    profitFieldId: account.profitFieldId || DEFAULT_PROFIT_FIELD_ID,
  };
}

function snapshotToDataSource(snapshot, source) {
  return {
    source,
    fetchedAt: snapshot.fetched_at,
    opportunities: snapshot.opportunities || [],
    pipelines: snapshot.pipelines || [],
    users: snapshot.users || [],
    contactCount: snapshot.contact_count || 0,
    syncStatus: snapshot.sync_status || null,
    syncError: snapshot.sync_error || null,
  };
}

function payloadToDataSource(payload, source, syncStatus = null, syncError = null) {
  return {
    source,
    fetchedAt: payload.fetchedAt,
    opportunities: payload.opportunities || [],
    pipelines: payload.pipelines || [],
    users: payload.users || [],
    contactCount: payload.contactCount || 0,
    syncStatus,
    syncError,
  };
}

function hasUsableSnapshot(snapshot) {
  return Boolean(
    snapshot?.fetched_at
    && (snapshot.opportunities?.length || snapshot.pipelines?.length),
  );
}

async function fetchLiveDataSource(accountContext, sourceLabel) {
  const token = accountContext.ghlToken;
  if (!token) {
    throw new Error('Missing GHL token for this account.');
  }
  if (!accountContext.locationId) {
    throw new Error('Missing GHL location ID for this account.');
  }

  const data = await fetchGhlData(token, accountContext.locationId);
  await setDashboardCache(accountContext.clientId, data).catch(() => {});
  return payloadToDataSource(data, sourceLabel);
}

async function loadDataSource(accountContext, query = {}) {
  const clientId = accountContext.clientId;
  const readSource = process.env.DASHBOARD_READ_SOURCE || 'live';
  const forceFresh = query.fresh === '1' || query.fresh === 'true' || query.forceFresh === '1';

  if (readSource === 'snapshot' && !forceFresh) {
    const snapshot = await getSnapshot(clientId);
    if (hasUsableSnapshot(snapshot)) {
      return snapshotToDataSource(snapshot, 'snapshot');
    }
  }

  if (!forceFresh) {
    const cached = await getDashboardCache(clientId);
    if (cached && isCacheFresh(cached.fetchedAt)) {
      return payloadToDataSource(cached, 'cache');
    }
  }

  try {
    return await fetchLiveDataSource(accountContext, 'live');
  } catch (error) {
    const snapshot = await getSnapshot(clientId);
    if (hasUsableSnapshot(snapshot)) {
      return snapshotToDataSource(snapshot, 'snapshot-fallback');
    }
    if (!accountContext.ghlToken) {
      throw new Error('Missing GHL token for this account.');
    }
    throw error;
  }
}

function parsePipelineIds(query = {}) {
  const raw = query.pipelineIds ?? query.pipelineId;
  if (!raw || raw === 'all') return [];

  const values = Array.isArray(raw) ? raw : String(raw).split(',');
  return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))];
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DATE_RANGE_MONTHS = 24;

function normalizeIsoDate(value) {
  if (!value) return null;
  const normalized = String(value).trim();
  if (!ISO_DATE_PATTERN.test(normalized)) return null;
  const date = new Date(`${normalized}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return normalized;
}

function countMonthsBetween(startStr, endStr, timeZone = DEFAULT_TIMEZONE) {
  const startKey = getCalendarDateString(new Date(`${startStr}T12:00:00`), timeZone)?.slice(0, 7);
  const endKey = getCalendarDateString(new Date(`${endStr}T12:00:00`), timeZone)?.slice(0, 7);
  if (!startKey || !endKey) return 0;

  let [year, month] = startKey.split('-').map(Number);
  const [endYear, endMonth] = endKey.split('-').map(Number);
  let count = 0;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    count += 1;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return count;
}

function normalizeDateFilters(dateFrom, dateTo, timeZone = DEFAULT_TIMEZONE) {
  const from = normalizeIsoDate(dateFrom);
  const to = normalizeIsoDate(dateTo);

  if (!from && !to) {
    return { dateFrom: null, dateTo: null };
  }

  if ((from && !to) || (!from && to)) {
    const error = new Error('Both dateFrom and dateTo are required for a custom date range.');
    error.statusCode = 400;
    throw error;
  }

  if (from > to) {
    const error = new Error('dateFrom must be on or before dateTo.');
    error.statusCode = 400;
    throw error;
  }

  if (countMonthsBetween(from, to, timeZone) > MAX_DATE_RANGE_MONTHS) {
    const error = new Error(`Date range cannot exceed ${MAX_DATE_RANGE_MONTHS} months.`);
    error.statusCode = 400;
    throw error;
  }

  return { dateFrom: from, dateTo: to };
}

function parseFilters(query = {}, accountContext = {}) {
  const dateField = ['createdAt', 'updatedAt', 'lastStatusChangeAt', 'lastStageChangeAt'].includes(query.dateField)
    ? query.dateField
    : 'createdAt';

  const pipelineIds = parsePipelineIds(query);
  const timeZone = accountContext.timezone || DEFAULT_TIMEZONE;
  const { dateFrom, dateTo } = normalizeDateFilters(query.dateFrom, query.dateTo, timeZone);

  return {
    pipelineIds,
    status: query.status || 'all',
    source: query.source || 'all',
    assignedTo: query.assignedTo || 'all',
    dateField,
    dateFrom,
    dateTo,
    adSpend: parseAmount(query.adSpend ?? accountContext.defaultAdSpend ?? process.env.CENHUB_AD_SPEND ?? 0),
    timeZone,
  };
}

function formatPipelineFilter(filters, pipelineMap) {
  if (!filters.pipelineIds.length) return 'all pipelines';
  return filters.pipelineIds
    .map((pipelineId) => pipelineMap.get(pipelineId) || pipelineId)
    .join(', ');
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

function matchesFilters(opportunity, filters) {
  if (!matchesPipelineFilter(opportunity, filters.pipelineIds)) {
    return false;
  }

  if (filters.status !== 'all' && opportunity.status !== filters.status) {
    return false;
  }

  if (filters.source !== 'all' && getSource(opportunity) !== filters.source) {
    return false;
  }

  if (filters.assignedTo !== 'all' && opportunity.assignedTo !== filters.assignedTo) {
    return false;
  }

  if (filters.dateFrom || filters.dateTo) {
    const dateValue = getDateValue(opportunity, filters.dateField);
    if (!dateValue) return false;
    if (!isCalendarDateInRange(dateValue, filters.dateFrom, filters.dateTo, filters.timeZone)) return false;
  }

  return true;
}

function emptyStatusCounts() {
  return { open: 0, won: 0, lost: 0, abandoned: 0 };
}

function incrementStatus(counts, status) {
  if (Object.prototype.hasOwnProperty.call(counts, status)) {
    counts[status] += 1;
  }
}

function buildStatusBreakdown(opportunities) {
  const counts = emptyStatusCounts();
  for (const opportunity of opportunities) {
    incrementStatus(counts, opportunity.status);
  }
  return counts;
}

function buildSourceReport(opportunities) {
  const rows = new Map();

  for (const opportunity of opportunities) {
    const source = getSource(opportunity);
    const row = rows.get(source) || {
      source,
      totalLeads: 0,
      totalValue: 0,
      open: 0,
      won: 0,
      lost: 0,
      abandoned: 0,
    };

    row.totalLeads += 1;
    row.totalValue += getMonetary(opportunity);
    incrementStatus(row, opportunity.status);
    rows.set(source, row);
  }

  return [...rows.values()]
    .map((row) => ({
      ...row,
      winPct: row.totalLeads > 0 ? (row.won / row.totalLeads) * 100 : 0,
    }))
    .sort((a, b) => b.totalValue - a.totalValue);
}

function buildAssigneeReport(opportunities, userMap) {
  const rows = new Map();

  for (const opportunity of opportunities) {
    const assigneeId = opportunity.assignedTo || 'unassigned';
    const row = rows.get(assigneeId) || {
      assigneeId,
      assigneeName: userMap.get(assigneeId) || 'Unassigned',
      totalLeads: 0,
      won: 0,
      totalValue: 0,
      wonValue: 0,
    };

    row.totalLeads += 1;
    row.totalValue += getMonetary(opportunity);
    if (opportunity.status === 'won') {
      row.won += 1;
      row.wonValue += getMonetary(opportunity);
    }

    rows.set(assigneeId, row);
  }

  return [...rows.values()].sort((a, b) => b.won - a.won);
}

function buildWeeklyRevenue(opportunities) {
  return buildTimeSeries(opportunities, {
    granularity: 'week',
    dateField: 'lastStatusChangeAt',
    filter: (opportunity) => opportunity.status === 'won',
    value: (opportunity) => getMonetary(opportunity),
    labelKey: 'week',
    valueKey: 'revenue',
    limit: 12,
    gapFillAfterSlice: true,
  });
}

function buildMonthlyRevenue(opportunities) {
  return buildTimeSeries(opportunities, {
    granularity: 'month',
    dateField: 'lastStatusChangeAt',
    filter: (opportunity) => opportunity.status === 'won',
    value: (opportunity) => getMonetary(opportunity),
    labelKey: 'month',
    valueKey: 'revenue',
    limit: 12,
  });
}

function buildWeeklyLeads(opportunities) {
  return buildTimeSeries(opportunities, {
    granularity: 'week',
    dateField: 'createdAt',
    value: () => 1,
    labelKey: 'week',
    valueKey: 'count',
    limit: 12,
  });
}

function buildMonthlyLeads(opportunities) {
  return buildTimeSeries(opportunities, {
    granularity: 'month',
    dateField: 'createdAt',
    value: () => 1,
    labelKey: 'month',
    valueKey: 'count',
    limit: 12,
  });
}

function buildMonthlyLeadsValue(opportunities) {
  return buildTimeSeries(opportunities, {
    granularity: 'month',
    dateField: 'createdAt',
    value: (opportunity) => getMonetary(opportunity),
    labelKey: 'month',
    valueKey: 'value',
    limit: 12,
  });
}

function buildMonthlyConversion(leadOpportunities, wonOpportunities = leadOpportunities) {
  const createdByMonth = new Map();
  const wonByMonth = new Map();

  for (const opportunity of leadOpportunities) {
    const createdAt = getDateValue(opportunity, 'createdAt');
    if (createdAt) {
      const createdKey = getMonthKey(createdAt);
      createdByMonth.set(createdKey, (createdByMonth.get(createdKey) || 0) + 1);
    }
  }

  for (const opportunity of wonOpportunities) {
    if (opportunity.status !== 'won') continue;

    const wonAt = getWonDate(opportunity);
    if (!wonAt) continue;

    const wonKey = getMonthKey(wonAt);
    wonByMonth.set(wonKey, (wonByMonth.get(wonKey) || 0) + 1);
  }

  const months = [...new Set([...createdByMonth.keys(), ...wonByMonth.keys()])].sort();

  return months
    .slice(-12)
    .map((month) => {
      const total = createdByMonth.get(month) || 0;
      const won = wonByMonth.get(month) || 0;
      return {
        month,
        rate: total > 0 ? (won / total) * 100 : 0,
        total,
        won,
      };
    });
}

function getMonthKey(date) {
  if (!date || Number.isNaN(date.getTime())) return '';
  return getCalendarDateFormatter(DEFAULT_TIMEZONE).format(date).slice(0, 7);
}

function incrementIsoWeek(weekKey) {
  const match = String(weekKey).match(/^(\d{4})-W(\d{2})$/);
  if (!match) return weekKey;

  const isoYear = Number(match[1]);
  const isoWeek = Number(match[2]);
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setUTCDate(jan4.getUTCDate() - jan4Day + 1);

  const nextMonday = new Date(mondayWeek1);
  nextMonday.setUTCDate(mondayWeek1.getUTCDate() + isoWeek * 7);

  return getWeekKey(new Date(
    nextMonday.getUTCFullYear(),
    nextMonday.getUTCMonth(),
    nextMonday.getUTCDate()
  ));
}

function fillWeeklyGaps(entries, labelKey, valueKey) {
  if (entries.length < 2) return entries;

  const filled = [];
  for (let index = 0; index < entries.length; index += 1) {
    filled.push(entries[index]);

    if (index >= entries.length - 1) continue;

    let cursor = entries[index][labelKey];
    const nextKey = entries[index + 1][labelKey];

    while (cursor !== nextKey) {
      cursor = incrementIsoWeek(cursor);
      if (cursor === nextKey) break;
      filled.push({ [labelKey]: cursor, [valueKey]: 0 });
    }
  }

  return filled;
}

function buildTimeSeries(opportunities, options) {
  const {
    granularity,
    dateField,
    filter = () => true,
    value,
    labelKey,
    valueKey,
    limit = 12,
    fillGaps = true,
    gapFillAfterSlice = false,
  } = options;

  const buckets = new Map();

  for (const opportunity of opportunities) {
    if (!filter(opportunity)) continue;

    const date = getDateValue(opportunity, dateField)
      || getDateValue(opportunity, 'updatedAt')
      || getDateValue(opportunity, 'createdAt');
    if (!date) continue;

    const key = granularity === 'month' ? getMonthKey(date) : getWeekKey(date);
    buckets.set(key, (buckets.get(key) || 0) + value(opportunity));
  }

  let entries = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, amount]) => ({
      [labelKey]: key,
      [valueKey]: amount,
    }));

  if (granularity === 'week' && gapFillAfterSlice) {
    entries = entries.slice(-limit);
    entries = fillWeeklyGaps(entries, labelKey, valueKey);
    return entries;
  }

  if (granularity === 'week' && fillGaps) {
    entries = fillWeeklyGaps(entries, labelKey, valueKey);
  }

  return entries.slice(-limit);
}

function sumOpenPipelineValue(opportunities) {
  let total = 0;
  for (const opportunity of opportunities) {
    if (opportunity.status === 'open') {
      total += getMonetary(opportunity);
    }
  }
  return total;
}


function sumMonetary(opportunities) {
  let total = 0;
  for (const opportunity of opportunities) {
    total += getMonetary(opportunity);
  }
  return total;
}

function pipelineIdsMatch(selected, defaults) {
  if (!selected?.length || !defaults?.length) return false;
  return [...selected].sort().join(',') === [...defaults].sort().join(',');
}

function isCenhubDefaultView(filters, accountContext = {}) {
  const noExtraFilters = filters.status === 'all'
    && filters.source === 'all'
    && filters.assignedTo === 'all'
    && !filters.dateFrom
    && !filters.dateTo;

  if (!noExtraFilters) return false;

  if (!filters.pipelineIds.length) return true;

  const slotDefaults = accountContext.slots?.defaultPipelineIds || [];
  return pipelineIdsMatch(filters.pipelineIds, slotDefaults);
}

function isDateInRange(date, filters) {
  if (!date) return false;
  return isCalendarDateInRange(date, filters.dateFrom, filters.dateTo, filters.timeZone);
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

function buildPeriodKpis(baseOpportunities, filters) {
  let totalLeads = 0;
  let totalLeadsValue = 0;

  for (const opportunity of baseOpportunities) {
    const createdAt = getDateValue(opportunity, 'createdAt');

    if (isDateInRange(createdAt, filters)) {
      totalLeads += 1;
      totalLeadsValue += getMonetary(opportunity);
    }
  }

  const averageLeadValue = totalLeads > 0 ? totalLeadsValue / totalLeads : 0;

  return {
    totalLeads,
    totalLeadsValue,
    averageLeadValue,
  };
}

function buildCenhubKpis(opportunities) {
  const filteredOpportunityCount = opportunities.length;
  const filteredMonetary = sumMonetary(opportunities);

  let totalLeads = filteredOpportunityCount;
  let totalLeadsValue = filteredMonetary;
  let averageLeadValue = filteredOpportunityCount > 0 ? filteredMonetary / filteredOpportunityCount : 0;

  return { totalLeads, totalLeadsValue, averageLeadValue };
}

function buildPipelineBreakdown(opportunities, pipelineMap, profitFieldId) {
  const rows = new Map();

  for (const opportunity of opportunities) {
    const pipelineId = opportunity.pipelineId || 'unknown';
    const row = rows.get(pipelineId) || {
      id: pipelineId,
      name: pipelineMap.get(pipelineId) || 'Unknown pipeline',
      count: 0,
      monetary: 0,
      profit: 0,
      won: 0,
      wonValue: 0,
    };

    row.count += 1;
    row.monetary += getMonetary(opportunity);
    row.profit += getProfit(opportunity, profitFieldId);
    if (opportunity.status === 'won') {
      row.won += 1;
      row.wonValue += getMonetary(opportunity);
    }

    rows.set(pipelineId, row);
  }

  return [...rows.values()].sort((a, b) => b.monetary - a.monetary);
}

function buildFilterOptions(allOpportunities, pipelines, users) {
  const sources = [...new Set(allOpportunities.map(getSource))].sort();

  return {
    pipelines,
    statuses: [
      { id: 'all', name: 'All statuses' },
      { id: 'open', name: 'Open' },
      { id: 'won', name: 'Won' },
      { id: 'lost', name: 'Lost' },
      { id: 'abandoned', name: 'Abandoned' },
    ],
    dateFields: [
      { id: 'createdAt', name: 'Created date' },
      { id: 'updatedAt', name: 'Updated date' },
      { id: 'lastStatusChangeAt', name: 'Status change date' },
      { id: 'lastStageChangeAt', name: 'Stage change date' },
    ],
    sources: [{ id: 'all', name: 'All sources' }, ...sources.map((source) => ({ id: source, name: source }))],
    assignees: [{ id: 'all', name: 'All assignees' }, ...users.map((user) => ({ id: user.id, name: user.name }))],
  };
}

function aggregateOpportunities(
  opportunities,
  filters,
  userMap,
  pipelineMap,
  allOpportunities,
  pipelines,
  users,
  contactCount,
  chartOpportunities = opportunities,
  baseOpportunities = opportunities,
  dedupeStats = null,
  rawOpportunities = allOpportunities,
  accountContext = {},
  dataMeta = {},
) {
  const statusBreakdown = buildStatusBreakdown(opportunities);
  const chartStatusBreakdown = buildStatusBreakdown(chartOpportunities);
  const profitFieldId = accountContext.profitFieldId || DEFAULT_PROFIT_FIELD_ID;
  const salesPipelineId = accountContext.slots?.salesPipelineId || null;
  const metricsModelSummary = describeMetricsModel(accountContext, pipelines);

  const hasDateFilter = Boolean(filters.dateFrom || filters.dateTo);
  const usingCenhubDefaults = isCenhubDefaultView(filters, accountContext);
  const winOpportunitiesForCharts = getWinOpportunities(
    rawOpportunities,
    accountContext,
    filters,
    { applyDateFilter: false },
  );

  let totalLeads;
  let totalLeadsValue;
  let averageLeadValue;
  let clientsWon;
  let wonRevenue;
  let wonOpportunityCount;
  let wonBundlinje;

  if (hasDateFilter) {
    ({
      totalLeads,
      totalLeadsValue,
      averageLeadValue,
    } = buildPeriodKpis(baseOpportunities, filters));
    wonBundlinje = sumWonBundlinje(rawOpportunities, accountContext, filters, profitFieldId);
  } else {
    wonBundlinje = sumWonBundlinje(rawOpportunities, accountContext, filters, profitFieldId);

    ({
      totalLeads,
      totalLeadsValue,
      averageLeadValue,
    } = buildCenhubKpis(opportunities));
  }

  ({
    wonRevenue,
    wonOpportunityCount,
    clientsWon,
  } = computeWinMetrics(rawOpportunities, accountContext, filters));

  const totalBundlinje = wonBundlinje;

  const opportunityCount = opportunities.length;
  const conversionRate = totalLeads > 0 ? (wonOpportunityCount / totalLeads) * 100 : 0;
  const winRate = opportunityCount > 0 ? (statusBreakdown.won / opportunityCount) * 100 : 0;
  const lostRate = opportunityCount > 0 ? (statusBreakdown.lost / opportunityCount) * 100 : 0;
  const abandonRate = opportunityCount > 0 ? (statusBreakdown.abandoned / opportunityCount) * 100 : 0;

  const openPipelineSource = salesPipelineId
    ? opportunities.filter((opportunity) => opportunity.pipelineId === salesPipelineId)
    : opportunities;
  const openPipelineValue = sumOpenPipelineValue(openPipelineSource);
  const averageWonDealSize = wonOpportunityCount > 0 ? wonRevenue / wonOpportunityCount : 0;
  const costPerLead = filters.adSpend > 0 && totalLeads > 0 ? filters.adSpend / totalLeads : 0;
  const costPerWonClient = filters.adSpend > 0 && clientsWon > 0 ? filters.adSpend / clientsWon : 0;
  const roas = filters.adSpend > 0 ? wonRevenue / filters.adSpend : 0;

  return {
    filters,
    filterOptions: buildFilterOptions(allOpportunities, pipelines, users),
    account: {
      clientId: accountContext.clientId,
      accountName: accountContext.accountName,
      dataSource: dataMeta.source || null,
      pipelineMode: accountContext.slots?.pipelineMode || null,
      timezone: accountContext.timezone || DEFAULT_TIMEZONE,
      defaultPipelineIds: accountContext.slots?.defaultPipelineIds || [],
      syncStale: isSnapshotStale(dataMeta.fetchedAt),
      syncStatus: dataMeta.syncStatus || null,
      syncError: dataMeta.syncError || null,
      metricsModel: {
        dedupeEnabled: accountContext.slots?.dedupeEnabled ?? false,
        winMode: accountContext.slots?.winMode || 'all',
        winPipelineId: accountContext.slots?.winPipelineId || null,
        label: metricsModelSummary.label,
        winSourceLabel: metricsModelSummary.winSourceLabel,
        lockedAt: accountContext.metricsModelLockedAt || null,
        version: accountContext.metricsModelVersion || 1,
        changedAt: accountContext.metricsModelChangedAt || null,
      },
    },
    kpis: {
      totalRevenue: wonRevenue,
      periodRevenue: hasDateFilter ? sumMonetary(opportunities) : wonRevenue,
      clientsWon,
      wonOpportunityCount,
      totalLeads,
      opportunityCount: opportunities.length,
      contactCount,
      averageLeadValue,
      totalLeadsValue,
      conversionRate,
      wonRevenue,
      totalBundlinje,
      wonBundlinje,
      adSpend: filters.adSpend,
      costPerLead,
      costPerWonClient,
      roas,
      hasDateFilter,
      usingCenhubDefaults,
      dedupeEnabled: Boolean(dedupeStats?.enabled),
      dedupePairsMerged: dedupeStats?.pairsMerged || 0,
      openLeads: statusBreakdown.open,
      openPipelineValue,
      averageWonDealSize,
      winRate,
      lostRate,
      abandonRate,
      lostCount: statusBreakdown.lost,
      abandonCount: statusBreakdown.abandoned,
    },
    statusBreakdown,
    chartStatusBreakdown,
    sourceReport: buildSourceReport(opportunities),
    assigneeReport: buildAssigneeReport(opportunities, userMap),
    weeklyRevenue: buildWeeklyRevenue(winOpportunitiesForCharts),
    monthlyRevenue: buildMonthlyRevenue(winOpportunitiesForCharts),
    weeklyLeads: buildWeeklyLeads(chartOpportunities),
    monthlyLeads: buildMonthlyLeads(chartOpportunities),
    monthlyLeadsValue: buildMonthlyLeadsValue(chartOpportunities),
    monthlyConversion: buildMonthlyConversion(chartOpportunities, winOpportunitiesForCharts),
    pipelines: buildPipelineBreakdown(opportunities, pipelineMap, profitFieldId),
    totals: {
      profit: totalBundlinje,
      monetary: totalLeadsValue,
      count: totalLeads,
    },
    updatedAt: new Date().toISOString(),
    cachedAt: dataMeta.fetchedAt || null,
    dedupe: dedupeStats,
  };
}

async function getDashboardData(query = {}) {
  const accountContext = await resolveAccountContext(query);
  const filters = parseFilters(query, accountContext);
  const dataSource = await loadDataSource(accountContext, query);
  const {
    opportunities: rawOpportunities,
    pipelines,
    users,
    contactCount,
  } = dataSource;

  const { opportunities, stats: dedupeStats } = dedupeOpportunities(rawOpportunities, pipelines, {
    afterSalesPipelineId: accountContext.slots.afterSalesPipelineId,
    funnelPipelineIds: accountContext.slots.funnelPipelineIds,
    dedupeEnabled: accountContext.slots.dedupeEnabled,
  });
  dedupeStats.winPipelineId = accountContext.slots.winPipelineId;

  const pipelineMap = new Map(pipelines.map((pipeline) => [pipeline.id, pipeline.name]));
  const userMap = new Map(users.map((user) => [user.id, user.name]));

  const nonDateFilters = { ...filters, dateFrom: null, dateTo: null };
  const baseFiltered = opportunities.filter((opportunity) =>
    matchesFilters(opportunity, nonDateFilters)
  );
  const filtered = baseFiltered.filter((opportunity) =>
    matchesFilters(opportunity, filters)
  );
  const chartOpportunities = baseFiltered;
  const rawFiltered = rawOpportunities.filter((opportunity) =>
    matchesFilters(opportunity, nonDateFilters)
  );

  return aggregateOpportunities(
    filtered,
    filters,
    userMap,
    pipelineMap,
    opportunities,
    pipelines,
    users,
    contactCount,
    chartOpportunities,
    baseFiltered,
    dedupeStats,
    rawFiltered,
    accountContext,
    dataSource,
  );
}

module.exports = {
  getDashboardData,
  parseFilters,
  normalizeDateFilters,
  parsePipelineIds,
  formatPipelineFilter,
  resolveAccountContext,
  loadDataSource,
  buildPeriodKpis,
};
