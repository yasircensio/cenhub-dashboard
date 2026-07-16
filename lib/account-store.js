const fs = require('fs');
const path = require('path');
const { decryptSecret, encryptSecret } = require('./crypto');
const { query, usePostgres } = require('./db');
const { getSnapshotPreviewKpis } = require('./snapshot-kpis');
const { validateMetricsModelInput } = require('./metrics-model');

function maybeEncryptSecret(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return '';
  try {
    return encryptSecret(normalized);
  } catch (error) {
    if (!process.env.ACCOUNT_CONFIG_ENCRYPTION_KEY && !usePostgres()) {
      return normalized;
    }
    throw error;
  }
}

const DATA_DIR = path.join(__dirname, '..', '.data');
const FILE_STORE = path.join(DATA_DIR, 'multi-tenant-store.json');

const DEFAULT_ACCOUNT_ID = process.env.DEFAULT_CLIENT_ID || 'suntech-nordic';
const DEFAULT_LOCATION_ID = process.env.CENHUB_LOCATION_ID || 'XTl96fVPBYqWgZdWkfFM';
const DEFAULT_PROFIT_FIELD_ID = process.env.CENHUB_PROFIT_FIELD_ID || '2YAu8bEKpOUSXwfYljWT';
const DEFAULT_TIMEZONE = process.env.DASHBOARD_TIMEZONE || 'Europe/Copenhagen';

const RESERVED_SLUGS = new Set([
  'admin', 'api', 'lib', 'dashboard', 'index', 'static', 'assets', 'login',
  'team', 'staff', 'users', 'settings',
  'favicon.ico', 'robots.txt', 'inngest', 'health', 'healthz',
]);

function normalizeClientId(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return DEFAULT_ACCOUNT_ID;
  return normalized.replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function isValidSlug(slug) {
  if (!slug || slug.length < 2 || slug.length > 48) return false;
  if (RESERVED_SLUGS.has(slug)) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function suggestSlugFromName(name) {
  return normalizeClientId(String(name || '').replace(/\s+/g, '-'));
}

function normalizeMetaAdAccountId(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  return raw.replace(/^act_/i, '');
}

function resolveMetaSystemUserToken(account) {
  if (!account) return '';
  const { normalizeMetaAccessToken } = require('./meta-insights');
  if (account.metaSystemUserToken) {
    return normalizeMetaAccessToken(account.metaSystemUserToken);
  }
  return normalizeMetaAccessToken(process.env.META_SYSTEM_USER_TOKEN || '');
}

function accountHasMetaSystemUserToken(row) {
  return Boolean(String(row?.meta_system_user_token_encrypted || '').trim())
    || Boolean(String(process.env.META_SYSTEM_USER_TOKEN || '').trim());
}

function readFileStore() {
  if (!fs.existsSync(FILE_STORE)) {
    return { accounts: {}, snapshots: {}, syncRuns: [] };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(FILE_STORE, 'utf8'));
    return {
      accounts: parsed.accounts || {},
      snapshots: parsed.snapshots || {},
      syncRuns: parsed.syncRuns || [],
    };
  } catch {
    return { accounts: {}, snapshots: {}, syncRuns: [] };
  }
}

function writeFileStore(store) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE_STORE, JSON.stringify(store, null, 2));
}

function enrichAccountRow(row) {
  if (!row) return null;
  const dedupeEnabled = Boolean(row.dedupe_enabled);
  const afterSalesPipelineId = row.after_sales_pipeline_id || null;
  const winPipelineId = row.win_pipeline_id || null;
  const metricsModelSetAt = row.metrics_model_set_at
    || ((dedupeEnabled || afterSalesPipelineId || winPipelineId) ? (row.created_at || null) : null);

  return {
    ...row,
    win_pipeline_id: winPipelineId || (dedupeEnabled ? afterSalesPipelineId : null),
    metrics_model_set_at: metricsModelSetAt,
    metrics_model_locked_at: row.metrics_model_locked_at || null,
    metrics_model_changed_at: row.metrics_model_changed_at || null,
    metrics_model_version: row.metrics_model_version != null ? Number(row.metrics_model_version) : 1,
  };
}

