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

function getFacebookSpend(fbMetrics, preset) {
  if (!fbMetrics) return 0;
  const bucket = fbMetrics[getFacebookPeriodKey(preset)];
  return bucket ? parseFbAmount(bucket.spend) : 0;
}

function getPeriodLabel(preset) {
  if (preset === 'month') return 'This month';
  if (preset === 'lastMonth') return 'Last month';
  if (preset === 'year') return 'This year';
  return 'Till date (yearly ad data)';
}

function enrichKpisWithMarketing(kpis, fbMetrics, preset) {
  const spend = getFacebookSpend(fbMetrics, preset);
  const revenue = Number(kpis.totalRevenue) || 0;
  const bundlinje = Number(kpis.wonBundlinje) || 0;
  const leads = Number(kpis.totalLeads) || 0;
  const clientsWon = Number(kpis.clientsWon) || 0;

  return {
    ...kpis,
    adSpend: spend,
    adSpendLabel: getPeriodLabel(preset),
    adSpendSource: spend > 0 ? 'facebook' : 'none',
    roas: spend > 0 ? revenue / spend : 0,
    poas: spend > 0 ? bundlinje / spend : 0,
    roasDk: spend > 0 ? revenue - spend : 0,
    poasDk: spend > 0 ? bundlinje - spend : 0,
    costPerLead: spend > 0 && leads > 0 ? spend / leads : 0,
    costPerWonClient: spend > 0 && clientsWon > 0 ? spend / clientsWon : 0,
    facebookClicks: getFacebookMetric(fbMetrics, preset, 'clicks'),
    facebookCtr: getFacebookMetric(fbMetrics, preset, 'ctr'),
    facebookCpc: getFacebookMetric(fbMetrics, preset, 'cpc'),
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

  const fromMonthly = normalizeMonthlyRows(fbMetrics);
  if (fromMonthly.length) return fromMonthly;

  const spendByMonth = new Map();
  addBucketSpend(spendByMonth, fbMetrics.last_month);
  addBucketSpend(spendByMonth, fbMetrics.this_month);

  // Only months with real Facebook buckets — no estimated split of yearly total.
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

function applyMarketingToDashboard(data, fbMetrics, preset) {
  const kpis = enrichKpisWithMarketing(data.kpis, fbMetrics, preset);
  const monthlyAdSpend = buildMonthlyAdSpend(fbMetrics);

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
  getFacebookPeriodKey,
  getFacebookSpend,
  parseFbAmount,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = marketingMetricsApi;
}

if (typeof window !== 'undefined') {
  window.MarketingMetrics = marketingMetricsApi;
}
