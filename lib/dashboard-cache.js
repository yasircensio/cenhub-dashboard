const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '.data');
const CACHE_FILE = path.join(DATA_DIR, 'dashboard-cache.json');
const CACHE_PREFIX = 'ghl_dashboard:';

let kvClient = null;

function useKv() {
  return Boolean(
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
    || (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  );
}

function getKv() {
  if (!kvClient) {
    // eslint-disable-next-line global-require
    const { kv } = require('@vercel/kv');
    kvClient = kv;
  }
  return kvClient;
}

function getCacheTtlMs() {
  const minutes = Number(process.env.DASHBOARD_CACHE_TTL_MINUTES || 2);
  if (!Number.isFinite(minutes) || minutes <= 0) return 2 * 60 * 1000;
  return minutes * 60 * 1000;
}

function getCacheTtlSeconds() {
  return Math.max(60, Math.ceil(getCacheTtlMs() / 1000));
}

function readFileStore() {
  if (!fs.existsSync(CACHE_FILE)) {
    return { entries: {} };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    return { entries: parsed.entries || {} };
  } catch {
    return { entries: {} };
  }
}

function writeFileStore(store) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(store, null, 2));
}

function normalizePayload(payload) {
  return {
    fetchedAt: payload.fetchedAt || payload.fetched_at || new Date().toISOString(),
    opportunities: payload.opportunities || [],
    pipelines: payload.pipelines || [],
    users: payload.users || [],
    contactCount: payload.contactCount ?? payload.contact_count ?? 0,
  };
}

function isCacheFresh(fetchedAt) {
  if (!fetchedAt) return false;
  return Date.now() - new Date(fetchedAt).getTime() <= getCacheTtlMs();
}

async function getDashboardCache(clientId) {
  const id = String(clientId || '').trim();
  if (!id) return null;

  if (useKv()) {
    const cached = await getKv().get(`${CACHE_PREFIX}${id}`);
    if (!cached) return null;
    return normalizePayload(cached);
  }

  const store = readFileStore();
  const cached = store.entries[id];
  if (!cached) return null;
  return normalizePayload(cached);
}

async function setDashboardCache(clientId, payload) {
  const id = String(clientId || '').trim();
  if (!id) return null;

  const record = normalizePayload(payload);

  if (useKv()) {
    await getKv().set(`${CACHE_PREFIX}${id}`, record, { ex: getCacheTtlSeconds() });
    return record;
  }

  const store = readFileStore();
  store.entries[id] = record;
  writeFileStore(store);
  return record;
}

module.exports = {
  getCacheTtlMs,
  getDashboardCache,
  isCacheFresh,
  setDashboardCache,
  useKv,
};