function rowToAccount(row, { includeSecrets = false } = {}) {
  if (!row) return null;
  const normalized = enrichAccountRow(row);
  const account = {
    clientId: normalized.client_id,
    accountName: normalized.account_name,
    locationId: normalized.location_id || null,
    timezone: normalized.timezone || DEFAULT_TIMEZONE,
    profitFieldId: normalized.profit_field_id || DEFAULT_PROFIT_FIELD_ID,
    facebookClientId: normalized.facebook_client_id || normalized.client_id,
    defaultAdSpend: normalized.default_ad_spend != null ? Number(normalized.default_ad_spend) : null,
    newLeadsPipelineId: normalized.new_leads_pipeline_id || null,
    salesPipelineId: normalized.sales_pipeline_id || null,
    afterSalesPipelineId: normalized.after_sales_pipeline_id || null,
    winPipelineId: normalized.win_pipeline_id || null,
    dedupeEnabled: Boolean(normalized.dedupe_enabled),
    metricsModelSetAt: normalized.metrics_model_set_at || null,
    metricsModelLockedAt: normalized.metrics_model_locked_at || null,
    metricsModelChangedAt: normalized.metrics_model_changed_at || null,
    metricsModelVersion: normalized.metrics_model_version || 1,
    readyForGhl: Boolean(normalized.ready_for_ghl),
    hasGhlToken: Boolean(normalized.ghl_token_encrypted),
    metaAdAccountId: normalized.meta_ad_account_id || null,
    metaPageId: normalized.meta_page_id || null,
    metaPixelId: normalized.meta_pixel_id || null,
    hasMetaSystemUserToken: accountHasMetaSystemUserToken(normalized),
    hasMetaPageAccessToken: Boolean(normalized.meta_page_access_token_encrypted),
    metaSyncStatus: normalized.meta_sync_status || null,
    metaSyncError: normalized.meta_sync_error || null,
    metaLastSyncedAt: normalized.meta_last_synced_at || null,
    createdAt: normalized.created_at || null,
    updatedAt: normalized.updated_at || null,
    adminUrl: `/${normalized.client_id}`,
  };
  if (includeSecrets) {
    account.ghlToken = row.ghl_token_encrypted ? decryptSecret(row.ghl_token_encrypted) : '';
    account.metaSystemUserToken = row.meta_system_user_token_encrypted
      ? decryptSecret(row.meta_system_user_token_encrypted)
      : '';
    account.metaPageAccessToken = row.meta_page_access_token_encrypted
      ? decryptSecret(row.meta_page_access_token_encrypted)
      : '';
  }
  return account;
}

function computeAccountStatus(account, snapshot) {
  if (!account.hasGhlToken) return 'needs_token';
  if (!account.metricsModelSetAt) return 'needs_metrics_model';
  if (!account.newLeadsPipelineId || !account.salesPipelineId) return 'needs_pipelines';
  if (snapshot?.sync_status === 'syncing') return 'syncing';
  if (snapshot?.sync_status === 'error') return 'sync_error';
  if (!snapshot?.fetched_at) return 'needs_sync';
  if (!account.readyForGhl) return 'needs_review';
  return 'ready';
}

function getPipelineMode(account) {
  return account.afterSalesPipelineId ? '3-pipeline' : '2-pipeline';
}

function toPublicSummary(account, snapshot = null) {
  const status = computeAccountStatus(account, snapshot);
  const previewKpis = snapshot ? getSnapshotPreviewKpis(snapshot, account) : null;
  return {
    clientId: account.clientId,
    accountName: account.accountName,
    status,
    pipelineMode: getPipelineMode(account),
    lastSyncAt: snapshot?.fetched_at || null,
    lastSyncStatus: snapshot?.sync_status || null,
    lastSyncError: snapshot?.sync_error || null,
    adminUrl: account.adminUrl,
    ghlIframeUrl: '/',
    readyForGhl: account.readyForGhl,
    metricsModelSetAt: account.metricsModelSetAt,
    metricsModelLockedAt: account.metricsModelLockedAt,
    dedupeEnabled: account.dedupeEnabled,
    previewKpis,
  };
}

async function checkSlugAvailable(slug) {
  const normalized = normalizeClientId(slug);
  if (!isValidSlug(normalized)) {
    return { available: false, normalized, reason: 'invalid_or_reserved' };
  }
  const existing = await getAccount(normalized);
  return {
    available: !existing,
    normalized,
    adminUrl: `/${normalized}`,
    reason: existing ? 'taken' : null,
  };
}

async function listClientIds() {
  if (usePostgres()) {
    const rows = await query`SELECT client_id FROM accounts ORDER BY account_name ASC`;
    return rows.map((row) => row.client_id);
  }

  const store = readFileStore();
  return Object.keys(store.accounts || {});
}

