const fs = require('fs');
const path = require('path');
const { query, usePostgres } = require('./db');
const { getAccount, listClientIds, normalizeClientId } = require('./account-store');

const DATA_FILE = path.join(__dirname, '..', '.data', 'fb-lead-sync-runs.json');
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;
const MAX_STORED_ROWS = 500;
const FB_LEAD_SYNC_SCHEDULE = '0 * * * * (GitHub Actions hourly)';

function normalizeLimit(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

function rowToRun(row) {
  return {
    id: Number(row.id),
    clientId: row.client_id,
    accountName: row.account_name || row.client_id,
    startedAt: row.started_at,
    finishedAt: row.finished_at || null,
    status: row.status,
    source: row.source || 'unknown',
    mode: row.mode || 'recent',
    days: row.days != null ? Number(row.days) : null,
    dryRun: Boolean(row.dry_run),
    metaLeadCount: row.meta_lead_count ?? null,
    inWindow: row.in_window ?? null,
    updated: row.updated_count != null ? Number(row.updated_count) : 0,
    skippedHasId: row.skipped_has_id != null ? Number(row.skipped_has_id) : 0,
    skippedNoMatch: row.skipped_no_match != null ? Number(row.skipped_no_match) : 0,
    errors: row.errors != null ? Number(row.errors) : 0,
    batchOffset: row.batch_offset != null ? Number(row.batch_offset) : 0,
    batchLimit: row.batch_limit ?? null,
    hasMore: Boolean(row.has_more),
    errorMessage: row.error_message || null,
    rows: Array.isArray(row.rows) ? row.rows : (row.rows ? JSON.parse(JSON.stringify(row.rows)) : []),
  };
}

function readLocalRuns() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return Array.isArray(parsed.runs) ? parsed.runs : [];
  } catch {
    return [];
  }
}

function writeLocalRuns(runs) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify({ runs }, null, 2));
}

function mergeAuditRows(existingRows, newRows) {
  const combined = [...(existingRows || []), ...(newRows || [])];
  const actionable = combined.filter((row) =>
    row.status === 'updated'
    || row.status === 'would_update'
    || row.status === 'error',
  );
  return actionable.slice(-MAX_STORED_ROWS);
}

async function createFbLeadSyncRun({
  clientId,
  mode = 'recent',
  days = 2,
  dryRun = false,
  source = 'unknown',
  batchLimit = null,
} = {}) {
  const id = normalizeClientId(clientId);
  const entry = {
    client_id: id,
    started_at: new Date().toISOString(),
    finished_at: null,
    status: 'running',
    source: String(source || 'unknown'),
    mode: String(mode || 'recent'),
    days: Number(days) || 2,
    dry_run: Boolean(dryRun),
    meta_lead_count: null,
    in_window: null,
    updated_count: 0,
    skipped_has_id: 0,
    skipped_no_match: 0,
    errors: 0,
    batch_offset: 0,
    batch_limit: batchLimit != null ? Number(batchLimit) : null,
    has_more: false,
    error_message: null,
    rows: [],
  };

  if (usePostgres()) {
    const rows = await query`
      INSERT INTO fb_lead_sync_runs (
        client_id, started_at, status, source, mode, days, dry_run,
        batch_limit, rows
      )
      VALUES (
        ${entry.client_id}, ${entry.started_at}, ${entry.status}, ${entry.source},
        ${entry.mode}, ${entry.days}, ${entry.dry_run},
        ${entry.batch_limit}, ${JSON.stringify(entry.rows)}::jsonb
      )
      RETURNING id
    `;
    return { ...entry, id: Number(rows[0].id) };
  }

  const runs = readLocalRuns();
  const nextId = runs.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0) + 1;
  const stored = { id: nextId, ...entry };
  runs.push(stored);
  writeLocalRuns(runs);
  return stored;
}

