const assert = require('assert');
const {
  addMonthsToMonthKey,
  aggregateDateRange,
  aggregateMonthRange,
  buildComparison,
  computeDeltaPct,
  formatPeriodLabel,
  mergeMonthsMaps,
  resolveComparisonPresets,
  yearsNeededForComparison,
} = require('../lib/meta-report-comparison');

function monthPayload({
  monthKey,
  spend = 10000,
  leads = 50,
  wonLeads = 5,
  avgLeadValue = 100000,
  avgProfitPerWon = 50000,
  bottomline = true,
} = {}) {
  const totalLeadValue = wonLeads * avgLeadValue;
  const roasKr = totalLeadValue - spend;
  const totalProfit = wonLeads * avgProfitPerWon;
  const poasKr = totalProfit - spend;
  const payload = {
    monthKey,
    meta: { spend, impressions: 100000, reach: 50000, clicks: 2000, cpm: 100, emptyMonth: false },
    topline: {
      leads,
      cpl: spend / leads,
      wonLeads,
      totalLeadValue,
      avgLeadValue,
      cac: spend / wonLeads,
      roasKr,
      roasX: spend > 0 ? roasKr / spend : 0,
    },
  };
  if (bottomline) {
    payload.bottomline = {
      totalProfit,
      avgProfitPerWon,
      poasKr,
      poasX: spend > 0 ? poasKr / spend : 0,
      censioFee: 0,
      poiKr: poasKr,
      poiX: spend > 0 ? poasKr / spend : 0,
    };
  }
  return payload;
}

function approx(actual, expected, tolerance = 0.02) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `Expected ${expected}, got ${actual}`);
}

function testMomPreset() {
  const presets = resolveComparisonPresets({ activeMonthKey: '2026-08', mode: 'mom' });
  assert.strictEqual(presets.periodA.startMonthKey, '2026-08');
  assert.strictEqual(presets.periodB.startMonthKey, '2026-07');
  assert.strictEqual(presets.periodA.startDate, '2026-08-01');
  assert.strictEqual(presets.periodA.endDate, '2026-08-31');
}

function testPartialDateRange() {
  const months = {
    '2026-08': monthPayload({
      monthKey: '2026-08',
      spend: 31000,
      leads: 31,
      wonLeads: 3,
    }),
  };
  months['2026-08'].periodStart = '2026-08-01';
  months['2026-08'].periodEnd = '2026-08-31';
  const agg = aggregateDateRange(months, '2026-08-10', '2026-08-15');
  assert.strictEqual(agg.hasData, true);
  approx(agg.metrics.spend, 6000, 50);
}

function testYtdPreset() {
  const presets = resolveComparisonPresets({ activeMonthKey: '2026-08', mode: 'ytd' });
  assert.strictEqual(presets.periodA.startMonthKey, '2026-01');
  assert.strictEqual(presets.periodA.endMonthKey, '2026-08');
  assert.strictEqual(presets.periodB.startMonthKey, '2025-01');
  assert.strictEqual(presets.periodB.endMonthKey, '2025-08');
}

function testAggregateSingleMonth() {
  const months = { '2026-07': monthPayload({ monthKey: '2026-07', spend: 8000, leads: 40, wonLeads: 4 }) };
  const agg = aggregateMonthRange(months, '2026-07', '2026-07');
  assert.strictEqual(agg.monthCount, 1);
  approx(agg.metrics.spend, 8000);
  approx(agg.metrics.leads, 40);
  approx(agg.metrics.totalLeadValue, 400000);
}

function testAggregateRangeSums() {
  const months = {
    '2026-06': monthPayload({ monthKey: '2026-06', spend: 10000, leads: 50, wonLeads: 5 }),
    '2026-07': monthPayload({ monthKey: '2026-07', spend: 12000, leads: 60, wonLeads: 6 }),
  };
  const agg = aggregateMonthRange(months, '2026-06', '2026-07');
  assert.strictEqual(agg.monthCount, 2);
  approx(agg.metrics.spend, 22000);
  approx(agg.metrics.leads, 110);
  approx(agg.metrics.wonLeads, 11);
  approx(agg.metrics.cpl, 200);
}

function testPartialRange() {
  const months = { '2026-07': monthPayload({ monthKey: '2026-07' }) };
  const agg = aggregateMonthRange(months, '2026-06', '2026-07');
  assert.strictEqual(agg.monthCount, 1);
  assert.strictEqual(agg.expectedMonthCount, 2);
  assert.strictEqual(agg.partialData, true);
}

function testBuildComparisonMom() {
  const months2026 = {
    '2026-07': monthPayload({ monthKey: '2026-07', spend: 10000, leads: 50, wonLeads: 5 }),
    '2026-08': monthPayload({ monthKey: '2026-08', spend: 12000, leads: 60, wonLeads: 6 }),
  };
  const result = buildComparison({
    monthsMap: months2026,
    periodA: { startDate: '2026-08-01', endDate: '2026-08-31' },
    periodB: { startDate: '2026-07-01', endDate: '2026-07-31' },
    mode: 'mom',
  });
  assert.strictEqual(result.insufficientData, false);
  assert.strictEqual(result.samePeriod, false);
  approx(result.deltas.spend.pct, 20);
  assert.ok(result.heroMetrics.length >= 5);
  assert.ok(result.detailRows.length > 0);
}

function testBuildComparisonMissingPriorYear() {
  const months2026 = {
    '2026-01': monthPayload({ monthKey: '2026-01', spend: 9000 }),
    '2026-02': monthPayload({ monthKey: '2026-02', spend: 10000 }),
  };
  const result = buildComparison({
    monthsMap: months2026,
    periodA: { startDate: '2026-01-01', endDate: '2026-02-28' },
    periodB: { startDate: '2025-01-01', endDate: '2025-02-28' },
    mode: 'ytd',
  });
  assert.strictEqual(result.insufficientData, false);
  assert.strictEqual(result.periodA.hasData, true);
  assert.strictEqual(result.periodB.hasData, false);
}

function testSamePeriodValidation() {
  const months = { '2026-08': monthPayload({ monthKey: '2026-08' }) };
  const result = buildComparison({
    monthsMap: months,
    periodA: { startDate: '2026-08-01', endDate: '2026-08-31' },
    periodB: { startDate: '2026-08-01', endDate: '2026-08-31' },
    mode: 'custom',
  });
  assert.strictEqual(result.samePeriod, true);
}

function testYearsNeeded() {
  const years = yearsNeededForComparison(
    { startDate: '2026-01-10', endDate: '2026-08-15' },
    { startDate: '2025-01-01', endDate: '2025-08-31' },
  );
  assert.deepStrictEqual(years.sort(), ['2025', '2026']);
}

function testFormatPeriodLabel() {
  assert.strictEqual(formatPeriodLabel('2026-08', '2026-08'), 'Aug 2026');
  assert.strictEqual(formatPeriodLabel('2026-01', '2026-08'), 'Jan–Aug 2026');
}

function testDeltaPct() {
  approx(computeDeltaPct(120, 100), 20);
  assert.strictEqual(computeDeltaPct(100, 0), null);
}

function run() {
  testMomPreset();
  testPartialDateRange();
  testYtdPreset();
  testAggregateSingleMonth();
  testAggregateRangeSums();
  testPartialRange();
  testBuildComparisonMom();
  testBuildComparisonMissingPriorYear();
  testSamePeriodValidation();
  testYearsNeeded();
  testFormatPeriodLabel();
  testDeltaPct();
  console.log('Meta report comparison tests passed.');
}

run();