async function listMetaSyncableClientIds() {
  const ids = await listClientIds();
  const syncable = [];
  for (const clientId of ids) {
    const account = await getAccount(clientId, { includeSecrets: true });
    if (!account?.metaAdAccountId) continue;
    if (!resolveMetaSystemUserToken(account)) continue;
    syncable.push(clientId);
  }
  return syncable;
}

async function listAccounts() {
  await recoverStuckSyncStates();
  if (usePostgres()) {
    const rows = await query`SELECT * FROM accounts ORDER BY account_name ASC`;
    const summaries = [];
    for (const row of rows) {
      const account = rowToAccount(row);
      const snapshot = await getSnapshot(account.clientId);
      summaries.push(toPublicSummary(account, snapshot));
    }
    return summaries;
  }

  const store = readFileStore();
  return Object.values(store.accounts)
    .map((row) => rowToAccount(row))
    .sort((a, b) => a.accountName.localeCompare(b.accountName))
    .map((account) => {
      const snapshot = store.snapshots[account.clientId] || null;
      return toPublicSummary(account, snapshot);
    });
}

async function getAccount(clientId, { includeSecrets = false, byLocationId = false } = {}) {
  if (usePostgres()) {
    const rows = byLocationId
      ? await query`SELECT * FROM accounts WHERE location_id = ${clientId} LIMIT 1`
      : await query`SELECT * FROM accounts WHERE client_id = ${normalizeClientId(clientId)} LIMIT 1`;
    return rowToAccount(rows[0], { includeSecrets });
  }

  const store = readFileStore();
  if (byLocationId) {
    const row = Object.values(store.accounts).find((item) => item.location_id === clientId);
    return rowToAccount(row, { includeSecrets });
  }
  return rowToAccount(store.accounts[normalizeClientId(clientId)], { includeSecrets });
}

async function createAccount(input) {
  const clientId = normalizeClientId(input.clientId);
  if (!isValidSlug(clientId)) {
    const error = new Error('Invalid or reserved client slug.');
    error.statusCode = 400;
    throw error;
  }
  if (await getAccount(clientId)) {
    const error = new Error('Client slug already exists.');
    error.statusCode = 409;
    throw error;
  }

  const now = new Date().toISOString();
  const accountName = String(input.accountName || clientId).trim();
  const ghlTokenEncrypted = input.ghlToken ? maybeEncryptSecret(input.ghlToken) : '';

  const record = {
    client_id: clientId,
    account_name: accountName,
    location_id: input.locationId || null,
    ghl_token_encrypted: ghlTokenEncrypted,
    timezone: input.timezone || DEFAULT_TIMEZONE,
    profit_field_id: input.profitFieldId || DEFAULT_PROFIT_FIELD_ID,
    facebook_client_id: input.facebookClientId || clientId,
    default_ad_spend: input.defaultAdSpend ?? null,
    new_leads_pipeline_id: input.newLeadsPipelineId || null,
    sales_pipeline_id: input.salesPipelineId || null,
    after_sales_pipeline_id: input.afterSalesPipelineId || null,
    win_pipeline_id: input.winPipelineId || null,
    dedupe_enabled: false,
    metrics_model_set_at: null,
    metrics_model_locked_at: null,
    metrics_model_changed_at: null,
    metrics_model_version: 1,
    ready_for_ghl: Boolean(input.readyForGhl),
    meta_ad_account_id: normalizeMetaAdAccountId(input.metaAdAccountId),
    meta_page_id: input.metaPageId ? String(input.metaPageId).trim() : null,
    meta_pixel_id: input.metaPixelId ? String(input.metaPixelId).trim() : null,
    meta_system_user_token_encrypted: input.metaSystemUserToken
      ? maybeEncryptSecret(input.metaSystemUserToken)
      : '',
    meta_page_access_token_encrypted: input.metaPageAccessToken
      ? maybeEncryptSecret(input.metaPageAccessToken)
      : '',
    meta_sync_status: null,
    meta_sync_error: null,
    meta_last_synced_at: null,
    created_at: now,
    updated_at: now,
  };

  if (usePostgres()) {
    await query`
      INSERT INTO accounts (
        client_id, account_name, location_id, ghl_token_encrypted, timezone,
        profit_field_id, facebook_client_id, default_ad_spend,
        new_leads_pipeline_id, sales_pipeline_id, after_sales_pipeline_id,
        win_pipeline_id, dedupe_enabled, metrics_model_set_at, metrics_model_locked_at,
        metrics_model_changed_at, metrics_model_version, ready_for_ghl,
        meta_ad_account_id, meta_page_id, meta_pixel_id,
        meta_system_user_token_encrypted, meta_page_access_token_encrypted,
        meta_sync_status, meta_sync_error, meta_last_synced_at,
        created_at, updated_at
      ) VALUES (
        ${record.client_id}, ${record.account_name}, ${record.location_id}, ${record.ghl_token_encrypted},
        ${record.timezone}, ${record.profit_field_id}, ${record.facebook_client_id}, ${record.default_ad_spend},
        ${record.new_leads_pipeline_id}, ${record.sales_pipeline_id}, ${record.after_sales_pipeline_id},
        ${record.win_pipeline_id}, ${record.dedupe_enabled}, ${record.metrics_model_set_at},
        ${record.metrics_model_locked_at}, ${record.metrics_model_changed_at}, ${record.metrics_model_version},
        ${record.ready_for_ghl},
        ${record.meta_ad_account_id}, ${record.meta_page_id}, ${record.meta_pixel_id},
        ${record.meta_system_user_token_encrypted}, ${record.meta_page_access_token_encrypted},
        ${record.meta_sync_status}, ${record.meta_sync_error}, ${record.meta_last_synced_at},
        ${record.created_at}, ${record.updated_at}
      )
    `;
    await query`
      INSERT INTO sync_snapshots (client_id, sync_status)
      VALUES (${clientId}, 'pending')
      ON CONFLICT (client_id) DO NOTHING
    `;
  } else {
    const store = readFileStore();
    store.accounts[clientId] = record;
    store.snapshots[clientId] = store.snapshots[clientId] || { client_id: clientId, sync_status: 'pending' };
    writeFileStore(store);
  }

  return rowToAccount(record);
}

