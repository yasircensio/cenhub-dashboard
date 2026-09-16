const assert = require('assert');
const {
  isAllowedAdsCheckDownloadUrl,
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
  assert.deepStrictEqual(parseMetaReportsPath('/api/meta-reports/clients/censio/ads-check'), {
    kind: 'ads-check',
    clientId: 'censio',
  });
  assert.deepStrictEqual(parseMetaReportsPath('/api/meta-reports/clients/censio/ads-check/download'), {
    kind: 'ads-check-download',
    clientId: 'censio',
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
  assert.deepStrictEqual(parseMetaReportsPath('/api/meta-reports/clients/ml-tagdaekning/switch-topline-source'), {
    kind: 'switch-topline-source',
    clientId: 'ml-tagdaekning',
  });
  assert.deepStrictEqual(parseMetaReportsPath('/api/meta-reports/clients/ml-tagdaekning/months/2026-01/sync-ghl'), {
    kind: 'month-sync-ghl',
    clientId: 'ml-tagdaekning',
    monthKey: '2026-01',
  });
  assert.strictEqual(isAllowedAdsCheckDownloadUrl('https://scontent.xx.fbcdn.net/v/foo.jpg'), true);
  assert.strictEqual(isAllowedAdsCheckDownloadUrl('https://video.xx.fbcdn.net/v/foo.mp4'), true);
  assert.strictEqual(isAllowedAdsCheckDownloadUrl('https://graph.facebook.com/v21.0/123'), true);
  assert.strictEqual(isAllowedAdsCheckDownloadUrl('http://scontent.xx.fbcdn.net/v/foo.jpg'), false, 'rejects non-https');
  assert.strictEqual(isAllowedAdsCheckDownloadUrl('https://evil.com/foo.jpg'), false, 'rejects other hosts');
  assert.strictEqual(isAllowedAdsCheckDownloadUrl('https://notfbcdn.net.evil.com/foo.jpg'), false, 'rejects lookalike hosts');
  assert.strictEqual(isAllowedAdsCheckDownloadUrl('not a url'), false, 'rejects invalid url');

  console.log('Meta reports handler path tests passed.');
}

main();
