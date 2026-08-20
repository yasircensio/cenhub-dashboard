#!/usr/bin/env node
/**
 * Dry-run Google Ads metrics fetch.
 *
 * Requires in .env:
 *   GOOGLE_ADS_DEVELOPER_TOKEN
 *   GOOGLE_ADS_CLIENT_ID
 *   GOOGLE_ADS_CLIENT_SECRET
 *   GOOGLE_ADS_REFRESH_TOKEN
 *
 * Optional:
 *   GOOGLE_ADS_LOGIN_CUSTOMER_ID   (MCC id, no dashes — only if querying via manager)
 *   GOOGLE_ADS_TEST_CUSTOMER_ID    (default test customer)
 *
 * Usage:
 *   node scripts/test-google-ads-insights.js [customerId]
 *   node scripts/test-google-ads-insights.js 9103268801
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const {
  formatGoogleAdsCustomerId,
  normalizeGoogleAdsCustomerId,
} = require('../lib/google-ads-config');
const { fetchGoogleAdsCustomerMetrics } = require('../lib/google-ads-query');

async function main() {
  const customerId = normalizeGoogleAdsCustomerId(
    process.argv[2] || process.env.GOOGLE_ADS_TEST_CUSTOMER_ID || '9103268801',
  );
  if (!customerId) {
    throw new Error('Pass customer id as argv[2] or set GOOGLE_ADS_TEST_CUSTOMER_ID (10 digits).');
  }

  console.log(`Fetching Google Ads metrics for ${formatGoogleAdsCustomerId(customerId)} (${customerId})...\n`);
  const result = await fetchGoogleAdsCustomerMetrics(customerId);
  const payload = {
    customerId: result.customerId,
    customerLabel: formatGoogleAdsCustomerId(result.customerId),
    period: 'LAST_30_DAYS',
    rowCount: result.rowCount,
    metrics: result.totals,
  };

  console.log(JSON.stringify(payload, null, 2));
  console.log('\nOK — Google Ads API auth and GAQL query succeeded.');
}

main().catch((error) => {
  if (error.details) {
    console.error(JSON.stringify(error.details, null, 2));
  }
  console.error(error.message || error);
  process.exit(1);
});
