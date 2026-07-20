const fs = require('fs');
const path = require('path');
const { query, usePostgres } = require('./db');
const { normalizeClientId } = require('./account-store');

const DATA_FILE = path.join(__dirname, '..', '.data', 'multi-tenant-store.json');

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

function normalizeLimit(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

function rowToGhlRun(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    accountName: row.account_name || row.client_id,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    status: row.status,
    source: row.source || 'unknown',
    errorMessage: row.error_message || null,
    opportunityCount: row.opportunity_count ?? null,
  };
}

function rowToMetaRun(row) {
  const isSystem = !row.client_id;
  return {
    id: row.id,
    clientId: row.client_id || 'system',
    accountName: isSystem ? 'System (scheduled)' : (row.account_name || row.client_id),
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    status: row.status,
    source: row.source || 'unknown',
    errorMessage: row.error_message || null,
    thisMonthSpend: row.this_month_spend != null ? Number(row.this_month_spend) : null,
    spendDateStop: row.spend_date_stop || null,
    metricsClientId: row.metrics_client_id || null,
  };
}

function entryToGhlRun(entry, accountNameById) {
  return {
    id: entry.id || null,
    clientId: entry.client_id,
    accountName: accountNameById[entry.client_id] || entry.client_id,
    startedAt: entry.started_at,
    finishedAt: entry.finished_at,
    status: entry.status,
    source: entry.source || 'unknown',
    errorMessage: entry.error_message || null,
    opportunityCount: entry.opportunity_count ?? null,
  };
}

function entryToMetaRun(entry, accountNameById) {
  const isSystem = !entry.client_id;
  return {
    id: entry.id || null,
    clientId: entry.client_id || 'system',
    accountName: isSystem ? 'System (scheduled)' : (accountNameById[entry.client_id] || entry.client_id),
    startedAt: entry.started_at,
    finishedAt: entry.finished_at,
    status: entry.status,
    source: entry.source || 'unknown',
    errorMessage: entry.error_message || null,
    thisMonthSpend: entry.this_month_spend != null ? Number(entry.this_month_spend) : null,
    spendDateStop: entry.spend_date_stop || null,
    metricsClientId: entry.metrics_client_id || null,
  };
}

function readLocalStore() {
  if (!fs.existsSync(DATA_FILE)) {
    return { accounts: {}, snapshots: {}, syncRuns: [], metaSyncRuns: [] };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return {
      accounts: parsed.accounts || {},
      snapshots: parsed.snapshots || {},
      syncRuns: parsed.syncRuns || [],
      metaSyncRuns: parsed.metaSyncRuns || [],
    };
  } catch {
    return { accounts: {}, snapshots: {}, syncRuns: [], metaSyncRuns: [] };
  }
}

function writeLocalStore(store) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

function buildSummary(runs, schedule) {
  const lastRun = runs[0] || null;
  const lastSuccess = runs.find((run) => {
    const status = String(run.status || '').toLowerCase();
    return status === 'success' || status === 'ok' || status === 'cron_tick';
  }) || null;
  return {
    lastRunAt: lastRun?.startedAt || null,
    lastRunStatus: lastRun?.status || null,
    lastSuccessAt: lastSuccess?.startedAt || null,
    schedule: schedule || null,
    totalShown: runs.length,
  };
}

