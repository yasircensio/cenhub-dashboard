const fs = require('fs');
const path = require('path');
const { query, usePostgres } = require('./db');

const DATA_FILE = path.join(__dirname, '..', '.data', 'multi-tenant-store.json');
const FB_LEAD_DATA_FILE = path.join(__dirname, '..', '.data', 'fb-lead-sync-runs.json');
const FB_LEAD_RETRIES_FILE = path.join(__dirname, '..', '.data', 'fb-lead-sync-retries.json');

const SYNC_HISTORY_RETENTION_DAYS = 3;
const GHL_WEBHOOK_RETENTION_DAYS = 3;
const FB_LEAD_RETRY_QUEUE_RETENTION_DAYS = 7;

function getSyncHistoryCutoffIso(maxAgeDays = SYNC_HISTORY_RETENTION_DAYS) {
  const days = Number(maxAgeDays);
  const safeDays = Number.isFinite(days) && days > 0 ? days : SYNC_HISTORY_RETENTION_DAYS;
  return new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000).toISOString();
}

function resolveSyncHistoryCutoffIso(sinceDays = SYNC_HISTORY_RETENTION_DAYS) {
  if (sinceDays == null || sinceDays === false) return null;
  return getSyncHistoryCutoffIso(sinceDays);
}

function readLocalMainStoreFull() {
  if (!fs.existsSync(DATA_FILE)) {
    return { syncRuns: [], metaSyncRuns: [], ghlWebhookEvents: [] };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return {
      syncRuns: parsed.syncRuns || [],
      metaSyncRuns: parsed.metaSyncRuns || [],
      ghlWebhookEvents: parsed.ghlWebhookEvents || [],
    };
  } catch {
    return { syncRuns: [], metaSyncRuns: [], ghlWebhookEvents: [] };
  }
}

function readLocalMainStore() {
  const store = readLocalMainStoreFull();
  return { syncRuns: store.syncRuns, metaSyncRuns: store.metaSyncRuns };
}

function writeLocalMainStore(patch) {
  const fullStore = fs.existsSync(DATA_FILE)
    ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
    : {};
  if (patch.syncRuns) fullStore.syncRuns = patch.syncRuns;
  if (patch.metaSyncRuns) fullStore.metaSyncRuns = patch.metaSyncRuns;
  if (patch.ghlWebhookEvents) fullStore.ghlWebhookEvents = patch.ghlWebhookEvents;
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(fullStore, null, 2));
}

function readLocalFbLeadRuns() {
  if (!fs.existsSync(FB_LEAD_DATA_FILE)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(FB_LEAD_DATA_FILE, 'utf8'));
    return Array.isArray(parsed.runs) ? parsed.runs : [];
  } catch {
    return [];
  }
}

function writeLocalFbLeadRuns(runs) {
  fs.mkdirSync(path.dirname(FB_LEAD_DATA_FILE), { recursive: true });
  fs.writeFileSync(FB_LEAD_DATA_FILE, JSON.stringify({ runs }, null, 2));
}

function readLocalFbLeadRetries() {
  if (!fs.existsSync(FB_LEAD_RETRIES_FILE)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(FB_LEAD_RETRIES_FILE, 'utf8'));
    return Array.isArray(parsed.retries) ? parsed.retries : [];
  } catch {
    return [];
  }
}

function writeLocalFbLeadRetries(retries) {
  fs.mkdirSync(path.dirname(FB_LEAD_RETRIES_FILE), { recursive: true });
  fs.writeFileSync(FB_LEAD_RETRIES_FILE, JSON.stringify({ retries }, null, 2));
}

async function pruneGhlSyncHistory({ maxAgeDays = SYNC_HISTORY_RETENTION_DAYS } = {}) {
  const cutoffIso = getSyncHistoryCutoffIso(maxAgeDays);

  if (usePostgres()) {
    const rows = await query`
      DELETE FROM sync_runs
      WHERE started_at < ${cutoffIso}
      RETURNING id
    `;
    return { deleted: rows.length, cutoffIso };
  }

  const store = readLocalMainStore();
  const before = store.syncRuns.length;
  store.syncRuns = store.syncRuns.filter((row) => String(row.started_at || '') >= cutoffIso);
  writeLocalMainStore({ syncRuns: store.syncRuns });
  return { deleted: before - store.syncRuns.length, cutoffIso };
}

async function pruneMetaSyncHistory({ maxAgeDays = SYNC_HISTORY_RETENTION_DAYS } = {}) {
  const cutoffIso = getSyncHistoryCutoffIso(maxAgeDays);

  if (usePostgres()) {
    const rows = await query`
      DELETE FROM meta_sync_runs
      WHERE started_at < ${cutoffIso}
      RETURNING id
    `;
    return { deleted: rows.length, cutoffIso };
  }

  const store = readLocalMainStore();
  const before = store.metaSyncRuns.length;
  store.metaSyncRuns = store.metaSyncRuns.filter((row) => String(row.started_at || '') >= cutoffIso);
  writeLocalMainStore({ metaSyncRuns: store.metaSyncRuns });
  return { deleted: before - store.metaSyncRuns.length, cutoffIso };
}

