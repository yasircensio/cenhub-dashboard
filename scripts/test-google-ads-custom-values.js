const assert = require('assert');
const {
  classifyGoogleAdsCustomInputStatus,
  googleAdsCustomInputsUpdatedAt,
} = require('../lib/google-ads-report-store');

function main() {
  assert.strictEqual(classifyGoogleAdsCustomInputStatus(null), 'empty');
  assert.strictEqual(classifyGoogleAdsCustomInputStatus({}), 'empty');
  assert.strictEqual(classifyGoogleAdsCustomInputStatus({ won_leads: 2 }), 'partial');
  assert.strictEqual(classifyGoogleAdsCustomInputStatus({
    won_leads: 2,
    avg_lead_value: 1000,
  }), 'complete');
  assert.strictEqual(classifyGoogleAdsCustomInputStatus({
    won_leads: 2,
    avg_lead_value: 1000,
  }, { requireProfit: true }), 'partial');
  assert.strictEqual(classifyGoogleAdsCustomInputStatus({
    wonLeads: 2,
    avgLeadValue: 1000,
    avgProfitPerWon: 400,
  }, { requireProfit: true }), 'complete');
  assert.strictEqual(
    googleAdsCustomInputsUpdatedAt({ updated_at: '2026-09-10T10:00:00.000Z' }, 'empty'),
    null,
  );
  assert.strictEqual(
    googleAdsCustomInputsUpdatedAt({ updatedAt: '2026-09-10T10:00:00.000Z' }, 'partial'),
    '2026-09-10T10:00:00.000Z',
  );

  console.log('Google Ads custom values status tests passed.');
}

main();