function normalizeSpendDateStop(value) {
  if (value == null || value === '') return null;
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

async function logMetaSyncRun(clientId, {
  status,
  source = 'unknown',
  errorMessage = null,
  startedAt,
  finishedAt,
  thisMonthSpend = null,
  spendDateStop = null,
  metricsClientId = null,
} = {}) {
  const id = clientId ? normalizeClientId(clientId) : null;
  const entry = {
    client_id: id,
    started_at: startedAt || new Date().toISOString(),
    finished_at: finishedAt || new Date().toISOString(),
    status: String(status || 'unknown'),
    source: String(source || 'unknown'),
    error_message: errorMessage != null ? String(errorMessage).slice(0, 2000) : null,
    this_month_spend: thisMonthSpend != null && Number.isFinite(Number(thisMonthSpend))
      ? Number(thisMonthSpend)
      : null,
    spend_date_stop: normalizeSpendDateStop(spendDateStop),
    metrics_client_id: metricsClientId != null ? String(metricsClientId) : null,
  };

  if (usePostgres()) {
    try {
      const rows = id
        ? await query`
            INSERT INTO meta_sync_runs (
              client_id, started_at, finished_at, status, source,
              error_message, this_month_spend, spend_date_stop, metrics_client_id
            )
            VALUES (
              ${id}, ${entry.started_at}, ${entry.finished_at}, ${entry.status}, ${entry.source},
              ${entry.error_message}, ${entry.this_month_spend}, ${entry.spend_date_stop}, ${entry.metrics_client_id}
            )
            RETURNING id
          `
        : await query`
            INSERT INTO meta_sync_runs (
              client_id, started_at, finished_at, status, source,
              error_message, this_month_spend, spend_date_stop, metrics_client_id
            )
            VALUES (
              NULL, ${entry.started_at}, ${entry.finished_at}, ${entry.status}, ${entry.source},
              ${entry.error_message}, ${entry.this_month_spend}, ${entry.spend_date_stop}, ${entry.metrics_client_id}
            )
            RETURNING id
          `;
      const rowId = rows[0]?.id;
      if (rowId == null) {
        throw new Error('meta_sync_runs INSERT returned no id');
      }
      console.log('[meta-sync-history] logged', {
        id: Number(rowId),
        clientId: id || 'system',
        source: entry.source,
        status: entry.status,
      });
      return { ...entry, id: Number(rowId) };
    } catch (error) {
      console.error('[meta-sync-history] INSERT failed:', error.message || error, {
        clientId: id || 'system',
        source: entry.source,
        status: entry.status,
      });
      throw error;
    }
  }

  const store = readLocalStore();
  if (!store.metaSyncRuns) store.metaSyncRuns = [];
  const nextId = store.metaSyncRuns.length + 1;
  const stored = { id: nextId, ...entry };
  store.metaSyncRuns.push(stored);
  const fullStore = JSON.parse(fs.existsSync(DATA_FILE) ? fs.readFileSync(DATA_FILE, 'utf8') : '{}');
  fullStore.metaSyncRuns = store.metaSyncRuns;
  if (!fullStore.accounts) fullStore.accounts = store.accounts;
  if (!fullStore.snapshots) fullStore.snapshots = store.snapshots;
  if (!fullStore.syncRuns) fullStore.syncRuns = store.syncRuns;
  writeLocalStore(fullStore);
  return stored;
}

async function listGhlSyncRuns({ clientId = null, limit = DEFAULT_LIMIT } = {}) {
  const cappedLimit = normalizeLimit(limit);

  if (usePostgres()) {
    const rows = clientId
      ? await query`
          SELECT r.*, a.account_name
          FROM sync_runs r
          JOIN accounts a ON a.client_id = r.client_id
          WHERE r.client_id = ${normalizeClientId(clientId)}
          ORDER BY r.started_at DESC
          LIMIT ${cappedLimit}
        `
      : await query`
          SELECT r.*, a.account_name
          FROM sync_runs r
          JOIN accounts a ON a.client_id = r.client_id
          ORDER BY r.started_at DESC
          LIMIT ${cappedLimit}
        `;
    const runs = rows.map(rowToGhlRun);
    return {
      type: 'ghl',
      runs,
      summary: buildSummary(runs, 'TZ=Europe/Copenhagen 0 3 * * *'),
    };
  }

  const store = readLocalStore();
  const accountNameById = Object.fromEntries(
    Object.values(store.accounts || {}).map((row) => [row.client_id, row.account_name]),
  );
  let runs = (store.syncRuns || []).map((entry) => entryToGhlRun(entry, accountNameById));
  if (clientId) {
    runs = runs.filter((run) => run.clientId === normalizeClientId(clientId));
  }
  runs.sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)));
  runs = runs.slice(0, cappedLimit);
  return {
    type: 'ghl',
    runs,
    summary: buildSummary(runs, 'TZ=Europe/Copenhagen 0 3 * * *'),
  };
}

async function listMetaSyncRuns({ clientId = null, limit = DEFAULT_LIMIT } = {}) {
  const cappedLimit = normalizeLimit(limit);
  const schedule = process.env.META_SYNC_CRON || 'TZ=Europe/Copenhagen 0 */2 * * *';
  const vercelCron = '0 4 * * * daily (Vercel Hobby max — use Inngest META_SYNC_CRON for more frequent sync)';

  if (usePostgres()) {
    const rows = clientId
      ? await query`
          SELECT r.*, a.account_name
          FROM meta_sync_runs r
          JOIN accounts a ON a.client_id = r.client_id
          WHERE r.client_id = ${normalizeClientId(clientId)}
          ORDER BY r.started_at DESC
          LIMIT ${cappedLimit}
        `
      : await query`
          SELECT r.*, a.account_name
          FROM meta_sync_runs r
          LEFT JOIN accounts a ON a.client_id = r.client_id
          ORDER BY r.started_at DESC
          LIMIT ${cappedLimit}
        `;
    const runs = rows.map(rowToMetaRun);
    return {
      type: 'meta',
      runs,
      summary: buildSummary(runs, `${schedule} · ${vercelCron}`),
    };
  }

  const store = readLocalStore();
  const accountNameById = Object.fromEntries(
    Object.values(store.accounts || {}).map((row) => [row.client_id, row.account_name]),
  );
  let runs = (store.metaSyncRuns || []).map((entry) => entryToMetaRun(entry, accountNameById));
  if (clientId) {
    runs = runs.filter((run) => run.clientId === normalizeClientId(clientId));
  }
  runs.sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)));
  runs = runs.slice(0, cappedLimit);
  return {
    type: 'meta',
    runs,
    summary: buildSummary(runs, `${schedule} · ${vercelCron}`),
  };
}

module.exports = {
  listGhlSyncRuns,
  listMetaSyncRuns,
  logMetaSyncRun,
};
