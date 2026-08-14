const fs = require('fs');
const path = require('path');
const { query, usePostgres } = require('./db');
const { normalizeClientId } = require('./account-store');
const {
  SYNC_HISTORY_RETENTION_DAYS,
  resolveSyncHistoryCutoffIso,
} = require('./sync-history-retention');

const DATA_FILE = path.join(__dirname, '..', '.data', 'multi-tenant-store.json');
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;
const SCHEDULE_LABEL = 'Webhook + after GHL snapshot sync';

function normalizeLimit(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

function normalizeSkipped(skipped = []) {
  return (skipped || []).map((item) => (
    typeof item === 'string' ? { monthKey: item, reason: 'unknown' } : item
  ));
}

function deriveStatus({ result, error }) {
  if (error) return 'error';
  if (result?.skipped === true) return 'skipped';
  const errors = result?.errors || [];
  const synced = result?.synced || [];
  if (errors.length > 0 && synced.length > 0) return 'partial';
  if (errors.length > 0) return 'error';
  return 'success';
}

function buildDetail({ result, context = {} }) {
  if (result?.skipped === true) {
    return {
      skipReason: result.reason || 'unknown',
      ...context,
    };
  }

  return {
    monthKeys: result?.monthKeys || context.monthKeys || null,
    synced: result?.synced || [],
    skipped: normalizeSkipped(result?.skipped),
    errors: result?.errors || [],
    attempted: result?.attempted ?? null,
    ...context,
  };
}

function buildMetaReportGhlSyncLogEntry({
  trigger,
  source,
  result,
  startedAt,
  finishedAt,
  error = null,
  context = {},
} = {}) {
  const status = deriveStatus({ result, error });
  const detail = buildDetail({ result, context });
  let errorMessage = null;

  if (error) {
    errorMessage = error.message || String(error);
  } else if (status === 'error' && result?.errors?.length) {
    errorMessage = result.errors.map((row) => `${row.monthKey}: ${row.message}`).join('; ');
  } else if (status === 'skipped' && result?.reason) {
    errorMessage = result.reason;
  }

  return {
    status,
    source: String(source || 'unknown'),
    trigger: String(trigger || 'unknown'),
    started_at: startedAt || new Date().toISOString(),
    finished_at: finishedAt || new Date().toISOString(),
    error_message: errorMessage != null ? String(errorMessage).slice(0, 2000) : null,
    detail,
  };
}

function parseDetail(value) {
  if (value == null) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(String(value));
  } catch {
    return null;
  }
}

function rowToRun(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    accountName: row.account_name || row.client_id,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    status: row.status,
    source: row.source || 'unknown',
    trigger: row.trigger || 'unknown',
    errorMessage: row.error_message || null,
    detail: parseDetail(row.detail),
  };
}

function entryToRun(entry, accountNameById) {
  return {
    id: entry.id || null,
    clientId: entry.client_id,
    accountName: accountNameById[entry.client_id] || entry.client_id,
    startedAt: entry.started_at,
    finishedAt: entry.finished_at,
    status: entry.status,
    source: entry.source || 'unknown',
    trigger: entry.trigger || 'unknown',
    errorMessage: entry.error_message || null,
    detail: parseDetail(entry.detail),
  };
}

function readLocalStore() {
  if (!fs.existsSync(DATA_FILE)) {
    return { accounts: {}, metaReportGhlSyncRuns: [] };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return {
      accounts: parsed.accounts || {},
      metaReportGhlSyncRuns: parsed.metaReportGhlSyncRuns || [],
    };
  } catch {
    return { accounts: {}, metaReportGhlSyncRuns: [] };
  }
}

function writeLocalStore(store) {
  const fullStore = fs.existsSync(DATA_FILE)
    ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
    : {};
  fullStore.metaReportGhlSyncRuns = store.metaReportGhlSyncRuns;
  if (store.accounts) fullStore.accounts = store.accounts;
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(fullStore, null, 2));
}

function buildSummary(runs) {
  const lastRun = runs[0] || null;
  const lastSuccess = runs.find((run) => {
    const status = String(run.status || '').toLowerCase();
    return status === 'success' || status === 'partial';
  }) || null;
  return {
    lastRunAt: lastRun?.startedAt || null,
    lastRunStatus: lastRun?.status || null,
    lastSuccessAt: lastSuccess?.startedAt || null,
    schedule: SCHEDULE_LABEL,
    totalShown: runs.length,
    retentionDays: SYNC_HISTORY_RETENTION_DAYS,
  };
}