async function updateAccount(clientId, input) {
  const existing = await getAccount(clientId, { includeSecrets: true });
  if (!existing) {
    const error = new Error('Account not found.');
    error.statusCode = 404;
    throw error;
  }

  let ghlTokenEncrypted = existing.hasGhlToken ? undefined : '';
  if (input.clearGhlToken) {
    ghlTokenEncrypted = '';
  } else if (input.ghlToken) {
    ghlTokenEncrypted = maybeEncryptSecret(input.ghlToken);
  }

  let metaSystemUserTokenEncrypted;
  if (input.clearMetaSystemUserToken) {
    metaSystemUserTokenEncrypted = '';
  } else if (input.metaSystemUserToken) {
    metaSystemUserTokenEncrypted = maybeEncryptSecret(input.metaSystemUserToken);
  }

  let metaPageAccessTokenEncrypted;
  if (input.clearMetaPageAccessToken) {
    metaPageAccessTokenEncrypted = '';
  } else if (input.metaPageAccessToken) {
    metaPageAccessTokenEncrypted = maybeEncryptSecret(input.metaPageAccessToken);
  }

  const afterSalesPipelineId = input.afterSalesPipelineId !== undefined
    ? (input.afterSalesPipelineId || null)
    : existing.afterSalesPipelineId;

  const metricsLocked = Boolean(existing.metricsModelLockedAt);
  const dedupeEnabled = metricsLocked
    ? existing.dedupeEnabled
    : (input.dedupeEnabled != null ? Boolean(input.dedupeEnabled) : existing.dedupeEnabled);
  const winPipelineId = metricsLocked
    ? existing.winPipelineId
    : (input.winPipelineId !== undefined ? (input.winPipelineId || null) : existing.winPipelineId);

  const updated = {
    client_id: existing.clientId,
    account_name: input.accountName ?? existing.accountName,
    location_id: input.locationId ?? existing.locationId,
    ghl_token_encrypted: ghlTokenEncrypted !== undefined
      ? ghlTokenEncrypted
      : (existing.hasGhlToken ? '__KEEP__' : ''),
    timezone: input.timezone ?? existing.timezone,
    profit_field_id: input.profitFieldId ?? existing.profitFieldId,
    facebook_client_id: input.facebookClientId ?? existing.facebookClientId,
    default_ad_spend: input.defaultAdSpend !== undefined ? input.defaultAdSpend : existing.defaultAdSpend,
    new_leads_pipeline_id: input.newLeadsPipelineId ?? existing.newLeadsPipelineId,
    sales_pipeline_id: input.salesPipelineId ?? existing.salesPipelineId,
    after_sales_pipeline_id: afterSalesPipelineId,
    win_pipeline_id: winPipelineId,
    dedupe_enabled: dedupeEnabled,
    metrics_model_set_at: existing.metricsModelSetAt,
    metrics_model_locked_at: existing.metricsModelLockedAt,
    metrics_model_changed_at: existing.metricsModelChangedAt,
    metrics_model_version: existing.metricsModelVersion,
    ready_for_ghl: input.readyForGhl != null ? Boolean(input.readyForGhl) : existing.readyForGhl,
    meta_ad_account_id: input.metaAdAccountId !== undefined
      ? normalizeMetaAdAccountId(input.metaAdAccountId)
      : existing.metaAdAccountId,
    meta_page_id: input.metaPageId !== undefined
      ? (input.metaPageId ? String(input.metaPageId).trim() : null)
      : existing.metaPageId,
    meta_pixel_id: input.metaPixelId !== undefined
      ? (input.metaPixelId ? String(input.metaPixelId).trim() : null)
      : existing.metaPixelId,
    updated_at: new Date().toISOString(),
  };

  if (usePostgres()) {
    const currentRows = await query`
      SELECT ghl_token_encrypted, meta_system_user_token_encrypted, meta_page_access_token_encrypted
      FROM accounts WHERE client_id = ${existing.clientId} LIMIT 1
    `;
    const current = currentRows[0] || {};
    const tokenValue = ghlTokenEncrypted !== undefined ? ghlTokenEncrypted : (current.ghl_token_encrypted || '');
    const metaSystemTokenValue = metaSystemUserTokenEncrypted !== undefined
      ? metaSystemUserTokenEncrypted
      : (current.meta_system_user_token_encrypted || '');
    const metaPageTokenValue = metaPageAccessTokenEncrypted !== undefined
      ? metaPageAccessTokenEncrypted
      : (current.meta_page_access_token_encrypted || '');

    await query`
      UPDATE accounts SET
        account_name = ${updated.account_name},
        location_id = ${updated.location_id},
        ghl_token_encrypted = ${tokenValue},
        timezone = ${updated.timezone},
        profit_field_id = ${updated.profit_field_id},
        facebook_client_id = ${updated.facebook_client_id},
        default_ad_spend = ${updated.default_ad_spend},
        new_leads_pipeline_id = ${updated.new_leads_pipeline_id},
        sales_pipeline_id = ${updated.sales_pipeline_id},
        after_sales_pipeline_id = ${updated.after_sales_pipeline_id},
        win_pipeline_id = ${updated.win_pipeline_id},
        dedupe_enabled = ${updated.dedupe_enabled},
        metrics_model_set_at = ${updated.metrics_model_set_at},
        metrics_model_locked_at = ${updated.metrics_model_locked_at},
        metrics_model_changed_at = ${updated.metrics_model_changed_at},
        metrics_model_version = ${updated.metrics_model_version},
        ready_for_ghl = ${updated.ready_for_ghl},
        meta_ad_account_id = ${updated.meta_ad_account_id},
        meta_page_id = ${updated.meta_page_id},
        meta_pixel_id = ${updated.meta_pixel_id},
        meta_system_user_token_encrypted = ${metaSystemTokenValue},
        meta_page_access_token_encrypted = ${metaPageTokenValue},
        updated_at = ${updated.updated_at}
      WHERE client_id = ${existing.clientId}
    `;
    const rows = await query`SELECT * FROM accounts WHERE client_id = ${existing.clientId} LIMIT 1`;
    return rowToAccount(rows[0]);
  }

  const store = readFileStore();
  const prev = store.accounts[existing.clientId];
  if (updated.ghl_token_encrypted === '__KEEP__') {
    updated.ghl_token_encrypted = prev.ghl_token_encrypted;
  }
  const filePatch = { ...updated };
  if (metaSystemUserTokenEncrypted !== undefined) {
    filePatch.meta_system_user_token_encrypted = metaSystemUserTokenEncrypted;
  }
  if (metaPageAccessTokenEncrypted !== undefined) {
    filePatch.meta_page_access_token_encrypted = metaPageAccessTokenEncrypted;
  }
  store.accounts[existing.clientId] = { ...prev, ...filePatch };
  writeFileStore(store);
  return rowToAccount(store.accounts[existing.clientId]);
}

