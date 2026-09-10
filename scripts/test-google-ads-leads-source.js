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

  const { displayedGoogleAdsLeads } = require('../lib/google-ads-leads-source');
  const sharedMonth = { googleConversions: 12, manualLeads: 40, wonLeads: 3, avgLeadValue: 1000 };
  assert.strictEqual(displayedGoogleAdsLeads(sharedMonth, { googleAdsReportLeadsSource: 'google' }), 12);
  assert.strictEqual(displayedGoogleAdsLeads(sharedMonth, { googleAdsReportLeadsSource: 'manual' }), 40);
  assert.strictEqual(displayedGoogleAdsLeads({ googleConversions: null, manualLeads: null }, { googleAdsReportLeadsSource: 'manual' }), null);

  const googleSettings = { googleAdsReportLeadsSource: 'google' };
  const manualSettings = { googleAdsReportLeadsSource: 'manual' };
  const customValuesMonth = { googleConversions: 12, manualLeads: 40, wonLeads: 3, avgLeadValue: 1000, avgProfitPerWon: 400 };
  const editReportMonth = {
    ...customValuesMonth,
    google: { conversions: 0 },
    topline: { leads: 0, wonLeads: 0, avgLeadValue: 0 },
    inputs: { avgProfitPerWon: 0 },
  };
  assert.strictEqual(
    displayedGoogleAdsLeads(customValuesMonth, googleSettings),
    displayedGoogleAdsLeads(editReportMonth, googleSettings),
  );
  assert.strictEqual(
    displayedGoogleAdsLeads(customValuesMonth, manualSettings),
    displayedGoogleAdsLeads(editReportMonth, manualSettings),
  );

  const customValuesEmpty = { googleConversions: null, manualLeads: null, wonLeads: null, avgLeadValue: null, avgProfitPerWon: null };
  const editReportEmpty = {
    ...customValuesEmpty,
    google: { conversions: 0 },
    topline: { leads: 0, wonLeads: 0, avgLeadValue: 0 },
    inputs: { avgProfitPerWon: 0 },
  };
  assert.strictEqual(displayedGoogleAdsLeads(customValuesEmpty, googleSettings), displayedGoogleAdsLeads(editReportEmpty, googleSettings));
  assert.strictEqual(displayedGoogleAdsLeads(customValuesEmpty, googleSettings), null);
  assert.strictEqual(displayedGoogleAdsLeads(editReportEmpty, manualSettings), null);

  console.log('Google Ads leads source tests passed.');
}

main();