async function pruneFbLeadSyncHistory({ maxAgeDays = SYNC_HISTORY_RETENTION_DAYS } = {}) {
  const cutoffIso = getSyncHistoryCutoffIso(maxAgeDays);

  if (usePostgres()) {
    const rows = await query`
      DELETE FROM fb_lead_sync_runs
      WHERE started_at < ${cutoffIso}
      RETURNING id
    `;
    return { deleted: rows.length, cutoffIso };
  }

  const runs = readLocalFbLeadRuns();
  const kept = runs.filter((row) => String(row.started_at || '') >= cutoffIso);
  writeLocalFbLeadRuns(kept);
  return { deleted: runs.length - kept.length, cutoffIso };
}

async function pruneGhlWebhookEvents({ maxAgeDays = GHL_WEBHOOK_RETENTION_DAYS } = {}) {
  const cutoffIso = getSyncHistoryCutoffIso(maxAgeDays);

  if (usePostgres()) {
    const rows = await query`
      DELETE FROM ghl_webhook_events
      WHERE received_at < ${cutoffIso}
      RETURNING webhook_id
    `;
    return { deleted: rows.length, cutoffIso };
  }

  const store = readLocalMainStoreFull();
  const before = store.ghlWebhookEvents.length;
  store.ghlWebhookEvents = store.ghlWebhookEvents.filter(
    (row) => String(row.received_at || '') >= cutoffIso,
  );
  writeLocalMainStore({ ghlWebhookEvents: store.ghlWebhookEvents });
  return { deleted: before - store.ghlWebhookEvents.length, cutoffIso };
}

async function pruneCompletedFbLeadSyncRetries({ maxAgeDays = FB_LEAD_RETRY_QUEUE_RETENTION_DAYS } = {}) {
  const cutoffIso = getSyncHistoryCutoffIso(maxAgeDays);

  if (usePostgres()) {
    const rows = await query`
      DELETE FROM fb_lead_sync_retries
      WHERE status IN ('done', 'failed')
        AND updated_at < ${cutoffIso}
      RETURNING id
    `;
    return { deleted: rows.length, cutoffIso };
  }

  const retries = readLocalFbLeadRetries();
  const kept = retries.filter((row) => {
    if (row.status !== 'done' && row.status !== 'failed') return true;
    return String(row.updated_at || '') >= cutoffIso;
  });
  writeLocalFbLeadRetries(kept);
  return { deleted: retries.length - kept.length, cutoffIso };
}

async function pruneAllSyncHistory({ maxAgeDays = SYNC_HISTORY_RETENTION_DAYS } = {}) {
  const ghl = await pruneGhlSyncHistory({ maxAgeDays });
  const meta = await pruneMetaSyncHistory({ maxAgeDays });
  const fb = await pruneFbLeadSyncHistory({ maxAgeDays });
  return {
    retentionDays: maxAgeDays,
    cutoffIso: ghl.cutoffIso,
    deleted: ghl.deleted + meta.deleted + fb.deleted,
    ghl,
    meta,
    fb,
  };
}

async function runRetentionMaintenance({
  syncHistoryDays = SYNC_HISTORY_RETENTION_DAYS,
  webhookDays = GHL_WEBHOOK_RETENTION_DAYS,
  retryQueueDays = FB_LEAD_RETRY_QUEUE_RETENTION_DAYS,
} = {}) {
  const history = await pruneAllSyncHistory({ maxAgeDays: syncHistoryDays });
  const webhooks = await pruneGhlWebhookEvents({ maxAgeDays: webhookDays });
  const retryQueue = await pruneCompletedFbLeadSyncRetries({ maxAgeDays: retryQueueDays });
  return {
    deleted: history.deleted + webhooks.deleted + retryQueue.deleted,
    history,
    webhooks,
    retryQueue,
  };
}

module.exports = {
  SYNC_HISTORY_RETENTION_DAYS,
  GHL_WEBHOOK_RETENTION_DAYS,
  FB_LEAD_RETRY_QUEUE_RETENTION_DAYS,
  getSyncHistoryCutoffIso,
  resolveSyncHistoryCutoffIso,
  pruneAllSyncHistory,
  pruneFbLeadSyncHistory,
  pruneGhlSyncHistory,
  pruneMetaSyncHistory,
  pruneGhlWebhookEvents,
  pruneCompletedFbLeadSyncRetries,
  runRetentionMaintenance,
};
