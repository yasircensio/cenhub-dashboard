const API_BASE_URL = 'https://services.leadconnectorhq.com';
const API_VERSION = '2021-07-28';
const LOCATION_ID = 'XTl96fVPBYqWgZdWkfFM';
const PROFIT_FIELD_ID = '2YAu8bEKpOUSXwfYljWT';
const { dedupeOpportunities } = require('./opportunity-dedupe');

const MAX_PAGES = 50;
const PAGE_LIMIT = 100;
const CACHE_TTL_MS = 5 * 60 * 1000;
const BUSINESS_TIMEZONE = process.env.DASHBOARD_TIMEZONE || 'Europe/Copenhagen';

const calendarDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: BUSINESS_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

let cache = {
  fetchedAt: 0,
  opportunities: [],
  pipelines: [],
  users: [],
  contactCount: 0,
};

function getToken() {
  return (
    process.env.CENHUB_PRIVATE_INTEGRATION_TOKEN ||
    process.env.GHL_PRIVATE_INTEGRATION_TOKEN
  );
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

function getProfit(opportunity) {
  const fields = opportunity.customFields || [];
  const field = fields.find((customField) =>
    customField.id === PROFIT_FIELD_ID
    || customField.fieldKey === `opportunity.${PROFIT_FIELD_ID}`
    || customField.fieldKey === PROFIT_FIELD_ID
    || (customField.fieldKey && /bundlinje/i.test(customField.fieldKey))
    || (customField.name && /bundlinje/i.test(customField.name))
  );
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

function getCalendarDateString(date) {
  if (!date) return null;
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return null;
  return calendarDateFormatter.format(value);
}

function isCalendarDateInRange(date, dateFrom, dateTo) {
  const calendarDate = getCalendarDateString(date);
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

async function apiFetch(token, path, query = {}) {
  const params = new URLSearchParams(query);
  const url = `${API_BASE_URL}${path}${params.toString() ? `?${params}` : ''}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Version: API_VERSION,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  return response.json();
}

async function fetchOpportunityPage(token, { startAfter, startAfterId }) {
  const params = {
    location_id: LOCATION_ID,
    limit: String(PAGE_LIMIT),
    status: 'all',
  };

  if (startAfter) params.startAfter = String(startAfter);
  if (startAfterId) params.startAfterId = startAfterId;

  return apiFetch(token, '/opportunities/search', params);
}

async function fetchAllOpportunities(token) {
  const opportunities = [];
  let startAfter = null;
  let startAfterId = null;

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const data = await fetchOpportunityPage(token, { startAfter, startAfterId });
    const pageOpportunities = data.opportunities || [];
    opportunities.push(...pageOpportunities);

    const meta = data.meta || {};
    if (pageOpportunities.length < PAGE_LIMIT || !meta.startAfter) break;

    startAfter = meta.startAfter;
    startAfterId = meta.startAfterId || null;
  }

  return opportunities;
}

async function fetchPipelines(token) {
  const data = await apiFetch(token, '/opportunities/pipelines', { locationId: LOCATION_ID });
  return (data.pipelines || []).map((pipeline) => ({
    id: pipeline.id,
    name: pipeline.name,
  }));
}

async function fetchContactCount(token) {
  const data = await apiFetch(token, '/contacts/', { locationId: LOCATION_ID, limit: '1' });
  return Number(data.meta?.total) || 0;
}

async function fetchUsers(token) {
  const data = await apiFetch(token, '/users/', { locationId: LOCATION_ID });
  return (data.users || []).map((user) => ({
    id: user.id,
    name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
  }));
}

async function ensureCache(token) {
  const isFresh = cache.fetchedAt && Date.now() - cache.fetchedAt < CACHE_TTL_MS;
  if (isFresh && cache.opportunities.length) {
    if (!cache.contactCount) {
      cache.contactCount = await fetchContactCount(token);
    }
    return cache;
  }

  const [opportunities, pipelines, users, contactCount] = await Promise.all([
    fetchAllOpportunities(token),
    fetchPipelines(token),
    fetchUsers(token),
    fetchContactCount(token),
  ]);

  cache = {
    fetchedAt: Date.now(),
    opportunities,
    pipelines,
    users,
    contactCount,
  };

  return cache;
}

function parsePipelineIds(query = {}) {
  const raw = query.pipelineIds ?? query.pipelineId;
  if (!raw || raw === 'all') return [];

  const values = Array.isArray(raw) ? raw : String(raw).split(',');
  return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))];
}

function parseFilters(query = {}) {
  const dateField = ['createdAt', 'updatedAt', 'lastStatusChangeAt', 'lastStageChangeAt'].includes(query.dateField)
    ? query.dateField
    : 'createdAt';

  const pipelineIds = parsePipelineIds(query);

  return {
    pipelineIds,
    status: query.status || 'all',
    source: query.source || 'all',
    assignedTo: query.assignedTo || 'all',
    dateField,
    dateFrom: query.dateFrom || null,
    dateTo: query.dateTo || null,
    adSpend: parseAmount(query.adSpend ?? process.env.CENHUB_AD_SPEND ?? 0),
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
    if (!isCalendarDateInRange(dateValue, filters.dateFrom, filters.dateTo)) return false;
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
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
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

function getAfterSaleWonOpportunities(rawOpportunities, afterSalePipelineId, filters, options = {}) {
  const { applyDateFilter = false } = options;
  const candidates = !afterSalePipelineId
    ? rawOpportunities.filter((opportunity) => opportunity.status === 'won')
    : rawOpportunities.filter(
      (opportunity) => opportunity.pipelineId === afterSalePipelineId && opportunity.status === 'won',
    );

  if (!applyDateFilter || !filters || (!filters.dateFrom && !filters.dateTo)) {
    return candidates;
  }

  return candidates.filter((opportunity) => isDateInRange(getWonDate(opportunity), filters));
}

function getAfterSaleWonMetrics(rawOpportunities, afterSalePipelineId, filters) {
  const wonOpportunities = getAfterSaleWonOpportunities(rawOpportunities, afterSalePipelineId, filters, {
    applyDateFilter: true,
  });

  const contactIds = new Set();
  const opportunityIds = new Set();
  let wonRevenue = 0;

  for (const opportunity of wonOpportunities) {
    wonRevenue += getMonetary(opportunity);

    if (opportunity.contactId) {
      contactIds.add(opportunity.contactId);
      continue;
    }

    if (opportunity.id) opportunityIds.add(opportunity.id);
  }

  return {
    wonRevenue,
    wonOpportunityCount: wonOpportunities.length,
    clientsWon: contactIds.size + opportunityIds.size,
  };
}

function sumMonetary(opportunities) {
  let total = 0;
  for (const opportunity of opportunities) {
    total += getMonetary(opportunity);
  }
  return total;
}

function isCenhubDefaultView(filters) {
  return !filters.pipelineIds.length
    && filters.status === 'all'
    && filters.source === 'all'
    && filters.assignedTo === 'all'
    && !filters.dateFrom
    && !filters.dateTo;
}

function isDateInRange(date, filters) {
  if (!date) return false;
  return isCalendarDateInRange(date, filters.dateFrom, filters.dateTo);
}

function getWonDate(opportunity) {
  return getDateValue(opportunity, 'lastStatusChangeAt')
    || getDateValue(opportunity, 'updatedAt')
    || getDateValue(opportunity, 'createdAt');
}

function sumWonBundlinje(rawOpportunities, afterSalePipelineId, filters) {
  const wonOpportunities = getAfterSaleWonOpportunities(rawOpportunities, afterSalePipelineId, filters, {
    applyDateFilter: true,
  });
  let total = 0;

  for (const opportunity of wonOpportunities) {
    total += getProfit(opportunity);
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

function buildCenhubKpis(opportunities, allOpportunities, filters, contactCount) {
  const allOpportunityCount = allOpportunities.length;
  const filteredOpportunityCount = opportunities.length;
  const allMonetary = sumMonetary(allOpportunities);

  let totalLeads = filteredOpportunityCount;
  let totalLeadsValue = sumMonetary(opportunities);
  let averageLeadValue = filteredOpportunityCount > 0 ? totalLeadsValue / filteredOpportunityCount : 0;

  if (isCenhubDefaultView(filters)) {
    totalLeads = contactCount || allOpportunityCount;
    totalLeadsValue = allMonetary;
    averageLeadValue = allOpportunityCount > 0 ? allMonetary / allOpportunityCount : 0;
  }

  return { totalLeads, totalLeadsValue, averageLeadValue };
}

function buildPipelineBreakdown(opportunities, pipelineMap) {
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
    row.profit += getProfit(opportunity);
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
) {
  const statusBreakdown = buildStatusBreakdown(opportunities);
  const chartStatusBreakdown = buildStatusBreakdown(chartOpportunities);

  const hasDateFilter = Boolean(filters.dateFrom || filters.dateTo);
  const usingCenhubDefaults = isCenhubDefaultView(filters);
  const afterSalePipelineId = dedupeStats?.afterSalePipelineId || null;
  const afterSaleWonForCharts = getAfterSaleWonOpportunities(
    rawOpportunities,
    afterSalePipelineId,
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
    wonBundlinje = sumWonBundlinje(rawOpportunities, afterSalePipelineId, filters);
  } else {
    wonBundlinje = sumWonBundlinje(rawOpportunities, afterSalePipelineId, filters);

    ({
      totalLeads,
      totalLeadsValue,
      averageLeadValue,
    } = buildCenhubKpis(
      opportunities,
      allOpportunities,
      filters,
      contactCount,
    ));
  }

  ({
    wonRevenue,
    wonOpportunityCount,
    clientsWon,
  } = getAfterSaleWonMetrics(rawOpportunities, afterSalePipelineId, filters));

  const totalBundlinje = wonBundlinje;

  const opportunityCount = opportunities.length;
  const conversionRate = totalLeads > 0 ? (wonOpportunityCount / totalLeads) * 100 : 0;
  const winRate = opportunityCount > 0 ? (statusBreakdown.won / opportunityCount) * 100 : 0;
  const lostRate = opportunityCount > 0 ? (statusBreakdown.lost / opportunityCount) * 100 : 0;
  const abandonRate = opportunityCount > 0 ? (statusBreakdown.abandoned / opportunityCount) * 100 : 0;
  const openPipelineValue = sumOpenPipelineValue(opportunities);
  const averageWonDealSize = wonOpportunityCount > 0 ? wonRevenue / wonOpportunityCount : 0;
  const costPerLead = filters.adSpend > 0 && totalLeads > 0 ? filters.adSpend / totalLeads : 0;
  const costPerWonClient = filters.adSpend > 0 && clientsWon > 0 ? filters.adSpend / clientsWon : 0;
  const roas = filters.adSpend > 0 ? wonRevenue / filters.adSpend : 0;

  return {
    filters,
    filterOptions: buildFilterOptions(allOpportunities, pipelines, users),
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
    weeklyRevenue: buildWeeklyRevenue(afterSaleWonForCharts),
    monthlyRevenue: buildMonthlyRevenue(afterSaleWonForCharts),
    weeklyLeads: buildWeeklyLeads(chartOpportunities),
    monthlyLeads: buildMonthlyLeads(chartOpportunities),
    monthlyLeadsValue: buildMonthlyLeadsValue(chartOpportunities),
    monthlyConversion: buildMonthlyConversion(chartOpportunities, afterSaleWonForCharts),
    pipelines: buildPipelineBreakdown(opportunities, pipelineMap),
    totals: {
      profit: totalBundlinje,
      monetary: totalLeadsValue,
      count: totalLeads,
    },
    updatedAt: new Date().toISOString(),
    cachedAt: cache.fetchedAt ? new Date(cache.fetchedAt).toISOString() : null,
    dedupe: dedupeStats,
  };
}

async function getDashboardData(query = {}) {
  const token = getToken();
  if (!token) {
    throw new Error('Missing CENHUB_PRIVATE_INTEGRATION_TOKEN environment variable.');
  }

  const filters = parseFilters(query);
  const { opportunities: rawOpportunities, pipelines, users, contactCount } = await ensureCache(token);
  const { opportunities, stats: dedupeStats } = dedupeOpportunities(rawOpportunities, pipelines);

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
    rawOpportunities,
  );
}

module.exports = {
  getDashboardData,
  parseFilters,
  parsePipelineIds,
  formatPipelineFilter,
};
