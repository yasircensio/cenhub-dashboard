const { isLeadActionType: isMetaLeadActionType } = require('./meta-insights');

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

function isLeadActionType(actionType) {
  return isMetaLeadActionType(actionType);
}

function computeConversionRatePercent(clicks, impressions) {
  const clickCount = parseAmount(clicks);
  const impressionCount = parseAmount(impressions);
  if (impressionCount <= 0) return 0;
  return roundRatio((clickCount / impressionCount) * 100);
}

function computeMetaReportMetrics(input = {}) {
  const spend = parseAmount(input.spend);
  const clicks = parseAmount(input.clicks);
  const impressions = parseAmount(input.impressions);
  const reach = parseAmount(input.reach);
  const cpm = parseAmount(input.cpm);
  const leads = parseAmount(input.leads);
  const wonLeads = parseAmount(input.wonLeads);
  const avgLeadValue = parseAmount(input.avgLeadValue);
  const avgProfitPerWon = parseAmount(input.avgProfitPerWon);
  const showBottomline = Boolean(input.showBottomline);
  const feeMode = input.feeMode || (input.feeEnabled ? 'performance' : null);
  const feePercent = parseAmount(input.feePercent) || 20;
  const marketingFeeAmount = parseAmount(input.marketingFeeAmount);
  const feeActive = Boolean(showBottomline && feeMode);

  const totalLeadValue = roundMoney(wonLeads * avgLeadValue);
  const cpl = leads > 0 ? roundMoney(spend / leads) : 0;
  const cac = wonLeads > 0 ? roundMoney(spend / wonLeads) : 0;
  // Sheet: ROAS kr = lead value - spend; ROAS % (x) = ROAS kr / spend
  const roasKr = roundMoney(totalLeadValue - spend);
  const roasX = spend > 0 ? roundRatio(roasKr / spend) : 0;

  const totalProfit = roundMoney(wonLeads * avgProfitPerWon);
  // Sheet: POAS kr = total profit - spend; POAS % (x) = POAS kr / spend
  const poasKr = roundMoney(totalProfit - spend);
  const poasX = spend > 0 ? roundRatio(poasKr / spend) : 0;

  let censioFee = 0;
  let feeLabel = '';
  if (feeActive && feeMode === 'performance') {
    censioFee = roundMoney(Math.max(0, poasKr) * (feePercent / 100));
    feeLabel = `Censio performance fee (${roundMoney(feePercent)}%)`;
  } else if (feeActive && feeMode === 'marketing') {
    censioFee = roundMoney(marketingFeeAmount);
    feeLabel = 'Censio marketing fee';
  }

  // Sheet (Jan): POI = POAS - fee; POI % (x) = POI / spend
  const poiKr = roundMoney(poasKr - censioFee);
  const poiX = spend > 0 ? roundRatio(poiKr / spend) : 0;

  const emptyMonth = spend <= 0 && impressions <= 0 && clicks <= 0 && leads <= 0;

  return {
    inputs: {
      wonLeads,
      avgLeadValue,
      avgProfitPerWon,
    },
    meta: {
      spend,
      cpm,
      impressions,
      reach,
      clicks,
      conversionRatePercent: computeConversionRatePercent(clicks, impressions),
      leads,
      emptyMonth,
    },
    topline: {
      leads,
      cpl,
      wonLeads,
      totalLeadValue,
      avgLeadValue,
      cac,
      roasKr,
      roasX,
    },
    bottomline: showBottomline ? {
      leads,
      wonLeads,
      totalLeadValue,
      avgLeadValue,
      cac,
      totalProfit,
      avgProfitPerWon,
      poasKr,
      poasX,
      censioFee,
      feeMode: feeActive ? feeMode : null,
      feePercent: feeActive && feeMode === 'performance' ? feePercent : 0,
      marketingFeeAmount: feeActive && feeMode === 'marketing' ? marketingFeeAmount : 0,
      feeLabel,
      poiKr,
      poiX,
    } : null,
  };
}

