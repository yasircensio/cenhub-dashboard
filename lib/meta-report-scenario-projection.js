const {
  META_REPORT_SCENARIO_FIXED_ELASTICITY,
  resolveScenarioElasticity,
  resolveScenarioMonthWindowLimit,
} = require('./meta-report-scenario-settings');

function parseAmount(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundMoney(value) {
  return Math.round(parseAmount(value) * 100) / 100;
}

function roundRatio(value) {
  return Math.round(parseAmount(value) * 100000000) / 100000000;
}

function linearRegression(points = []) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: 0, r: 0 };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  let sumYY = 0;

  for (const point of points) {
    const x = parseAmount(point.x);
    const y = parseAmount(point.y);
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
    sumYY += y * y;
  }

  const denom = (n * sumXX) - (sumX * sumX);
  if (denom === 0) return { slope: 0, intercept: sumY / n, r: 0 };

  const slope = ((n * sumXY) - (sumX * sumY)) / denom;
  const intercept = (sumY - (slope * sumX)) / n;
  const rDenom = Math.sqrt(((n * sumXX) - (sumX * sumX)) * ((n * sumYY) - (sumY * sumY)));
  const r = rDenom > 0 ? ((n * sumXY) - (sumX * sumY)) / rDenom : 0;

  return { slope, intercept, r };
}

const MIN_TREND_MONTHS = 4;
const MIN_EFFICIENCY_MONTHS = 2;
const MAD_MULTIPLIER = 2.5;
const MAX_MONTHLY_TREND = 0.03;
const TREND_R_THRESHOLD = 0.35;
const HOT_STREAK_THRESHOLD = 0.15;

