const assert = require('assert');
const {
  computeMetaReportMetrics,
  isLeadActionType,
  parseAmount,
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

  const total = parseLeadCountFromActions([
    { action_type: 'link_click', value: '100' },
    { action_type: 'lead', value: '30' },
    { action_type: 'onsite_conversion.lead_grouped', value: '19' },
  ]);
  assert.strictEqual(total, 49);
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

function main() {
  testSheetExample();
  testFeeNotNegativeOnLoss();
  testMarketingFeeMode();
  testEmptyMonth();
  testLeadActionParsing();
  console.log('Meta report calculator tests passed.');
}

main();
