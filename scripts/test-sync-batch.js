#!/usr/bin/env node
const assert = require('assert');
const { createBatchId, syncAllInline } = require('../lib/sync-batch');
const { computeAccountStatus } = require('../lib/account-store');

function testCreateBatchId() {
  const batchId = createBatchId();
  assert.match(batchId, /^batch-\d+-[a-z0-9]+$/);
}

function testSyncAllInlineExport() {
  assert.strictEqual(typeof syncAllInline, 'function');
}

function testAccountStatusSyncing() {
  const account = {
    hasGhlToken: true,
    metricsModelSetAt: new Date().toISOString(),
    newLeadsPipelineId: 'a',
    salesPipelineId: 'b',
    readyForGhl: true,
  };
  const snapshot = {
    fetched_at: new Date().toISOString(),
    sync_status: 'syncing',
  };
  assert.strictEqual(computeAccountStatus(account, snapshot), 'syncing');
}

testCreateBatchId();
testSyncAllInlineExport();
testAccountStatusSyncing();

console.log('Sync batch unit tests passed.');
