/**
 * Browser + Node: merge Facebook ad spend into dashboard performance buckets.
 * Loaded in the client via /lib/performance-merge.js (globalThis.PerformanceMerge).
 */

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

function differenceInCalendarDays(start, end) {
  const a = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const b = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((b - a) / 86400000);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function startOfWeekMonday(date) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function monthKeyFromReference(referenceDate) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(referenceDate).slice(0, 7);
}

function metaMonthPeriodDays(monthKey, referenceDate = new Date()) {
  const monthStart = new Date(`${monthKey}-01T12:00:00`);
  const monthEnd = endOfMonth(monthStart);
  const currentKey = monthKeyFromReference(referenceDate);
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

function bucketKeyForDate(isoDate, granularity) {
  const date = parseIsoDate(isoDate);
  if (!date) return isoDate;
  if (granularity === 'day') return isoDate;
  if (granularity === 'week') return toIsoDateLocal(startOfWeekMonday(date));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
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

const performanceMergeApi = {
  mergePerformanceMarketing,
  totalsFromKpis,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = performanceMergeApi;
}

if (typeof globalThis !== 'undefined') {
  globalThis.PerformanceMerge = performanceMergeApi;
}
