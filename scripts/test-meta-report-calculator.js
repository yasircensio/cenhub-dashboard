const assert = require('assert');
const {
  buildScenarioProjectionSteps,
  buildScenarioProjectionMonthKeys,
  computeMetaReportMetrics,
  computeMetaReportEfficiencyInsight,
  computeScenarioEfficiency,
  isLeadActionType,
  linearRegression,
  parseAmount,
  prepareScenarioSeries,
  projectMetaReportBudgetScenario,
  projectScenario,
  resolveScenarioConfidence,
} = require('../lib/meta-report-calculator');
const { parseLeadCountFromActions } = require('../lib/meta-insights');

function approx(actual, expected, tolerance = 0.02) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `Expected ${expected}, got ${actual}`);
}

function testSheetExample() {
  // ML Tagdækning sheet "9 - 30 Januar"
  const result = computeMetaReportMetrics({
    spend: 3716.04,
    cpm: 68.6,
    impressions: 54158,
    reach: 23675,
    clicks: 1811,
    leads: 49,
    wonLeads: 5,
    avgLeadValue: 120000,
    avgProfitPerWon: 60000,
    showBottomline: true,
    feeEnabled: true,
    feePercent: 20,
  });

  approx(result.meta.conversionRatePercent, 3.34, 0.01);
  approx(result.topline.totalLeadValue, 600000);
  approx(result.topline.cac, 743.208);
  approx(result.topline.roasKr, 596283.96);
  approx(result.topline.roasX, 160.462, 0.02);
  approx(result.bottomline.totalProfit, 300000);
  approx(result.bottomline.poasKr, 296283.96);
  approx(result.bottomline.poasX, 79.731, 0.01);
  approx(result.bottomline.censioFee, 59256.792);
  // POI = POAS - fee = 237027.168
  approx(result.bottomline.poiKr, 237027.168);
  // POI % = POI / spend = 63.785x
  approx(result.bottomline.poiX, 63.785, 0.01);
}

function testFeeNotNegativeOnLoss() {
  const result = computeMetaReportMetrics({
    spend: 1326.8,
    leads: 0,
    wonLeads: 0,
    avgLeadValue: 0,
    avgProfitPerWon: 0,
    showBottomline: true,
    feeEnabled: true,
    feePercent: 20,
  });
  assert.strictEqual(result.bottomline.censioFee, 0);
  approx(result.bottomline.poiKr, -1326.8);
  approx(result.bottomline.poiX, -1, 0.01);
}

function testEmptyMonth() {
  const result = computeMetaReportMetrics({
    spend: 0,
    impressions: 0,
    clicks: 0,
    leads: 0,
    wonLeads: 0,
    avgLeadValue: 0,
  });
  assert.strictEqual(result.meta.emptyMonth, true);
}

function testLeadActionParsing() {
  assert.strictEqual(isLeadActionType('lead'), true);
  assert.strictEqual(isLeadActionType('onsite_conversion.lead_grouped'), true);
  assert.strictEqual(isLeadActionType('link_click'), false);

  // Prefer canonical `lead`; never sum overlapping lead action types.
  const total = parseLeadCountFromActions([
    { action_type: 'link_click', value: '100' },
    { action_type: 'lead', value: '30' },
    { action_type: 'onsite_conversion.lead_grouped', value: '19' },
  ]);
  assert.strictEqual(total, 30);

  assert.strictEqual(parseLeadCountFromActions([
    { action_type: 'onsite_conversion.lead_grouped', value: '19' },
  ]), 19);

  assert.strictEqual(parseLeadCountFromActions([
    { action_type: 'lead', value: '308' },
    { action_type: 'onsite_conversion.lead_grouped', value: '309' },
  ]), 308);
}

function testMarketingFeeMode() {
  const result = computeMetaReportMetrics({
    spend: 3716.04,
    leads: 49,
    wonLeads: 5,
    avgLeadValue: 120000,
    avgProfitPerWon: 60000,
    showBottomline: true,
    feeMode: 'marketing',
    marketingFeeAmount: 25000,
  });
  approx(result.bottomline.poasKr, 296283.96);
  assert.strictEqual(result.bottomline.feeMode, 'marketing');
  approx(result.bottomline.censioFee, 25000);
  approx(result.bottomline.poiKr, 271283.96);
}

