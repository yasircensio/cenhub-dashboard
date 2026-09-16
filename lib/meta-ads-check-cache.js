const ADS_CHECK_CACHE_TTL_SECONDS = 120;
const CACHE_PREFIX = 'meta_ads_check:v3:';

const memoryCache = new Map();
let kvClient = null;

function useKv() {
  return Boolean(
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
    || (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  );
}

function getKv() {
  if (!kvClient) {
    const { kv } = require('@vercel/kv');
    kvClient = kv;
  }
  return kvClient;
}

function adsCheckCacheKey(clientId, scope) {
  return `${CACHE_PREFIX}${String(clientId || '').trim()}:${scope === 'all' ? 'all' : 'active'}`;
}

function readMemory(key) {
  const row = memoryCache.get(key);
  if (!row) return null;
  if (Date.now() > row.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return row.payload;
}

function writeMemory(key, payload) {
  memoryCache.set(key, {
    payload,
    expiresAt: Date.now() + (ADS_CHECK_CACHE_TTL_SECONDS * 1000),
  });
}

async function getAdsCheckCache(clientId, scope) {
  const key = adsCheckCacheKey(clientId, scope);
  const local = readMemory(key);
  if (local) return local;
  if (!useKv()) return null;
  const cached = await getKv().get(key);
  if (!cached) return null;
  writeMemory(key, cached);
  return cached;
}

async function setAdsCheckCache(clientId, scope, payload) {
  const key = adsCheckCacheKey(clientId, scope);
  writeMemory(key, payload);
  if (!useKv()) return payload;
  await getKv().set(key, payload, { ex: ADS_CHECK_CACHE_TTL_SECONDS });
  return payload;
}

function clearAdsCheckCacheForTests() {
  memoryCache.clear();
}

module.exports = {
  ADS_CHECK_CACHE_TTL_SECONDS,
  adsCheckCacheKey,
  clearAdsCheckCacheForTests,
  getAdsCheckCache,
  setAdsCheckCache,
};
