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

  console.log('google-ads-config version tests passed');
}

main();
