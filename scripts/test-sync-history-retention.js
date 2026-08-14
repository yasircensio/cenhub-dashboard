const fs = require('fs');
const path = require('path');
const {
  SYNC_HISTORY_RETENTION_DAYS,
  GHL_WEBHOOK_RETENTION_DAYS,
  FB_LEAD_RETRY_QUEUE_RETENTION_DAYS,
  getSyncHistoryCutoffIso,
  pruneMetaReportGhlSyncHistory,
  resolveSyncHistoryCutoffIso,
} = require('../lib/sync-history-retention');
const { usePostgres } = require('../lib/db');
const { isLegacyCronAllowed } = require('../lib/fb-lead-sync-cron-handler');

const DATA_FILE = path.join(__dirname, '..', '.data', 'multi-tenant-store.json');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function withEnv(overrides, fn) {
  const previous = {};
  for (const [key, value] of Object.entries(overrides)) {
    previous[key] = process.env[key];
    if (value == null) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    fn();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value == null) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function runConstantTests() {
  assert(SYNC_HISTORY_RETENTION_DAYS === 3, 'sync history retention is 3 days');
  assert(GHL_WEBHOOK_RETENTION_DAYS === 3, 'webhook retention is 3 days');
  assert(FB_LEAD_RETRY_QUEUE_RETENTION_DAYS === 7, 'retry queue retention is 7 days');

  const cutoff = getSyncHistoryCutoffIso();
  const cutoffMs = Date.parse(cutoff);
  const nowMs = Date.now();
  const deltaDays = (nowMs - cutoffMs) / (24 * 60 * 60 * 1000);
  assert(deltaDays >= 2.99 && deltaDays <= 3.01, 'cutoff is ~3 days ago');

  assert(resolveSyncHistoryCutoffIso(null) === null, 'null sinceDays skips cutoff');
  assert(resolveSyncHistoryCutoffIso(false) === null, 'false sinceDays skips cutoff');
  assert(resolveSyncHistoryCutoffIso(7) !== null, 'numeric sinceDays applies cutoff');

  withEnv({ VERCEL_ENV: 'production', FB_LEAD_LEGACY_CRON_DEBUG: undefined }, () => {
    assert(!isLegacyCronAllowed(), 'legacy cron blocked in production');
  });

  withEnv({ VERCEL_ENV: 'production', FB_LEAD_LEGACY_CRON_DEBUG: '1' }, () => {
    assert(isLegacyCronAllowed(), 'legacy cron allowed when debug flag set');
  });

  withEnv({ VERCEL_ENV: 'preview', FB_LEAD_LEGACY_CRON_DEBUG: undefined }, () => {
    assert(isLegacyCronAllowed(), 'legacy cron allowed on preview');
  });

  withEnv({ VERCEL_ENV: undefined, FB_LEAD_LEGACY_CRON_DEBUG: undefined }, () => {
    assert(isLegacyCronAllowed(), 'legacy cron allowed locally');
  });
}

async function testMetaReportGhlSyncHistoryPrune() {
  const hadFile = fs.existsSync(DATA_FILE);
  const backup = hadFile ? fs.readFileSync(DATA_FILE, 'utf8') : null;
  const cutoffIso = getSyncHistoryCutoffIso();
  const oldStartedAt = new Date(Date.parse(cutoffIso) - 24 * 60 * 60 * 1000).toISOString();
  const freshStartedAt = new Date().toISOString();

  try {
    const store = hadFile ? JSON.parse(backup) : {};
    store.metaReportGhlSyncRuns = [
      {
        id: 900001,
        client_id: 'retention-prune-test',
        started_at: oldStartedAt,
        finished_at: oldStartedAt,
        status: 'success',
        source: 'test',
        trigger: 'test',
        error_message: null,
        detail: { test: 'old' },
      },
      {
        id: 900002,
        client_id: 'retention-prune-test',
        started_at: freshStartedAt,
        finished_at: freshStartedAt,
        status: 'success',
        source: 'test',
        trigger: 'test',
        error_message: null,
        detail: { test: 'fresh' },
      },
    ];
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));

    const result = await pruneMetaReportGhlSyncHistory();
    assert(result.deleted >= 1, 'prune deletes at least one old meta report ghl row');
    const next = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const runs = next.metaReportGhlSyncRuns || [];
    assert(
      runs.every((row) => String(row.started_at || '') >= cutoffIso),
      'only rows within retention window remain',
    );
    assert(
      runs.some((row) => row.detail?.test === 'fresh'),
      'fresh meta report ghl row is kept',
    );
    assert(
      !runs.some((row) => row.detail?.test === 'old'),
      'old meta report ghl row is removed',
    );
  } finally {
    if (backup != null) fs.writeFileSync(DATA_FILE, backup);
    else if (fs.existsSync(DATA_FILE)) fs.unlinkSync(DATA_FILE);
  }
}

async function main() {
  runConstantTests();

  if (usePostgres()) {
    console.log('Meta report GHL sync history prune test skipped (DATABASE_URL set).');
  } else {
    await testMetaReportGhlSyncHistoryPrune();
  }

  console.log('Sync history retention tests passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
