const assert = require('assert');
const {
  DEFAULT_GOOGLE_ADS_API_VERSION,
  getGoogleAdsConfig,
  normalizeGoogleAdsApiVersion,
} = require('../lib/google-ads-config');

function main() {
  assert.strictEqual(DEFAULT_GOOGLE_ADS_API_VERSION, 'v25');
  assert.strictEqual(normalizeGoogleAdsApiVersion(''), 'v25');
  assert.strictEqual(normalizeGoogleAdsApiVersion('v18'), 'v25');
  assert.strictEqual(normalizeGoogleAdsApiVersion('v22'), 'v25');
  assert.strictEqual(normalizeGoogleAdsApiVersion('v25'), 'v25');
  assert.strictEqual(normalizeGoogleAdsApiVersion('v26'), 'v26');

  const previous = process.env.GOOGLE_ADS_API_VERSION;
  process.env.GOOGLE_ADS_API_VERSION = 'v18';
  assert.strictEqual(getGoogleAdsConfig().apiVersion, 'v25');
  process.env.GOOGLE_ADS_API_VERSION = 'v22';
  assert.strictEqual(getGoogleAdsConfig().apiVersion, 'v25');
  process.env.GOOGLE_ADS_API_VERSION = 'v25';
  assert.strictEqual(getGoogleAdsConfig().apiVersion, 'v25');
  if (previous == null) delete process.env.GOOGLE_ADS_API_VERSION;
  else process.env.GOOGLE_ADS_API_VERSION = previous;

  const {
    classifyGoogleAdsConversionAction,
    parseGoogleAdsSendTo,
  } = require('../lib/google-ads-query');
  assert.strictEqual(classifyGoogleAdsConversionAction({ category: 'BOOK_APPOINTMENT' }), 'appointment');
  assert.strictEqual(classifyGoogleAdsConversionAction({ category: 'SUBMIT_LEAD_FORM' }), 'contact_form');
  assert.strictEqual(classifyGoogleAdsConversionAction({ name: 'Appointment booked' }), 'appointment');
  assert.strictEqual(classifyGoogleAdsConversionAction({ name: 'Kontaktformular' }), 'contact_form');
  assert.deepStrictEqual(
    parseGoogleAdsSendTo([{ eventSnippet: "gtag('event', 'conversion', {'send_to': 'AW-1234567890/AbC-D_efG'});" }]),
    { awConversionId: '1234567890', conversionLabel: 'AbC-D_efG', sendTo: 'AW-1234567890/AbC-D_efG' },
  );

  console.log('google-ads-config version tests passed');
}

main();
