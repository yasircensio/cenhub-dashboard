const { GRAPH_VERSION, graphFetch } = require('./meta-token');

const MAX_AD_PAGES = 3;
const MAX_ADS = 80;
const MAX_VIDEO_LOOKUPS = 20;

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

function summarizeAd(ad = {}, video = null) {
  const creative = ad.creative || {};
  const type = classifyCreative(creative);
  const thumbnail = video?.picture
    || creative.thumbnail_url
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
    imageUrl: creative.image_url || null,
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

async function fetchVideoDetails(videoId, accessToken) {
  const id = String(videoId || '').trim();
  if (!id) return null;
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(id)}?fields=id,title,source,picture,length,permalink_url,format`;
  return graphFetch(url, accessToken);
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

  const ads = await fetchGraphPages(
    `https://graph.facebook.com/${GRAPH_VERSION}/act_${id}/ads?${params.toString()}`,
    accessToken,
  );

  const videoIds = [...new Set(
    ads.map((ad) => extractVideoId(ad.creative)).filter(Boolean),
  )].slice(0, MAX_VIDEO_LOOKUPS);
  const videos = new Map();
  const videoErrors = [];
  const videoDebug = [];
  for (const videoId of videoIds) {
    try {
      const detail = await fetchVideoDetails(videoId, accessToken);
      videos.set(videoId, detail);
      videoDebug.push({
        videoId,
        keys: detail ? Object.keys(detail) : [],
        hasSource: Boolean(detail?.source),
        formatCount: Array.isArray(detail?.format?.data) ? detail.format.data.length : 0,
        firstFormatUrl: detail?.format?.data?.[0]?.embed_html
          ? null
          : (detail?.format?.data?.find((row) => row.picture)?.picture || null),
      });
    } catch (error) {
      videoErrors.push({ videoId, error: error.message || 'Video lookup failed' });
    }
  }

  const creatives = ads.map((ad) => summarizeAd(ad, videos.get(extractVideoId(ad.creative)) || null));
  return {
    adCount: creatives.length,
    videoCount: creatives.filter((row) => row.type === 'video').length,
    imageCount: creatives.filter((row) => row.type === 'image').length,
    carouselCount: creatives.filter((row) => row.type === 'carousel').length,
    withPreview: creatives.filter((row) => row.thumbnailUrl || row.videoUrl).length,
    videoLookupErrors: videoErrors,
    videoDebug,
    creatives,
  };
}

module.exports = {
  classifyCreative,
  extractVideoId,
  fetchAdAccountCreatives,
  normalizeAdAccountId,
  summarizeAd,
};
