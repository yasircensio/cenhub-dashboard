const DEFAULT_ARCHIVE_LIMIT = 2;
const MAX_ARCHIVE_BYTES = 40 * 1024 * 1024;

function hasBlobStore() {
  return Boolean(String(process.env.BLOB_READ_WRITE_TOKEN || '').trim());
}

function videoBlobPathname(clientId, videoId) {
  const client = String(clientId || '').trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
  const id = String(videoId || '').replace(/[^0-9]/g, '');
  if (!client || !id) return null;
  return `meta-ads/${client}/videos/${id}.mp4`;
}

function pathnameToVideoId(pathname) {
  const match = String(pathname || '').match(/\/videos\/(\d+)\.mp4$/i);
  return match ? match[1] : null;
}

function isActiveAd(ad) {
  return String(ad?.effectiveStatus || ad?.status || '').toUpperCase() === 'ACTIVE';
}

function applyStoredVideoUrls(creatives, storedByVideoId, { onlyActive = true } = {}) {
  const stored = storedByVideoId instanceof Map ? storedByVideoId : new Map();
  return (Array.isArray(creatives) ? creatives : []).map((row) => {
    if (onlyActive && !isActiveAd(row)) {
      return { ...row, stored: false, storedVideoUrl: null };
    }
    const videoId = String(row?.videoId || '').replace(/[^0-9]/g, '');
    const blob = videoId ? stored.get(videoId) : null;
    const storedUrl = blob?.url || null;
    if (!storedUrl) return { ...row, stored: false, storedVideoUrl: null };
    return {
      ...row,
      stored: true,
      storedVideoUrl: storedUrl,
      metaVideoUrl: row.metaVideoUrl || row.videoUrl || null,
      videoUrl: storedUrl,
    };
  });
}

async function listStoredVideos(clientId) {
  const byId = new Map();
  const prefix = videoBlobPathname(clientId, '0')?.replace(/0\.mp4$/, '') || null;
  if (!hasBlobStore() || !prefix) return byId;
  const { list } = require('@vercel/blob');
  let cursor;
  do {
    const result = await list({ prefix, cursor, limit: 100 });
    for (const blob of result.blobs || []) {
      const videoId = pathnameToVideoId(blob.pathname);
      if (videoId) byId.set(videoId, blob);
    }
    cursor = result.hasMore ? result.cursor : null;
  } while (cursor);
  return byId;
}

async function getStoredVideo(clientId, videoId) {
  const pathname = videoBlobPathname(clientId, videoId);
  if (!pathname || !hasBlobStore()) return null;
  const { list } = require('@vercel/blob');
  const result = await list({ prefix: pathname, limit: 1 });
  return (result.blobs || []).find((row) => row.pathname === pathname) || null;
}

async function putStoredVideo(clientId, videoId, body, { contentType = 'video/mp4' } = {}) {
  const pathname = videoBlobPathname(clientId, videoId);
  if (!pathname) {
    throw new Error('Missing client or video id for blob path.');
  }
  if (!hasBlobStore()) {
    throw new Error('Vercel Blob is not configured.');
  }
  const { put } = require('@vercel/blob');
  return put(pathname, body, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType,
  });
}

async function downloadMetaFile(url, { maxBytes = MAX_ARCHIVE_BYTES } = {}) {
  const response = await fetch(url, { headers: { Accept: '*/*' } });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} downloading video`);
  }
  const length = Number(response.headers.get('content-length') || 0);
  if (length > maxBytes) {
    const error = new Error(`Video is ${length} bytes, over the ${maxBytes} byte limit.`);
    error.code = 'TOO_LARGE';
    throw error;
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > maxBytes) {
    const error = new Error(`Video is ${buffer.length} bytes, over the ${maxBytes} byte limit.`);
    error.code = 'TOO_LARGE';
    throw error;
  }
  return {
    buffer,
    contentType: response.headers.get('content-type') || 'video/mp4',
  };
}

function uniqueMissingVideos(creatives, storedByVideoId, { limit = DEFAULT_ARCHIVE_LIMIT } = {}) {
  const stored = storedByVideoId instanceof Map ? storedByVideoId : new Map();
  const seen = new Set();
  const missing = [];
  for (const ad of creatives || []) {
    const videoId = String(ad?.videoId || '').replace(/[^0-9]/g, '');
    const sourceUrl = ad?.metaVideoUrl || ad?.videoUrl;
    if (!videoId || !sourceUrl || stored.has(videoId) || seen.has(videoId)) continue;
    if (!isActiveAd(ad)) continue;
    seen.add(videoId);
    missing.push({
      videoId,
      adId: ad.adId || null,
      adName: ad.adName || null,
      sourceUrl,
    });
    if (missing.length >= limit) break;
  }
  return missing;
}

async function archiveMissingVideos(clientId, creatives, {
  limit = DEFAULT_ARCHIVE_LIMIT,
  maxBytes = MAX_ARCHIVE_BYTES,
  existing = null,
} = {}) {
  const summary = { stored: [], skipped: [], errors: [] };
  if (!hasBlobStore()) return summary;
  const storedByVideoId = existing || await listStoredVideos(clientId);
  const missing = uniqueMissingVideos(creatives, storedByVideoId, { limit });
  for (const item of missing) {
    try {
      const file = await downloadMetaFile(item.sourceUrl, { maxBytes });
      const blob = await putStoredVideo(clientId, item.videoId, file.buffer, {
        contentType: file.contentType,
      });
      storedByVideoId.set(item.videoId, blob);
      summary.stored.push({
        videoId: item.videoId,
        adId: item.adId,
        adName: item.adName,
        url: blob.url,
        bytes: file.buffer.length,
      });
    } catch (error) {
      const target = error.code === 'TOO_LARGE' ? summary.skipped : summary.errors;
      target.push({ videoId: item.videoId, adId: item.adId, error: error.message });
    }
  }
  summary.existing = storedByVideoId;
  return summary;
}

async function attachStoredVideos(clientId, creatives, { archiveLimit = DEFAULT_ARCHIVE_LIMIT } = {}) {
  const existing = await listStoredVideos(clientId);
  const archived = await archiveMissingVideos(clientId, creatives, {
    limit: archiveLimit,
    existing,
  });
  const storedByVideoId = archived.existing || existing;
  const next = applyStoredVideoUrls(creatives, storedByVideoId);
  return {
    creatives: next,
    storedVideoCount: next.filter((row) => row.stored).length,
    archivedNow: archived.stored,
    archiveErrors: archived.errors,
    archiveSkipped: archived.skipped,
    blobConfigured: hasBlobStore(),
  };
}

module.exports = {
  DEFAULT_ARCHIVE_LIMIT,
  MAX_ARCHIVE_BYTES,
  applyStoredVideoUrls,
  archiveMissingVideos,
  attachStoredVideos,
  getStoredVideo,
  hasBlobStore,
  isActiveAd,
  listStoredVideos,
  pathnameToVideoId,
  putStoredVideo,
  uniqueMissingVideos,
  videoBlobPathname,
};