function testBudgetScenarioProjection() {
  const series = [
    {
      spend: 10000,
      leads: 50,
      wonLeads: 5,
      avgLeadValue: 100000,
      avgProfitPerWon: 50000,
      roasKr: 490000,
      roasX: 49,
      periodEnd: '2025-01-31',
    },
    {
      spend: 15000,
      leads: 60,
      wonLeads: 6,
      avgLeadValue: 100000,
      avgProfitPerWon: 50000,
      roasKr: 585000,
      roasX: 39,
      periodEnd: '2025-02-28',
    },
  ];

  const result = projectMetaReportBudgetScenario({
    series,
    baselineSpend: 10000,
    multiplier: 2,
    hasBottomline: true,
  });

  assert.strictEqual(result.insufficientData, false);
  approx(result.baseline.spend, 10000);
  approx(result.projected.spend, 20000);
  // Power-law at 0.80 elasticity: 2^0.80 ~= 1.74x leads vs baseline, not 2x
  approx(result.projected.leads, 74, 2);
}

function testScenarioProjectionStepsMatchTargetMultiplier() {
  const series = [{
    spend: 9000,
    leads: 45,
    wonLeads: 5,
    avgLeadValue: 100000,
    avgProfitPerWon: 50000,
    periodEnd: '2025-01-31',
  }, {
    spend: 9000,
    leads: 45,
    wonLeads: 5,
    avgLeadValue: 100000,
    avgProfitPerWon: 50000,
    periodEnd: '2025-02-28',
  }];

  const projection = projectScenario({
    series,
    baselineSpend: 9000,
    multiplier: 3,
    monthWindow: '6',
    asOfDate: new Date('2025-03-01T12:00:00.000Z'),
  });

  const steps = buildScenarioProjectionSteps(projection, { hasBottomline: false });
  assert.strictEqual(steps.length, 4);
  steps.forEach((step) => {
    approx(step.spend, 27000);
    approx(step.spendMultiplier, 3);
  });

  const atDouble = buildScenarioProjectionSteps(
    { ...projection, multiplier: 2 },
    { hasBottomline: false, targetMultiplier: 2 },
  );
  atDouble.forEach((step) => {
    approx(step.spend, 18000);
    approx(step.spendMultiplier, 2);
  });
}

function testShortAdHistoryUsesAvailableMonths() {
  const series = [
    { spend: 0, leads: 0, wonLeads: 0, periodEnd: '2024-10-31' },
    { spend: 0, leads: 0, wonLeads: 0, periodEnd: '2024-11-30' },
    { spend: 8000, leads: 40, wonLeads: 4, avgLeadValue: 100000, avgProfitPerWon: 50000, periodEnd: '2024-12-31' },
    { spend: 9000, leads: 45, wonLeads: 5, avgLeadValue: 100000, avgProfitPerWon: 50000, periodEnd: '2025-01-31' },
    { spend: 10000, leads: 50, wonLeads: 5, avgLeadValue: 100000, avgProfitPerWon: 50000, periodEnd: '2025-02-28' },
  ];

  const prepared = prepareScenarioSeries(series, {
    windowMonths: '6',
    asOfDate: new Date('2025-03-01T12:00:00.000Z'),
  });

  assert.strictEqual(prepared.monthsUsed, 3);
  assert.strictEqual(prepared.monthsAvailable, 3);
}

function testIncompleteMonthExcluded() {
  const series = [
    { spend: 9000, leads: 45, wonLeads: 5, avgLeadValue: 100000, avgProfitPerWon: 50000, periodEnd: '2025-01-31' },
    { spend: 9000, leads: 45, wonLeads: 5, avgLeadValue: 100000, avgProfitPerWon: 50000, periodEnd: '2025-02-28' },
    { spend: 12000, leads: 60, wonLeads: 6, avgLeadValue: 100000, avgProfitPerWon: 50000, periodEnd: '2025-08-31' },
  ];

  const prepared = prepareScenarioSeries(series, {
    windowMonths: '6',
    asOfDate: new Date('2025-08-10T12:00:00.000Z'),
  });

  assert.strictEqual(prepared.monthsUsed, 2);
}

