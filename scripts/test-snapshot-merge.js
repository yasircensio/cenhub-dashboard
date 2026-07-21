#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  mergeOpportunityIntoSnapshot,
  removeOpportunityFromSnapshot,
} = require('../lib/snapshot-merge');

const DATA_FILE = path.join(__dirname, '..', '.data', 'multi-tenant-store.json');
const TEST_CLIENT = 'snapshot-merge-test';

function writeTestSnapshot(opportunities) {
  const store = fs.existsSync(DATA_FILE)
    ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
    : { accounts: {}, snapshots: {} };

  store.accounts[TEST_CLIENT] = store.accounts[TEST_CLIENT] || {
    clientId: TEST_CLIENT,
    locationId: 'loc-test',
  };
  store.snapshots[TEST_CLIENT] = {
    fetched_at: new Date().toISOString(),
    sync_status: 'success',
    sync_error: null,
    pipelines: [{ id: 'p1', name: 'Sales' }],
    users: [],
    contact_count: 0,
    opportunities,
  };

  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

function readTestOpportunities() {
  const store = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  return store.snapshots[TEST_CLIENT]?.opportunities || [];
}

async function testMergeUpsert() {
  writeTestSnapshot([
    { id: 'opp-1', name: 'First', status: 'open', monetaryValue: 100 },
  ]);

  await mergeOpportunityIntoSnapshot(TEST_CLIENT, {
    id: 'opp-1',
    name: 'First updated',
    status: 'won',
    monetaryValue: 500,
  });

  const merged = readTestOpportunities();
  assert.strictEqual(merged.length, 1);
  assert.strictEqual(merged[0].name, 'First updated');
  assert.strictEqual(merged[0].status, 'won');
  assert.strictEqual(merged[0].monetaryValue, 500);
}

async function testMergeInsert() {
  writeTestSnapshot([
    { id: 'opp-1', name: 'First', status: 'open', monetaryValue: 100 },
  ]);

  await mergeOpportunityIntoSnapshot(TEST_CLIENT, {
    id: 'opp-2',
    name: 'Second',
    status: 'open',
    monetaryValue: 200,
  });

  const merged = readTestOpportunities();
  assert.strictEqual(merged.length, 2);
  assert.ok(merged.some((row) => row.id === 'opp-2'));
}

async function testRemove() {
  writeTestSnapshot([
    { id: 'opp-1', name: 'First', status: 'open', monetaryValue: 100 },
    { id: 'opp-2', name: 'Second', status: 'open', monetaryValue: 200 },
  ]);

  await removeOpportunityFromSnapshot(TEST_CLIENT, 'opp-1');
  const remaining = readTestOpportunities();
  assert.strictEqual(remaining.length, 1);
  assert.strictEqual(remaining[0].id, 'opp-2');
}

async function testSyncLockBlocksMerge() {
  writeTestSnapshot([
    { id: 'opp-1', name: 'First', status: 'open', monetaryValue: 100 },
  ]);

  const store = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  store.snapshots[TEST_CLIENT].sync_status = 'syncing';
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));

  const { SyncInProgressError } = require('../lib/snapshot-sync-lock');
  await assert.rejects(
    () => mergeOpportunityIntoSnapshot(TEST_CLIENT, {
      id: 'opp-1',
      name: 'Blocked',
      status: 'open',
      monetaryValue: 100,
    }),
    (error) => error instanceof SyncInProgressError,
  );
}

async function main() {
  if (process.env.DATABASE_URL) {
    console.log('Skipping file-store snapshot merge tests (DATABASE_URL is set — use a dev DB to test Postgres path).');
    return;
  }

  await testMergeUpsert();
  await testMergeInsert();
  await testRemove();
  await testSyncLockBlocksMerge();
  console.log('Snapshot merge tests passed.');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
