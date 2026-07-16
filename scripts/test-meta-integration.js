require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const {
  normalizeMetaAdAccountId,
  transformToMetricsPayload,
} = require('../lib/meta-insights');
const { resolveMetaSystemUserToken } = require('../lib/account-store');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function testNormalizeMetaAdAccountId() {
  assert(normalizeMetaAdAccountId('154139302') === '154139302', 'numeric id');
  assert(normalizeMetaAdAccountId('act_154139302') === '154139302', 'act_ prefix');
  assert(normalizeMetaAdAccountId('') === null, 'empty');
  assert(normalizeMetaAdAccountId('  act_99  ') === '99', 'trim');
}

function testTransformPayload() {
  const payload = transformToMetricsPayload('censio', 'Censio', {
    this_month: { spend: '100', date_start: '2026-07-01', date_stop: '2026-07-15' },
    last_month: { spend: '200', date_start: '2026-06-01', date_stop: '2026-06-30' },
    yearly: { spend: '5000', date_start: '2026-01-01', date_stop: '2026-07-15' },
    monthly: [{ month: '2026-06', spend: '200' }, { month: '2026-07', spend: '100' }],
  });
  assert(payload.client_id === 'censio', 'client_id');
  assert(payload.this_month.spend === '100', 'this_month');
  assert(payload.monthly.length === 2, 'monthly rows');
}

function testResolveMetaSystemUserToken() {
  const prev = process.env.META_SYSTEM_USER_TOKEN;
  process.env.META_SYSTEM_USER_TOKEN = 'env-token';
  assert(resolveMetaSystemUserToken({ metaSystemUserToken: 'override' }) === 'override', 'override');
  assert(resolveMetaSystemUserToken({}) === 'env-token', 'env fallback');
  process.env.META_SYSTEM_USER_TOKEN = prev;
}

async function main() {
  console.log('Testing Meta integration helpers...\n');
  testNormalizeMetaAdAccountId();
  testTransformPayload();
  testResolveMetaSystemUserToken();
  console.log('All Meta integration helper tests passed.');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