function aggregateMetaReportSeriesEfficiency(series = []) {
  let totalSpend = 0;
  let totalLeads = 0;
  let totalWon = 0;
  let weightedLeadValue = 0;
  let weightedProfit = 0;

  for (const point of series) {
    const spend = parseAmount(point.spend);
    const leads = parseAmount(point.leads);
    const wonLeads = parseAmount(point.wonLeads);
    if (spend <= 0 && leads <= 0) continue;

    totalSpend += spend;
    totalLeads += leads;
    totalWon += wonLeads;
    weightedLeadValue += wonLeads * parseAmount(point.avgLeadValue);
    weightedProfit += wonLeads * parseAmount(point.avgProfitPerWon);
  }

  const spendMonths = series.filter((point) => parseAmount(point.spend) > 0).length;
  const avgCpl = totalLeads > 0 ? roundMoney(totalSpend / totalLeads) : 0;
  const winRate = totalLeads > 0 ? roundRatio(totalWon / totalLeads) : 0;
  const avgLeadValue = totalWon > 0 ? roundMoney(weightedLeadValue / totalWon) : 0;
  const avgProfitPerWon = totalWon > 0 ? roundMoney(weightedProfit / totalWon) : 0;
  const avgMonthlySpend = spendMonths > 0 ? roundMoney(totalSpend / spendMonths) : 0;

  return {
    avgCpl,
    winRate,
    avgLeadValue,
    avgProfitPerWon,
    avgMonthlySpend,
    totalSpend,
    totalLeads,
    totalWon,
  };
}

function projectMetaReportBudgetAtSpend(spend, efficiency, hasBottomline = false) {
  const amount = parseAmount(spend);
  if (amount <= 0 || efficiency.avgCpl <= 0) {
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

  const leads = Math.round(amount / efficiency.avgCpl);
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

function projectMetaReportBudgetScenario(options = {}) {
  const { projectScenario } = require('./meta-report-scenario-projection');
  const result = projectScenario({
    ...options,
    monthWindow: options.monthWindow || 'all',
    blendHistory: Boolean(options.blendHistory),
    includeTrend: Boolean(options.includeTrend),
    cautionStrongMonths: Boolean(options.cautionStrongMonths),
    baselineMode: 'year',
  });

  return {
    efficiency: result.efficiency,
    baseline: result.baseline,
    projected: result.projected,
    projectedConservative: result.projectedConservative,
    projectedOptimistic: result.projectedOptimistic,
    multiplier: result.multiplier,
    baselineSpend: result.baselineSpend,
    hasBottomline: result.hasBottomline,
    insufficientData: result.insufficientData,
    prepared: result.prepared,
    elasticity: result.elasticity,
    trendRate: result.trendRate,
    trendDirection: result.trendDirection,
    trendRatePct: result.trendRatePct,
  };
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

function computeMetaReportEfficiencyInsight(series = [], yKey = 'roasX') {
  const points = series
    .filter((point) => parseAmount(point.spend) > 0)
    .map((point) => ({ x: parseAmount(point.spend), y: parseAmount(point[yKey]) }));

  if (points.length < 2) {
    return {
      tone: 'neutral',
      message: 'Not enough months to assess spend efficiency yet.',
    };
  }

  const { slope, r } = linearRegression(points);
  const absR = Math.abs(r);
  if (absR < 0.25) {
    return {
      tone: 'neutral',
      message: 'Return is stable across spend levels.',
    };
  }
  if (slope > 0) {
    return {
      tone: 'positive',
      message: 'Higher spend months tend to maintain or improve return — scaling looks promising.',
    };
  }
  return {
    tone: 'negative',
    message: 'Higher spend months show lower efficiency — improve targeting/creative before scaling.',
  };
}

module.exports = {
  aggregateMetaReportSeriesEfficiency,
  buildScenarioProjectionSteps: require('./meta-report-scenario-projection').buildScenarioProjectionSteps,
  buildScenarioProjectionMonthKeys: require('./meta-report-scenario-projection').buildScenarioProjectionMonthKeys,
  isScenarioProjectionAllowed: require('./meta-report-scenario-projection').isScenarioProjectionAllowed,
  resolveScenarioProjectionTarget: require('./meta-report-scenario-projection').resolveScenarioProjectionTarget,
  computeConversionRatePercent,
  computeMetaReportEfficiencyInsight,
  computeMetaReportMetrics,
  computeScenarioEfficiency: require('./meta-report-scenario-projection').computeScenarioEfficiency,
  isLeadActionType,
  linearRegression,
  parseAmount,
  prepareScenarioSeries: require('./meta-report-scenario-projection').prepareScenarioSeries,
  projectMetaReportBudgetAtSpend,
  projectMetaReportBudgetScenario,
  projectScenario: require('./meta-report-scenario-projection').projectScenario,
  projectScenarioAtSpend: require('./meta-report-scenario-projection').projectScenarioAtSpend,
  resolveScenarioConfidence: require('./meta-report-scenario-projection').resolveScenarioConfidence,
  roundMoney,
  roundRatio,
};
