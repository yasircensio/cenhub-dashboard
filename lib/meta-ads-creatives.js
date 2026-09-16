const { GRAPH_VERSION, graphFetch } = require('./meta-token');

const MAX_AD_PAGES = 2;
const MAX_ADS = 80;
const MAX_LIBRARY_PAGES = 5;
const IMAGE_HASH_BATCH = 50;

function normalizeAdAccountId(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  return raw.replace(/^act_/i, '');
}

function extractVideoId(creative = {}) {
  return creative.video_id
    || creative.object_story_spec?.video_data?.video_id
    || null;
}

function classifyCreative(creative = {}) {
  const spec = creative.object_story_spec || {};
  const children = spec.link_data?.child_attachments;
  if (Array.isArray(children) && children.length > 1) return 'carousel';
  if (
    extractVideoId(creative)
    || creative.object_type === 'VIDEO'
    || spec.video_data
  ) {
    return 'video';
  }
  return 'image';
}

function firstAttachmentImage(creative = {}) {
  const children = creative.object_story_spec?.link_data?.child_attachments;
  if (!Array.isArray(children)) return null;
  const first = children.find((row) => row?.picture || row?.image_url);
  return first?.picture || first?.image_url || null;
}

function extractCreativePicture(creative = {}) {
  return creative.image_url
    || creative.object_story_spec?.link_data?.picture
    || creative.object_story_spec?.photo_data?.url
    || firstAttachmentImage(creative)
    || null;
}

// Looking up a video by its ad-creative video_id (GET /{video-id}) with the
// ad-account token does not return a downloadable `source` URL under ads_read.
// Two sources do:
// 1. The ad account video library (GET /act_{id}/advideos) for uploaded ads.
// 2. The Facebook Page token (GET /{video-id}) for Page-owned videos used in ads.
function summarizeAd(ad = {}, { video = null, libraryImage = null } = {}) {
  const creative = ad.creative || {};
  const type = classifyCreative(creative);
  const thumbnail = video?.picture
    || creative.thumbnail_url
    || libraryImage?.url
    || creative.image_url
    || firstAttachmentImage(creative)
    || null;
  return {
    adId: ad.id || null,
    adName: ad.name || null,
    status: ad.status || null,
    effectiveStatus: ad.effective_status || null,
    campaignName: ad.campaign?.name || null,
    campaignId: ad.campaign?.id || null,
    adsetName: ad.adset?.name || null,
    adsetId: ad.adset?.id || null,
    createdTime: ad.created_time || null,
    updatedTime: ad.updated_time || null,
    type,
    headline: creative.title || creative.object_story_spec?.link_data?.name || null,
    body: creative.body || creative.object_story_spec?.link_data?.message || null,
    thumbnailUrl: thumbnail,
    imageUrl: libraryImage?.url || extractCreativePicture(creative) || null,
    imageHash: creative.image_hash || null,
    videoId: extractVideoId(creative) || video?.id || null,
    videoUrl: video?.source || null,
    videoTitle: video?.title || null,
    videoLength: video?.length != null ? Number(video.length) : null,
  };
}

async function fetchGraphPages(firstUrl, accessToken, { maxPages = MAX_AD_PAGES, maxItems = MAX_ADS } = {}) {
  const items = [];
  let url = firstUrl;
  let pages = 0;
  while (url && pages < maxPages && items.length < maxItems) {
    const body = await graphFetch(url, accessToken);
    const batch = Array.isArray(body.data) ? body.data : [];
    items.push(...batch);
    url = body.paging?.next || null;
    pages += 1;
  }
  return items.slice(0, maxItems);
}

async function fetchAccountVideoLibrary(adAccountId, accessToken) {
  const rows = await fetchGraphPages(
    `https://graph.facebook.com/${GRAPH_VERSION}/act_${adAccountId}/advideos?fields=id,title,source,picture,length&limit=50`,
    accessToken,
    { maxPages: MAX_LIBRARY_PAGES, maxItems: 250 },
  ).catch(() => []);
  const byId = new Map();
  for (const row of rows) {
    if (row?.id) byId.set(row.id, row);
  }
  return byId;
}

// Diagnostic helper: lists videos in the ad account's own video library
// (regardless of whether any current ad uses them), smallest first, so a
// normal-sized one can be picked for a download test without pulling a huge
// file by accident.
async function fetchAccountVideoLibrarySample(adAccountId, accessToken, { limit = 10 } = {}) {
  const id = normalizeAdAccountId(adAccountId);
  const library = await fetchAccountVideoLibrary(id, accessToken);
  return Array.from(library.values())
    .filter((row) => row?.source)
    .sort((a, b) => (a.length ?? Infinity) - (b.length ?? Infinity))
    .slice(0, limit)
    .map((row) => ({
      id: row.id,
      title: row.title || null,
      lengthSeconds: row.length != null ? Number(row.length) : null,
      source: row.source,
      picture: row.picture || null,
    }));
}

function collectCreativeImageHashes(ads) {
  return [...new Set(
    (Array.isArray(ads) ? ads : [])
      .map((ad) => ad?.creative?.image_hash)
      .filter(Boolean)
      .map((hash) => String(hash)),
  )];
}

