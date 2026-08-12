const assert = require('assert');
const {
  aggregateFromSnapshot,
  canUseGhlForMonth,
} = require('../lib/meta-report-ghl-aggregator');
const {
  parseMetaReportsPath,
} = require('../lib/meta-reports-handler');

function buildOpportunity({ id, createdAt, status, monetaryValue, profit, pipelineId = 'pipe-new', contactId }) {
  return {
    id,
    pipelineId,
    status,
    createdAt,
    contactId: contactId || `contact-${id}`,
    monetaryValue,
    customFields: profit != null ? [{
      id: 'profit-field',
      fieldKey: 'opportunity.bundlinje',
      fieldValueNumber: profit,
    }] : [],
  };
}

function main() {
  const account = {
    clientId: 'test-client',
    timezone: 'Europe/Copenhagen',
    newLeadsPipelineId: 'pipe-new',
    salesPipelineId: 'pipe-sales',
    dedupeEnabled: false,
    profitFieldId: 'profit-field',
  };

  const snapshot = {
    fetched_at: '2026-03-01T10:00:00.000Z',
    pipelines: [{ id: 'pipe-new', name: 'New leads' }],
    opportunities: [
      buildOpportunity({ id: '1', createdAt: '2026-01-05T10:00:00Z', status: 'open', monetaryValue: 1000 }),
      buildOpportunity({ id: '2', createdAt: '2026-01-12T10:00:00Z', status: 'won', monetaryValue: 5000, profit: 1200 }),
      buildOpportunity({ id: '3', createdAt: '2026-02-02T10:00:00Z', status: 'won', monetaryValue: 3000, profit: 800 }),
    ],
  };

  const jan = aggregateFromSnapshot(snapshot, account, '2026-01');
  assert.strictEqual(jan.leads, 2);
  assert.strictEqual(jan.wonLeads, 1);
  assert.strictEqual(jan.totalRevenue, 5000);
  assert.strictEqual(jan.totalProfit, 1200);
  assert.strictEqual(jan.avgLeadValue, 5000);
  assert.strictEqual(jan.avgProfitPerWon, 1200);
  assert.strictEqual(canUseGhlForMonth(jan), true);

  const empty = aggregateFromSnapshot({ fetched_at: null, opportunities: [] }, account, '2025-12');
  assert.strictEqual(canUseGhlForMonth(empty), false);

  assert.deepStrictEqual(parseMetaReportsPath('/api/meta-reports/ghl-clients'), { kind: 'ghl-clients' });
  assert.deepStrictEqual(parseMetaReportsPath('/api/meta-reports/ghl-clients/foo'), {
    kind: 'ghl-client',
    clientId: 'foo',
  });
  assert.deepStrictEqual(parseMetaReportsPath('/api/meta-reports/clients/foo/sync-ghl-preview'), {
    kind: 'sync-ghl-preview',
    clientId: 'foo',
  });
  assert.deepStrictEqual(parseMetaReportsPath('/api/meta-reports/clients/foo/months/2026-01/sync-ghl'), {
    kind: 'month-sync-ghl',
    clientId: 'foo',
    monthKey: '2026-01',
  });

  console.log('Meta report GHL aggregator tests passed.');
}

main();