async function getFbLeadSyncLeadsCache(runId) {
  const id = Number(runId);
  if (!Number.isFinite(id)) return null;

  if (usePostgres()) {
    const rows = await query`
      SELECT leads_cache FROM fb_lead_sync_runs WHERE id = ${id} LIMIT 1
    `;
    const cache = rows[0]?.leads_cache;
    if (!cache?.leads?.length) return null;
    return cache;
  }

  const runs = readLocalRuns();
  const entry = runs.find((row) => Number(row.id) === id);
  if (!entry?.leads_cache?.leads?.length) return null;
  return entry.leads_cache;
}

async function recoverStuckFbLeadSyncRuns(maxAgeMs = 5 * 60 * 1000) {
  const threshold = new Date(Date.now() - maxAgeMs).toISOString();

  if (usePostgres()) {
    const rows = await query`
      UPDATE fb_lead_sync_runs
      SET
        status = 'error',
        has_more = FALSE,
        finished_at = NOW(),
        error_message = COALESCE(error_message, 'Sync timed out or was interrupted. Run Preview again.')
      WHERE status = 'running'
        AND started_at < ${threshold}
      RETURNING id
    `;
    return rows.length;
  }

  const runs = readLocalRuns();
  let recovered = 0;
  for (const run of runs) {
    if (run.status !== 'running') continue;
    if (!run.started_at || run.started_at > threshold) continue;
    run.status = 'error';
    run.has_more = false;
    run.finished_at = new Date().toISOString();
    run.error_message = run.error_message || 'Sync timed out or was interrupted. Run Preview again.';
    recovered += 1;
  }
  if (recovered) writeLocalRuns(runs);
  return recovered;
}