function testDownwardTrendLowersProjection() {
  const series = [
    { spend: 10000, leads: 60, wonLeads: 6, avgLeadValue: 100000, avgProfitPerWon: 50000, periodEnd: '2024-10-31' },
    { spend: 10000, leads: 55, wonLeads: 5, avgLeadValue: 100000, avgProfitPerWon: 50000, periodEnd: '2024-11-30' },
    { spend: 10000, leads: 50, wonLeads: 5, avgLeadValue: 100000, avgProfitPerWon: 50000, periodEnd: '2024-12-31' },
    { spend: 10000, leads: 45, wonLeads: 4, avgLeadValue: 100000, avgProfitPerWon: 50000, periodEnd: '2025-01-31' },
  ];

  const flat = projectScenario({
    series,
    baselineSpend: 10000,
    multiplier: 2,
    includeTrend: false,
    asOfDate: new Date('2025-02-01T12:00:00.000Z'),
  });
  const trending = projectScenario({
    series,
    baselineSpend: 10000,
    multiplier: 2,
    includeTrend: true,
    asOfDate: new Date('2025-02-01T12:00:00.000Z'),
  });

  assert.ok(trending.projected.leads <= flat.projected.leads);
  assert.strictEqual(trending.trendDirection, 'down');
}

function testPillsAreIndependent() {
  const series = [
    { spend: 8000, leads: 40, wonLeads: 4, avgLeadValue: 100000, avgProfitPerWon: 50000, periodEnd: '2024-11-30' },
    { spend: 12000, leads: 55, wonLeads: 5, avgLeadValue: 100000, avgProfitPerWon: 50000, periodEnd: '2024-12-31' },
    { spend: 16000, leads: 65, wonLeads: 6, avgLeadValue: 100000, avgProfitPerWon: 50000, periodEnd: '2025-01-31' },
  ];

  const prepared = prepareScenarioSeries(series, {
    windowMonths: 'all',
    asOfDate: new Date('2025-02-01T12:00:00.000Z'),
  });

  const plain = computeScenarioEfficiency(prepared.months, {});
  const blendOnly = computeScenarioEfficiency(prepared.months, { blendHistory: true });
  const trendOnly = computeScenarioEfficiency(prepared.months, { includeTrend: true });

  assert.notStrictEqual(blendOnly.efficiency.avgCpl, plain.efficiency.avgCpl);
  assert.strictEqual(trendOnly.efficiency.avgCpl, plain.efficiency.avgCpl);
}

function testConservativeOptimisticBandCollapsesWithoutTrend() {
  const series = [
    { spend: 10000, leads: 50, wonLeads: 5, avgLeadValue: 100000, avgProfitPerWon: 50000, periodEnd: '2025-01-31' },
    { spend: 10000, leads: 50, wonLeads: 5, avgLeadValue: 100000, avgProfitPerWon: 50000, periodEnd: '2025-02-28' },
  ];

  const flat = projectMetaReportBudgetScenario({
    series,
    baselineSpend: 10000,
    multiplier: 2,
    includeTrend: false,
  });

  assert.strictEqual(flat.projectedConservative.totalLeadValue, flat.projectedOptimistic.totalLeadValue);

  const trendingSeries = [
    { spend: 10000, leads: 50, wonLeads: 1.0, avgLeadValue: 10000, avgProfitPerWon: 5000, periodEnd: '2024-09-30' },
    { spend: 10000, leads: 50, wonLeads: 1.0, avgLeadValue: 10000, avgProfitPerWon: 5000, periodEnd: '2024-10-31' },
    { spend: 10000, leads: 50, wonLeads: 1.0, avgLeadValue: 10000, avgProfitPerWon: 5000, periodEnd: '2024-11-30' },
    { spend: 10000, leads: 50, wonLeads: 1.5, avgLeadValue: 10000, avgProfitPerWon: 5000, periodEnd: '2024-12-31' },
    { spend: 10000, leads: 50, wonLeads: 1.6, avgLeadValue: 10000, avgProfitPerWon: 5000, periodEnd: '2025-01-31' },
    { spend: 10000, leads: 50, wonLeads: 1.7, avgLeadValue: 10000, avgProfitPerWon: 5000, periodEnd: '2025-02-28' },
  ];
  const trending = projectMetaReportBudgetScenario({
    series: trendingSeries,
    baselineSpend: 10000,
    multiplier: 2,
    includeTrend: true,
    monthWindow: 'all',
    asOfDate: new Date('2025-03-01T12:00:00.000Z'),
  });

  assert.notStrictEqual(trending.projectedConservative.leads, trending.projectedOptimistic.leads);
}

