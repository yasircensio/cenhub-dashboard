/**
 * Copies all currently ACTIVE Meta ad videos into Vercel Blob.
 * Paused / inactive videos are not downloaded.
 *
 * Usage: node scripts/download-meta-ads-check.js [clientId]
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({
  path: require('path').join(__dirname, '..', '.env.local'),
});

const fs = require('fs');
const path = require('path');
const { getAccount, resolveMetaSystemUserToken } = require('../lib/account-store');
const { GRAPH_VERSION, graphFetch } = require('../lib/meta-token');
const { fetchAdAccountCreatives } = require('../lib/meta-ads-creatives');
const { attachStoredVideos, hasBlobStore } = require('../lib/meta-ads-blob');

const ROOT = path.join(__dirname, '..');
const OUT_ROOT = path.join(ROOT, '.data', 'meta-ads-check');
const API_BASE = process.env.ADS_CHECK_API_BASE || 'https://analytics.censio.dk';

function argValue(flag, fallback) {
  const index = process.argv.indexOf(flag);
  if (index === -1 || !process.argv[index + 1]) return fallback;
  return process.argv[index + 1];
}

function safeName(value) {
  return String(value || 'file').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80);
}

async function fillSourcesFromPage(creatives, pageAccessToken) {
  if (!pageAccessToken) return creatives;
  const seen = new Set();
  for (const ad of creatives || []) {
    if (ad.videoUrl || !ad.videoId || seen.has(ad.videoId)) continue;
    seen.add(ad.videoId);
    try {
      const detail = await graphFetch(
        `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(ad.videoId)}?fields=id,title,source,picture,length`,
        pageAccessToken,
      );
      if (!detail?.source) continue;
      for (const row of creatives) {
        if (String(row.videoId) === String(ad.videoId)) {
          row.videoUrl = detail.source;
          row.videoTitle = row.videoTitle || detail.title || null;
          row.thumbnailUrl = row.thumbnailUrl || detail.picture || null;
        }
      }
    } catch {
      // Page token may not cover this video.
    }
  }
  return creatives;
}

async function fetchCreativesLocally(account, activeOnly) {
  return fetchAdAccountCreatives(account.metaAdAccountId, resolveMetaSystemUserToken(account), {
    activeOnly,
    pageAccessToken: account.metaPageAccessToken || null,
  });
}

async function fetchCreativesFromProd(clientId, scope) {
  const apiKey = process.env.DASHBOARD_ADMIN_API_KEY || '';
  if (!apiKey) throw new Error('DASHBOARD_ADMIN_API_KEY is not set.');
  const url = `${API_BASE}/api/meta-reports/clients/${encodeURIComponent(clientId)}/ads-check?scope=${scope}`;
  const response = await fetch(url, { headers: { 'x-api-key': apiKey } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.ok === false) {
    throw new Error(body.error || `HTTP ${response.status} from production ads-check`);
  }
  return body;
}

async function main() {
  const clientId = process.argv[2] && !process.argv[2].startsWith('-')
    ? process.argv[2]
    : 'censio';
  const limit = Math.max(1, Number(argValue('--limit', '50')) || 50);
  const scope = 'active';
  const account = await getAccount(clientId, { includeSecrets: true });
  if (!account) throw new Error(`Account not found: ${clientId}`);

  let source = 'local';
  let result;
  try {
    result = await fetchCreativesLocally(account, scope !== 'all');
  } catch (error) {
    source = 'production-list+page-token';
    result = await fetchCreativesFromProd(clientId, scope);
    result.creatives = await fillSourcesFromPage(result.creatives || [], account.metaPageAccessToken);
  }

  const stored = await attachStoredVideos(account.clientId, result.creatives || [], {
    archiveLimit: limit,
  });

  const outDir = path.join(OUT_ROOT, clientId, 'videos');
  fs.mkdirSync(outDir, { recursive: true });
  const localCopies = [];
  for (const item of stored.archivedNow || []) {
    if (!item.url) continue;
    const dest = path.join(outDir, `${safeName(`${item.videoId}_${item.adName || 'video'}`)}.mp4`);
    const response = await fetch(item.url);
    if (!response.ok) continue;
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(dest, buffer);
    localCopies.push({ file: path.relative(ROOT, dest), bytes: buffer.length, videoId: item.videoId });
  }

  const summary = {
    clientId: account.clientId,
    accountName: account.accountName,
    source,
    usedPageToken: Boolean(account.metaPageAccessToken),
    blobConfigured: hasBlobStore() || stored.blobConfigured,
    adCount: result.adCount,
    videoCount: result.videoCount,
    storedVideoCount: stored.storedVideoCount,
    archivedNow: (stored.archivedNow || []).map((row) => ({
      videoId: row.videoId,
      adId: row.adId,
      adName: row.adName,
      bytes: row.bytes,
      url: row.url,
    })),
    archiveErrors: stored.archiveErrors,
    archiveSkipped: stored.archiveSkipped,
    localCopies,
  };
  fs.writeFileSync(path.join(OUT_ROOT, clientId, 'manifest.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
