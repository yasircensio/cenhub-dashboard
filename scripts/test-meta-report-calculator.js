const assert = require('assert');
const {
  computeMetaReportMetrics,
  computeMetaReportEfficiencyInsight,
  isLeadActionType,
  linearRegression,
  parseAmount,
  projectMetaReportBudgetScenario,
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
    },
    {
      spend: 15000,
      leads: 60,
      wonLeads: 6,
      avgLeadValue: 100000,
      avgProfitPerWon: 50000,
      roasKr: 585000,
      roasX: 39,
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
  approx(result.projected.leads, 88);
  approx(result.projected.wonLeads, 8.8);
  approx(result.projected.totalLeadValue, 880000);
  approx(result.projected.roasKr, 860000);
  approx(result.projected.roasX, 43);
  approx(result.projected.poasKr, 420000);
  approx(result.projected.poasX, 21);
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

function main() {
  testSheetExample();
  testFeeNotNegativeOnLoss();
  testMarketingFeeMode();
  testEmptyMonth();
  testLeadActionParsing();
  testBudgetScenarioProjection();
  testBudgetScenarioInsufficientData();
  testEfficiencyInsight();
  testLinearRegression();
  console.log('Meta report calculator tests passed.');
}

main();