function testResolveScenarioConfidence() {
  assert.strictEqual(resolveScenarioConfidence(0), 'low');
  assert.strictEqual(resolveScenarioConfidence(3), 'low');
  assert.strictEqual(resolveScenarioConfidence(4), 'medium');
  assert.strictEqual(resolveScenarioConfidence(6), 'medium');
  assert.strictEqual(resolveScenarioConfidence(7), 'high');
  assert.strictEqual(resolveScenarioConfidence(24), 'high');
}

function testOutlierWinsorization() {
  const series = [
    { spend: 9000, leads: 40, wonLeads: 5, avgLeadValue: 100000, avgProfitPerWon: 50000, periodEnd: '2024-10-31' },
    { spend: 9000, leads: 45, wonLeads: 5, avgLeadValue: 100000, avgProfitPerWon: 50000, periodEnd: '2024-11-30' },
    { spend: 9000, leads: 200, wonLeads: 20, avgLeadValue: 100000, avgProfitPerWon: 50000, periodEnd: '2024-12-31' },
    { spend: 9000, leads: 50, wonLeads: 5, avgLeadValue: 100000, avgProfitPerWon: 50000, periodEnd: '2025-01-31' },
  ];

  const prepared = prepareScenarioSeries(series, {
    windowMonths: 'all',
    asOfDate: new Date('2025-02-01T12:00:00.000Z'),
  });

  assert.ok(prepared.outliersAdjusted >= 1);
  const outlierMonth = prepared.months.find((point) => point.periodEnd === '2024-12-31');
  assert.ok(outlierMonth);
  assert.ok(outlierMonth.leads < 200);
  approx(outlierMonth.wonLeads, Math.round(outlierMonth.leads * (20 / 200)), 1);
}

function testBlendSmoothKeepsProjectedRevenueInSyncWithBaseline() {
  const series = [
    { spend: 7000, leads: 14, wonLeads: 2, avgLeadValue: 50000, avgProfitPerWon: 25000, periodEnd: '2025-01-31' },
    { spend: 8500, leads: 17, wonLeads: 2, avgLeadValue: 50000, avgProfitPerWon: 25000, periodEnd: '2025-02-28' },
    { spend: 12000, leads: 120, wonLeads: 3, avgLeadValue: 50000, avgProfitPerWon: 25000, periodEnd: '2025-03-31' },
    { spend: 9000, leads: 18, wonLeads: 2, avgLeadValue: 50000, avgProfitPerWon: 25000, periodEnd: '2025-04-30' },
    { spend: 9500, leads: 19, wonLeads: 2, avgLeadValue: 50000, avgProfitPerWon: 25000, periodEnd: '2025-05-31' },
    { spend: 9764, leads: 20, wonLeads: 2, avgLeadValue: 50000, avgProfitPerWon: 25000, periodEnd: '2025-06-30' },
    { spend: 10000, leads: 21, wonLeads: 2, avgLeadValue: 50000, avgProfitPerWon: 25000, periodEnd: '2025-07-31' },
  ];
  const common = {
    series,
    baselineSpend: 9764,
    multiplier: 2,
    blendHistory: true,
    monthWindow: 'all',
    asOfDate: new Date('2025-08-01T12:00:00.000Z'),
  };
  const smoothOn = projectMetaReportBudgetScenario({ ...common, smoothOutliers: true });
  const smoothOff = projectMetaReportBudgetScenario({ ...common, smoothOutliers: false });

  assert.ok(smoothOn.prepared.outliersAdjusted >= 1);
  if (smoothOn.baseline.totalLeadValue !== smoothOff.baseline.totalLeadValue) {
    assert.notStrictEqual(smoothOn.projected.totalLeadValue, smoothOff.projected.totalLeadValue);
  }
}

function testScenarioProjectionMonthLabels() {
  // Labels are derived from asOfDate — not hardcoded. August → Sep–Dec.
  const asOfDate = new Date('2026-08-10T12:00:00.000Z');
  const series = [{
    spend: 9000,
    leads: 45,
    wonLeads: 5,
    avgLeadValue: 100000,
    avgProfitPerWon: 50000,
    periodEnd: '2025-01-31',
  }, {
    spend: 9000,
    leads: 45,
    wonLeads: 5,
    avgLeadValue: 100000,
    avgProfitPerWon: 50000,
    periodEnd: '2025-02-28',
  }];

  const projection = projectScenario({
    series,
    baselineSpend: 9000,
    multiplier: 3,
    monthWindow: '6',
    asOfDate,
  });

  const steps = buildScenarioProjectionSteps(projection, { hasBottomline: false, asOfDate });
  assert.strictEqual(steps.length, 4);
  assert.deepStrictEqual(steps.map((step) => step.label), ['Sep', 'Oct', 'Nov', 'Dec']);
  assert.deepStrictEqual(steps.map((step) => step.monthKey), ['2026-09', '2026-10', '2026-11', '2026-12']);
}