async function setMetaSyncState(clientId, { metaSyncStatus, metaSyncError = null, metaLastSyncedAt = null } = {}) {
  const id = normalizeClientId(clientId);
  const existing = await getAccount(id);
  if (!existing) {
    const error = new Error('Account not found.');
    error.statusCode = 404;
    throw error;
  }

  const patch = {
    meta_sync_status: metaSyncStatus ?? existing.metaSyncStatus,
    meta_sync_error: metaSyncError,
    meta_last_synced_at: metaLastSyncedAt ?? existing.metaLastSyncedAt,
    updated_at: new Date().toISOString(),
  };

  if (usePostgres()) {
    await query`
      UPDATE accounts SET
        meta_sync_status = ${patch.meta_sync_status},
        meta_sync_error = ${patch.meta_sync_error},
        meta_last_synced_at = ${patch.meta_last_synced_at},
        updated_at = ${patch.updated_at}
      WHERE client_id = ${id}
    `;
  } else {
    const store = readFileStore();
    store.accounts[id] = { ...store.accounts[id], ...patch };
    writeFileStore(store);
  }

  return getAccount(id);
}

async function setMetricsModel(clientId, input = {}) {
  const existing = await getAccount(clientId);
  if (!existing) {
    const error = new Error('Account not found.');
    error.statusCode = 404;
    throw error;
  }

  const { dedupeEnabled, winPipelineId } = validateMetricsModelInput(input);
  const isFirstSetup = !existing.metricsModelSetAt;
  const isLockedChange = Boolean(existing.metricsModelLockedAt);

  if (isLockedChange) {
    if (input.confirmSlug !== existing.clientId) {
      const error = new Error('Type the client slug exactly to confirm this metrics model change.');
      error.statusCode = 400;
      throw error;
    }
    if (!input.acknowledgeImpact) {
      const error = new Error('Acknowledge that revenue and win metrics will change before continuing.');
      error.statusCode = 400;
      throw error;
    }
  }

  const now = new Date().toISOString();
  const nextVersion = isLockedChange
    ? (existing.metricsModelVersion || 1) + 1
    : (existing.metricsModelVersion || 1);

  const afterSalesPipelineId = dedupeEnabled
    ? (input.afterSalesPipelineId || existing.afterSalesPipelineId || winPipelineId)
    : existing.afterSalesPipelineId;

  const patch = {
    dedupe_enabled: dedupeEnabled,
    win_pipeline_id: winPipelineId,
    after_sales_pipeline_id: afterSalesPipelineId,
    metrics_model_set_at: existing.metricsModelSetAt || now,
    metrics_model_changed_at: isLockedChange ? now : (existing.metricsModelChangedAt || null),
    metrics_model_version: nextVersion,
    updated_at: now,
  };

  if (usePostgres()) {
    await query`
      UPDATE accounts SET
        dedupe_enabled = ${patch.dedupe_enabled},
        win_pipeline_id = ${patch.win_pipeline_id},
        after_sales_pipeline_id = ${patch.after_sales_pipeline_id},
        metrics_model_set_at = ${patch.metrics_model_set_at},
        metrics_model_changed_at = ${patch.metrics_model_changed_at},
        metrics_model_version = ${patch.metrics_model_version},
        updated_at = ${patch.updated_at}
      WHERE client_id = ${existing.clientId}
    `;
    const rows = await query`SELECT * FROM accounts WHERE client_id = ${existing.clientId} LIMIT 1`;
    return rowToAccount(rows[0]);
  }

  const store = readFileStore();
  const prev = store.accounts[existing.clientId];
  store.accounts[existing.clientId] = {
    ...prev,
    ...patch,
    after_sales_pipeline_id: patch.after_sales_pipeline_id ?? prev.after_sales_pipeline_id,
  };
  writeFileStore(store);
  return rowToAccount(store.accounts[existing.clientId]);
}

