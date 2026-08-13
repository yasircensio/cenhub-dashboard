const { getAccount } = require('./account-store');
const { syncAccount } = require('./sync-service');
const { getCurrentMonthKey } = require('./marketing-metrics');
const {
  aggregateGhlMonthForReport,
  canUseGhlForMonth,
} = require('./meta-report-ghl-aggregator');
const {
  ensureMonthRecord,
  getMonthRecord,
  getYearMonthKeys,
  listMetaReportClients,
  saveGhlMonthRecord,
  saveMonthRecord,
} = require('./meta-report-store');
const {
  restoreMetaInputsPatch,
} = require('./meta-report-topline-restore');

const STALE_SNAPSHOT_MS = 24 * 60 * 60 * 1000;

function assertOnGhlList(account) {
  if (!account?.metaReportGhlDataEnabled) {
    const error = new Error('Client is not on the GHL list for Meta reports.');
    error.statusCode = 403;
    throw error;
  }
}

function isSnapshotStale(fetchedAt) {
  if (!fetchedAt) return true;
  const age = Date.now() - new Date(fetchedAt).getTime();
  return Number.isNaN(age) || age > STALE_SNAPSHOT_MS;
}

async function syncGhlMonthFromSnapshot(clientId, monthKey, {
  overwriteManual = false,
} = {}) {
  const account = await getAccount(clientId);
  if (!account) {
    const error = new Error('Account not found.');
    error.statusCode = 404;
    throw error;
  }
  assertOnGhlList(account);

  const existing = await getMonthRecord(clientId, monthKey);
  if (existing?.manualOverride && existing?.toplineSource === 'manual' && !overwriteManual) {
    const error = new Error('This month has manual values. Confirm overwrite to sync from Cenhub.');
    error.statusCode = 409;
    error.code = 'manual_override';
    throw error;
  }

  const aggregated = await aggregateGhlMonthForReport(clientId, monthKey);
  if (!canUseGhlForMonth(aggregated)) {
    const error = new Error('No Cenhub data found for this month in the latest snapshot.');
    error.statusCode = 404;
    throw error;
  }

  await ensureMonthRecord(clientId, monthKey, account, account.timezone);
  return saveGhlMonthRecord(clientId, monthKey, aggregated);
}

async function getGhlSyncPreview(clientId, year) {
  const account = await getAccount(clientId);
  if (!account) {
    const error = new Error('Account not found.');
    error.statusCode = 404;
    throw error;
  }
  assertOnGhlList(account);

  const monthKeys = getYearMonthKeys(Number(year), account.timezone);
  const syncNow = [];
  const skipManual = [];

  for (const monthKey of monthKeys) {
    const existing = await getMonthRecord(clientId, monthKey);
    if (existing?.manualOverride && existing?.toplineSource === 'manual') {
      skipManual.push(monthKey);
    } else {
      syncNow.push(monthKey);
    }
  }

  return { syncNow, skipManual, year: Number(year), monthKeys };
}

async function syncGhlYearFromSnapshot(clientId, year, {
  skipManual = true,
  overwriteManual = false,
} = {}) {
  const preview = await getGhlSyncPreview(clientId, year);
  const monthKeys = skipManual && !overwriteManual
    ? preview.syncNow
    : preview.monthKeys;

  const synced = [];
  const skipped = [];
  const errors = [];

  for (const monthKey of preview.monthKeys) {
    if (skipManual && !overwriteManual && preview.skipManual.includes(monthKey)) {
      skipped.push(monthKey);
      continue;
    }
    try {
      await syncGhlMonthFromSnapshot(clientId, monthKey, { overwriteManual });
      synced.push(monthKey);
    } catch (error) {
      if (error.statusCode === 404) {
        skipped.push(monthKey);
        continue;
      }
      errors.push({ monthKey, message: error.message });
    }
  }

  return {
    synced,
    skipped,
    errors,
    attempted: monthKeys.length,
  };
}

async function refreshSnapshotAndSyncMonth(clientId, monthKey, options = {}) {
  const account = await getAccount(clientId, { includeSecrets: true });
  if (!account) {
    const error = new Error('Account not found.');
    error.statusCode = 404;
    throw error;
  }
  assertOnGhlList(account);
  if (!account.hasGhlToken || !account.locationId) {
    const error = new Error('GHL token and location are required to refresh Cenhub data.');
    error.statusCode = 400;
    throw error;
  }

  await syncAccount(clientId, { source: 'meta-report-ghl-refresh' });
  return syncGhlMonthFromSnapshot(clientId, monthKey, options);
}

async function switchMonthToMetaSource(clientId, monthKey) {
  const account = await getAccount(clientId);
  if (!account) {
    const error = new Error('Account not found.');
    error.statusCode = 404;
    throw error;
  }
  assertOnGhlList(account);

  await ensureMonthRecord(clientId, monthKey, account, account.timezone);
  const existing = await getMonthRecord(clientId, monthKey);
  return saveMonthRecord(clientId, monthKey, {
    toplineSource: 'meta',
    manualOverride: false,
    ...restoreMetaInputsPatch(existing),
  });
}

