const assert = require('assert');
const {
  isActiveCenhubManualMonth,
  isCenhubManualStored,
  resolveEffectiveToplineSource,
} = require('../lib/meta-report-topline-mode');
const { buildMonthPayload } = require('../lib/meta-report-service');

const ghlSettings = { metaReportGhlDataEnabled: true, metaReportToplineMode: 'cenhub' };
const metaSettings = { metaReportGhlDataEnabled: true, metaReportToplineMode: 'meta' };

assert.strictEqual(
  resolveEffectiveToplineSource({ toplineSource: 'manual', manualOverride: true }, metaSettings),
  'meta',
);
assert.strictEqual(
  resolveEffectiveToplineSource({ toplineSource: 'manual', manualOverride: true }, ghlSettings),
  'manual',
);
assert.strictEqual(isCenhubManualStored({ toplineSource: 'manual', manualOverride: true }), true);
assert.strictEqual(
  isActiveCenhubManualMonth({ toplineSource: 'manual', manualOverride: true }, metaSettings),
  false,
);
assert.strictEqual(
  isActiveCenhubManualMonth({ toplineSource: 'manual', manualOverride: true }, ghlSettings),
  true,
);

const account = {
  clientId: 'test-client',
  metaReportGhlDataEnabled: true,
  metaReportToplineMode: 'meta',
  metaReportShowBottomline: false,
  metaReportFeeEnabled: false,
};
const monthRecord = {
  monthKey: '2026-08',
  periodStart: '2026-08-01',
  periodEnd: '2026-08-31',
  toplineSource: 'manual',
  manualOverride: true,
  wonLeads: 9,
  avgLeadValue: 9000,
  avgProfitPerWon: 7000,
  metaSavedWonLeads: 3,
  metaSavedAvgLeadValue: 51000,
  metaSavedAvgProfitPerWon: 41000,
  metaSpend: 1000,
  published: true,
};

const payload = buildMonthPayload(account, monthRecord, { includeUnpublished: true });
assert.strictEqual(payload.dataSource, 'meta');
assert.strictEqual(payload.manualOverride, false);
assert.strictEqual(payload.topline.wonLeads, 3);
assert.strictEqual(payload.topline.avgLeadValue, 51000);

const cenhubPayload = buildMonthPayload(
  { ...account, metaReportToplineMode: 'cenhub' },
  monthRecord,
  { includeUnpublished: true },
);
assert.strictEqual(cenhubPayload.dataSource, 'manual');
assert.strictEqual(cenhubPayload.manualOverride, true);
assert.strictEqual(cenhubPayload.topline.wonLeads, 9);

console.log('Meta report topline mode tests passed.');
