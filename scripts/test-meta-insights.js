/**
 * Dry-run Meta insights fetch (requires META_SYSTEM_USER_TOKEN and ad account id).
 * Usage: node scripts/test-meta-insights.js [adAccountId]
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const {
  fetchAllInsightsBuckets,
  normalizeMetaAdAccountId,
  transformToMetricsPayload,
} = require('../lib/meta-insights');

async function main() {
  const adAccountId = normalizeMetaAdAccountId(process.argv[2] || process.env.META_TEST_AD_ACCOUNT_ID || '154139302');
  const token = String(process.env.META_SYSTEM_USER_TOKEN || '').trim();

  if (!token) {
    throw new Error('Set META_SYSTEM_USER_TOKEN in .env');
  }
  if (!adAccountId) {
    throw new Error('Pass ad account id as argv[2] or set META_TEST_AD_ACCOUNT_ID');
  }

  console.log(`Fetching Meta insights for act_${adAccountId}...\n`);
  const buckets = await fetchAllInsightsBuckets(adAccountId, token);
  const payload = transformToMetricsPayload('test-meta', 'Test Meta Account', buckets);

  console.log(JSON.stringify(payload, null, 2));
  console.log('\nOK — payload shape ready for saveClientMetrics.');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
