#!/usr/bin/env node
const assert = require('assert');
const { buildAccountSyncEvents, createBatchId } = require('../lib/sync-batch');
const { computeAccountStatus } = require('../lib/account-store');

function testBuildAccountSyncEvents() {
  const events = buildAccountSyncEvents(['alpha', 'beta'], {
    batchId: 'batch-test',
    source: 'admin',
  });

  assert.strictEqual(events.length, 2);
  assert.deepStrictEqual(events[0], {
    name: 'dashboard/sync.account',
    data: { clientId: 'alpha', batchId: 'batch-test', source: 'admin' },
  });
  assert.deepStrictEqual(events[1], {
    name: 'dashboard/sync.account',
    data: { clientId: 'beta', batchId: 'batch-test', source: 'admin' },
  });
}

function testCreateBatchId() {
  const batchId = createBatchId();
  assert.match(batchId, /^batch-\d+-[a-z0-9]+$/);
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

testBuildAccountSyncEvents();
testCreateBatchId();
testAccountStatusSyncing();

console.log('Sync batch unit tests passed.');
