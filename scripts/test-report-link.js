const assert = require('assert');
const {
  buildDualPublicReportShape,
  resolveDualPlatforms,
  summarizeLinkedPair,
} = require('../lib/report-link');

function main() {
  assert.deepStrictEqual(
    resolveDualPlatforms({ metaEnabled: true, googleEnabled: true }, 'meta'),
    ['meta', 'google-ads'],
  );
  assert.deepStrictEqual(
    resolveDualPlatforms({ metaEnabled: true, googleEnabled: false }, 'meta'),
    ['meta'],
  );
  assert.deepStrictEqual(
    resolveDualPlatforms({ metaEnabled: false, googleEnabled: true }, 'google-ads'),
    ['google-ads'],
  );
  assert.deepStrictEqual(
    resolveDualPlatforms({ metaEnabled: true, googleEnabled: true }, 'google-ads'),
    ['meta', 'google-ads'],
  );

  const pair = summarizeLinkedPair(
    { clientId: 'acme', accountName: 'Acme', metaReportEnabled: true },
    { clientId: 'gads-1', accountName: 'Acme Google', linkedMetaClientId: 'acme', enabled: true },
  );
  assert.strictEqual(pair.metaClientId, 'acme');
  assert.strictEqual(pair.googleClientId, 'gads-1');
  assert.strictEqual(
    summarizeLinkedPair(
      { clientId: 'acme', metaReportEnabled: true },
      { clientId: 'gads-1', linkedMetaClientId: 'other', enabled: true },
    ),
    null,
  );

  const dualMeta = buildDualPublicReportShape({
    origin: 'meta',
    pair,
    meta: { clientId: 'acme', year: 2026, accountName: 'Acme', months: {} },
    google: { clientId: 'gads-1', year: 2026, accountName: 'Acme Google', months: {} },
  });
  assert.strictEqual(dualMeta.reportKind, 'dual');
  assert.strictEqual(dualMeta.origin, 'meta');
  assert.strictEqual(dualMeta.accountName, 'Acme');
  assert.deepStrictEqual(dualMeta.platforms, ['meta', 'google-ads']);

  const dual = buildDualPublicReportShape({
    origin: 'google-ads',
    pair,
    meta: { clientId: 'acme', year: 2026, accountName: 'Acme', months: {} },
    google: { clientId: 'gads-1', year: 2026, accountName: 'Acme Google', months: {} },
  });
  assert.strictEqual(dual.reportKind, 'dual');
  assert.strictEqual(dual.origin, 'google-ads');
  assert.deepStrictEqual(dual.platforms, ['meta', 'google-ads']);
  assert.strictEqual(dual.accountName, 'Acme Google');

  const single = buildDualPublicReportShape({
    origin: 'meta',
    pair: { ...pair, googleEnabled: false },
    meta: { clientId: 'acme', year: 2026 },
    google: { clientId: 'gads-1', year: 2026 },
  });
  assert.strictEqual(single, null);

  const dualOriginOnly = buildDualPublicReportShape({
    origin: 'google-ads',
    pair: { ...pair, metaEnabled: false, googleEnabled: true },
    meta: { clientId: 'acme', year: 2026 },
    google: { clientId: 'gads-1', year: 2026 },
  });
  assert.strictEqual(dualOriginOnly, null);

  const fs = require('fs');
  const path = require('path');
  const uniqueSql = fs.readFileSync(
    path.join(__dirname, '..', 'db', 'migrate-google-ads-report-link.sql'),
    'utf8',
  );
  assert(uniqueSql.includes('google_ads_report_clients_linked_meta_idx'));
  assert(uniqueSql.includes('UNIQUE INDEX'));

  console.log('Report link tests passed.');
}

main();