async function updateFbLeadSyncRun(runId, patch = {}) {
  const id = Number(runId);
  if (!Number.isFinite(id)) {
    throw new Error('Invalid run id.');
  }

  if (usePostgres()) {
    const currentRows = await query`SELECT * FROM fb_lead_sync_runs WHERE id = ${id} LIMIT 1`;
    const current = currentRows[0];
    if (!current) {
      const error = new Error('Run not found.');
      error.statusCode = 404;
      throw error;
    }

    const mergedRows = patch.appendRows
      ? mergeAuditRows(current.rows, patch.appendRows)
      : (patch.rows !== undefined ? patch.rows : current.rows);

    const next = {
      finished_at: patch.finishedAt !== undefined ? patch.finishedAt : current.finished_at,
      status: patch.status !== undefined ? patch.status : current.status,
      meta_lead_count: patch.metaLeadCount !== undefined ? patch.metaLeadCount : current.meta_lead_count,
      in_window: patch.inWindow !== undefined ? patch.inWindow : current.in_window,
      updated_count: patch.updated !== undefined ? patch.updated : current.updated_count,
      skipped_has_id: patch.skippedHasId !== undefined ? patch.skippedHasId : current.skipped_has_id,
      skipped_no_match: patch.skippedNoMatch !== undefined ? patch.skippedNoMatch : current.skipped_no_match,
      errors: patch.errors !== undefined ? patch.errors : current.errors,
      batch_offset: patch.batchOffset !== undefined ? patch.batchOffset : current.batch_offset,
      batch_limit: patch.batchLimit !== undefined ? patch.batchLimit : current.batch_limit,
      has_more: patch.hasMore !== undefined ? patch.hasMore : current.has_more,
      error_message: patch.errorMessage !== undefined ? patch.errorMessage : current.error_message,
      rows: mergedRows,
      leads_cache: patch.leadsCache !== undefined ? patch.leadsCache : current.leads_cache,
    };

    await query`
      UPDATE fb_lead_sync_runs SET
        finished_at = ${next.finished_at},
        status = ${next.status},
        meta_lead_count = ${next.meta_lead_count},
        in_window = ${next.in_window},
        updated_count = ${next.updated_count},
        skipped_has_id = ${next.skipped_has_id},
        skipped_no_match = ${next.skipped_no_match},
        errors = ${next.errors},
        batch_offset = ${next.batch_offset},
        batch_limit = ${next.batch_limit},
        has_more = ${next.has_more},
        error_message = ${next.error_message},
        rows = ${JSON.stringify(next.rows)}::jsonb,
        leads_cache = ${next.leads_cache != null ? JSON.stringify(next.leads_cache) : null}::jsonb
      WHERE id = ${id}
    `;
    const rows = await query`
      SELECT r.*, a.account_name
      FROM fb_lead_sync_runs r
      JOIN accounts a ON a.client_id = r.client_id
      WHERE r.id = ${id}
      LIMIT 1
    `;
    return rowToRun(rows[0]);
  }

  const runs = readLocalRuns();
  const index = runs.findIndex((row) => Number(row.id) === id);
  if (index < 0) {
    const error = new Error('Run not found.');
    error.statusCode = 404;
    throw error;
  }
  const current = runs[index];
  const mergedRows = patch.appendRows
    ? mergeAuditRows(current.rows, patch.appendRows)
    : (patch.rows !== undefined ? patch.rows : current.rows);
  runs[index] = {
    ...current,
    finished_at: patch.finishedAt !== undefined ? patch.finishedAt : current.finished_at,
    status: patch.status !== undefined ? patch.status : current.status,
    meta_lead_count: patch.metaLeadCount !== undefined ? patch.metaLeadCount : current.meta_lead_count,
    in_window: patch.inWindow !== undefined ? patch.inWindow : current.in_window,
    updated_count: patch.updated !== undefined ? patch.updated : current.updated_count,
    skipped_has_id: patch.skippedHasId !== undefined ? patch.skippedHasId : current.skipped_has_id,
    skipped_no_match: patch.skippedNoMatch !== undefined ? patch.skippedNoMatch : current.skipped_no_match,
    errors: patch.errors !== undefined ? patch.errors : current.errors,
    batch_offset: patch.batchOffset !== undefined ? patch.batchOffset : current.batch_offset,
    batch_limit: patch.batchLimit !== undefined ? patch.batchLimit : current.batch_limit,
    has_more: patch.hasMore !== undefined ? patch.hasMore : current.has_more,
    error_message: patch.errorMessage !== undefined ? patch.errorMessage : current.error_message,
    rows: mergedRows,
    leads_cache: patch.leadsCache !== undefined ? patch.leadsCache : current.leads_cache,
  };
  writeLocalRuns(runs);
  const account = await getAccount(runs[index].client_id);
  return rowToRun({ ...runs[index], account_name: account?.accountName });
}

async function finishFbLeadSyncRun(runId, { status = 'success', errorMessage = null } = {}) {
  return updateFbLeadSyncRun(runId, {
    status,
    errorMessage,
    finishedAt: new Date().toISOString(),
    hasMore: false,
  });
}

async function getFbLeadSyncRun(runId) {
  const id = Number(runId);
  if (!Number.isFinite(id)) {
    const error = new Error('Invalid run id.');
    error.statusCode = 400;
    throw error;
  }

  if (usePostgres()) {
    const rows = await query`
      SELECT r.*, a.account_name
      FROM fb_lead_sync_runs r
      JOIN accounts a ON a.client_id = r.client_id
      WHERE r.id = ${id}
      LIMIT 1
    `;
    if (!rows[0]) {
      const error = new Error('Run not found.');
      error.statusCode = 404;
      throw error;
    }
    return rowToRun(rows[0]);
  }

  const runs = readLocalRuns();
  const entry = runs.find((row) => Number(row.id) === id);
  if (!entry) {
    const error = new Error('Run not found.');
    error.statusCode = 404;
    throw error;
  }
  const account = await getAccount(entry.client_id);
  return rowToRun({ ...entry, account_name: account?.accountName });
}

