#!/usr/bin/env node
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { getSnapshotPreviewKpis } = require('../lib/snapshot-kpis');
const { computeAccountStatus } = require('../lib/account-store');

const DATA_FILE = path.join(__dirname, '..', '.data', 'multi-tenant-store.json');

function testSnapshotPreviewKpis() {
  const snapshot = {
    contact_count: 100,
    opportunities: [
      { pipelineId: 'win-1', status: 'won', monetaryValue: 5000, contactId: 'c1' },
      { pipelineId: 'win-1', status: 'won', monetaryValue: 3000, contactId: 'c2' },
      { pipelineId: 'sales-1', status: 'open', monetaryValue: 1000, contactId: 'c3' },
    ],
  };
  const account = {
    newLeadsPipelineId: 'leads-1',
    salesPipelineId: 'sales-1',
    afterSalesPipelineId: 'win-1',
  };

  const kpis = getSnapshotPreviewKpis(snapshot, account);
  assert.strictEqual(kpis.clientsWon, 2);
  assert.strictEqual(kpis.wonRevenue, 8000);
  assert.strictEqual(kpis.totalLeads, 100);
}

function testAccountStatusReady() {
  const account = {
    hasGhlToken: true,
    metricsModelSetAt: new Date().toISOString(),
    newLeadsPipelineId: 'a',
    salesPipelineId: 'b',
    afterSalesPipelineId: 'c',
    readyForGhl: true,
  };
  const snapshot = { fetched_at: new Date().toISOString(), sync_status: 'success' };
  assert.strictEqual(computeAccountStatus(account, snapshot), 'ready');
}

function testAccountStatusNeedsMetricsModel() {
  const account = {
    hasGhlToken: true,
    newLeadsPipelineId: 'a',
    salesPipelineId: 'b',
  };
  assert.strictEqual(computeAccountStatus(account, null), 'needs_metrics_model');
}

function testAccountStatusNeedsSync() {
  const account = {
    hasGhlToken: true,
    metricsModelSetAt: new Date().toISOString(),
    newLeadsPipelineId: 'a',
    salesPipelineId: 'b',
    readyForGhl: false,
  };
  assert.strictEqual(computeAccountStatus(account, null), 'needs_sync');
}

function testFileStoreExistsAfterSeed() {
  if (!fs.existsSync(DATA_FILE)) {
    console.log('Skipping file-store check (no .data/multi-tenant-store.json — run npm run seed:suntech first).');
    return;
  }
  const store = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  assert.ok(store.accounts['suntech-nordic'], 'Expected suntech-nordic account in file store.');
  assert.ok(store.snapshots['suntech-nordic']?.fetched_at, 'Expected snapshot for suntech-nordic.');
}

testSnapshotPreviewKpis();
testAccountStatusReady();
testAccountStatusNeedsMetricsModel();
testAccountStatusNeedsSync();
testFileStoreExistsAfterSeed();

console.log('Sync / account store unit tests passed.');