async function lockMetricsModelAfterFirstSync(clientId) {
  const existing = await getAccount(clientId);
  if (!existing?.metricsModelSetAt || existing.metricsModelLockedAt) {
    return existing;
  }

  const lockedAt = new Date().toISOString();
  if (usePostgres()) {
    await query`
      UPDATE accounts SET
        metrics_model_locked_at = ${lockedAt},
        updated_at = ${lockedAt}
      WHERE client_id = ${normalizeClientId(clientId)}
    `;
    const rows = await query`SELECT * FROM accounts WHERE client_id = ${normalizeClientId(clientId)} LIMIT 1`;
    return rowToAccount(rows[0]);
  }

  const store = readFileStore();
  const id = normalizeClientId(clientId);
  if (!store.accounts[id]) return null;
  store.accounts[id] = {
    ...store.accounts[id],
    metrics_model_locked_at: lockedAt,
    updated_at: lockedAt,
  };
  writeFileStore(store);
  return rowToAccount(store.accounts[id]);
}

async function deleteAccount(clientId) {
  const id = normalizeClientId(clientId);
  const existing = await getAccount(id);
  if (!existing) {
    const error = new Error('Account not found.');
    error.statusCode = 404;
    throw error;
  }

  if (usePostgres()) {
    await query`DELETE FROM accounts WHERE client_id = ${id}`;
  } else {
    const store = readFileStore();
    delete store.accounts[id];
    delete store.snapshots[id];
    store.syncRuns = (store.syncRuns || []).filter((run) => run.client_id !== id);
    writeFileStore(store);
  }

  return { deleted: true, clientId: id, accountName: existing.accountName };
}

