const assert = require('assert');
const {
  DEFAULT_GOOGLE_ADS_API_VERSION,
  getGoogleAdsConfig,
  normalizeGoogleAdsApiVersion,
} = require('../lib/google-ads-config');

function main() {
  assert.strictEqual(normalizeGoogleAdsApiVersion(''), DEFAULT_GOOGLE_ADS_API_VERSION);
  assert.strictEqual(normalizeGoogleAdsApiVersion('v18'), DEFAULT_GOOGLE_ADS_API_VERSION);
  assert.strictEqual(normalizeGoogleAdsApiVersion('18'), DEFAULT_GOOGLE_ADS_API_VERSION);
  assert.strictEqual(normalizeGoogleAdsApiVersion('v21'), DEFAULT_GOOGLE_ADS_API_VERSION);
  assert.strictEqual(normalizeGoogleAdsApiVersion('v22'), 'v22');
  assert.strictEqual(normalizeGoogleAdsApiVersion('v25'), 'v25');

  const previous = process.env.GOOGLE_ADS_API_VERSION;
  process.env.GOOGLE_ADS_API_VERSION = 'v18';
  assert.strictEqual(getGoogleAdsConfig().apiVersion, DEFAULT_GOOGLE_ADS_API_VERSION);
  process.env.GOOGLE_ADS_API_VERSION = 'v22';
  assert.strictEqual(getGoogleAdsConfig().apiVersion, 'v22');
  if (previous == null) delete process.env.GOOGLE_ADS_API_VERSION;
  else process.env.GOOGLE_ADS_API_VERSION = previous;

  console.log('google-ads-config version tests passed');
}

main();