async function listFbLeadSyncRuns({ clientId = null, limit = DEFAULT_LIMIT } = {}) {
  const cappedLimit = normalizeLimit(limit);

  if (usePostgres()) {
    const rows = clientId
      ? await query`
          SELECT r.*, a.account_name
          FROM fb_lead_sync_runs r
          JOIN accounts a ON a.client_id = r.client_id
          WHERE r.client_id = ${normalizeClientId(clientId)}
          ORDER BY r.started_at DESC
          LIMIT ${cappedLimit}
        `
      : await query`
          SELECT r.*, a.account_name
          FROM fb_lead_sync_runs r
          JOIN accounts a ON a.client_id = r.client_id
          ORDER BY r.started_at DESC
          LIMIT ${cappedLimit}
        `;
    const runs = rows.map(rowToRun);
    return {
      runs,
      summary: buildSummary(runs),
    };
  }

  const runs = readLocalRuns();
  const accountNameById = {};
  for (const id of await listClientIds()) {
    const account = await getAccount(id);
    if (account) accountNameById[id] = account.accountName;
  }
  let filtered = runs.map((entry) => rowToRun({
    ...entry,
    account_name: accountNameById[entry.client_id] || entry.client_id,
  }));
  if (clientId) {
    filtered = filtered.filter((run) => run.clientId === normalizeClientId(clientId));
  }
  filtered.sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)));
  filtered = filtered.slice(0, cappedLimit);
  return {
    runs: filtered,
    summary: buildSummary(filtered),
  };
}

function buildSummary(runs) {
  const lastRun = runs[0] || null;
  const lastSuccess = runs.find((run) => {
    const status = String(run.status || '').toLowerCase();
    return status === 'success' || status === 'ok';
  }) || null;
  const since24h = Date.now() - 24 * 60 * 60 * 1000;
  const updatedLast24h = runs
    .filter((run) => Date.parse(run.startedAt || '') >= since24h)
    .reduce((sum, run) => sum + (run.updated || 0), 0);
  return {
    lastRunAt: lastRun?.startedAt || null,
    lastRunStatus: lastRun?.status || null,
    lastSuccessAt: lastSuccess?.startedAt || null,
    updatedLast24h,
    schedule: FB_LEAD_SYNC_SCHEDULE,
    totalShown: runs.length,
  };
}

async function getLastRunByClient(clientId) {
  const { runs } = await listFbLeadSyncRuns({ clientId, limit: 1 });
  return runs[0] || null;
}

async function getFbLeadSyncDashboard() {
  await recoverStuckFbLeadSyncRuns();
  const clientIds = await listClientIds();
  const clients = [];
  let enabledCount = 0;

  for (const clientId of clientIds) {
    const account = await getAccount(clientId);
    if (!account) continue;
    if (account.fbLeadSyncEnabled) enabledCount += 1;
    const lastRun = await getLastRunByClient(clientId);
    clients.push({
      clientId: account.clientId,
      accountName: account.accountName,
      fbLeadSyncEnabled: account.fbLeadSyncEnabled,
      ghlFbLeadFieldId: account.ghlFbLeadFieldId,
      metaPageId: account.metaPageId,
      locationId: account.locationId,
      hasGhlToken: account.hasGhlToken,
      hasMetaToken: account.hasMetaSystemUserToken || account.hasMetaPageAccessToken,
      lastRun: lastRun ? {
        id: lastRun.id,
        startedAt: lastRun.startedAt,
        status: lastRun.status,
        mode: lastRun.mode,
        updated: lastRun.updated,
        dryRun: lastRun.dryRun,
      } : null,
    });
  }

  const { summary } = await listFbLeadSyncRuns({ limit: 50 });
  return {
    summary: {
      ...summary,
      enabledCount,
    },
    clients,
  };
}

module.exports = {
  FB_LEAD_SYNC_SCHEDULE,
  MAX_STORED_ROWS,
  createFbLeadSyncRun,
  updateFbLeadSyncRun,
  finishFbLeadSyncRun,
  getFbLeadSyncRun,
  getFbLeadSyncLeadsCache,
  getLastRunByClient,
  getFbLeadSyncDashboard,
  listFbLeadSyncRuns,
  mergeAuditRows,
  recoverStuckFbLeadSyncRuns,
};
