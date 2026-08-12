const assert = require('assert');
const {
  parseMetaReportsPath,
} = require('../lib/meta-reports-handler');

function main() {
  assert.deepStrictEqual(parseMetaReportsPath('/api/meta-reports'), { kind: 'dashboard' });
  assert.deepStrictEqual(parseMetaReportsPath('/api/meta-reports/provision'), { kind: 'provision' });
  assert.deepStrictEqual(parseMetaReportsPath('/api/meta-reports/custom-values'), {
    kind: 'custom-values',
  });
  assert.deepStrictEqual(parseMetaReportsPath('/api/meta-reports/public/abc123'), {
    kind: 'public',
    token: 'abc123',
  });
  assert.deepStrictEqual(parseMetaReportsPath('/api/meta-reports/clients/ml-tagdaekning'), {
    kind: 'client-year',
    clientId: 'ml-tagdaekning',
  });
  assert.deepStrictEqual(parseMetaReportsPath('/api/meta-reports/clients/ml-tagdaekning/settings'), {
    kind: 'client-settings',
    clientId: 'ml-tagdaekning',
  });
  assert.deepStrictEqual(parseMetaReportsPath('/api/meta-reports/clients/ml-tagdaekning/months/2026-01'), {
    kind: 'month-save',
    clientId: 'ml-tagdaekning',
    monthKey: '2026-01',
  });
  assert.deepStrictEqual(parseMetaReportsPath('/api/meta-reports/clients/ml-tagdaekning/months/2026-01/refresh'), {
    kind: 'month-refresh',
    clientId: 'ml-tagdaekning',
    monthKey: '2026-01',
  });
  assert.deepStrictEqual(parseMetaReportsPath('/api/meta-reports/ghl-clients'), { kind: 'ghl-clients' });
  assert.deepStrictEqual(parseMetaReportsPath('/api/meta-reports/clients/ml-tagdaekning/months/2026-01/sync-ghl'), {
    kind: 'month-sync-ghl',
    clientId: 'ml-tagdaekning',
    monthKey: '2026-01',
  });
  console.log('Meta reports handler path tests passed.');
}

main();
