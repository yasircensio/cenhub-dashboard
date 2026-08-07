const assert = require('assert');
const {
  buildReportAccessToken,
  generateReportAccessToken,
  isHybridReportToken,
  isLegacyReportToken,
  parseHybridReportToken,
  reportSlugFromAccountName,
  rotateReportAccessToken,
} = require('../lib/report-access');

async function main() {
  assert.strictEqual(reportSlugFromAccountName('ML Tagdækning', 'ml-tagdaekning'), 'ml-tagd-kning');
  assert.strictEqual(reportSlugFromAccountName('', 'acme-roofing'), 'acme-roofing');

  assert.deepStrictEqual(parseHybridReportToken('ml-tagdaekning-4829'), {
    slug: 'ml-tagdaekning',
    suffix: '4829',
  });
  assert.strictEqual(parseHybridReportToken('legacy-hex-token'), null);

  assert.strictEqual(isHybridReportToken('ml-tagdaekning-0001'), true);
  assert.strictEqual(isHybridReportToken('abc'), false);
  assert.strictEqual(isLegacyReportToken('a'.repeat(64)), true);
  assert.strictEqual(isLegacyReportToken('ml-tagdaekning-1234'), false);

  const token = buildReportAccessToken('ml-tagdaekning', '4829');
  assert.strictEqual(token, 'ml-tagdaekning-4829');

  const generated = await generateReportAccessToken('Acme Roofing ApS', { excludeClientId: 'acme-roofing' });
  assert.match(generated, /^acme-roofing-aps-\d{4}$/);

  const rotated = await rotateReportAccessToken('acme-roofing-aps-1234', 'Acme Roofing ApS', 'acme-roofing');
  assert.match(rotated, /^acme-roofing-aps-\d{4}$/);
  assert.notStrictEqual(rotated, 'acme-roofing-aps-1234');

  const legacyRotated = await rotateReportAccessToken('deadbeef'.repeat(8), 'Acme Roofing ApS', 'acme-roofing');
  assert.match(legacyRotated, /^acme-roofing-aps-\d{4}$/);

  console.log('Report access token tests passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