function testScenarioProjectionMonthLabelsFromJanuary() {
  const asOfDate = new Date('2026-01-15T12:00:00.000Z');
  const keys = buildScenarioProjectionMonthKeys(4, asOfDate);
  assert.deepStrictEqual(keys, ['2026-02', '2026-03', '2026-04', '2026-05']);
}

function testScenarioProjectionMonthLabelsYearRollover() {
  const asOfDate = new Date('2026-12-10T12:00:00.000Z');
  const keys = buildScenarioProjectionMonthKeys(4, asOfDate);
  assert.deepStrictEqual(keys, ['2027-01', '2027-02', '2027-03', '2027-04']);
}

function testBudgetScenarioInsufficientData() {
  const result = projectMetaReportBudgetScenario({
    series: [{ spend: 0, leads: 0, wonLeads: 0 }],
    baselineSpend: 0,
    multiplier: 2,
  });
  assert.strictEqual(result.insufficientData, true);
}

function testEfficiencyInsight() {
  const rising = [
    { spend: 8000, roasX: 1.2 },
    { spend: 12000, roasX: 1.8 },
    { spend: 16000, roasX: 2.1 },
  ];
  const falling = [
    { spend: 8000, roasX: 2.5 },
    { spend: 12000, roasX: 1.6 },
    { spend: 16000, roasX: 1.1 },
  ];

  assert.strictEqual(computeMetaReportEfficiencyInsight(rising).tone, 'positive');
  assert.strictEqual(computeMetaReportEfficiencyInsight(falling).tone, 'negative');
  assert.strictEqual(computeMetaReportEfficiencyInsight([{ spend: 1000, roasX: 1 }]).tone, 'neutral');
}

function testLinearRegression() {
  const line = linearRegression([
    { x: 1, y: 2 },
    { x: 2, y: 4 },
    { x: 3, y: 6 },
  ]);
  approx(line.slope, 2);
  approx(line.intercept, 0);
  approx(line.r, 1);
}

function testLastMonthBaselineMode() {
  const asOfDate = new Date('2026-08-10T12:00:00.000Z');
  const series = [
    { monthKey: '2026-05', spend: 12000, leads: 50, wonLeads: 5, avgLeadValue: 100000, avgProfitPerWon: 50000, periodEnd: '2026-05-31' },
    { monthKey: '2026-06', spend: 13000, leads: 50, wonLeads: 5, avgLeadValue: 100000, avgProfitPerWon: 50000, periodEnd: '2026-06-30' },
    { monthKey: '2026-07', spend: 14000, leads: 50, wonLeads: 5, avgLeadValue: 100000, avgProfitPerWon: 50000, periodEnd: '2026-07-31' },
    { monthKey: '2026-08', spend: 9609, leads: 40, wonLeads: 4, avgLeadValue: 100000, avgProfitPerWon: 50000, periodEnd: '2026-08-31' },
  ];

  const result = projectScenario({
    series,
    baselineMode: 'last',
    activeMonthKey: '2026-08',
    multiplier: 2,
    monthWindow: '6',
    asOfDate,
  });

  assert.strictEqual(result.insufficientData, false);
  approx(result.baselineSpend, 14000);
  approx(result.projected.spend, 28000);

  const juneResult = projectScenario({
    series,
    baselineMode: 'last',
    activeMonthKey: '2026-06',
    multiplier: 2,
    monthWindow: '6',
    asOfDate,
  });
  approx(juneResult.baselineSpend, 12000);
}

function testLastMonthBaselineRequiresExactPreviousMonth() {
  const asOfDate = new Date('2026-08-10T12:00:00.000Z');
  const series = [
    { monthKey: '2026-06', spend: 12000, leads: 50, wonLeads: 5, avgLeadValue: 100000, avgProfitPerWon: 50000, periodEnd: '2026-06-30' },
    { monthKey: '2026-08', spend: 9609, leads: 40, wonLeads: 4, avgLeadValue: 100000, avgProfitPerWon: 50000, periodEnd: '2026-08-31' },
  ];

  const result = projectScenario({
    series,
    baselineMode: 'last',
    activeMonthKey: '2026-08',
    multiplier: 2,
    monthWindow: '6',
    asOfDate,
  });

  assert.strictEqual(result.baselineSpend, 0);
  assert.strictEqual(result.insufficientData, true);
}

