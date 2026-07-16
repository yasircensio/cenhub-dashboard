require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const {
  normalizeMetaAdAccountId,
  transformToMetricsPayload,
} = require('../lib/meta-insights');
const {
  normalizeMetaAccessToken,
  resolveMetaAccessToken,
  validateMetaAccessToken,
  verifyMetaAccessToken,
} = require('../lib/meta-token');
const { resolveMetaSystemUserToken } = require('../lib/account-store');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function testNormalizeMetaAdAccountId() {
  assert(normalizeMetaAdAccountId('154139302') === '154139302', 'numeric id');
  assert(normalizeMetaAdAccountId('act_154139302') === '154139302', 'act_ prefix');
  assert(normalizeMetaAdAccountId('') === null, 'empty');
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
}

function testValidateMetaAccessToken() {
  assert(!validateMetaAccessToken('').ok, 'empty');
  assert(!validateMetaAccessToken('154139302').ok, 'numeric ad account id');
  assert(!validateMetaAccessToken('123456789012345|abc').ok, 'app token');
  assert(validateMetaAccessToken('EAA' + 'x'.repeat(100)).ok, 'long token');
  assert(validateMetaAccessToken('"EAA' + 'x'.repeat(100) + '"').token.startsWith('EAA'), 'strip quotes');
}

function testResolveMetaAccessTokenFallback() {
  const prev = process.env.META_SYSTEM_USER_TOKEN;
  process.env.META_SYSTEM_USER_TOKEN = 'EAA' + 'y'.repeat(100);
  const resolved = resolveMetaAccessToken({
    metaSystemUserToken: '154139302',
  });
  assert(resolved.source === 'env', 'falls back to env when account token invalid');
  assert(resolved.ignoredAccountOverride, 'flags ignored override');
  process.env.META_SYSTEM_USER_TOKEN = prev;
}

function testResolveMetaSystemUserToken() {
  const prev = process.env.META_SYSTEM_USER_TOKEN;
  process.env.META_SYSTEM_USER_TOKEN = 'EAA' + 'z'.repeat(100);
  assert(resolveMetaSystemUserToken({ metaSystemUserToken: 'EAA' + 'a'.repeat(100) }).startsWith('EAA'), 'override');
  assert(resolveMetaSystemUserToken({}).startsWith('EAA'), 'env fallback');
  process.env.META_SYSTEM_USER_TOKEN = prev;
}

async function testUpdateAccountMetaFields() {
  if (!process.env.DATABASE_URL && !require('fs').existsSync(require('path').join(__dirname, '..', '.data', 'multi-tenant-store.json'))) {
    console.log('  (skip updateAccount meta test — no store)');
    return;
  }

  const {
    createAccount,
    deleteAccount,
    getAccount,
    updateAccount,
  } = require('../lib/account-store');

  const slug = `test-meta-${Date.now()}`;
  await createAccount({ clientId: slug, accountName: 'Meta Test' });
  try {
    await updateAccount(slug, { metaAdAccountId: 'act_154139302' });
    const account = await getAccount(slug);
    assert(account.metaAdAccountId === '154139302', 'metaAdAccountId persisted after update');
  } finally {
    await deleteAccount(slug).catch(() => {});
  }
}

async function main() {
  console.log('Testing Meta integration helpers...\n');
  testNormalizeMetaAdAccountId();
  testTransformPayload();
  testValidateMetaAccessToken();
  testResolveMetaAccessTokenFallback();
  testResolveMetaSystemUserToken();
  await testUpdateAccountMetaFields();
  console.log('All Meta integration helper tests passed.');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
