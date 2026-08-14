const assert = require('assert');
const {
  resolveAffectedMonthKeys,
  shouldAutoSyncMetaReportGhl,
} = require('../lib/meta-report-ghl-webhook-hook');

const account = {
  clientId: 'censio',
  timezone: 'Europe/Copenhagen',
  metaReportEnabled: true,
  metaReportGhlDataEnabled: true,
  metaReportToplineMode: 'cenhub',
};

assert.strictEqual(shouldAutoSyncMetaReportGhl(account), true);
assert.strictEqual(shouldAutoSyncMetaReportGhl({ ...account, metaReportToplineMode: 'meta' }), false);
assert.strictEqual(shouldAutoSyncMetaReportGhl({ ...account, metaReportGhlDataEnabled: false }), false);

const leadMonth = resolveAffectedMonthKeys({
  id: '1',
  status: 'open',
  createdAt: '2026-08-05T10:00:00.000Z',
}, account);
assert.deepStrictEqual(leadMonth, ['2026-08']);

const wonMonth = resolveAffectedMonthKeys({
  id: '2',
  status: 'won',
  createdAt: '2026-07-01T10:00:00.000Z',
  lastStatusChangeAt: '2026-08-12T15:00:00.000Z',
}, account);
assert.ok(wonMonth.includes('2026-07'));
assert.ok(wonMonth.includes('2026-08'));

console.log('Meta report GHL webhook hook tests passed.');