function parseDateOnly(value) {
  if (!value) return null;
  const text = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const date = new Date(`${text}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function isIncompleteMonth(point, asOfDate = new Date()) {
  const periodEnd = parseDateOnly(point.periodEnd);
  if (!periodEnd) return true;
  const today = formatDateOnly(asOfDate);
  return String(point.periodEnd).slice(0, 10) >= today;
}

function isAdActiveMonth(point) {
  const spend = parseAmount(point.spend);
  const leads = parseAmount(point.leads);
  return spend > 0 && leads > 0;
}

function monthWeight(index, count) {
  if (count <= 1) return 1;
  return index + 1;
}

function median(values = []) {
  const sorted = values.filter((value) => Number.isFinite(value)).slice().sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
  return sorted[mid];
}

function mad(values = []) {
  const med = median(values);
  const deviations = values.map((value) => Math.abs(value - med));
  return median(deviations);
}

function winsorizeValue(value, med, spread) {
  if (!Number.isFinite(value) || spread <= 0) return value;
  const lower = med - (MAD_MULTIPLIER * spread);
  const upper = med + (MAD_MULTIPLIER * spread);
  return Math.min(upper, Math.max(lower, value));
}

function winsorizeMonths(months = []) {
  if (months.length < 3) {
    return { months, outliersAdjusted: 0 };
  }

  const cplValues = months.map((point) => parseAmount(point.cpl));
  const leadValues = months.map((point) => parseAmount(point.leads));
  const cplMed = median(cplValues);
  const leadMed = median(leadValues);
  const cplMad = mad(cplValues);
  const leadMad = mad(leadValues);

  let outliersAdjusted = 0;
  const adjusted = months.map((point) => {
    const next = { ...point };
    let changed = false;

    if (cplMad > 0) {
      const cappedCpl = winsorizeValue(parseAmount(point.cpl), cplMed, cplMad);
      if (cappedCpl !== parseAmount(point.cpl)) {
        next.cpl = roundMoney(cappedCpl);
        next.leads = Math.max(1, Math.round(parseAmount(point.spend) / cappedCpl));
        changed = true;
      }
    }

    if (leadMad > 0) {
      const cappedLeads = winsorizeValue(parseAmount(point.leads), leadMed, leadMad);
      if (Math.round(cappedLeads) !== Math.round(parseAmount(point.leads))) {
        next.leads = Math.max(1, Math.round(cappedLeads));
        changed = true;
      }
    }

    if (changed) outliersAdjusted += 1;
    return next;
  });

  return { months: adjusted, outliersAdjusted };
}

function enrichMonthPoint(point) {
  const spend = parseAmount(point.spend);
  const leads = parseAmount(point.leads);
  const wonLeads = parseAmount(point.wonLeads);
  const avgLeadValue = parseAmount(point.avgLeadValue);
  const avgProfitPerWon = parseAmount(point.avgProfitPerWon);
  const cpl = leads > 0 ? roundMoney(spend / leads) : 0;
  const totalLeadValue = roundMoney(wonLeads * avgLeadValue);
  const efficiencyIndex = spend > 0 ? totalLeadValue / spend : 0;

  return {
    ...point,
    spend,
    leads,
    wonLeads,
    avgLeadValue,
    avgProfitPerWon,
    cpl,
    totalLeadValue,
    efficiencyIndex,
  };
}

function prepareScenarioSeries(series = [], {
  windowMonths = '6',
  asOfDate = new Date(),
  smoothOutliers = true,
} = {}) {
  const windowLimit = resolveScenarioMonthWindowLimit(windowMonths);
  const adActive = series
    .filter(isAdActiveMonth)
    .filter((point) => !isIncompleteMonth(point, asOfDate))
    .map(enrichMonthPoint);

  const monthsAvailable = adActive.length;
  const windowed = windowLimit === Infinity
    ? adActive
    : adActive.slice(-windowLimit);

  const winsorized = smoothOutliers ? winsorizeMonths(windowed) : { months: windowed, outliersAdjusted: 0 };

  return {
    months: winsorized.months,
    monthsAvailable,
    monthsUsed: winsorized.months.length,
    outliersAdjusted: winsorized.outliersAdjusted,
    confidence: resolveScenarioConfidence(winsorized.months.length),
  };
}

function computeRecencyWeightedEfficiency(months = []) {
  if (months.length < MIN_EFFICIENCY_MONTHS) {
    return null;
  }

  let weightedSpend = 0;
  let weightedLeads = 0;
  let weightedWon = 0;
  let weightedLeadValue = 0;
  let weightedProfit = 0;
  let totalSpend = 0;

  months.forEach((point, index) => {
    const weight = monthWeight(index, months.length);
    weightedSpend += parseAmount(point.spend) * weight;
    weightedLeads += parseAmount(point.leads) * weight;
    weightedWon += parseAmount(point.wonLeads) * weight;
    weightedLeadValue += parseAmount(point.wonLeads) * parseAmount(point.avgLeadValue) * weight;
    weightedProfit += parseAmount(point.wonLeads) * parseAmount(point.avgProfitPerWon) * weight;
    totalSpend += parseAmount(point.spend);
  });

  const avgCpl = weightedLeads > 0 ? roundMoney(weightedSpend / weightedLeads) : 0;
  const winRate = weightedLeads > 0 ? roundRatio(weightedWon / weightedLeads) : 0;
  const avgLeadValue = weightedWon > 0 ? roundMoney(weightedLeadValue / weightedWon) : 0;
  const avgProfitPerWon = weightedWon > 0 ? roundMoney(weightedProfit / weightedWon) : 0;
  const avgMonthlySpend = months.length > 0 ? roundMoney(totalSpend / months.length) : 0;

  return {
    avgCpl,
    winRate,
    avgLeadValue,
    avgProfitPerWon,
    avgMonthlySpend,
  };
}

function computePooledEfficiency(months = []) {
  if (!months.length) return null;

  let totalSpend = 0;
  let totalLeads = 0;
  let totalWon = 0;
  let weightedLeadValue = 0;
  let weightedProfit = 0;

  for (const point of months) {
    const spend = parseAmount(point.spend);
    const leads = parseAmount(point.leads);
    const wonLeads = parseAmount(point.wonLeads);
    totalSpend += spend;
    totalLeads += leads;
    totalWon += wonLeads;
    weightedLeadValue += wonLeads * parseAmount(point.avgLeadValue);
    weightedProfit += wonLeads * parseAmount(point.avgProfitPerWon);
  }

  return {
    avgCpl: totalLeads > 0 ? roundMoney(totalSpend / totalLeads) : 0,
    winRate: totalLeads > 0 ? roundRatio(totalWon / totalLeads) : 0,
    avgLeadValue: totalWon > 0 ? roundMoney(weightedLeadValue / totalWon) : 0,
    avgProfitPerWon: totalWon > 0 ? roundMoney(weightedProfit / totalWon) : 0,
    avgMonthlySpend: months.length > 0 ? roundMoney(totalSpend / months.length) : 0,
  };
}

function blendEfficiency(left, right, leftWeight = 0.5) {
  if (!left || !right) return left || right;
  const rightWeight = 1 - leftWeight;
  return {
    avgCpl: roundMoney((left.avgCpl * leftWeight) + (right.avgCpl * rightWeight)),
    winRate: roundRatio((left.winRate * leftWeight) + (right.winRate * rightWeight)),
    avgLeadValue: roundMoney((left.avgLeadValue * leftWeight) + (right.avgLeadValue * rightWeight)),
    avgProfitPerWon: roundMoney((left.avgProfitPerWon * leftWeight) + (right.avgProfitPerWon * rightWeight)),
    avgMonthlySpend: roundMoney((left.avgMonthlySpend * leftWeight) + (right.avgMonthlySpend * rightWeight)),
  };
}

function computeSpendAdjustedResiduals(months = [], elasticity = 0.75) {
  const spends = months.map((point) => parseAmount(point.spend)).filter((value) => value > 0);
  const medianSpend = median(spends) || 1;

  return months.map((point, index) => {
    const spend = parseAmount(point.spend);
    const efficiencyIndex = parseAmount(point.efficiencyIndex);
    const safeEfficiency = efficiencyIndex > 0 ? efficiencyIndex : 0.000001;
    const safeSpend = spend > 0 ? spend : medianSpend;
    const residual = Math.log(safeEfficiency) - (elasticity * Math.log(safeSpend / medianSpend));
    return { x: index, y: residual, monthKey: point.monthKey };
  });
}

function computeMonthlyTrendRate(months = [], elasticity = 0.75, { dampenHotStreak = false } = {}) {
  if (months.length < MIN_TREND_MONTHS) {
    return { trendRate: 0, trendDirection: 'flat', trendRatePct: 0, trendR: 0 };
  }

  const residuals = computeSpendAdjustedResiduals(months, elasticity);
  const { slope, r } = linearRegression(residuals);
  let trendRate = Math.max(-MAX_MONTHLY_TREND, Math.min(MAX_MONTHLY_TREND, slope));

  if (dampenHotStreak) {
    const efficiencyValues = months.map((point) => parseAmount(point.efficiencyIndex)).filter((value) => value > 0);
    const fullMedian = median(efficiencyValues);
    const recent = months.slice(-3);
    const recentAvg = recent.reduce((sum, point) => sum + parseAmount(point.efficiencyIndex), 0) / recent.length;

    if (fullMedian > 0 && recentAvg > fullMedian * (1 + HOT_STREAK_THRESHOLD) && trendRate > 0) {
      trendRate *= 0.5;
    }
  }

  let trendDirection = 'flat';
  if (Math.abs(trendRate) >= 0.005) {
    trendDirection = trendRate > 0 ? 'up' : 'down';
  }

  return {
    trendRate,
    trendDirection,
    trendRatePct: roundRatio(trendRate * 100),
    trendR: roundRatio(r),
  };
}

function calibrateElasticity() {
  return META_REPORT_SCENARIO_FIXED_ELASTICITY;
}

function computeScenarioEfficiency(months = [], {
  blendHistory = false,
  includeTrend = false,
  cautionStrongMonths = false,
} = {}) {
  const presetElasticity = resolveScenarioElasticity();
  const elasticity = calibrateElasticity();
  const recencyWeighted = computeRecencyWeightedEfficiency(months);
  const pooled = computePooledEfficiency(months);

  if (!recencyWeighted || recencyWeighted.avgCpl <= 0) {
    return {
      efficiency: null,
      elasticity,
      presetElasticity,
      trendRate: 0,
      trendDirection: 'flat',
      trendRatePct: 0,
      trendR: 0,
    };
  }

  const efficiency = blendHistory ? blendEfficiency(pooled, recencyWeighted, 0.5) : recencyWeighted;
  let trendInfo = { trendRate: 0, trendDirection: 'flat', trendRatePct: 0, trendR: 0 };

  if (includeTrend) {
    const computedTrend = computeMonthlyTrendRate(months, elasticity, { dampenHotStreak: cautionStrongMonths });
    if (Math.abs(computedTrend.trendR) >= TREND_R_THRESHOLD) {
      trendInfo = computedTrend;
    }
  }

  return {
    efficiency,
    elasticity,
    presetElasticity,
    trendRate: trendInfo.trendRate,
    trendDirection: trendInfo.trendDirection,
    trendRatePct: trendInfo.trendRatePct,
    trendR: trendInfo.trendR,
  };
}

function resolveScenarioConfidence(monthsUsed = 0) {
  const count = Number.parseInt(monthsUsed, 10) || 0;
  if (count < 4) return 'low';
  if (count < 7) return 'medium';
  return 'high';
}

function projectScenarioAtSpend({
  baselineSpend,
  spend,
  efficiency,
  elasticity = 0.75,
  trendAdj = 1,
  hasBottomline = false,
} = {}) {
  const baseSpend = parseAmount(baselineSpend);
  const amount = parseAmount(spend);

  if (amount <= 0 || baseSpend <= 0 || !efficiency || efficiency.avgCpl <= 0) {
    return {
      spend: 0,
      leads: 0,
      wonLeads: 0,
      totalLeadValue: 0,
      roasKr: 0,
      roasX: 0,
      poasKr: null,
      poasX: null,
    };
  }

  const baselineLeads = baseSpend / efficiency.avgCpl;
  const spendMultiplier = amount / baseSpend;
  const adjustedTrend = parseAmount(trendAdj) > 0 ? parseAmount(trendAdj) : 1;
  const leads = Math.max(0, Math.round(baselineLeads * (spendMultiplier ** elasticity) * adjustedTrend));
  const wonLeads = Math.round(leads * efficiency.winRate);
  const totalLeadValue = roundMoney(wonLeads * efficiency.avgLeadValue);
  const roasKr = roundMoney(totalLeadValue - amount);
  const roasX = amount > 0 ? roundRatio(roasKr / amount) : 0;

  let poasKr = null;
  let poasX = null;
  if (hasBottomline && efficiency.avgProfitPerWon > 0) {
    const totalProfit = roundMoney(wonLeads * efficiency.avgProfitPerWon);
    poasKr = roundMoney(totalProfit - amount);
    poasX = amount > 0 ? roundRatio(poasKr / amount) : 0;
  }

  return {
    spend: amount,
    leads,
    wonLeads,
    totalLeadValue,
    roasKr,
    roasX,
    poasKr,
    poasX,
  };
}

function resolveScenarioBaselineSpend(series, preparedMonths, {
  baselineMode = 'year',
  activeMonthKey = null,
} = {}) {
  if (baselineMode === 'month' && activeMonthKey) {
    const month = preparedMonths.find((point) => point.monthKey === activeMonthKey);
    if (month && parseAmount(month.spend) > 0) {
      return parseAmount(month.spend);
    }
    const fromSeries = series.find((point) => point.monthKey === activeMonthKey);
    if (fromSeries && parseAmount(fromSeries.spend) > 0) {
      return parseAmount(fromSeries.spend);
    }
  }

  if (preparedMonths.length > 0) {
    const total = preparedMonths.reduce((sum, point) => sum + parseAmount(point.spend), 0);
    return roundMoney(total / preparedMonths.length);
  }

  return 0;
}

function projectScenario({
  series = [],
  baselineSpend,
  multiplier = 1,
  hasBottomline = false,
  blendHistory = false,
  includeTrend = false,
  cautionStrongMonths = false,
  monthWindow = '6',
  baselineMode = 'year',
  activeMonthKey = null,
  asOfDate = new Date(),
  smoothOutliers = true,
} = {}) {
  const prepared = prepareScenarioSeries(series, { windowMonths: monthWindow, asOfDate, smoothOutliers });
  const efficiencyResult = computeScenarioEfficiency(prepared.months, { blendHistory, includeTrend, cautionStrongMonths });
  const resolvedBaselineSpend = baselineSpend != null
    ? parseAmount(baselineSpend)
    : resolveScenarioBaselineSpend(series, prepared.months, { baselineMode, activeMonthKey });

  const mult = parseAmount(multiplier) || 1;
  const { efficiency, elasticity, trendRate } = efficiencyResult;

  if (!efficiency || efficiency.avgCpl <= 0 || resolvedBaselineSpend <= 0 || prepared.monthsUsed < MIN_EFFICIENCY_MONTHS) {
    return {
      ...efficiencyResult,
      prepared,
      baseline: projectScenarioAtSpend({ baselineSpend: 0, spend: 0, efficiency }),
      projected: projectScenarioAtSpend({ baselineSpend: 0, spend: 0, efficiency }),
      projectedConservative: null,
      projectedOptimistic: null,
      multiplier: mult,
      baselineSpend: resolvedBaselineSpend,
      hasBottomline,
      insufficientData: true,
    };
  }

  const trendAdj = Math.exp(trendRate * 1);
  const baseline = projectScenarioAtSpend({
    baselineSpend: resolvedBaselineSpend,
    spend: resolvedBaselineSpend,
    efficiency,
    elasticity,
    trendAdj: 1,
    hasBottomline,
  });
  const projected = projectScenarioAtSpend({
    baselineSpend: resolvedBaselineSpend,
    spend: roundMoney(resolvedBaselineSpend * mult),
    efficiency,
    elasticity,
    trendAdj,
    hasBottomline,
  });

  const projectedConservative = projectScenarioAtSpend({
    baselineSpend: resolvedBaselineSpend,
    spend: roundMoney(resolvedBaselineSpend * mult),
    efficiency,
    elasticity,
    trendAdj: Math.exp(Math.min(trendRate, 0) * 1),
    hasBottomline,
  });
  const projectedOptimistic = projectScenarioAtSpend({
    baselineSpend: resolvedBaselineSpend,
    spend: roundMoney(resolvedBaselineSpend * mult),
    efficiency,
    elasticity,
    trendAdj: Math.exp(Math.max(trendRate, 0) * 1),
    hasBottomline,
  });

  return {
    ...efficiencyResult,
    efficiency,
    prepared,
    baseline,
    projected,
    projectedConservative,
    projectedOptimistic,
    multiplier: mult,
    baselineSpend: resolvedBaselineSpend,
    hasBottomline,
    insufficientData: false,
  };
}

const SCENARIO_MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthKeyFromAsOfDate(asOfDate = new Date()) {
  const date = asOfDate instanceof Date ? asOfDate : new Date(asOfDate);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function addMonthsToMonthKey(monthKey, offset = 0) {
  const normalized = String(monthKey || '').trim();
  if (!/^\d{4}-\d{2}$/.test(normalized)) return null;
  const [year, month] = normalized.split('-').map(Number);
  const date = new Date(year, (month - 1) + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabelFromMonthKey(monthKey) {
  const month = Number.parseInt(String(monthKey || '').slice(5, 7), 10);
  return SCENARIO_MONTH_LABELS[month - 1] || monthKey;
}

function buildScenarioProjectionMonthKeys(count = 4, asOfDate = new Date()) {
  // Always the next N calendar months after asOfDate's month (e.g. Jan → Feb–May).
  const currentKey = monthKeyFromAsOfDate(asOfDate);
  if (!currentKey || count <= 0) return [];
  const keys = [];
  for (let step = 1; step <= count; step += 1) {
    keys.push(addMonthsToMonthKey(currentKey, step));
  }
  return keys;
}

function monthKeysBetweenExclusive(startKey, endKey) {
  if (!startKey || !endKey || startKey >= endKey) return [];
  const keys = [];
  let cursor = addMonthsToMonthKey(startKey, 1);
  while (cursor && cursor < endKey) {
    keys.push(cursor);
    cursor = addMonthsToMonthKey(cursor, 1);
  }
  return keys;
}

function buildScenarioProjectionSteps(projection, {
  months = 4,
  hasBottomline = false,
  asOfDate = new Date(),
  targetMultiplier = null,
} = {}) {
  if (!projection || projection.insufficientData) return [];

  const baseSpend = parseAmount(projection.baselineSpend);
  const targetMult = parseAmount(targetMultiplier ?? projection.multiplier) || 1;
  const efficiency = projection.efficiency;
  const elasticity = projection.elasticity || 0.75;
  const trendRate = projection.trendRate || 0;
  const projectionMonthKeys = buildScenarioProjectionMonthKeys(months, asOfDate);
  const steps = [];

  for (let step = 1; step <= months; step += 1) {
    const stepMult = targetMult;
    const spend = roundMoney(baseSpend * stepMult);
    const trendAdj = Math.exp(trendRate * step);
    const metrics = projectScenarioAtSpend({
      baselineSpend: baseSpend,
      spend,
      efficiency,
      elasticity,
      trendAdj,
      hasBottomline,
    });
    const monthKey = projectionMonthKeys[step - 1] || null;

    steps.push({
      label: monthKey ? monthLabelFromMonthKey(monthKey) : `+${step} mo`,
      monthKey,
      spendMultiplier: roundRatio(stepMult),
      spend: metrics.spend,
      leads: metrics.leads,
      wonLeads: metrics.wonLeads,
      totalLeadValue: metrics.totalLeadValue,
      roasKr: metrics.roasKr,
      roasX: metrics.roasX,
      poasKr: metrics.poasKr,
      poasX: metrics.poasX,
    });
  }

  return steps;
}

module.exports = {
  MIN_EFFICIENCY_MONTHS,
  MIN_TREND_MONTHS,
  addMonthsToMonthKey,
  buildScenarioProjectionMonthKeys,
  buildScenarioProjectionSteps,
  computeScenarioEfficiency,
  enrichMonthPoint,
  isAdActiveMonth,
  isIncompleteMonth,
  monthKeyFromAsOfDate,
  monthKeysBetweenExclusive,
  monthLabelFromMonthKey,
  prepareScenarioSeries,
  projectScenario,
  projectScenarioAtSpend,
  resolveScenarioBaselineSpend,
  resolveScenarioConfidence,
};
