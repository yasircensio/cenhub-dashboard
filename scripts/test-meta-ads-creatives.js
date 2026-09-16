const assert = require('assert');
const { classifyCreative, extractVideoId, summarizeAd } = require('../lib/meta-ads-creatives');

function main() {
  assert.strictEqual(classifyCreative({ object_type: 'SHARE', image_url: 'https://img' }), 'image');
  assert.strictEqual(classifyCreative({ video_id: '123' }), 'video');
  assert.strictEqual(classifyCreative({ object_story_spec: { video_data: { video_id: '9' } } }), 'video');
  assert.strictEqual(classifyCreative({
    object_story_spec: {
      link_data: {
        child_attachments: [{ picture: 'a' }, { picture: 'b' }],
      },
    },
  }), 'carousel');

  const summarized = summarizeAd({
    id: 'ad-1',
    name: 'Spring offer',
    status: 'ACTIVE',
    effective_status: 'ACTIVE',
    campaign: { id: 'c1', name: 'Prospecting' },
    adset: { id: 's1', name: 'DK 25-45' },
    creative: {
      title: 'Book now',
      thumbnail_url: 'https://thumb',
      video_id: 'vid-1',
    },
  }, { video: { id: 'vid-1', source: 'https://video.mp4', picture: 'https://poster', length: 15 } });

  assert.strictEqual(summarized.type, 'video');
  assert.strictEqual(summarized.videoUrl, 'https://video.mp4');
  assert.strictEqual(summarized.thumbnailUrl, 'https://poster');
  assert.strictEqual(summarized.campaignName, 'Prospecting');

  // Some ad formats only nest the video id under object_story_spec.video_data
  // instead of exposing creative.video_id directly.
  assert.strictEqual(
    extractVideoId({ object_story_spec: { video_data: { video_id: 'nested-1' } } }),
    'nested-1',
  );
  const nestedSummary = summarizeAd({
    id: 'ad-2',
    name: 'Nested video ad',
    creative: {
      object_story_spec: { video_data: { video_id: 'nested-1' } },
    },
  }, { video: { id: 'nested-1', source: 'https://nested.mp4', picture: 'https://nested-poster.jpg' } });
  assert.strictEqual(nestedSummary.type, 'video');
  assert.strictEqual(nestedSummary.videoId, 'nested-1');
  assert.strictEqual(nestedSummary.videoUrl, 'https://nested.mp4');

  // Static images resolve through the ad account's image library by hash,
  // since ads_read does not expose a full-resolution creative.image_url for
  // every format.
  const imageSummary = summarizeAd({
    id: 'ad-3',
    name: 'Static offer',
    creative: {
      image_hash: 'abc123',
      thumbnail_url: 'https://small-thumb',
    },
  }, { libraryImage: { hash: 'abc123', url: 'https://full-res-image.jpg' } });
  assert.strictEqual(imageSummary.type, 'image');
  assert.strictEqual(imageSummary.imageUrl, 'https://full-res-image.jpg');

  const { collectCreativeImageHashes } = require('../lib/meta-ads-creatives');
  assert.deepStrictEqual(collectCreativeImageHashes([
    { creative: { image_hash: 'aaa' } },
    { creative: { image_hash: 'aaa' } },
    { creative: { image_hash: 'bbb' } },
    { creative: {} },
  ]), ['aaa', 'bbb']);

  console.log('Meta ads creatives tests passed.');
}

main();
