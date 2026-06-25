function parseFbAmount(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getFacebookPeriodKey(preset) {
  return preset === 'month' ? 'this_month' : 'yearly';
}

function getFacebookSpend(fbMetrics, preset) {
  if (!fbMetrics) return 0;
  const bucket = fbMetrics[getFacebookPeriodKey(preset)];
  return bucket ? parseFbAmount(bucket.spend) : 0;
}

function getPeriodLabel(preset) {
  if (preset === 'month') return 'This month';
  if (preset === 'year') return 'This year';
  return 'Till date (yearly ad data)';
}

function enrichKpisWithMarketing(kpis, fbMetrics, preset) {
  const spend = getFacebookSpend(fbMetrics, preset);
  const revenue = Number(kpis.totalRevenue) || 0;
  const bundlinje = Number(kpis.totalBundlinje) || 0;
  const leads = Number(kpis.totalLeads) || 0;
  const clientsWon = Number(kpis.clientsWon) || 0;

  return {
    ...kpis,
    adSpend: spend,
    adSpendLabel: getPeriodLabel(preset),
    adSpendSource: spend > 0 ? 'facebook' : 'none',
    roas: spend > 0 ? revenue / spend : 0,
    poas: spend > 0 ? bundlinje / spend : 0,
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

function parseMarketingDate(dateStr) {
  if (!dateStr) return null;
  const normalized = String(dateStr).trim();
  const date = normalized.includes('T')
    ? new Date(normalized)
    : new Date(`${normalized}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function monthKeyFromDate(dateStr) {
  const date = parseMarketingDate(dateStr);
  if (!date) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthsBetween(startStr, endStr) {
  const start = parseMarketingDate(startStr);
  const end = parseMarketingDate(endStr);
  if (!start || !end) return [];

  const months = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  while (cursor <= endMonth) {
    months.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
}

function addBucketSpend(spendByMonth, bucket) {
  if (!bucket?.date_start) return;
  const month = monthKeyFromDate(bucket.date_start);
  if (!month) return;
  spendByMonth.set(month, parseFbAmount(bucket.spend));
}

function buildMonthlyAdSpend(fbMetrics) {
  if (!fbMetrics) return [];

  if (Array.isArray(fbMetrics.monthly) && fbMetrics.monthly.length) {
    return fbMetrics.monthly
      .map((row) => ({ month: row.month, spend: parseFbAmount(row.spend) }))
      .filter((row) => row.month && row.spend > 0)
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  const spendByMonth = new Map();
  const yearly = fbMetrics.yearly;
  const monthKeys = yearly?.date_start && yearly?.date_stop
    ? monthsBetween(yearly.date_start, yearly.date_stop)
    : [];

  addBucketSpend(spendByMonth, fbMetrics.last_month);
  addBucketSpend(spendByMonth, fbMetrics.this_month);

  if (!monthKeys.length) {
    return Array.from(spendByMonth.entries())
      .map(([month, spend]) => ({ month, spend }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  const yearlyTotal = parseFbAmount(yearly.spend);
  const knownTotal = monthKeys.reduce((sum, month) => sum + (spendByMonth.get(month) || 0), 0);
  const unknownMonths = monthKeys.filter((month) => !spendByMonth.has(month));
  const remainder = Math.max(0, yearlyTotal - knownTotal);

  if (unknownMonths.length && remainder > 0) {
    const perMonth = remainder / unknownMonths.length;
    unknownMonths.forEach((month) => spendByMonth.set(month, perMonth));
  }

  return monthKeys.map((month) => ({
    month,
    spend: spendByMonth.get(month) || 0,
  }));
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
  buildMonthlyCostPerLead,
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