async function fetchAccountImagesByHash(adAccountId, accessToken, hashes) {
  const unique = [...new Set((hashes || []).map((hash) => String(hash || '').trim()).filter(Boolean))];
  const byHash = new Map();
  if (!unique.length) return byHash;

  for (let index = 0; index < unique.length; index += IMAGE_HASH_BATCH) {
    const batch = unique.slice(index, index + IMAGE_HASH_BATCH);
    const params = new URLSearchParams({
      fields: 'hash,name,url,permalink_url',
    });
    // Meta's adimages edge expects a PHP-style array, not JSON.
    params.set('hashes', `['${batch.join("','")}']`);
    const body = await graphFetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/act_${adAccountId}/adimages?${params.toString()}`,
      accessToken,
    ).catch(() => ({ data: [] }));
    for (const row of Array.isArray(body.data) ? body.data : []) {
      if (row?.hash) byHash.set(row.hash, row);
    }
  }
  return byHash;
}

async function fetchVideoDetailsWithPageToken(videoId, pageAccessToken) {
  const id = String(videoId || '').trim();
  if (!id || !pageAccessToken) return null;
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(id)}?fields=id,title,source,picture,length`;
  return graphFetch(url, pageAccessToken);
}

async function fillMissingVideosFromPage(videoIds, videoLibrary, pageAccessToken, { maxLookups = 5 } = {}) {
  if (!pageAccessToken) return videoLibrary;
  const missing = videoIds.filter((id) => !videoLibrary.get(id)?.source).slice(0, maxLookups);
  await Promise.all(missing.map(async (videoId) => {
    try {
      const detail = await fetchVideoDetailsWithPageToken(videoId, pageAccessToken);
      if (detail?.source) videoLibrary.set(videoId, detail);
    } catch {
      // Page token may not cover this video. Keep the library result.
    }
  }));
  return videoLibrary;
}

function normalizeStoredVideoId(value) {
  return String(value || '').replace(/[^0-9]/g, '');
}

async function fetchAdAccountCreatives(adAccountId, accessToken, {
  activeOnly = true,
  pageAccessToken = null,
  storedVideoIds = null,
  storedVideosPromise = null,
} = {}) {
  const id = normalizeAdAccountId(adAccountId);
  if (!id) {
    const error = new Error('Meta ad account ID is not configured.');
    error.statusCode = 400;
    throw error;
  }
  if (!accessToken) {
    const error = new Error('Meta system user token is not configured.');
    error.statusCode = 400;
    throw error;
  }

  const fields = [
    'id',
    'name',
    'status',
    'effective_status',
    'created_time',
    'updated_time',
    'campaign{id,name}',
    'adset{id,name}',
    'creative{id,name,title,body,thumbnail_url,image_url,object_type,video_id,image_hash,object_story_spec}',
  ].join(',');
  const params = new URLSearchParams({
    fields,
    limit: String(MAX_ADS),
  });
  if (activeOnly) {
    params.set('filtering', JSON.stringify([
      { field: 'effective_status', operator: 'IN', value: ['ACTIVE'] },
    ]));
  }

  const ads = await fetchGraphPages(
    `https://graph.facebook.com/${GRAPH_VERSION}/act_${id}/ads?${params.toString()}`,
    accessToken,
  );

      const storedFromPromise = storedVideosPromise ? await storedVideosPromise : null;
      const storedIds = new Set([
        ...(storedVideoIds instanceof Set ? storedVideoIds : Array.from(storedVideoIds || [])),
        ...(storedFromPromise instanceof Map ? storedFromPromise.keys() : []),
      ].map(normalizeStoredVideoId).filter(Boolean));
  const videoIds = [...new Set(ads.map((ad) => extractVideoId(ad.creative)).filter(Boolean))];
  const missingVideoIds = videoIds.filter((videoId) => !storedIds.has(normalizeStoredVideoId(videoId)));
  const videoLibrary = new Map();

  const [imageLibrary] = await Promise.all([
    fetchAccountImagesByHash(id, accessToken, collectCreativeImageHashes(ads)),
    fillMissingVideosFromPage(missingVideoIds, videoLibrary, pageAccessToken),
  ]);

  const creatives = ads.map((ad) => summarizeAd(ad, {
    video: videoLibrary.get(extractVideoId(ad.creative)) || null,
    libraryImage: imageLibrary.get(ad.creative?.image_hash) || null,
  }));

  return {
    adCount: creatives.length,
    videoCount: creatives.filter((row) => row.type === 'video').length,
    imageCount: creatives.filter((row) => row.type === 'image').length,
    carouselCount: creatives.filter((row) => row.type === 'carousel').length,
    withPreview: creatives.filter((row) => row.thumbnailUrl || row.videoUrl).length,
    withDownloadableFile: creatives.filter((row) => row.videoUrl || row.imageUrl).length,
    creatives,
  };
}

module.exports = {
  classifyCreative,
  collectCreativeImageHashes,
  extractCreativePicture,
  extractVideoId,
  fetchAccountImagesByHash,
  fetchAccountVideoLibrarySample,
  fetchAdAccountCreatives,
  IMAGE_HASH_BATCH,
  normalizeAdAccountId,
  summarizeAd,
};
