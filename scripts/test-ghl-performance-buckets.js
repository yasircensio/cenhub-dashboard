const assert = require('assert');
const {
  buildGhlPerformance,
  inferGranularity,
  mergePerformanceMarketing,
  totalsFromKpis,
} = require('../lib/ghl-performance-buckets');

function makeOpportunity(overrides = {}) {
  return {
    id: overrides.id || '1',
    status: overrides.status || 'open',
    monetaryValue: overrides.monetaryValue ?? 1000,
    createdAt: overrides.createdAt || '2026-10-01T10:00:00.000Z',
    lastStatusChangeAt: overrides.lastStatusChangeAt || overrides.createdAt || '2026-10-01T10:00:00.000Z',
    pipelineId: 'pipe-1',
    assignedTo: 'user-1',
    contactId: overrides.contactId || 'contact-1',
    customFields: overrides.customFields || [],
    ...overrides,
  };
}

function main() {
  assert.strictEqual(inferGranularity(new Date(2026, 9, 1), new Date(2026, 9, 15)), 'day');
  assert.strictEqual(inferGranularity(new Date(2026, 8, 1), new Date(2026, 9, 15)), 'week');
  assert.strictEqual(inferGranularity(new Date(2026, 0, 1), new Date(2026, 9, 15)), 'month');

  const leads = [
    makeOpportunity({ id: 'l1', createdAt: '2026-10-02T10:00:00.000Z' }),
    makeOpportunity({ id: 'l2', createdAt: '2026-10-05T10:00:00.000Z' }),
  ];
  const wins = [
    makeOpportunity({
      id: 'w1',
      status: 'won',
      monetaryValue: 5000,
      createdAt: '2026-10-01T10:00:00.000Z',
      lastStatusChangeAt: '2026-10-03T10:00:00.000Z',
      contactId: 'c-w1',
    }),
  ];

  const performance = buildGhlPerformance({
    leadOpportunities: leads,
    rawOpportunities: [...leads, ...wins],
    accountContext: { winMode: 'all' },
    filters: {
      dateFrom: '2026-10-01',
      dateTo: '2026-10-10',
      dateField: 'createdAt',
      timeZone: 'Europe/Copenhagen',
    },
    monthlyAdSpend: [{ month: '2026-10', spend: 3100 }],
    now: new Date('2026-10-10T12:00:00.000Z'),
  });

  assert.ok(performance);
  assert.strictEqual(performance.granularity, 'day');
  assert.ok(performance.buckets.length >= 8);

  const leadSum = performance.buckets.reduce((sum, bucket) => sum + bucket.leads, 0);
  const revenueSum = performance.buckets.reduce((sum, bucket) => sum + bucket.revenue, 0);
  const spendSum = performance.buckets.reduce((sum, bucket) => sum + bucket.adSpend, 0);

  assert.strictEqual(leadSum, 2);
  assert.strictEqual(revenueSum, 5000);
  assert.ok(spendSum > 0);

  const merged = mergePerformanceMarketing(
    performance,
    {
      totalRevenue: 5000,
      totalLeads: 2,
      clientsWon: 1,
      wonOpportunityCount: 1,
      adSpend: spendSum,
      poasDk: 1000,
      conversionRate: 50,
    },
    [{ month: '2026-10', spend: 3100 }],
    { timeZone: 'Europe/Copenhagen' },
    new Date('2026-10-10T12:00:00.000Z'),
  );

  assert.strictEqual(merged.totals.revenue, 5000);
  assert.strictEqual(merged.totals.leads, 2);
  assert.strictEqual(merged.totals.customers, 1);
  assert.strictEqual(merged.totals.adSpend, spendSum);

  const septemberDays = [];
  for (let day = 1; day <= 30; day += 1) {
    const iso = `2026-09-${String(day).padStart(2, '0')}`;
    septemberDays.push({
      start: iso,
      end: iso,
      revenue: 0,
      profit: 0,
      adSpend: 0,
      leads: 0,
      customers: 0,
    });
  }
  const lastMonth = mergePerformanceMarketing(
    {
      granularity: 'day',
      range: { start: '2026-09-01', end: '2026-09-30' },
      buckets: septemberDays,
    },
    { adSpend: 30000, totalRevenue: 0, totalLeads: 0, clientsWon: 0 },
    [{ month: '2026-09', spend: 30000 }],
    { timeZone: 'Europe/Copenhagen' },
    new Date('2026-10-30T12:00:00.000Z'),
  );
  const lastMonthSpend = lastMonth.buckets.reduce((sum, bucket) => sum + bucket.adSpend, 0);
  assert.ok(Math.abs(lastMonthSpend - 30000) < 1, `expected last month spend 30000, got ${lastMonthSpend}`);
  assert.ok(lastMonth.buckets.every((bucket) => bucket.adSpend > 0));

  // Chart profit must equal bundlinje minus ad spend (same as the POAS card), even after re-merging.
  const profitInput = {
    granularity: 'day',
    range: { start: '2026-10-01', end: '2026-10-02' },
    buckets: [
      { start: '2026-10-01', end: '2026-10-01', revenue: 100, profit: 80, bundlinje: 80, adSpend: 0, leads: 1, customers: 1 },
      { start: '2026-10-02', end: '2026-10-02', revenue: 0, profit: 0, bundlinje: 0, adSpend: 0, leads: 0, customers: 0 },
    ],
  };
  const profitNow = new Date('2026-10-02T12:00:00.000Z');
  const firstMerge = mergePerformanceMarketing(profitInput, { totalRevenue: 100, adSpend: 20, wonBundlinje: 80 }, [{ month: '2026-10', spend: 20 }], {}, profitNow);
  const secondMerge = mergePerformanceMarketing(firstMerge, { totalRevenue: 100, adSpend: 20, wonBundlinje: 80 }, [{ month: '2026-10', spend: 20 }], {}, profitNow);
  assert.ok(Math.abs(secondMerge.buckets[0].profit - (80 - 10)) < 0.01, `bucket profit ${secondMerge.buckets[0].profit}`);
  assert.strictEqual(secondMerge.totals.profit, 60);

  const totals = totalsFromKpis({ totalRevenue: 100, adSpend: 20, totalLeads: 4, clientsWon: 2, poasDk: 30 });
  assert.strictEqual(totals.roas, 5);
  assert.strictEqual(totals.cpl, 5);
  assert.strictEqual(totals.cac, 10);

  testComparison();

  console.log('GHL performance bucket tests passed.');
}