async function logMetaReportGhlSyncRun(clientId, payload = {}) {
  const id = normalizeClientId(clientId);
  const entry = {
    client_id: id,
    started_at: payload.started_at || payload.startedAt || new Date().toISOString(),
    finished_at: payload.finished_at || payload.finishedAt || new Date().toISOString(),
    status: String(payload.status || 'success'),
    source: String(payload.source || 'unknown'),
    trigger: String(payload.trigger || 'unknown'),
    error_message: payload.error_message != null
      ? String(payload.error_message).slice(0, 2000)
      : (payload.errorMessage != null ? String(payload.errorMessage).slice(0, 2000) : null),
    detail: payload.detail != null ? payload.detail : null,
  };

  if (usePostgres()) {
    const rows = await query`
      INSERT INTO meta_report_ghl_sync_runs (
        client_id, started_at, finished_at, status, source, trigger, error_message, detail
      )
      VALUES (
        ${id},
        ${entry.started_at},
        ${entry.finished_at},
        ${entry.status},
        ${entry.source},
        ${entry.trigger},
        ${entry.error_message},
        ${JSON.stringify(entry.detail)}::jsonb
      )
      RETURNING id
    `;
    const rowId = rows[0]?.id;
    if (rowId == null) {
      throw new Error('meta_report_ghl_sync_runs INSERT returned no id');
    }
    return { ...entry, id: Number(rowId) };
  }

  const store = readLocalStore();
  if (!store.metaReportGhlSyncRuns) store.metaReportGhlSyncRuns = [];
  const nextId = store.metaReportGhlSyncRuns.length + 1;
  const stored = { id: nextId, ...entry };
  store.metaReportGhlSyncRuns.push(stored);
  writeLocalStore(store);
  return stored;
}

async function recordMetaReportGhlSyncRun(clientId, options = {}) {
  const entry = buildMetaReportGhlSyncLogEntry(options);
  return logMetaReportGhlSyncRun(clientId, entry);
}

async function listMetaReportGhlSyncRuns({
  clientId = null,
  limit = DEFAULT_LIMIT,
  sinceDays = SYNC_HISTORY_RETENTION_DAYS,
} = {}) {
  const cappedLimit = normalizeLimit(limit);
  const cutoffIso = resolveSyncHistoryCutoffIso(sinceDays);

  if (usePostgres()) {
    const rows = clientId
      ? (cutoffIso
        ? await query`
            SELECT r.*, a.account_name
            FROM meta_report_ghl_sync_runs r
            JOIN accounts a ON a.client_id = r.client_id
            WHERE r.client_id = ${normalizeClientId(clientId)}
              AND r.started_at >= ${cutoffIso}
            ORDER BY r.started_at DESC
            LIMIT ${cappedLimit}
          `
        : await query`
            SELECT r.*, a.account_name
            FROM meta_report_ghl_sync_runs r
            JOIN accounts a ON a.client_id = r.client_id
            WHERE r.client_id = ${normalizeClientId(clientId)}
            ORDER BY r.started_at DESC
            LIMIT ${cappedLimit}
          `)
      : (cutoffIso
        ? await query`
            SELECT r.*, a.account_name
            FROM meta_report_ghl_sync_runs r
            JOIN accounts a ON a.client_id = r.client_id
            WHERE r.started_at >= ${cutoffIso}
            ORDER BY r.started_at DESC
            LIMIT ${cappedLimit}
          `
        : await query`
            SELECT r.*, a.account_name
            FROM meta_report_ghl_sync_runs r
            JOIN accounts a ON a.client_id = r.client_id
            ORDER BY r.started_at DESC
            LIMIT ${cappedLimit}
          `);
    const runs = rows.map(rowToRun);
    return {
      type: 'meta-report-ghl',
      runs,
      summary: buildSummary(runs),
    };
  }

  const store = readLocalStore();
  const accountNameById = Object.fromEntries(
    Object.values(store.accounts || {}).map((row) => [row.client_id, row.account_name]),
  );
  let runs = (store.metaReportGhlSyncRuns || []).map((entry) => entryToRun(entry, accountNameById));
  if (clientId) {
    runs = runs.filter((run) => run.clientId === normalizeClientId(clientId));
  }
  runs = cutoffIso
    ? runs.filter((run) => String(run.startedAt || '') >= cutoffIso)
    : runs;
  runs.sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)));
  runs = runs.slice(0, cappedLimit);
  return {
    type: 'meta-report-ghl',
    runs,
    summary: buildSummary(runs),
  };
}

async function deleteMetaReportGhlSyncRuns({ clientId = null } = {}) {
  if (usePostgres()) {
    if (clientId) {
      const id = normalizeClientId(clientId);
      const rows = await query`
        DELETE FROM meta_report_ghl_sync_runs
        WHERE client_id = ${id}
        RETURNING id
      `;
      return { deleted: rows.length, clientId: id };
    }
    const rows = await query`DELETE FROM meta_report_ghl_sync_runs RETURNING id`;
    return { deleted: rows.length };
  }

  const store = readLocalStore();
  const before = (store.metaReportGhlSyncRuns || []).length;
  if (clientId) {
    const id = normalizeClientId(clientId);
    store.metaReportGhlSyncRuns = (store.metaReportGhlSyncRuns || []).filter((row) => row.client_id !== id);
  } else {
    store.metaReportGhlSyncRuns = [];
  }
  writeLocalStore(store);
  return { deleted: before - (store.metaReportGhlSyncRuns || []).length, clientId: clientId || null };
}

async function safeRecordMetaReportGhlSyncRun(clientId, options = {}) {
  try {
    return await recordMetaReportGhlSyncRun(clientId, options);
  } catch (error) {
    console.error('[meta-report-ghl-sync-history] Failed to log run:', error.message || error);
    return null;
  }
}

module.exports = {
  buildMetaReportGhlSyncLogEntry,
  deleteMetaReportGhlSyncRuns,
  deriveStatus,
  listMetaReportGhlSyncRuns,
  logMetaReportGhlSyncRun,
  normalizeSkipped,
  recordMetaReportGhlSyncRun,
  safeRecordMetaReportGhlSyncRun,
};
