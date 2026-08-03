const {
  SYNC_HISTORY_RETENTION_DAYS,
  GHL_WEBHOOK_RETENTION_DAYS,
  FB_LEAD_RETRY_QUEUE_RETENTION_DAYS,
  getSyncHistoryCutoffIso,
  resolveSyncHistoryCutoffIso,
} = require('../lib/sync-history-retention');
const { isLegacyCronAllowed } = require('../lib/fb-lead-sync-cron-handler');

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

function main() {
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

  console.log('Sync history retention tests passed.');
}

main();
