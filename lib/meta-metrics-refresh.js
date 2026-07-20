const { getAccount } = require('./account-store');
const { getTodayIso } = require('./marketing-metrics');

const DEFAULT_TIMEZONE = process.env.DASHBOARD_TIMEZONE || 'Europe/Copenhagen';
const REFRESH_COOLDOWN_MS = 15 * 60 * 1000;

function subtractCalendarDays(isoDate, days) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function getMetricsDateStop(metrics) {
  return metrics?.this_month?.date_stop
    || metrics?.yearly?.date_stop
    || null;
}

function isMetaMetricsStale(metrics, timeZone = DEFAULT_TIMEZONE) {
  if (!metrics) return true;

  const dateStop = getMetricsDateStop(metrics);
  if (!dateStop) return true;

  const stopDate = String(dateStop).slice(0, 10);
  const today = getTodayIso(timeZone);
  if (!today) return true;
  if (stopDate >= today) return false;

  const yesterday = subtractCalendarDays(today, 1);
  return stopDate < yesterday;
}

function shouldSkipRefresh(account, { force = false } = {}) {
  if (force) return false;
  if (!account?.metaLastSyncedAt) return false;

  const sinceSync = Date.now() - new Date(account.metaLastSyncedAt).getTime();
  return sinceSync >= 0 && sinceSync < REFRESH_COOLDOWN_MS;
}

async function findAccountForMetricsClient(metricsClientId) {
  const direct = await getAccount(metricsClientId, { includeSecrets: true });
  if (direct) return direct;

  const { listClientIds } = require('./account-store');
  const clientIds = await listClientIds();
  for (const clientId of clientIds) {
    const account = await getAccount(clientId, { includeSecrets: true });
    if (!account) continue;
    if (account.facebookClientId === metricsClientId || account.clientId === metricsClientId) {
      return account;
    }
  }

  return null;
}

async function ensureFreshMetaMetrics(metricsClientId, options = {}) {
  const { syncMetaMetrics } = require('./meta-sync-service');
  const {
    force = false,
    awaitRefresh = true,
    maxWaitMs = 12_000,
    timeZone = DEFAULT_TIMEZONE,
  } = options;

  const account = await findAccountForMetricsClient(metricsClientId);
  if (!account?.metaAdAccountId) {
    return { refreshed: false, reason: 'no_meta_config' };
  }

  const { getMetrics } = require('./facebook-metrics-store');
  const metricsKey = account.facebookClientId || account.clientId;
  const metrics = await getMetrics(metricsClientId) || await getMetrics(metricsKey);
  const stale = force || isMetaMetricsStale(metrics, account.timezone || timeZone);

  if (!stale) {
    return { refreshed: false, reason: 'fresh', metricsClientId: metricsKey };
  }

  if (shouldSkipRefresh(account, { force })) {
    return { refreshed: false, reason: 'cooldown', metricsClientId: metricsKey };
  }

  const syncPromise = syncMetaMetrics(account.clientId).catch((error) => ({
    success: false,
    error: error.message,
  }));

  if (!awaitRefresh) {
    syncPromise.catch(() => {});
    return { refreshed: true, reason: 'background', metricsClientId: metricsKey };
  }

  let timeoutId;
  const result = await Promise.race([
    syncPromise,
    new Promise((resolve) => {
      timeoutId = setTimeout(() => resolve({ success: false, timedOut: true }), maxWaitMs);
    }),
  ]);
  if (timeoutId) clearTimeout(timeoutId);

  if (result?.timedOut) {
    syncPromise.catch(() => {});
    return { refreshed: true, reason: 'timeout', metricsClientId: metricsKey };
  }

  if (result?.skipped) {
    return { refreshed: false, reason: result.reason || 'skipped', metricsClientId: metricsKey };
  }

  if (result?.success === false) {
    return {
      refreshed: false,
      reason: result.error || 'sync_failed',
      metricsClientId: metricsKey,
    };
  }

  return {
    refreshed: true,
    reason: 'synced',
    metricsClientId: metricsKey,
    metaLastSyncedAt: result?.metaLastSyncedAt || null,
  };
}

module.exports = {
  REFRESH_COOLDOWN_MS,
  ensureFreshMetaMetrics,
  findAccountForMetricsClient,
  getMetricsDateStop,
  isMetaMetricsStale,
  shouldSkipRefresh,
};