async function getSnapshot(clientId) {
  const id = normalizeClientId(clientId);
  if (usePostgres()) {
    const rows = await query`SELECT * FROM sync_snapshots WHERE client_id = ${id} LIMIT 1`;
    const row = rows[0];
    if (!row) return null;
    return {
      client_id: row.client_id,
      fetched_at: row.fetched_at,
      opportunities: row.opportunities || [],
      pipelines: row.pipelines || [],
      users: row.users || [],
      contact_count: row.contact_count || 0,
      sync_status: row.sync_status,
      sync_error: row.sync_error,
    };
  }
  const store = readFileStore();
  return store.snapshots[id] || null;
}

async function upsertSnapshot(clientId, payload) {
  const id = normalizeClientId(clientId);
  const record = {
    client_id: id,
    fetched_at: payload.fetchedAt || new Date().toISOString(),
    opportunities: payload.opportunities || [],
    pipelines: payload.pipelines || [],
    users: payload.users || [],
    contact_count: payload.contactCount || 0,
    sync_status: payload.syncStatus || 'success',
    sync_error: payload.syncError || null,
  };

  if (usePostgres()) {
    await query`
      INSERT INTO sync_snapshots (
        client_id, fetched_at, opportunities, pipelines, users, contact_count, sync_status, sync_error
      ) VALUES (
        ${record.client_id}, ${record.fetched_at}, ${JSON.stringify(record.opportunities)}::jsonb,
        ${JSON.stringify(record.pipelines)}::jsonb, ${JSON.stringify(record.users)}::jsonb,
        ${record.contact_count}, ${record.sync_status}, ${record.sync_error}
      )
      ON CONFLICT (client_id) DO UPDATE SET
        fetched_at = EXCLUDED.fetched_at,
        opportunities = EXCLUDED.opportunities,
        pipelines = EXCLUDED.pipelines,
        users = EXCLUDED.users,
        contact_count = EXCLUDED.contact_count,
        sync_status = EXCLUDED.sync_status,
        sync_error = EXCLUDED.sync_error,
        sync_started_at = NULL
    `;
    return record;
  }

  const store = readFileStore();
  store.snapshots[id] = {
    ...(store.snapshots[id] || {}),
    ...record,
    sync_started_at: null,
  };
  writeFileStore(store);
  return store.snapshots[id];
}

async function setSyncState(clientId, { syncStatus, syncError = null }) {
  const id = normalizeClientId(clientId);
  const existing = await getSnapshot(id);
  const syncStartedAt = syncStatus === 'syncing' ? new Date().toISOString() : null;

  if (usePostgres()) {
    try {
      if (existing) {
        await query`
          UPDATE sync_snapshots
          SET
            sync_status = ${syncStatus},
            sync_error = ${syncError},
            sync_started_at = ${syncStartedAt}
          WHERE client_id = ${id}
        `;
      } else {
        await query`
          INSERT INTO sync_snapshots (client_id, sync_status, sync_error, sync_started_at)
          VALUES (${id}, ${syncStatus}, ${syncError}, ${syncStartedAt})
        `;
      }
    } catch (error) {
      if (!/sync_started_at/.test(String(error.message || ''))) {
        throw error;
      }
      if (existing) {
        await query`
          UPDATE sync_snapshots
          SET sync_status = ${syncStatus}, sync_error = ${syncError}
          WHERE client_id = ${id}
        `;
      } else {
        await query`
          INSERT INTO sync_snapshots (client_id, sync_status, sync_error)
          VALUES (${id}, ${syncStatus}, ${syncError})
        `;
      }
    }
    return {
      client_id: id,
      sync_status: syncStatus,
      sync_error: syncError,
      sync_started_at: syncStartedAt,
    };
  }

  const store = readFileStore();
  store.snapshots[id] = {
    ...(store.snapshots[id] || { client_id: id }),
    sync_status: syncStatus,
    sync_error: syncError,
    sync_started_at: syncStartedAt,
  };
  writeFileStore(store);
  return store.snapshots[id];
}

