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

  const totals = totalsFromKpis({ totalRevenue: 100, adSpend: 20, totalLeads: 4, clientsWon: 2, poasDk: 30 });
  assert.strictEqual(totals.roas, 5);
  assert.strictEqual(totals.cpl, 5);
  assert.strictEqual(totals.cac, 10);

  console.log('GHL performance bucket tests passed.');
}

main();
