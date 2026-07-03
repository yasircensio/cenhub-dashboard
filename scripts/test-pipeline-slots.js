#!/usr/bin/env node
const assert = require('assert');
const { buildPipelineSlots } = require('../lib/pipeline-slots');

function testThreePipelineMode() {
  const slots = buildPipelineSlots({
    newLeadsPipelineId: 'leads-1',
    salesPipelineId: 'sales-1',
    afterSalesPipelineId: 'after-1',
    dedupeEnabled: true,
  });

  assert.strictEqual(slots.pipelineMode, '3-pipeline');
  assert.strictEqual(slots.winPipelineId, 'after-1');
  assert.deepStrictEqual(slots.funnelPipelineIds, ['leads-1', 'sales-1']);
  assert.deepStrictEqual(slots.defaultPipelineIds, ['leads-1', 'sales-1', 'after-1']);
  assert.strictEqual(slots.dedupeEnabled, true);
}

function testTwoPipelineMode() {
  const slots = buildPipelineSlots({
    newLeadsPipelineId: 'leads-1',
    salesPipelineId: 'sales-1',
    afterSalesPipelineId: null,
    dedupeEnabled: false,
  });

  assert.strictEqual(slots.pipelineMode, '2-pipeline');
  assert.strictEqual(slots.winMode, 'all');
  assert.strictEqual(slots.winPipelineId, null);
  assert.deepStrictEqual(slots.defaultPipelineIds, ['leads-1', 'sales-1']);
  assert.strictEqual(slots.dedupeEnabled, false);
}

function testDedupeDisabledWithoutAfterSales() {
  const slots = buildPipelineSlots({
    newLeadsPipelineId: 'leads-1',
    salesPipelineId: 'sales-1',
    dedupeEnabled: false,
    winPipelineId: 'sales-1',
  });

  assert.strictEqual(slots.dedupeEnabled, false);
  assert.strictEqual(slots.winMode, 'pipeline');
  assert.strictEqual(slots.winPipelineId, 'sales-1');
}

testThreePipelineMode();
testTwoPipelineMode();
testDedupeDisabledWithoutAfterSales();

console.log('Pipeline slots unit tests passed.');