async function setMonthToplineSource(clientId, monthKey, source) {
  const account = await getAccount(clientId);
  if (!account) {
    const error = new Error('Account not found.');
    error.statusCode = 404;
    throw error;
  }
  assertOnGhlList(account);

  await ensureMonthRecord(clientId, monthKey, account, account.timezone);
  const existing = await getMonthRecord(clientId, monthKey);
  if (source === 'manual') {
    const { accountReportFields } = require('./meta-report-store');
    const { resolveEffectiveToplineSource } = require('./meta-report-topline-mode');
    const settings = accountReportFields(account);
    const stored = existing?.toplineSource || 'meta';
    const effective = resolveEffectiveToplineSource(existing, settings);
    if (stored !== 'manual' && effective !== 'ghl') {
      const error = new Error('Manual override is only available for months with Cenhub data.');
      error.statusCode = 409;
      error.code = 'manual_not_allowed';
      throw error;
    }
  }
  const { buildMetaInputsSnapshot, shouldSnapshotMetaInputs } = require('./meta-report-topline-restore');
  const patch = {
    toplineSource: source,
    manualOverride: source === 'manual',
  };
  if (source === 'manual' && shouldSnapshotMetaInputs(existing)) {
    Object.assign(patch, buildMetaInputsSnapshot(existing));
  }
  return saveMonthRecord(clientId, monthKey, patch);
}

async function switchClientToplineSource(clientId, year, mode, {
  skipManual = true,
  overwriteManual = false,
} = {}) {
  const account = await getAccount(clientId);
  if (!account) {
    const error = new Error('Account not found.');
    error.statusCode = 404;
    throw error;
  }
  assertOnGhlList(account);

  const normalized = mode === 'cenhub' ? 'cenhub' : 'meta';
  const { updateAccount } = require('./account-store');
  await updateAccount(clientId, { metaReportToplineMode: normalized });

  if (normalized === 'cenhub') {
    const result = await syncGhlYearFromSnapshot(clientId, year, {
      skipManual,
      overwriteManual,
    });
    return {
      mode: normalized,
      synced: result.synced,
      skipped: result.skipped,
      errors: result.errors,
    };
  }

  const monthKeys = getYearMonthKeys(Number(year), account.timezone);
  const switched = [];
  const skipped = [];

  for (const monthKey of monthKeys) {
    const existing = await getMonthRecord(clientId, monthKey);
    if (existing?.manualOverride && existing?.toplineSource === 'manual') {
      skipped.push(monthKey);
      continue;
    }
    await switchMonthToMetaSource(clientId, monthKey);
    switched.push(monthKey);
  }

  return { mode: normalized, switched, skipped, errors: [] };
}

async function getGhlClientsPageData() {
  const clients = await listMetaReportClients({ filter: 'all' });
  const { getSnapshot } = require('./account-store');
  const rows = [];

  for (const client of clients) {
    const snapshot = client.hasGhl ? await getSnapshot(client.clientId) : null;
    rows.push({
      clientId: client.clientId,
      accountName: client.accountName,
      metaAdAccountId: client.metaAdAccountId,
      metaReportEnabled: client.metaReportEnabled,
      hasGhl: client.hasGhl,
      onGhlList: Boolean(client.metaReportGhlDataEnabled),
      snapshotFetchedAt: snapshot?.fetched_at || null,
      snapshotStale: isSnapshotStale(snapshot?.fetched_at),
      opportunityCount: snapshot?.opportunities?.length || 0,
    });
  }

  return {
    clients: rows,
    summary: {
      totalClients: rows.length,
      ghlConnected: rows.filter((row) => row.hasGhl).length,
      onGhlList: rows.filter((row) => row.onGhlList).length,
    },
  };
}

async function setGhlListMembership(clientId, enabled) {
  const account = await getAccount(clientId);
  if (!account) {
    const error = new Error('Account not found.');
    error.statusCode = 404;
    throw error;
  }
  if (enabled && (!account.hasGhlToken || !account.locationId)) {
    const error = new Error('Connect GHL token and location on client setup before adding to the GHL list.');
    error.statusCode = 400;
    throw error;
  }

  const { updateAccount } = require('./account-store');
  return updateAccount(clientId, { metaReportGhlDataEnabled: Boolean(enabled) });
}

module.exports = {
  getGhlClientsPageData,
  getGhlSyncPreview,
  refreshSnapshotAndSyncMonth,
  setGhlListMembership,
  setMonthToplineSource,
  switchClientToplineSource,
  switchMonthToMetaSource,
  syncGhlMonthFromSnapshot,
  syncGhlYearFromSnapshot,
  isSnapshotStale,
};
