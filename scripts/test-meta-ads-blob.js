const assert = require('assert');
const {
  applyStoredVideoUrls,
  pathnameToVideoId,
  uniqueMissingVideos,
  videoBlobPathname,
} = require('../lib/meta-ads-blob');

function main() {
  assert.strictEqual(videoBlobPathname('censio', '1446669490223580'), 'meta-ads/censio/videos/1446669490223580.mp4');
  assert.strictEqual(videoBlobPathname('Censio!', 'id-1446'), 'meta-ads/censio/videos/1446.mp4');
  assert.strictEqual(videoBlobPathname('', '1'), null);
  assert.strictEqual(pathnameToVideoId('meta-ads/censio/videos/1446669490223580.mp4'), '1446669490223580');

  const mapped = applyStoredVideoUrls(
    [{ videoId: '99', videoUrl: 'https://video.xx.fbcdn.net/v/ad.mp4', type: 'video', effectiveStatus: 'ACTIVE' }],
    new Map([['99', { url: 'https://xxx.public.blob.vercel-storage.com/meta-ads/censio/videos/99.mp4' }]]),
  );
  assert.strictEqual(mapped[0].stored, true);
  assert.strictEqual(mapped[0].videoUrl, 'https://xxx.public.blob.vercel-storage.com/meta-ads/censio/videos/99.mp4');
  assert.strictEqual(mapped[0].metaVideoUrl, 'https://video.xx.fbcdn.net/v/ad.mp4');

  const missing = uniqueMissingVideos([
    { videoId: '1', videoUrl: 'https://fbcdn/a.mp4', type: 'video', effectiveStatus: 'ACTIVE' },
    { videoId: '1', videoUrl: 'https://fbcdn/a.mp4', type: 'video', effectiveStatus: 'ACTIVE' },
    { videoId: '2', videoUrl: 'https://fbcdn/b.mp4', type: 'video', effectiveStatus: 'ACTIVE' },
    { videoId: '3', videoUrl: 'https://fbcdn/c.mp4', type: 'video', effectiveStatus: 'ACTIVE' },
    { videoId: '4', videoUrl: 'https://fbcdn/d.mp4', type: 'video', effectiveStatus: 'PAUSED' },
  ], new Map([['1', { url: 'https://blob/1' }]]), { limit: 2 });
  assert.deepStrictEqual(missing.map((row) => row.videoId), ['2', '3']);

  const pausedKeptOut = applyStoredVideoUrls(
    [{ videoId: '99', videoUrl: 'https://video.xx.fbcdn.net/v/ad.mp4', type: 'video', effectiveStatus: 'PAUSED' }],
    new Map([['99', { url: 'https://xxx.public.blob.vercel-storage.com/meta-ads/censio/videos/99.mp4' }]]),
  );
  assert.strictEqual(pausedKeptOut[0].stored, false);
  assert.strictEqual(pausedKeptOut[0].storedVideoUrl, null);

  console.log('Meta ads blob tests passed.');
}

async function cacheTests() {
  const {
    adsCheckCacheKey,
    clearAdsCheckCacheForTests,
    getAdsCheckCache,
    setAdsCheckCache,
  } = require('../lib/meta-ads-check-cache');
  clearAdsCheckCacheForTests();
  assert.strictEqual(adsCheckCacheKey('censio', 'all'), 'meta_ads_check:v4:censio:all');
  await setAdsCheckCache('censio', 'all', { ok: true, clientId: 'censio' });
  const cached = await getAdsCheckCache('censio', 'all');
  assert.strictEqual(cached.ok, true);
  assert.strictEqual(cached.clientId, 'censio');
  console.log('Meta ads check cache tests passed.');
}

main();
cacheTests().catch((error) => {
  console.error(error);
  process.exit(1);
});
