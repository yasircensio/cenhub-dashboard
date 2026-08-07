const assert = require('assert');
const {
  buildReportAccessToken,
  buildUniqueReportToken,
  generateReportAccessToken,
  isHybridReportToken,
  isLegacyReportToken,
  normalizeReportSlug,
  parseHybridReportToken,
  rebuildReportTokenWithSlug,
  reportSlugFromAccountName,
  resolveReportSlug,
  rotateReportAccessToken,
} = require('../lib/report-access');

async function main() {
  assert.strictEqual(reportSlugFromAccountName('ML Tagdækning', 'ml-tagdaekning'), 'ml-tagd-kning');
  assert.strictEqual(reportSlugFromAccountName('', 'acme-roofing'), 'acme-roofing');
  assert.strictEqual(normalizeReportSlug('ML Tag'), 'ml-tag');

  assert.deepStrictEqual(parseHybridReportToken('ml-tag-4829'), {
    slug: 'ml-tag',
    suffix: '4829',
  });
  assert.strictEqual(parseHybridReportToken('legacy-hex-token'), null);

  assert.strictEqual(isHybridReportToken('ml-tagdaekning-0001'), true);
  assert.strictEqual(isHybridReportToken('abc'), false);
  assert.strictEqual(isLegacyReportToken('a'.repeat(64)), true);
  assert.strictEqual(isLegacyReportToken('ml-tagdaekning-1234'), false);

  const token = buildReportAccessToken('ml-tag', '4829');
  assert.strictEqual(token, 'ml-tag-4829');

  assert.strictEqual(resolveReportSlug({
    metaReportSlug: 'ml-tag',
    metaReportAccessToken: 'ml-tag-1234',
  }), 'ml-tag');
  assert.strictEqual(resolveReportSlug({
    metaReportAccessToken: 'ml-tag-1234',
  }), 'ml-tag');

  const generated = await generateReportAccessToken('Acme Roofing ApS', { excludeClientId: 'acme-roofing' });
  assert.match(generated, /^acme-roofing-aps-\d{4}$/);

  const custom = await buildUniqueReportToken('ml-tag', 'ml-tagdaekning');
  assert.match(custom, /^ml-tag-\d{4}$/);

  const preserved = await rebuildReportTokenWithSlug('ml-tagd-kning-2192', 'ml-tag', 'ml-tagdaekning');
  assert.strictEqual(preserved, 'ml-tag-2192');

  const rotated = await rotateReportAccessToken('ml-tag-1234', 'ML Tagdækning', 'ml-tagdaekning', 'ml-tag');
  assert.match(rotated, /^ml-tag-\d{4}$/);
  assert.notStrictEqual(rotated, 'ml-tag-1234');

  const legacyRotated = await rotateReportAccessToken('deadbeef'.repeat(8), 'Acme Roofing ApS', 'acme-roofing');
  assert.match(legacyRotated, /^acme-roofing-aps-\d{4}$/);

  console.log('Report access token tests passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