async function recoverStuckSyncStates(maxAgeMs = 10 * 60 * 1000) {
  const threshold = new Date(Date.now() - maxAgeMs).toISOString();
  let recovered = 0;

  async function recoverRow(clientId, startedAt) {
    if (!startedAt) {
      await setSyncState(clientId, { syncStatus: 'syncing', syncError: null });
      return;
    }
    if (startedAt > threshold) return;
    await setSyncState(clientId, {
      syncStatus: 'error',
      syncError: 'Background sync timed out. Click Sync again.',
    });
    recovered += 1;
  }

  try {
    if (usePostgres()) {
      const rows = await query`
        SELECT client_id, sync_started_at
        FROM sync_snapshots
        WHERE sync_status = 'syncing'
      `;
      for (const row of rows) {
        await recoverRow(row.client_id, row.sync_started_at);
      }
      return recovered;
    }
  } catch (error) {
    if (/sync_started_at/.test(String(error.message || ''))) {
      return recovered;
    }
    throw error;
  }

  const store = readFileStore();
  for (const [clientId, snapshot] of Object.entries(store.snapshots || {})) {
    if (snapshot.sync_status !== 'syncing') continue;
    await recoverRow(clientId, snapshot.sync_started_at);
  }
  return recovered;
}

async function logSyncRun(clientId, { status, errorMessage = null, opportunityCount = null, startedAt, finishedAt }) {
  const id = normalizeClientId(clientId);
  const entry = {
    client_id: id,
    started_at: startedAt || new Date().toISOString(),
    finished_at: finishedAt || new Date().toISOString(),
    status,
    error_message: errorMessage,
    opportunity_count: opportunityCount,
  };

  if (usePostgres()) {
    await query`
      INSERT INTO sync_runs (client_id, started_at, finished_at, status, error_message, opportunity_count)
      VALUES (${entry.client_id}, ${entry.started_at}, ${entry.finished_at}, ${entry.status}, ${entry.error_message}, ${entry.opportunity_count})
    `;
    return entry;
  }

  const store = readFileStore();
  store.syncRuns.push(entry);
  writeFileStore(store);
  return entry;
}

function getEnvBackedDefaults(clientId) {
  const id = normalizeClientId(clientId);
  return {
    clientId: id,
    accountName: id,
    locationId: DEFAULT_LOCATION_ID,
    timezone: DEFAULT_TIMEZONE,
    profitFieldId: DEFAULT_PROFIT_FIELD_ID,
    facebookClientId: process.env.DEFAULT_FACEBOOK_CLIENT_ID || id,
    defaultAdSpend: Number.isFinite(Number(process.env.CENHUB_AD_SPEND)) ? Number(process.env.CENHUB_AD_SPEND) : null,
    newLeadsPipelineId: process.env.CENHUB_NEW_LEADS_PIPELINE_ID || 'YIgoFK04OJCRlMkCIa0X',
    salesPipelineId: process.env.CENHUB_SALES_PIPELINE_ID || 'mHvsnX8pjfQMEEzAvdIx',
    afterSalesPipelineId: process.env.CENHUB_AFTER_SALES_PIPELINE_ID || 'YrKUKuQ1HlSQ1rZpeGex',
    winPipelineId: process.env.CENHUB_AFTER_SALES_PIPELINE_ID || 'YrKUKuQ1HlSQ1rZpeGex',
    dedupeEnabled: true,
    metricsModelSetAt: new Date().toISOString(),
    metricsModelLockedAt: null,
    metricsModelChangedAt: null,
    metricsModelVersion: 1,
    readyForGhl: false,
    hasGhlToken: Boolean(process.env.CENHUB_PRIVATE_INTEGRATION_TOKEN || process.env.GHL_PRIVATE_INTEGRATION_TOKEN),
    ghlToken: process.env.CENHUB_PRIVATE_INTEGRATION_TOKEN || process.env.GHL_PRIVATE_INTEGRATION_TOKEN || '',
    adminUrl: `/${id}`,
  };
}

module.exports = {
  DEFAULT_ACCOUNT_ID,
  RESERVED_SLUGS,
  checkSlugAvailable,
  computeAccountStatus,
  createAccount,
  deleteAccount,
  getAccount,
  getEnvBackedDefaults,
  getPipelineMode,
  getSnapshot,
  isValidSlug,
  listAccounts,
  listClientIds,
  listMetaSyncableClientIds,
  logSyncRun,
  normalizeMetaAdAccountId,
  resolveMetaSystemUserToken,
  setMetaSyncState,
  lockMetricsModelAfterFirstSync,
  normalizeClientId,
  recoverStuckSyncStates,
  setMetricsModel,
  setSyncState,
  suggestSlugFromName,
  toPublicSummary,
  updateAccount,
  upsertSnapshot,
};
