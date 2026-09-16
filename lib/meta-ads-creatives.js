const { GRAPH_VERSION, graphFetch } = require('./meta-token');

const MAX_AD_PAGES = 3;
const MAX_ADS = 80;
const MAX_LIBRARY_PAGES = 5;

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

// Looking up a video by its ad-creative video_id (GET /{video-id}) does not
// return a downloadable `source` URL under ads_read. The ad account's own
// video/image library edges (GET /act_{id}/advideos and /adimages) do return
// it, so creatives are resolved against those libraries instead.
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
    imageUrl: libraryImage?.url || creative.image_url || null,
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

async function fetchAccountImageLibrary(adAccountId, accessToken) {
  const rows = await fetchGraphPages(
    `https://graph.facebook.com/${GRAPH_VERSION}/act_${adAccountId}/adimages?fields=hash,name,url,permalink_url&limit=100`,
    accessToken,
    { maxPages: MAX_LIBRARY_PAGES, maxItems: 500 },
  ).catch(() => []);
  const byHash = new Map();
  for (const row of rows) {
    if (row?.hash) byHash.set(row.hash, row);
  }
  return byHash;
}

async function fetchAdAccountCreatives(adAccountId, accessToken, { activeOnly = true } = {}) {
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
    limit: '50',
  });
  if (activeOnly) {
    params.set('filtering', JSON.stringify([
      { field: 'effective_status', operator: 'IN', value: ['ACTIVE'] },
    ]));
  }

  const [ads, videoLibrary, imageLibrary] = await Promise.all([
    fetchGraphPages(
      `https://graph.facebook.com/${GRAPH_VERSION}/act_${id}/ads?${params.toString()}`,
      accessToken,
    ),
    fetchAccountVideoLibrary(id, accessToken),
    fetchAccountImageLibrary(id, accessToken),
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
  extractVideoId,
  fetchAccountVideoLibrarySample,
  fetchAdAccountCreatives,
  normalizeAdAccountId,
  summarizeAd,
};
