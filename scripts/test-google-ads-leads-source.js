const assert = require('assert');
const {
  normalizeGoogleAdsLeadsSource,
  resolveEffectiveGoogleAdsLeads,
  resolveManualLeadsToStore,
} = require('../lib/google-ads-leads-source');

function main() {
  assert.strictEqual(normalizeGoogleAdsLeadsSource('manual'), 'manual');
  assert.strictEqual(normalizeGoogleAdsLeadsSource('google'), 'google');
  assert.strictEqual(normalizeGoogleAdsLeadsSource(null), 'google');

  const googleOnly = resolveEffectiveGoogleAdsLeads({
    googleConversions: 12,
    manualLeads: 40,
  }, { googleAdsReportLeadsSource: 'google' });
  assert.strictEqual(googleOnly.leads, 12);
  assert.strictEqual(googleOnly.overridden, false);

  const manualFallback = resolveEffectiveGoogleAdsLeads({
    googleConversions: 12,
    manualLeads: null,
  }, { googleAdsReportLeadsSource: 'manual' });
  assert.strictEqual(manualFallback.leads, 12);
  assert.strictEqual(manualFallback.overridden, false);

  const manualOverride = resolveEffectiveGoogleAdsLeads({
    googleConversions: 12,
    manualLeads: 40,
  }, { googleAdsReportLeadsSource: 'manual' });
  assert.strictEqual(manualOverride.leads, 40);
  assert.strictEqual(manualOverride.overridden, true);

  assert.strictEqual(resolveManualLeadsToStore(12, 12, null, 'manual'), null);
  assert.strictEqual(resolveManualLeadsToStore(40, 12, null, 'manual'), 40);
  assert.strictEqual(resolveManualLeadsToStore(null, 12, 40, 'manual'), null);
  assert.strictEqual(resolveManualLeadsToStore(40, 12, 40, 'google'), 40);

  console.log('Google Ads leads source tests passed.');
}

main();
