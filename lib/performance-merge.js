/**
 * Browser + Node: merge Facebook ad spend into dashboard performance buckets.
 * Loaded in the client via /lib/performance-merge.js (globalThis.PerformanceMerge).
 */

// Wrapped in a closure: in the browser this is a plain <script>, and its helper names
// must not leak into (or be overwritten by) the dashboard bundle's global scope.
(function performanceMergeModule() {
'use strict';

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
  return differenceInCalendarDays(monthStart, monthEnd) + 1;
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
  const leads = Number(kpis.totalLeads) || 0;
  const customers = Number(kpis.clientsWon) || 0;
  // Same formulas as the detailed KPI cards (period-aware leads/spend come from kpis).
  const cpl = Number(kpis.costPerLead) > 0
    ? Number(kpis.costPerLead)
    : (adSpend > 0 && leads > 0 ? adSpend / leads : null);
  const cac = Number(kpis.costPerWonClient) > 0
    ? Number(kpis.costPerWonClient)
    : (adSpend > 0 && customers > 0 ? adSpend / customers : null);

  return {
    revenue,
    // Bundlinje POAS (DK): bundlinje minus ad spend (profit before ad spend when no spend yet).
    profit: bundlinje - adSpend,
    adSpend,
    leads,
    customers,
    ltv: null,
    roas: adSpend > 0 ? revenue / adSpend : null,
    cpl,
    cac,
    closeRate: leads > 0
      ? ((Number(kpis.wonOpportunityCount) || customers) / leads) * 100
      : 0,
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
    // Keep raw bundlinje so re-merging (filter changes) never subtracts spend twice.
    bundlinje: Number.isFinite(Number(bucket.bundlinje)) ? Number(bucket.bundlinje) : (Number(bucket.profit) || 0),
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

  for (const bucket of buckets) {
    bucket.profit = bucket.bundlinje - bucket.adSpend;
  }

  return {
    ...performance,
    buckets: [...byKey.values()].sort((a, b) => a.start.localeCompare(b.start)),
    totals: totalsFromKpis(kpis),
  };
}

/* ------------------------------------------------------------------ */
/* Period comparison helpers (pure, shared by browser and Node tests)  */
/* ------------------------------------------------------------------ */

const DA_MONTHS = [
  'januar', 'februar', 'marts', 'april', 'maj', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'december',
];
const DA_MONTHS_SHORT = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

// Which direction is "good" for each metric. Costs are inverted (a rise is bad).
const COMPARE_METRIC_DIRECTION = {
  revenue: 'up',
  profit: 'up',
  roas: 'up',
  customers: 'up',
  adSpend: 'down',
  closeRate: 'up',
  leads: 'up',
  cpl: 'down',
  cac: 'down',
  ltv: 'up',
};

function daysInMonthOf(year, month1) {
  return new Date(year, month1, 0).getDate();
}

function isoFromYmd(year, month1, day) {
  return `${year}-${String(month1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function monthBoundsIsoLocal(year, month1) {
  return {
    start: isoFromYmd(year, month1, 1),
    end: isoFromYmd(year, month1, daysInMonthOf(year, month1)),
  };
}

function addDaysIso(iso, days) {
  const date = parseIsoDate(iso);
  return toIsoDateLocal(new Date(date.getFullYear(), date.getMonth(), date.getDate() + days));
}

function shiftYearsIso(iso, deltaYears) {
  const date = parseIsoDate(iso);
  const year = date.getFullYear() + deltaYears;
  const month = date.getMonth();
  const day = Math.min(date.getDate(), new Date(year, month + 1, 0).getDate());
  return toIsoDateLocal(new Date(year, month, day));
}

function effectiveRangeEnd(range, todayIso) {
  return todayIso && range.end > todayIso ? todayIso : range.end;
}

/**
 * month  = one calendar month (full or month to date)
 * year   = 1 Jan to 31 Dec, or year to date
 * custom = anything else
 */
function detectRangeShape(range, todayIso) {
  const start = parseIsoDate(range?.start);
  const end = parseIsoDate(range?.end);
  if (!start || !end) return 'custom';
  if (start.getDate() === 1 && start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return 'month';
  }
  if (start.getMonth() === 0 && start.getDate() === 1 && start.getFullYear() === end.getFullYear()) {
    const fullYear = end.getMonth() === 11 && end.getDate() === 31;
    const yearToDate = Boolean(todayIso) && range.end === todayIso;
    if (fullYear || yearToDate) return 'year';
  }
  return 'custom';
}

function isRangeBounded(range) {
  return Boolean(range?.start && range?.end);
}

function sameRange(a, b) {
  return Boolean(a && b && a.start === b.start && a.end === b.end);
}

/**
 * Resolve the comparison range for a current range.
 *   mode 'previous_period' | 'previous_year' | 'pick'
 *   options.todayIso  yyyy-mm-dd (end of a running period is cut at today)
 *   options.pick      { year, month } with month 1..12 (month shape) - year shape only uses year
 * Returns { start, end } or null when no sensible comparison exists.
 */
function resolveComparisonRange(range, mode, options = {}) {
  if (!isRangeBounded(range)) return null;
  const todayIso = options.todayIso || null;
  const shape = detectRangeShape(range, todayIso);
  const effEnd = effectiveRangeEnd(range, todayIso);
  const start = parseIsoDate(range.start);
  const end = parseIsoDate(range.end);
  const elapsedDays = differenceInCalendarDays(parseIsoDate(range.start), parseIsoDate(effEnd)) + 1;
  if (elapsedDays <= 0) return null;

  const monthEndIso = shape === 'month'
    ? monthBoundsIsoLocal(start.getFullYear(), start.getMonth() + 1).end
    : null;
  const partialMonth = shape === 'month' && effEnd < monthEndIso;
  const partialYear = shape === 'year' && !(end.getMonth() === 11 && end.getDate() === 31 && effEnd >= range.end);

  let result = null;

  if (mode === 'previous_year') {
    if (shape === 'month' && !partialMonth) {
      result = monthBoundsIsoLocal(start.getFullYear() - 1, start.getMonth() + 1);
    } else if (shape === 'year' && !partialYear) {
      result = { start: isoFromYmd(start.getFullYear() - 1, 1, 1), end: isoFromYmd(start.getFullYear() - 1, 12, 31) };
    } else {
      result = { start: shiftYearsIso(range.start, -1), end: shiftYearsIso(effEnd, -1) };
    }
  } else if (mode === 'pick') {
    const pick = options.pick || {};
    if (shape === 'month' && Number(pick.year) && Number(pick.month)) {
      const bounds = monthBoundsIsoLocal(Number(pick.year), Number(pick.month));
      const length = daysInMonthOf(Number(pick.year), Number(pick.month));
      const cappedDays = partialMonth ? Math.min(elapsedDays, length) : length;
      result = { start: bounds.start, end: addDaysIso(bounds.start, cappedDays - 1) };
    } else if (shape === 'year' && Number(pick.year)) {
      const year = Number(pick.year);
      result = {
        start: isoFromYmd(year, 1, 1),
        end: partialYear ? shiftYearsIso(effEnd, year - start.getFullYear()) : isoFromYmd(year, 12, 31),
      };
    } else {
      return resolveComparisonRange(range, 'previous_period', options);
    }
  } else if (shape === 'month') {
    const prevYear = start.getMonth() === 0 ? start.getFullYear() - 1 : start.getFullYear();
    const prevMonth = start.getMonth() === 0 ? 12 : start.getMonth();
    const bounds = monthBoundsIsoLocal(prevYear, prevMonth);
    const length = daysInMonthOf(prevYear, prevMonth);
    const cappedDays = partialMonth ? Math.min(elapsedDays, length) : length;
    result = { start: bounds.start, end: addDaysIso(bounds.start, cappedDays - 1) };
  } else if (shape === 'year') {
    const prevYear = start.getFullYear() - 1;
    result = {
      start: isoFromYmd(prevYear, 1, 1),
      end: partialYear ? shiftYearsIso(effEnd, -1) : isoFromYmd(prevYear, 12, 31),
    };
  } else {
    const newEnd = addDaysIso(range.start, -1);
    result = { start: addDaysIso(newEnd, -(elapsedDays - 1)), end: newEnd };
  }

  if (!result || sameRange(result, { start: range.start, end: effEnd }) || sameRange(result, range)) return null;
  if (todayIso && result.start > todayIso) return null;
  return result;
}

function formatDayMonthShort(iso) {
  const date = parseIsoDate(iso);
  return `${date.getDate()}. ${DA_MONTHS_SHORT[date.getMonth()]}`;
}

/** Plain-language range, e.g. "september 2026", "2026", "1.-30. okt 2026". */
function formatComparisonRangeLabel(range, todayIso) {
  if (!isRangeBounded(range)) return '';
  const shape = detectRangeShape(range, todayIso);
  const effEnd = effectiveRangeEnd(range, todayIso);
  const start = parseIsoDate(range.start);
  const end = parseIsoDate(effEnd);
  if (!start || !end) return '';
  const monthEnd = monthBoundsIsoLocal(start.getFullYear(), start.getMonth() + 1).end;
  if (shape === 'month' && effEnd >= monthEnd) {
    return `${DA_MONTHS[start.getMonth()]} ${start.getFullYear()}`;
  }
  if (shape === 'year' && effEnd >= isoFromYmd(start.getFullYear(), 12, 31)) {
    return String(start.getFullYear());
  }
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${start.getDate()}.\u2013${end.getDate()}. ${DA_MONTHS_SHORT[end.getMonth()]} ${end.getFullYear()}`;
  }
  if (start.getFullYear() === end.getFullYear()) {
    return `${formatDayMonthShort(range.start)} \u2013 ${formatDayMonthShort(effEnd)} ${end.getFullYear()}`;
  }
  return `${formatDayMonthShort(range.start)} ${start.getFullYear()} \u2013 ${formatDayMonthShort(effEnd)} ${end.getFullYear()}`;
}

/** Short label used for chart legends, e.g. "Sep 2026" or "2026". */
function formatComparisonSeriesLabel(range, todayIso) {
  if (!isRangeBounded(range)) return '';
  const shape = detectRangeShape(range, todayIso);
  const start = parseIsoDate(range.start);
  if (shape === 'month') {
    const short = DA_MONTHS_SHORT[start.getMonth()];
    return `${short.charAt(0).toUpperCase()}${short.slice(1)} ${start.getFullYear()}`;
  }
  if (shape === 'year') return String(start.getFullYear());
  return formatComparisonRangeLabel(range, todayIso);
}

/**
 * Words that tell the user exactly what is compared with what.
 * shortRef is used inside the card change line ("vs. august").
 */
function describeComparison({ current, comparison, mode = 'previous_period', todayIso = null }) {
  if (!isRangeBounded(current) || !isRangeBounded(comparison)) return null;
  const shape = detectRangeShape(current, todayIso);
  const currentLabel = formatComparisonRangeLabel(current, todayIso);
  const comparisonLabel = formatComparisonRangeLabel(comparison, todayIso);
  const currentYear = parseIsoDate(current.start).getFullYear();
  const comparisonStart = parseIsoDate(comparison.start);

  let relation;
  if (mode === 'previous_year') relation = 'samme periode sidste år';
  else if (mode === 'pick') relation = 'valgt periode';
  else if (shape === 'month') relation = 'forrige måned';
  else if (shape === 'year') relation = 'forrige år';
  else {
    const days = differenceInCalendarDays(parseIsoDate(current.start), parseIsoDate(effectiveRangeEnd(current, todayIso))) + 1;
    relation = `forrige ${days} dage`;
  }

  let shortRef;
  if (shape === 'month') {
    const name = DA_MONTHS[comparisonStart.getMonth()];
    shortRef = comparisonStart.getFullYear() === currentYear ? name : `${name} ${comparisonStart.getFullYear()}`;
  } else if (shape === 'year') {
    shortRef = String(comparisonStart.getFullYear());
  } else {
    shortRef = comparisonLabel;
  }

  return {
    shape,
    currentLabel,
    comparisonLabel,
    relation,
    shortRef,
    sentence: `${currentLabel} sammenlignet med ${comparisonLabel} (${relation})`,
    currentSeriesLabel: formatComparisonSeriesLabel(current, todayIso),
    comparisonSeriesLabel: formatComparisonSeriesLabel(comparison, todayIso),
  };
}

/**
 * Change between two metric values.
 * kind: 'unknown' (missing value) | 'new' (was 0, now > 0) | 'flat' | 'change'
 * isGood honours the metric direction ('up' good when rising, 'down' good when falling).
 * options.points: true for percent metrics -> difference in percentage points.
 */
function computeDelta(current, previous, direction = 'up', options = {}) {
  if (current == null || previous == null || Number.isNaN(Number(current)) || Number.isNaN(Number(previous))) {
    return { kind: 'unknown' };
  }
  const now = Number(current);
  const before = Number(previous);
  const diff = now - before;

  if (options.points) {
    if (Math.abs(diff) < 0.05) return { kind: 'flat' };
    return {
      kind: 'change',
      unit: 'pp',
      value: diff,
      direction: diff > 0 ? 'up' : 'down',
      isGood: direction === 'up' ? diff > 0 : diff < 0,
    };
  }

  if (before === 0) {
    if (now === 0) return { kind: 'flat' };
    return { kind: 'new', direction: now > 0 ? 'up' : 'down', isGood: direction === 'up' ? now > 0 : now < 0 };
  }
  const percent = (diff / Math.abs(before)) * 100;
  if (Math.abs(percent) < 0.05) return { kind: 'flat' };
  return {
    kind: 'change',
    unit: '%',
    value: percent,
    direction: diff > 0 ? 'up' : 'down',
    isGood: direction === 'up' ? diff > 0 : diff < 0,
  };
}

/** Pair buckets by position (day 1 with day 1, ...), like the CRM chart. */
function alignComparisonBuckets(currentBuckets = [], comparisonBuckets = []) {
  const length = Math.max(currentBuckets.length, comparisonBuckets.length);
  return Array.from({ length }, (_, index) => ({
    current: currentBuckets[index] || null,
    comparison: comparisonBuckets[index] || null,
  }));
}

/** Same bucket-size rule the server uses (<=31 days day, <=60 week, else month). */
function inferGranularityForRange(range) {
  const start = parseIsoDate(range?.start);
  const end = parseIsoDate(range?.end);
  if (!start || !end) return 'day';
  const days = differenceInCalendarDays(start, end) + 1;
  if (days <= 31) return 'day';
  if (days <= 60) return 'week';
  return 'month';
}

/** True when the comparison period ends before the first record we have. */
function isBeforeDataStart(comparison, earliestIso) {
  return Boolean(comparison?.end && earliestIso && comparison.end < earliestIso);
}

const performanceMergeApi = {
  mergePerformanceMarketing,
  totalsFromKpis,
  COMPARE_METRIC_DIRECTION,
  detectRangeShape,
  resolveComparisonRange,
  describeComparison,
  formatComparisonRangeLabel,
  formatComparisonSeriesLabel,
  computeDelta,
  alignComparisonBuckets,
  inferGranularityForRange,
  isBeforeDataStart,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = performanceMergeApi;
}

if (typeof globalThis !== 'undefined') {
  globalThis.PerformanceMerge = performanceMergeApi;
}
}());
