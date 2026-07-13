const DEFAULT_TIMEZONE = (typeof process !== 'undefined' && process.env?.DASHBOARD_TIMEZONE)
  || 'Europe/Copenhagen';

function parseFbAmount(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getFacebookPeriodKey(preset) {
  if (preset === 'month') return 'this_month';
  if (preset === 'lastMonth') return 'last_month';
  return 'yearly';
}

function getCurrentMonthKey(timeZone = DEFAULT_TIMEZONE) {
  return calendarMonthKey(new Date(), timeZone);
}

function getPreviousMonthKey(timeZone = DEFAULT_TIMEZONE) {
  const current = getCurrentMonthKey(timeZone);
  const [year, month] = current.split('-').map(Number);
  if (!year || !month) return '';

  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear -= 1;
  }

  return `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
}

function getFacebookSpend(fbMetrics, preset) {
  if (!fbMetrics) return 0;
  const bucket = fbMetrics[getFacebookPeriodKey(preset)];
  return bucket ? parseFbAmount(bucket.spend) : 0;
}

function getSpendForPreset(fbMetrics, preset, monthlyAdSpend, timeZone = DEFAULT_TIMEZONE) {
  const monthly = monthlyAdSpend || buildMonthlyAdSpend(fbMetrics);
  const byMonth = new Map(monthly.map((row) => [row.month, Number(row.spend) || 0]));

  if (preset === 'month') {
    const spend = byMonth.get(getCurrentMonthKey(timeZone));
    if (spend > 0) return spend;
  } else if (preset === 'lastMonth') {
    const spend = byMonth.get(getPreviousMonthKey(timeZone));
    if (spend > 0) return spend;
  } else if (preset === 'year') {
    const year = getCurrentMonthKey(timeZone).slice(0, 4);
    const sum = monthly
      .filter((row) => row.month.startsWith(`${year}-`))
      .reduce((total, row) => total + (Number(row.spend) || 0), 0);
    if (sum > 0) return sum;
  }

  return getFacebookSpend(fbMetrics, preset);
}

function getLeadsForPreset(kpis, monthlyLeads, preset, timeZone = DEFAULT_TIMEZONE) {
  const rows = monthlyLeads || [];
  if (preset === 'month') {
    const row = rows.find((entry) => entry.month === getCurrentMonthKey(timeZone));
    if (row) return Number(row.count) || 0;
  } else if (preset === 'lastMonth') {
    const row = rows.find((entry) => entry.month === getPreviousMonthKey(timeZone));
    if (row) return Number(row.count) || 0;
  }
  return Number(kpis.totalLeads) || 0;
}

function getPeriodLabel(preset) {
  if (preset === 'month') return 'This month';
  if (preset === 'lastMonth') return 'Last month';
  if (preset === 'year') return 'This year';
  if (preset === 'custom') return 'Custom range';
  return 'Till date';
}

function formatMonthYearLabel(dateStr, timeZone = DEFAULT_TIMEZONE) {
  const date = parseMarketingDate(dateStr);
  if (!date) return '';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatShortDateLabel(dateStr, timeZone = DEFAULT_TIMEZONE) {
  const date = parseMarketingDate(dateStr);
  if (!date) return '';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function getPeriodLabelForRange(dateFrom, dateTo, timeZone = DEFAULT_TIMEZONE) {
  if (!dateFrom || !dateTo) return 'Custom range';

  const startMonth = monthKeyFromDate(dateFrom, timeZone);
  const endMonth = monthKeyFromDate(dateTo, timeZone);
  if (!startMonth || !endMonth) return 'Custom range';

  if (startMonth === endMonth) {
    const { start: monthStart, end: monthEnd } = monthBoundsIso(startMonth);
    if (dateFrom === monthStart && dateTo === monthEnd) {
      return formatMonthYearLabel(dateFrom, timeZone);
    }
    return `${formatShortDateLabel(dateFrom, timeZone)} – ${formatShortDateLabel(dateTo, timeZone)}`;
  }

  const startYear = startMonth.slice(0, 4);
  const endYear = endMonth.slice(0, 4);
  const startMonthLabel = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    month: 'short',
  }).format(parseMarketingDate(dateFrom));
  const endMonthLabel = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    month: 'short',
  }).format(parseMarketingDate(dateTo));

  if (startYear === endYear) {
    return `${startMonthLabel} – ${endMonthLabel} ${startYear}`;
  }

  return `${formatMonthYearLabel(dateFrom, timeZone)} – ${formatMonthYearLabel(dateTo, timeZone)}`;
}

function getSpendForDateRange(fbMetrics, dateFrom, dateTo, monthlyAdSpend, timeZone = DEFAULT_TIMEZONE) {
  if (!dateFrom || !dateTo) return 0;

  const monthly = monthlyAdSpend || buildMonthlyAdSpend(fbMetrics);
  const monthKeys = monthsBetween(dateFrom, dateTo, timeZone);
  if (!monthKeys.length) return 0;

  const byMonth = new Map(monthly.map((row) => [row.month, Number(row.spend) || 0]));
  const sum = monthKeys.reduce(
    (total, month) => total + getProratedMonthValue(byMonth.get(month) || 0, month, dateFrom, dateTo, timeZone),
    0,
  );
  if (sum > 0) return sum;

  return fbMetrics?.yearly ? parseFbAmount(fbMetrics.yearly.spend) : 0;
}

function daysInCalendarMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function daysBetweenInclusive(startIso, endIso) {
  const start = parseMarketingDate(startIso);
  const end = parseMarketingDate(endIso);
  if (!start || !end) return 0;
  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}

function monthBoundsIso(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = `${year}-${String(month).padStart(2, '0')}-${String(daysInCalendarMonth(year, month)).padStart(2, '0')}`;
  return { start, end };
}

function getTodayCalendarParts(timeZone = DEFAULT_TIMEZONE, date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  return {
    year: Number(parts.find((part) => part.type === 'year')?.value),
    month: Number(parts.find((part) => part.type === 'month')?.value),
    day: Number(parts.find((part) => part.type === 'day')?.value),
  };
}

function getTodayIso(timeZone = DEFAULT_TIMEZONE, date = new Date()) {
  const parts = getTodayCalendarParts(timeZone, date);
  if (!parts.year || !parts.month || !parts.day) return '';
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

function getProratedMonthRatio(monthKey, dateFrom, dateTo, timeZone = DEFAULT_TIMEZONE) {
  const { start: monthStart, end: monthEnd } = monthBoundsIso(monthKey);
  let effectiveStart = dateFrom > monthStart ? dateFrom : monthStart;
  let effectiveEnd = dateTo < monthEnd ? dateTo : monthEnd;

  const todayIso = getTodayIso(timeZone);
  if (effectiveEnd > todayIso) effectiveEnd = todayIso;
  if (effectiveStart > effectiveEnd) return 0;

  const daysSelected = daysBetweenInclusive(effectiveStart, effectiveEnd);
  if (daysSelected <= 0) return 0;

  if (monthKey === getCurrentMonthKey(timeZone)) {
    const todayDay = getTodayCalendarParts(timeZone).day;
    if (!todayDay) return 0;
    return Math.min(1, daysSelected / todayDay);
  }

  const [year, month] = monthKey.split('-').map(Number);
  const totalDays = daysInCalendarMonth(year, month);
  return totalDays > 0 ? daysSelected / totalDays : 0;
}

function getProratedMonthValue(monthValue, monthKey, dateFrom, dateTo, timeZone = DEFAULT_TIMEZONE) {
  if (!monthValue) return 0;
  return monthValue * getProratedMonthRatio(monthKey, dateFrom, dateTo, timeZone);
}

function getFacebookMetricsForDateRange(fbMetrics, dateFrom, dateTo, monthlyAdSpend, timeZone = DEFAULT_TIMEZONE) {
  if (!dateFrom || !dateTo || !fbMetrics) {
    return { clicks: 0, ctr: 0, cpc: 0 };
  }

  const monthKeys = new Set(monthsBetween(dateFrom, dateTo, timeZone));
  if (!monthKeys.size) return { clicks: 0, ctr: 0, cpc: 0 };

  let clicks = 0;
  let impressions = 0;
  for (const row of resolveMonthlyFromPayload(fbMetrics)) {
    const normalized = normalizeMonthlyRow(row);
    if (!normalized || !monthKeys.has(normalized.month)) continue;
    const ratio = getProratedMonthRatio(normalized.month, dateFrom, dateTo, timeZone);
    if (ratio <= 0) continue;
    clicks += parseFbAmount(pickField(row, ['clicks', 'Clicks'])) * ratio;
    impressions += parseFbAmount(pickField(row, ['impressions', 'Impressions'])) * ratio;
  }

  const spend = getSpendForDateRange(fbMetrics, dateFrom, dateTo, monthlyAdSpend, timeZone);
  return {
    clicks,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    cpc: clicks > 0 ? spend / clicks : 0,
  };
}

function enrichKpisWithMarketing(kpis, fbMetrics, preset, options = {}) {
  const {
    monthlyAdSpend = null,
    monthlyLeads = [],
    timeZone = DEFAULT_TIMEZONE,
    dateFrom = null,
    dateTo = null,
  } = options;

  const revenue = Number(kpis.totalRevenue) || 0;
  const bundlinje = Number(kpis.wonBundlinje) || 0;
  const clientsWon = Number(kpis.clientsWon) || 0;

  let spend;
  let adSpendLabel;
  let leads;
  let facebookClicks;
  let facebookCtr;
  let facebookCpc;

  if (preset === 'custom' && dateFrom && dateTo) {
    spend = getSpendForDateRange(fbMetrics, dateFrom, dateTo, monthlyAdSpend, timeZone);
    adSpendLabel = getPeriodLabelForRange(dateFrom, dateTo, timeZone);
    leads = Number(kpis.totalLeads) || 0;
    ({
      clicks: facebookClicks,
      ctr: facebookCtr,
      cpc: facebookCpc,
    } = getFacebookMetricsForDateRange(fbMetrics, dateFrom, dateTo, monthlyAdSpend, timeZone));
  } else {
    spend = getSpendForPreset(fbMetrics, preset, monthlyAdSpend, timeZone);
    adSpendLabel = getPeriodLabel(preset);
    leads = getLeadsForPreset(kpis, monthlyLeads, preset, timeZone);
    facebookClicks = getFacebookMetric(fbMetrics, preset, 'clicks');
    facebookCtr = getFacebookMetric(fbMetrics, preset, 'ctr');
    facebookCpc = getFacebookMetric(fbMetrics, preset, 'cpc');
  }

  return {
    ...kpis,
    adSpend: spend,
    adSpendLabel,
    adSpendNote: preset === 'custom' ? 'Avg value for days elapsed this month.' : null,
    adSpendSource: spend > 0 ? 'facebook' : 'none',
    roas: spend > 0 ? revenue / spend : 0,
    poas: spend > 0 ? bundlinje / spend : 0,
    roasDk: spend > 0 ? revenue - spend : 0,
    poasDk: spend > 0 ? bundlinje - spend : 0,
    costPerLead: spend > 0 && leads > 0 ? spend / leads : 0,
    costPerWonClient: spend > 0 && clientsWon > 0 ? spend / clientsWon : 0,
    facebookClicks,
    facebookCtr,
    facebookCpc,
  };
}

function getFacebookMetric(fbMetrics, preset, field) {
  if (!fbMetrics) return 0;
  const bucket = fbMetrics[getFacebookPeriodKey(preset)];
  if (!bucket) return 0;
  return parseFbAmount(bucket[field]);
}

function pickField(row, names) {
  if (!row || typeof row !== 'object') return null;
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
      return row[name];
    }
  }
  const normalizedNames = new Set(names.map((name) => String(name).toLowerCase().replace(/\s+/g, '_')));
  for (const [key, value] of Object.entries(row)) {
    if (value === undefined || value === null || value === '') continue;
    const normalizedKey = String(key).toLowerCase().replace(/\s+/g, '_');
    if (normalizedNames.has(normalizedKey)) return value;
  }
  return null;
}

function parseMarketingDate(dateStr) {
  if (!dateStr) return null;
  const normalized = String(dateStr).trim();
  if (!normalized) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const date = new Date(`${normalized}T12:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function calendarMonthKey(date, timeZone = DEFAULT_TIMEZONE) {
  if (!date || Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  return year && month ? `${year}-${month}` : '';
}

function monthKeyFromDate(dateStr, timeZone = DEFAULT_TIMEZONE) {
  const date = parseMarketingDate(dateStr);
  return calendarMonthKey(date, timeZone);
}

function monthsBetween(startStr, endStr, timeZone = DEFAULT_TIMEZONE) {
  const startKey = monthKeyFromDate(startStr, timeZone);
  const endKey = monthKeyFromDate(endStr, timeZone);
  if (!startKey || !endKey) return [];

  const months = [];
  let [year, month] = startKey.split('-').map(Number);
  const [endYear, endMonth] = endKey.split('-').map(Number);

  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push(`${year}-${String(month).padStart(2, '0')}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return months;
}

function normalizeMonthlyRow(row) {
  if (!row || typeof row !== 'object') return null;

  const spend = parseFbAmount(pickField(row, ['spend', 'Spend']));
  if (spend <= 0) return null;

  let month = pickField(row, ['month', 'Month']);
  if (!month) {
    const dateStart = pickField(row, ['date_start', 'Date Start', 'dateStart', 'DateStart']);
    month = monthKeyFromDate(dateStart);
  } else if (String(month).length > 7) {
    month = monthKeyFromDate(month);
  }

  if (!month) return null;
  return { month, spend };
}

function parseMonthlyArrayValue(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function resolveMonthlyFromPayload(data = {}) {
  const fromMonthly = parseMonthlyArrayValue(data.monthly);
  if (fromMonthly.length) return fromMonthly;
  return parseMonthlyArrayValue(data.monthly_json);
}

function normalizeMonthlyRows(fbMetrics) {
  const raw = resolveMonthlyFromPayload(fbMetrics);
  if (!raw.length) return [];

  const byMonth = new Map();
  for (const row of raw) {
    const normalized = normalizeMonthlyRow(row);
    if (normalized) byMonth.set(normalized.month, normalized.spend);
  }

  return Array.from(byMonth.entries())
    .map(([month, spend]) => ({ month, spend }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

function addBucketSpend(spendByMonth, bucket) {
  const normalized = normalizeMonthlyRow({
    month: bucket?.month,
    spend: bucket?.spend ?? bucket?.Spend,
    date_start: bucket?.date_start,
    'Date Start': bucket?.['Date Start'],
    dateStart: bucket?.dateStart,
  });
  if (!normalized) return;
  spendByMonth.set(normalized.month, normalized.spend);
}

function buildMonthlyAdSpend(fbMetrics) {
  if (!fbMetrics) return [];

  const spendByMonth = new Map();
  for (const row of normalizeMonthlyRows(fbMetrics)) {
    spendByMonth.set(row.month, row.spend);
  }

  // Overlay rolling Make buckets so KPI cards and charts share the same month totals.
  addBucketSpend(spendByMonth, fbMetrics.last_month);
  addBucketSpend(spendByMonth, fbMetrics.this_month);

  return Array.from(spendByMonth.entries())
    .map(([month, spend]) => ({ month, spend }))
    .filter((row) => row.spend > 0)
    .sort((a, b) => a.month.localeCompare(b.month));
}

function buildMonthlyCostPerLead(monthlyAdSpend, monthlyLeads) {
  const spendByMonth = new Map((monthlyAdSpend || []).map((row) => [row.month, Number(row.spend) || 0]));
  const leadsByMonth = new Map((monthlyLeads || []).map((row) => [row.month, Number(row.count) || 0]));
  const months = [...new Set([...spendByMonth.keys(), ...leadsByMonth.keys()])].sort();

  return months
    .map((month) => {
      const spend = spendByMonth.get(month) || 0;
      const leads = leadsByMonth.get(month) || 0;
      return {
        month,
        cpl: spend > 0 && leads > 0 ? spend / leads : 0,
      };
    })
    .filter((row) => row.cpl > 0);
}

function applyMarketingToDashboard(data, fbMetrics, preset, options = {}) {
  const timeZone = options.timeZone || data.account?.timezone || DEFAULT_TIMEZONE;
  const monthlyAdSpend = buildMonthlyAdSpend(fbMetrics);
  const kpis = enrichKpisWithMarketing(data.kpis, fbMetrics, preset, {
    monthlyAdSpend,
    monthlyLeads: data.monthlyLeads || [],
    timeZone,
    dateFrom: options.dateFrom || null,
    dateTo: options.dateTo || null,
  });

  return {
    ...data,
    kpis,
    monthlyAdSpend,
    monthlyCostPerLead: buildMonthlyCostPerLead(monthlyAdSpend, data.monthlyLeads || []),
    facebookMetrics: fbMetrics,
    marketingPreset: preset,
  };
}

const marketingMetricsApi = {
  applyMarketingToDashboard,
  enrichKpisWithMarketing,
  buildMonthlyAdSpend,
  buildMonthlyCostPerLead,
  normalizeMonthlyRow,
  normalizeMonthlyRows,
  parseMonthlyArrayValue,
  resolveMonthlyFromPayload,
  calendarMonthKey,
  monthKeyFromDate,
  getCurrentMonthKey,
  getPreviousMonthKey,
  getSpendForPreset,
  getSpendForDateRange,
  getProratedMonthRatio,
  getTodayIso,
  getPeriodLabelForRange,
  formatShortDateLabel,
  getLeadsForPreset,
  getFacebookPeriodKey,
  getFacebookSpend,
  getFacebookMetricsForDateRange,
  monthsBetween,
  parseFbAmount,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = marketingMetricsApi;
}

if (typeof window !== 'undefined') {
  window.MarketingMetrics = marketingMetricsApi;
}
