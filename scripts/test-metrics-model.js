#!/usr/bin/env node
const assert = require('assert');
const {
  computeWinMetrics,
  getWinOpportunities,
  resolveMetricsModel,
  validateMetricsModelInput,
} = require('../lib/metrics-model');

function testDedupeUsesWinPipeline() {
  const model = resolveMetricsModel({
    dedupeEnabled: true,
    winPipelineId: 'win-1',
    afterSalesPipelineId: 'after-1',
    salesPipelineId: 'sales-1',
  });
  assert.strictEqual(model.winMode, 'pipeline');
  assert.strictEqual(model.winPipelineId, 'win-1');

  const opps = [
    { id: '1', status: 'won', pipelineId: 'win-1', monetaryValue: 100, contactId: 'c1', lastStatusChangeAt: '2026-03-01T10:00:00Z' },
    { id: '2', status: 'won', pipelineId: 'sales-1', monetaryValue: 50, contactId: 'c2', lastStatusChangeAt: '2026-03-02T10:00:00Z' },
  ];
  const metrics = computeWinMetrics(opps, model, {});
  assert.strictEqual(metrics.wonRevenue, 100);
  assert.strictEqual(metrics.clientsWon, 1);
}

function testSimpleUsesAllWon() {
  const model = resolveMetricsModel({
    dedupeEnabled: false,
    salesPipelineId: 'sales-1',
  });
  assert.strictEqual(model.winMode, 'all');
  assert.strictEqual(model.winPipelineId, null);

  const opps = [
    { id: '1', status: 'won', pipelineId: 'sales-1', monetaryValue: 100, contactId: 'c1' },
    { id: '2', status: 'won', pipelineId: 'other', monetaryValue: 75, contactId: 'c2' },
  ];
  const metrics = computeWinMetrics(opps, model, {});
  assert.strictEqual(metrics.wonRevenue, 175);
  assert.strictEqual(metrics.clientsWon, 2);
}

function testDateFilterOnWinDate() {
  const model = resolveMetricsModel({ dedupeEnabled: false });
  const opps = [
    { id: '1', status: 'won', pipelineId: 'a', monetaryValue: 100, lastStatusChangeAt: '2026-03-15T10:00:00Z' },
    { id: '2', status: 'won', pipelineId: 'a', monetaryValue: 200, lastStatusChangeAt: '2026-01-10T10:00:00Z' },
  ];
  const metrics = computeWinMetrics(opps, model, {
    dateFrom: '2026-03-01',
    dateTo: '2026-03-31',
    timeZone: 'Europe/Copenhagen',
  });
  assert.strictEqual(metrics.wonRevenue, 100);
}

function testValidateRequiresWinPipelineWhenDedupe() {
  assert.throws(
    () => validateMetricsModelInput({ dedupeEnabled: true, winPipelineId: null }),
    /Win pipeline is required/,
  );
}

testDedupeUsesWinPipeline();
testSimpleUsesAllWon();
testDateFilterOnWinDate();
testValidateRequiresWinPipelineWhenDedupe();

console.log('Metrics model unit tests passed.');
