const {
  getWinOpportunities,
  getWonDate,
} = require('./metrics-model');
const { findBundlinjeField } = require('./bundlinje-field');
const { getPeriodLabel, getPeriodLabelForRange, monthKeyFromDate } = require('./marketing-metrics');

const DEFAULT_PROFIT_FIELD_ID = process.env.CENHUB_PROFIT_FIELD_ID || '2YAu8bEKpOUSXwfYljWT';

function parseAmount(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const parsed = Number.parseFloat(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getMonetary(opportunity) {
  return parseAmount(opportunity?.monetaryValue);
}

function getProfit(opportunity, profitFieldId) {
  const field = findBundlinjeField(opportunity.customFields, profitFieldId);
  if (!field) return 0;
  return parseAmount(
    field.fieldValueNumber ??
    field.fieldValueString ??
    field.fieldValue ??
    field.value,
  );
}

function getDateValue(opportunity, field) {
  const value = opportunity?.[field];
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function calendarDateFormatter(timeZone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function toIsoDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseIsoDate(value) {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function calendarDateString(date, timeZone) {
  if (!date) return null;
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return null;
  return calendarDateFormatter(timeZone).format(value);
}

function differenceInCalendarDays(start, end) {
  const a = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const b = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((b - a) / 86400000);
}

function startOfWeekMonday(date) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function endOfWeekSunday(date) {
  const start = startOfWeekMonday(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return end;
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function inferGranularity(startDate, endDate) {
  const days = differenceInCalendarDays(startDate, endDate) + 1;
  if (days <= 31) return 'day';
  if (days <= 60) return 'week';
  return 'month';
}

function metaMonthPeriodDays(monthKey, referenceDate = new Date()) {
  const monthStart = new Date(`${monthKey}-01T12:00:00`);
  const monthEnd = endOfMonth(monthStart);
  const currentKey = monthKeyFromDate(calendarDateString(referenceDate, 'UTC') || toIsoDateLocal(referenceDate));
  if (monthKey === currentKey) {
    return differenceInCalendarDays(monthStart, referenceDate) + 1;
  }
  if (monthStart > new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate())) {
    return 0;
  }
  return differenceInCalendarDays(monthEnd, monthStart) + 1;
}

function dailyAdSpend(rangeStart, rangeEnd, monthlyAdSpend, now = new Date()) {
  const spendByMonth = {};
  for (const row of monthlyAdSpend || []) {
    const month = String(row.month || '').slice(0, 7);
    const spend = Number(row.spend) || 0;
    if (month && spend > 0) spendByMonth[month] = spend;
  }

  const out = new Map();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const periodDaysCache = new Map();

  for (
    let day = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
    day <= rangeEnd && day <= today;
    day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)
  ) {
    const monthKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}`;
    const monthSpend = spendByMonth[monthKey];
    if (!monthSpend) continue;

    let periodDays = periodDaysCache.get(monthKey);
    if (periodDays === undefined) {
      periodDays = metaMonthPeriodDays(monthKey, now);
      periodDaysCache.set(monthKey, periodDays);
    }
    if (periodDays <= 0) continue;

    out.set(toIsoDateLocal(day), monthSpend / periodDays);
  }
  return out;
}

function emptyTotals() {
  return {
    revenue: 0,
    profit: 0,
    adSpend: 0,
    leads: 0,
    customers: 0,
    ltv: null,
  };
}

function addTotals(target, source) {
  target.revenue += source.revenue || 0;
  target.profit += source.profit || 0;
  target.adSpend += source.adSpend || 0;
  target.leads += source.leads || 0;
  target.customers += source.customers || 0;
  if (source.ltv != null) {
    target.ltv = (target.ltv || 0) + source.ltv;
  }
}

function resolvePerformanceRange(filters, leadOpportunities, timeZone) {
  if (filters.dateFrom && filters.dateTo) {
    const start = parseIsoDate(filters.dateFrom);
    const end = parseIsoDate(filters.dateTo);
    if (start && end) return { start, end, startIso: filters.dateFrom, endIso: filters.dateTo };
  }

  let earliest = null;
  for (const opportunity of leadOpportunities || []) {
    const created = getDateValue(opportunity, 'createdAt');
    const iso = calendarDateString(created, timeZone);
    if (!iso) continue;
    if (!earliest || iso < earliest) earliest = iso;
  }

  const end = new Date();
  const endIso = calendarDateString(end, timeZone) || toIsoDateLocal(end);
  const startIso = earliest || endIso;
  return {
    start: parseIsoDate(startIso),
    end: parseIsoDate(endIso),
    startIso,
    endIso,
  };
}

function bucketKeyForDate(isoDate, granularity) {
  const date = parseIsoDate(isoDate);
  if (!date) return isoDate;
  if (granularity === 'day') return isoDate;
  if (granularity === 'week') return toIsoDateLocal(startOfWeekMonday(date));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function bucketBoundsFromKey(key, granularity) {
  if (granularity === 'day') {
    const date = parseIsoDate(key);
    return { start: key, end: key };
  }
  if (granularity === 'week') {
    const startDate = parseIsoDate(key);
    const endDate = endOfWeekSunday(startDate);
    return { start: key, end: toIsoDateLocal(endDate) };
  }
  const [year, month] = key.split('-').map(Number);
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = endOfMonth(new Date(year, month - 1, 1));
  return { start, end: toIsoDateLocal(endDate) };
}

function fillBucketRange(startDate, endDate, granularity, bucketMap) {
  const todayIso = toIsoDateLocal(new Date());
  if (granularity === 'day') {
    for (
      let day = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      day <= endDate;
      day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)
    ) {
      const iso = toIsoDateLocal(day);
      if (iso > todayIso) continue;
      const key = bucketKeyForDate(iso, granularity);
      if (!bucketMap.has(key)) {
        const bounds = bucketBoundsFromKey(key, granularity);
        bucketMap.set(key, { ...bounds, ...emptyTotals() });
      }
    }
    return;
  }

  if (granularity === 'week') {
    let cursor = startOfWeekMonday(startDate);
    while (cursor <= endDate) {
      const key = toIsoDateLocal(cursor);
      if (key <= todayIso && !bucketMap.has(key)) {
        const bounds = bucketBoundsFromKey(key, granularity);
        bucketMap.set(key, { ...bounds, ...emptyTotals() });
      }
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 7);
    }
    return;
  }

  let year = startDate.getFullYear();
  let month = startDate.getMonth();
  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth();
  while (year < endYear || (year === endYear && month <= endMonth)) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    if (!bucketMap.has(key)) {
      const bounds = bucketBoundsFromKey(key, granularity);
      bucketMap.set(key, { ...bounds, ...emptyTotals() });
    }
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
}

function buildGhlPerformance({
  leadOpportunities = [],
  rawOpportunities = [],
  accountContext = {},
  filters = {},
  monthlyAdSpend = [],
  profitFieldId = DEFAULT_PROFIT_FIELD_ID,
  now = new Date(),
}) {
  const timeZone = filters.timeZone || accountContext.timezone || 'Europe/Copenhagen';
  const range = resolvePerformanceRange(filters, leadOpportunities, timeZone);
  if (!range.start || !range.end) {
    return null;
  }

  const granularity = inferGranularity(range.start, range.end);
  const dateField = filters.dateField || 'createdAt';
  const profitField = profitFieldId || accountContext.profitFieldId || DEFAULT_PROFIT_FIELD_ID;
  const bucketMap = new Map();

  const ensureBucket = (isoDate) => {
    const key = bucketKeyForDate(isoDate, granularity);
    if (!bucketMap.has(key)) {
      const bounds = bucketBoundsFromKey(key, granularity);
      bucketMap.set(key, { ...bounds, ...emptyTotals() });
    }
    return bucketMap.get(key);
  };

  for (const opportunity of leadOpportunities) {
    const date = getDateValue(opportunity, dateField);
    const iso = calendarDateString(date, timeZone);
    if (!iso) continue;
    if (iso < range.startIso || iso > range.endIso) continue;
    const bucket = ensureBucket(iso);
    bucket.leads += 1;
  }

  const winCandidates = getWinOpportunities(rawOpportunities, accountContext, filters, {
    applyDateFilter: true,
  });
  for (const opportunity of winCandidates) {
    const wonDate = getWonDate(opportunity);
    const iso = calendarDateString(wonDate, timeZone);
    if (!iso) continue;
    if (iso < range.startIso || iso > range.endIso) continue;
    const bucket = ensureBucket(iso);
    bucket.revenue += getMonetary(opportunity);
    bucket.profit += getProfit(opportunity, profitField);
    bucket.customers += 1;
  }

  const dailySpend = dailyAdSpend(range.start, range.end, monthlyAdSpend, now);
  for (const [iso, amount] of dailySpend.entries()) {
    const bucket = ensureBucket(iso);
    bucket.adSpend += amount;
  }

  fillBucketRange(range.start, range.end, granularity, bucketMap);

  const buckets = [...bucketMap.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, bucket]) => bucket);

  const totals = emptyTotals();
  for (const bucket of buckets) {
    addTotals(totals, bucket);
  }

  const periodLabel = filters.dateFrom && filters.dateTo
    ? getPeriodLabelForRange(filters.dateFrom, filters.dateTo, timeZone)
    : getPeriodLabel('all', timeZone);

  return {
    granularity,
    periodLabel,
    range: { start: range.startIso, end: range.endIso },
    totals,
    buckets,
  };
}

function totalsFromKpis(kpis = {}) {
  const revenue = Number(kpis.totalRevenue) || 0;
  const adSpend = Number(kpis.adSpend) || 0;
  const bundlinje = Number(kpis.wonBundlinje) || 0;
  const profit = Number.isFinite(Number(kpis.poasDk))
    ? Number(kpis.poasDk)
    : bundlinje - adSpend;

  return {
    revenue,
    profit,
    adSpend,
    leads: Number(kpis.totalLeads) || 0,
    customers: Number(kpis.clientsWon) || 0,
    ltv: null,
    roas: adSpend > 0 ? revenue / adSpend : null,
    cpl: adSpend > 0 && kpis.totalLeads > 0 ? adSpend / kpis.totalLeads : null,
    cac: adSpend > 0 && kpis.clientsWon > 0 ? adSpend / kpis.clientsWon : null,
    closeRate: Number(kpis.conversionRate) || (kpis.totalLeads > 0
      ? ((Number(kpis.wonOpportunityCount) || Number(kpis.clientsWon) || 0) / kpis.totalLeads) * 100
      : 0),
  };
}

function mergePerformanceMarketing(performance, kpis, monthlyAdSpend, filters = {}, now = new Date()) {
  if (!performance) return performance;
  const rangeStart = parseIsoDate(performance.range?.start);
  const rangeEnd = parseIsoDate(performance.range?.end);
  if (!rangeStart || !rangeEnd) {
    return { ...performance, totals: totalsFromKpis(kpis) };
  }

  const dailySpend = dailyAdSpend(rangeStart, rangeEnd, monthlyAdSpend, now);
  const buckets = performance.buckets.map((bucket) => ({
    ...bucket,
    adSpend: 0,
  }));
  const byKey = new Map(buckets.map((bucket) => [
    bucketKeyForDate(bucket.start, performance.granularity),
    bucket,
  ]));

  for (const [iso, amount] of dailySpend.entries()) {
    const key = bucketKeyForDate(iso, performance.granularity);
    const bucket = byKey.get(key);
    if (bucket) bucket.adSpend += amount;
  }

  return {
    ...performance,
    buckets: [...byKey.values()].sort((a, b) => a.start.localeCompare(b.start)),
    totals: totalsFromKpis(kpis),
  };
}

module.exports = {
  buildGhlPerformance,
  mergePerformanceMarketing,
  totalsFromKpis,
  inferGranularity,
  dailyAdSpend,
  resolvePerformanceRange,
};