function testBaselineModesMatchProjectionSpend() {
  const asOfDate = new Date('2026-08-10T12:00:00.000Z');
  const series = [
    { monthKey: '2026-06', spend: 12000, leads: 50, wonLeads: 5, avgLeadValue: 100000, avgProfitPerWon: 50000, periodEnd: '2026-06-30' },
    { monthKey: '2026-07', spend: 14000, leads: 50, wonLeads: 5, avgLeadValue: 100000, avgProfitPerWon: 50000, periodEnd: '2026-07-31' },
    { monthKey: '2026-08', spend: 9609, leads: 40, wonLeads: 4, avgLeadValue: 100000, avgProfitPerWon: 50000, periodEnd: '2026-08-31' },
  ];

  const { resolveScenarioBaselineSpend, prepareScenarioSeries } = require('../lib/meta-report-scenario-projection');
  const prepared = prepareScenarioSeries(series, { windowMonths: '6', asOfDate });

  const lastSpend = resolveScenarioBaselineSpend(series, prepared.months, {
    baselineMode: 'last',
    activeMonthKey: '2026-08',
    asOfDate,
  });
  const monthSpend = resolveScenarioBaselineSpend(series, prepared.months, {
    baselineMode: 'month',
    activeMonthKey: '2026-08',
    asOfDate,
  });

  approx(lastSpend, 14000);
  approx(monthSpend, 9609);
}

function testScenarioMultiplierMatchesProjectedSpend() {
  const baselineSpend = 18270.29;
  const series = [
    {
      spend: 9000,
      leads: 18,
      wonLeads: 1,
      avgLeadValue: 51000,
      avgProfitPerWon: 41000,
      periodEnd: '2026-06-30',
    },
    {
      spend: 12000,
      leads: 20,
      wonLeads: 1,
      avgLeadValue: 51000,
      avgProfitPerWon: 41000,
      periodEnd: '2026-07-31',
    },
    {
      spend: 12258,
      leads: 23,
      wonLeads: 1,
      avgLeadValue: 51000,
      avgProfitPerWon: 41000,
      periodEnd: '2026-08-31',
    },
  ];

  const projection = projectScenario({
    series,
    baselineSpend,
    multiplier: 2,
    monthWindow: '6',
    hasBottomline: true,
    asOfDate: new Date('2026-09-01T12:00:00.000Z'),
  });

  assert.strictEqual(projection.insufficientData, false);
  approx(projection.projected.spend, baselineSpend * 2, 1);
  approx(projection.projected.spend / projection.baselineSpend, 2, 0.01);

  const steps = buildScenarioProjectionSteps(projection, {
    hasBottomline: true,
    targetMultiplier: 2,
    asOfDate: new Date('2026-09-01T12:00:00.000Z'),
  });
  steps.forEach((step) => {
    approx(step.spend, baselineSpend * 2, 1);
    approx(step.spendMultiplier, 2, 0.01);
  });
}

function main() {
  testSheetExample();
  testFeeNotNegativeOnLoss();
  testMarketingFeeMode();
  testEmptyMonth();
  testLeadActionParsing();
  testBudgetScenarioProjection();
  testScenarioProjectionStepsMatchTargetMultiplier();
  testScenarioMultiplierMatchesProjectedSpend();
  testShortAdHistoryUsesAvailableMonths();
  testIncompleteMonthExcluded();
  testDownwardTrendLowersProjection();
  testPillsAreIndependent();
  testConservativeOptimisticBandCollapsesWithoutTrend();
  testResolveScenarioConfidence();
  testScenarioProjectionMonthLabels();
  testScenarioProjectionMonthLabelsFromJanuary();
  testScenarioProjectionMonthLabelsYearRollover();
  testOutlierWinsorization();
  testBlendSmoothKeepsProjectedRevenueInSyncWithBaseline();
  testBudgetScenarioInsufficientData();
  testLastMonthBaselineMode();
  testLastMonthBaselineRequiresExactPreviousMonth();
  testBaselineModesMatchProjectionSpend();
  testEfficiencyInsight();
  testLinearRegression();
  console.log('Meta report calculator tests passed.');
}

main();
