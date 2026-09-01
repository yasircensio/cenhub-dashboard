const assert = require('assert');
const { parseGoogleAdsReportsPath } = require('../lib/google-ads-reports-handler');

function main() {
  assert.deepStrictEqual(parseGoogleAdsReportsPath('/api/google-ads-reports'), { kind: 'dashboard' });
  assert.deepStrictEqual(parseGoogleAdsReportsPath('/api/google-ads-reports/provision'), { kind: 'provision' });
  assert.deepStrictEqual(parseGoogleAdsReportsPath('/api/google-ads-reports/clients/gads-9103268801'), {
    kind: 'client-year',
    clientId: 'gads-9103268801',
  });
  assert.deepStrictEqual(parseGoogleAdsReportsPath('/api/google-ads-reports/clients/gads-9103268801/settings'), {
    kind: 'client-settings',
    clientId: 'gads-9103268801',
  });
  assert.deepStrictEqual(parseGoogleAdsReportsPath('/api/google-ads-reports/clients/gads-9103268801/months/2026-08'), {
    kind: 'month-save',
    clientId: 'gads-9103268801',
    monthKey: '2026-08',
  });
  assert.deepStrictEqual(
    parseGoogleAdsReportsPath('/api/google-ads-reports/clients/gads-9103268801/months/2026-08/refresh'),
    {
      kind: 'month-refresh',
      clientId: 'gads-9103268801',
      monthKey: '2026-08',
    },
  );
  assert.deepStrictEqual(
    parseGoogleAdsReportsPath('/api/google-ads-reports/clients/gads-2700870813/conversion-actions'),
    {
      kind: 'conversion-actions',
      clientId: 'gads-2700870813',
    },
  );
  console.log('google-ads-reports-handler path tests passed');
}

main();
