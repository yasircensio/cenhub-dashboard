const assert = require('assert');
const {
  addMonthsToMonthKey,
  aggregateDateRange,
  aggregateMonthRange,
  buildComparison,
  computeDeltaPct,
  formatComparisonDisplayLabel,
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
  assert.strictEqual(result.periodA.label, 'Aug 2026');
  assert.strictEqual(result.periodB.label, 'Jul 2026');
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

function testComparisonDisplayLabels() {
  assert.strictEqual(
    formatComparisonDisplayLabel('mom', { startDate: '2026-08-01', endDate: '2026-08-31' }),
    'Aug 2026',
  );
  assert.strictEqual(
    formatComparisonDisplayLabel('months', { startDate: '2026-03-01', endDate: '2026-03-31' }),
    'Mar 2026',
  );
  assert.strictEqual(
    formatComparisonDisplayLabel('ytd', { startDate: '2026-01-01', endDate: '2026-08-31' }),
    '2026',
  );
  assert.ok(
    formatComparisonDisplayLabel('custom', { startDate: '2026-08-10', endDate: '2026-08-15' }).includes('Aug'),
  );
}

function testYtdByMonthKeepsMissingPriorMonths() {
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
  assert.strictEqual(result.ytdByMonth.length, 2);
  assert.strictEqual(result.ytdByMonth[0].hasDataA, true);
  assert.strictEqual(result.ytdByMonth[0].hasDataB, false);
  assert.strictEqual(result.ytdByMonth[0].periodB, null);
  assert.strictEqual(result.periodA.label, '2026');
  assert.strictEqual(result.periodB.label, '2025');
}

function testMonthsPreset() {
  const presets = resolveComparisonPresets({ activeMonthKey: '2026-08', mode: 'months' });
  assert.strictEqual(presets.periodA.startMonthKey, '2026-08');
  assert.strictEqual(presets.periodB.startMonthKey, '2026-07');
  assert.strictEqual(presets.periodA.startDate, '2026-08-01');
  assert.strictEqual(presets.periodA.endDate, '2026-08-31');

  const customMonths = resolveComparisonPresets({
    activeMonthKey: '2026-08',
    mode: 'months',
    customPeriodA: { startDate: '2026-03-01', endDate: '2026-03-31' },
    customPeriodB: { startDate: '2025-11-01', endDate: '2025-11-30' },
  });
  assert.strictEqual(customMonths.periodA.startMonthKey, '2026-03');
  assert.strictEqual(customMonths.periodB.startMonthKey, '2025-11');
}

function testBuildComparisonMonths() {
  const months = {
    '2026-03': monthPayload({ monthKey: '2026-03', spend: 9000, leads: 45, wonLeads: 4 }),
    '2025-11': monthPayload({ monthKey: '2025-11', spend: 11000, leads: 55, wonLeads: 5 }),
  };
  const result = buildComparison({
    monthsMap: months,
    periodA: { startDate: '2026-03-01', endDate: '2026-03-31' },
    periodB: { startDate: '2025-11-01', endDate: '2025-11-30' },
    mode: 'months',
  });
  assert.strictEqual(result.periodA.label, 'Mar 2026');
  assert.strictEqual(result.periodB.label, 'Nov 2025');
  approx(result.deltas.spend.pct, -18.18, 0.1);
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

function testCustomDateRangeSpansMultipleMonths() {
  const months = {
    '2026-01': monthPayload({ monthKey: '2026-01', spend: 8000, leads: 40, wonLeads: 4 }),
    '2026-02': monthPayload({ monthKey: '2026-02', spend: 9000, leads: 45, wonLeads: 5 }),
    '2026-03': monthPayload({ monthKey: '2026-03', spend: 10000, leads: 50, wonLeads: 5 }),
  };
  const result = buildComparison({
    monthsMap: months,
    periodA: { startDate: '2026-01-01', endDate: '2026-03-31' },
    periodB: { startDate: '2025-12-01', endDate: '2025-12-31' },
    mode: 'custom',
  });
  assert.strictEqual(result.insufficientData, false);
  assert.strictEqual(result.samePeriod, false);
  approx(result.periodA.metrics.spend, 27000);
  approx(result.periodA.metrics.leads, 135);
  assert.ok(formatComparisonDisplayLabel('custom', {
    startDate: '2026-01-01',
    endDate: '2026-03-31',
  }).includes('Mar'));
}

function testCustomDateEndAfterStartWithinMonth() {
  const months = {
    '2026-03': monthPayload({ monthKey: '2026-03', spend: 10000, leads: 50, wonLeads: 5 }),
  };
  months['2026-03'].periodStart = '2026-03-01';
  months['2026-03'].periodEnd = '2026-03-31';
  const result = buildComparison({
    monthsMap: months,
    periodA: { startDate: '2026-03-05', endDate: '2026-03-20' },
    periodB: { startDate: '2026-02-01', endDate: '2026-02-28' },
    mode: 'custom',
  });
  assert.strictEqual(result.insufficientData, false);
  assert.strictEqual(result.periodA.hasData, true);
  approx(result.periodA.metrics.spend, 5161.29, 100);
}

function run() {
  testMomPreset();
  testMonthsPreset();
  testPartialDateRange();
  testYtdPreset();
  testAggregateSingleMonth();
  testAggregateRangeSums();
  testPartialRange();
  testBuildComparisonMom();
  testBuildComparisonMonths();
  testBuildComparisonMissingPriorYear();
  testComparisonDisplayLabels();
  testYtdByMonthKeepsMissingPriorMonths();
  testSamePeriodValidation();
  testCustomDateRangeSpansMultipleMonths();
  testCustomDateEndAfterStartWithinMonth();
  testYearsNeeded();
  testFormatPeriodLabel();
  testDeltaPct();
  console.log('Meta report comparison tests passed.');
}

run();