function testComparison() {
  const {
    resolveComparisonRange,
    describeComparison,
    computeDelta,
    alignComparisonBuckets,
    detectRangeShape,
    isBeforeDataStart,
  } = require('../lib/performance-merge');
  const today = '2026-10-30';

  // Full past month -> whole previous month.
  assert.deepStrictEqual(
    resolveComparisonRange({ start: '2026-09-01', end: '2026-09-30' }, 'previous_period', { todayIso: today }),
    { start: '2026-08-01', end: '2026-08-31' },
  );
  // January rolls back into December of the previous year.
  assert.deepStrictEqual(
    resolveComparisonRange({ start: '2026-01-01', end: '2026-01-31' }, 'previous_period', { todayIso: today }),
    { start: '2025-12-01', end: '2025-12-31' },
  );
  // Month to date (preset end is the month end, today is the 30th) -> same elapsed days of September (30).
  assert.deepStrictEqual(
    resolveComparisonRange({ start: '2026-10-01', end: '2026-10-31' }, 'previous_period', { todayIso: today }),
    { start: '2026-09-01', end: '2026-09-30' },
  );
  // Month to date on the 31st would not fit a 30-day month: capped to its length.
  assert.deepStrictEqual(
    resolveComparisonRange({ start: '2026-10-01', end: '2026-10-31' }, 'previous_period', { todayIso: '2026-10-31' }),
    { start: '2026-09-01', end: '2026-09-30' },
  );
  // Early in the month: equal number of elapsed days.
  assert.deepStrictEqual(
    resolveComparisonRange({ start: '2026-10-01', end: '2026-10-31' }, 'previous_period', { todayIso: '2026-10-10' }),
    { start: '2026-09-01', end: '2026-09-10' },
  );
  // Year to date -> same dates last year.
  assert.strictEqual(detectRangeShape({ start: '2026-01-01', end: '2026-10-30' }, today), 'year');
  assert.deepStrictEqual(
    resolveComparisonRange({ start: '2026-01-01', end: '2026-10-30' }, 'previous_period', { todayIso: today }),
    { start: '2025-01-01', end: '2025-10-30' },
  );
  // Full past year -> whole previous year.
  assert.deepStrictEqual(
    resolveComparisonRange({ start: '2025-01-01', end: '2025-12-31' }, 'previous_period', { todayIso: today }),
    { start: '2024-01-01', end: '2024-12-31' },
  );
  // Custom range -> equally long window directly before.
  assert.deepStrictEqual(
    resolveComparisonRange({ start: '2026-10-10', end: '2026-10-23' }, 'previous_period', { todayIso: today }),
    { start: '2026-09-26', end: '2026-10-09' },
  );
  // Same period last year, including a leap year February.
  assert.deepStrictEqual(
    resolveComparisonRange({ start: '2025-02-01', end: '2025-02-28' }, 'previous_year', { todayIso: today }),
    { start: '2024-02-01', end: '2024-02-29' },
  );
  assert.deepStrictEqual(
    resolveComparisonRange({ start: '2026-10-01', end: '2026-10-31' }, 'previous_year', { todayIso: today }),
    { start: '2025-10-01', end: '2025-10-30' },
  );
  // Picking a month mirrors the shape (month vs month), and a running month is cut to equal days.
  assert.deepStrictEqual(
    resolveComparisonRange({ start: '2026-09-01', end: '2026-09-30' }, 'pick', { todayIso: today, pick: { year: 2025, month: 2 } }),
    { start: '2025-02-01', end: '2025-02-28' },
  );
  assert.deepStrictEqual(
    resolveComparisonRange({ start: '2026-10-01', end: '2026-10-31' }, 'pick', { todayIso: today, pick: { year: 2025, month: 2 } }),
    { start: '2025-02-01', end: '2025-02-28' },
  );
  // Picking the same period is not a comparison.
  assert.strictEqual(
    resolveComparisonRange({ start: '2026-09-01', end: '2026-09-30' }, 'pick', { todayIso: today, pick: { year: 2026, month: 9 } }),
    null,
  );
  // A comparison that starts in the future is rejected.
  assert.strictEqual(
    resolveComparisonRange({ start: '2026-10-01', end: '2026-10-31' }, 'pick', { todayIso: today, pick: { year: 2026, month: 11 } }),
    null,
  );

  // Labels say exactly what is compared with what.
  const description = describeComparison({
    current: { start: '2026-09-01', end: '2026-09-30' },
    comparison: { start: '2026-08-01', end: '2026-08-31' },
    mode: 'previous_period',
    todayIso: today,
  });
  assert.strictEqual(description.sentence, 'september 2026 vs. august 2026 (forrige måned)');
  assert.strictEqual(description.shortRef, 'august');
  assert.strictEqual(description.currentSeriesLabel, 'Sep 2026');
  assert.strictEqual(description.comparisonSeriesLabel, 'Aug 2026');
  const lastYear = describeComparison({
    current: { start: '2026-09-01', end: '2026-09-30' },
    comparison: { start: '2025-09-01', end: '2025-09-30' },
    mode: 'previous_year',
    todayIso: today,
  });
  assert.strictEqual(lastYear.shortRef, 'september 2025');
  assert.strictEqual(lastYear.sentence, 'september 2026 vs. september 2025 (sidste år)');

  // Deltas: good/bad follows the metric direction (costs are inverted).
  const revenueUp = computeDelta(120, 100, 'up');
  assert.strictEqual(revenueUp.kind, 'change');
  assert.ok(Math.abs(revenueUp.value - 20) < 1e-9 && revenueUp.isGood);
  const costUp = computeDelta(120, 100, 'down');
  assert.ok(costUp.direction === 'up' && costUp.isGood === false);
  const costDown = computeDelta(80, 100, 'down');
  assert.ok(costDown.direction === 'down' && costDown.isGood === true);
  assert.strictEqual(computeDelta(5, 0, 'up').kind, 'new');
  assert.strictEqual(computeDelta(0, 0, 'up').kind, 'flat');
  assert.strictEqual(computeDelta(null, 10, 'up').kind, 'unknown');
  const points = computeDelta(8, 6.5, 'up', { points: true });
  assert.ok(points.unit === 'pp' && Math.abs(points.value - 1.5) < 1e-9);

  // 31-day month against a 30-day month is aligned by position; the extra day has no partner.
  const august = Array.from({ length: 31 }, (_, i) => ({ start: `2026-08-${String(i + 1).padStart(2, '0')}` }));
  const september = Array.from({ length: 30 }, (_, i) => ({ start: `2026-09-${String(i + 1).padStart(2, '0')}` }));
  const aligned = alignComparisonBuckets(august, september);
  assert.strictEqual(aligned.length, 31);
  assert.strictEqual(aligned[0].comparison.start, '2026-09-01');
  assert.strictEqual(aligned[30].comparison, null);

  assert.strictEqual(isBeforeDataStart({ start: '2024-01-01', end: '2024-01-31' }, '2025-03-10'), true);
  assert.strictEqual(isBeforeDataStart({ start: '2025-03-01', end: '2025-03-31' }, '2025-03-10'), false);
}

main();
