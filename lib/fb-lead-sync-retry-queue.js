const fs = require('fs');
const path = require('path');
const { query, usePostgres } = require('./db');
const { normalizeClientId } = require('./account-store');
const { syncFbLeadIdForContact } = require('./meta-lead-ghl-sync');

const DATA_FILE = path.join(__dirname, '..', '.data', 'fb-lead-sync-retries.json');
const DEFAULT_MAX_ATTEMPTS = 4;
const DEFAULT_PROCESS_LIMIT = 20;
let retriesTableEnsured = false;

function isMissingRetriesTableError(error) {
  const message = String(error?.message || error || '').toLowerCase();
  return /fb_lead_sync_retries/.test(message)
    && (/does not exist|relation/.test(message) || /undefined_table/.test(message));
}

async function ensureFbLeadSyncRetriesTable() {
  if (!usePostgres() || retriesTableEnsured) return;

  await query`
    CREATE TABLE IF NOT EXISTS fb_lead_sync_retries (
      id BIGSERIAL PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES accounts (client_id) ON DELETE CASCADE,
      contact_id TEXT NOT NULL,
      opportunity_id TEXT,
      trigger_source TEXT NOT NULL DEFAULT 'ghl-webhook',
      attempt INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 4,
      next_retry_at TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      last_status TEXT,
      last_error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (client_id, contact_id)
    )
  `;
  await query`
    CREATE INDEX IF NOT EXISTS fb_lead_sync_retries_pending_next_idx
      ON fb_lead_sync_retries (next_retry_at)
      WHERE status = 'pending'
  `;
  retriesTableEnsured = true;
}

function parseRetryMinutes() {
  const raw = String(process.env.FB_LEAD_SYNC_RETRY_MINUTES || '5,15,30,60').trim();
  const values = raw.split(',').map((part) => Number.parseInt(part.trim(), 10)).filter(Number.isFinite);
  return values.length ? values : [5, 15, 30, 60];
}

function getRetryScheduleMinutes() {
  return parseRetryMinutes();
}

function computeNextRetryAt(attempt, fromDate = new Date()) {
  const schedule = getRetryScheduleMinutes();
  const index = Math.max(0, Math.min(attempt - 1, schedule.length - 1));
  const minutes = schedule[index];
  return new Date(fromDate.getTime() + minutes * 60 * 1000).toISOString();
}

function rowToRetry(row) {
  return {
    id: Number(row.id),
    clientId: row.client_id,
    contactId: row.contact_id,
    opportunityId: row.opportunity_id || null,
    triggerSource: row.trigger_source || 'ghl-webhook',
    attempt: Number(row.attempt) || 0,
    maxAttempts: Number(row.max_attempts) || DEFAULT_MAX_ATTEMPTS,
    nextRetryAt: row.next_retry_at,
    status: row.status || 'pending',
    lastStatus: row.last_status || null,
    lastError: row.last_error || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function readLocalRetries() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return Array.isArray(parsed.retries) ? parsed.retries : [];
  } catch {
    return [];
  }
}

function writeLocalRetries(retries) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify({ retries }, null, 2));
}

async function enqueueFbLeadSyncRetry({
  clientId,
  contactId,
  opportunityId = null,
  attempt = 1,
  nextRetryAt = null,
  triggerSource = 'ghl-webhook',
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
} = {}) {
  const id = normalizeClientId(clientId);
  const contact = String(contactId || '').trim();
  if (!id || !contact) {
    throw new Error('clientId and contactId are required for FB lead sync retry.');
  }

  const nextAt = nextRetryAt || computeNextRetryAt(attempt);
  const now = new Date().toISOString();

  if (usePostgres()) {
    await ensureFbLeadSyncRetriesTable();
    const rows = await query`
      INSERT INTO fb_lead_sync_retries (
        client_id, contact_id, opportunity_id, trigger_source,
        attempt, max_attempts, next_retry_at, status, updated_at
      )
      VALUES (
        ${id}, ${contact}, ${opportunityId}, ${triggerSource},
        ${attempt}, ${maxAttempts}, ${nextAt}, 'pending', NOW()
      )
      ON CONFLICT (client_id, contact_id) DO UPDATE SET
        opportunity_id = COALESCE(EXCLUDED.opportunity_id, fb_lead_sync_retries.opportunity_id),
        trigger_source = EXCLUDED.trigger_source,
        attempt = EXCLUDED.attempt,
        max_attempts = EXCLUDED.max_attempts,
        next_retry_at = EXCLUDED.next_retry_at,
        status = CASE
          WHEN fb_lead_sync_retries.status = 'done' THEN fb_lead_sync_retries.status
          ELSE 'pending'
        END,
        last_status = fb_lead_sync_retries.last_status,
        last_error = fb_lead_sync_retries.last_error,
        updated_at = NOW()
      RETURNING *
    `;
    return rowToRetry(rows[0]);
  }

  const retries = readLocalRetries();
  const index = retries.findIndex((row) => row.client_id === id && row.contact_id === contact);
  const entry = {
    id: index >= 0 ? retries[index].id : retries.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0) + 1,
    client_id: id,
    contact_id: contact,
    opportunity_id: opportunityId,
    trigger_source: triggerSource,
    attempt,
    max_attempts: maxAttempts,
    next_retry_at: nextAt,
    status: index >= 0 && retries[index].status === 'done' ? 'done' : 'pending',
    last_status: index >= 0 ? retries[index].last_status : null,
    last_error: index >= 0 ? retries[index].last_error : null,
    created_at: index >= 0 ? retries[index].created_at : now,
    updated_at: now,
  };
  if (index >= 0) retries[index] = entry;
  else retries.push(entry);
  writeLocalRetries(retries);
  return rowToRetry(entry);
}

async function cancelFbLeadSyncRetry(clientId, contactId) {
  const id = normalizeClientId(clientId);
  const contact = String(contactId || '').trim();
  if (!id || !contact) return { cancelled: 0 };

  if (usePostgres()) {
    await ensureFbLeadSyncRetriesTable();
    const rows = await query`
      UPDATE fb_lead_sync_retries
      SET status = 'done', last_status = 'updated', updated_at = NOW()
      WHERE client_id = ${id} AND contact_id = ${contact} AND status = 'pending'
      RETURNING id
    `;
    return { cancelled: rows.length };
  }

  const retries = readLocalRetries();
  let cancelled = 0;
  for (const row of retries) {
    if (row.client_id === id && row.contact_id === contact && row.status === 'pending') {
      row.status = 'done';
      row.last_status = 'updated';
      row.updated_at = new Date().toISOString();
      cancelled += 1;
    }
  }
  if (cancelled) writeLocalRetries(retries);
  return { cancelled };
}

async function markFbLeadSyncRetryResult(retryRow, outcome) {
  const done = outcome.updated > 0
    || outcome.status === 'already_has_id'
    || outcome.status === 'already_correct'
    || outcome.status === 'already_has_different_id'
    || outcome.status === 'no_email_or_phone'
    || outcome.status === 'disabled'
    || outcome.status === 'not_configured'
    || outcome.status === 'not_ready'
    || outcome.status === 'field_missing';

  if (done) {
    await cancelFbLeadSyncRetry(retryRow.clientId, retryRow.contactId);
    return { status: 'done', outcome };
  }

  const nextAttempt = (retryRow.attempt || 0) + 1;
  if (nextAttempt > (retryRow.maxAttempts || DEFAULT_MAX_ATTEMPTS)) {
    if (usePostgres()) {
      await query`
        UPDATE fb_lead_sync_retries
        SET status = 'failed',
            last_status = ${outcome.status || 'failed'},
            last_error = ${outcome.error || null},
            updated_at = NOW()
        WHERE id = ${retryRow.id}
      `;
    } else {
      const retries = readLocalRetries();
      const row = retries.find((entry) => Number(entry.id) === Number(retryRow.id));
      if (row) {
        row.status = 'failed';
        row.last_status = outcome.status || 'failed';
        row.last_error = outcome.error || null;
        row.updated_at = new Date().toISOString();
        writeLocalRetries(retries);
      }
    }
    return { status: 'failed', outcome };
  }

  const nextRetryAt = computeNextRetryAt(nextAttempt);
  if (usePostgres()) {
    await query`
      UPDATE fb_lead_sync_retries
      SET attempt = ${nextAttempt},
          next_retry_at = ${nextRetryAt},
          last_status = ${outcome.status || null},
          last_error = ${outcome.error || null},
          status = 'pending',
          updated_at = NOW()
      WHERE id = ${retryRow.id}
    `;
  } else {
    const retries = readLocalRetries();
    const row = retries.find((entry) => Number(entry.id) === Number(retryRow.id));
    if (row) {
      row.attempt = nextAttempt;
      row.next_retry_at = nextRetryAt;
      row.last_status = outcome.status || null;
      row.last_error = outcome.error || null;
      row.status = 'pending';
      row.updated_at = new Date().toISOString();
      writeLocalRetries(retries);
    }
  }
  return { status: 'pending', nextAttempt, nextRetryAt, outcome };
}

async function listDueFbLeadSyncRetries({ limit = DEFAULT_PROCESS_LIMIT } = {}) {
  const capped = Math.max(1, Math.min(Number(limit) || DEFAULT_PROCESS_LIMIT, 100));
  const now = new Date().toISOString();

  if (usePostgres()) {
    await ensureFbLeadSyncRetriesTable();
    const rows = await query`
      SELECT *
      FROM fb_lead_sync_retries
      WHERE status = 'pending'
        AND next_retry_at <= ${now}
      ORDER BY next_retry_at ASC
      LIMIT ${capped}
    `;
    return rows.map(rowToRetry);
  }

  return readLocalRetries()
    .filter((row) => row.status === 'pending' && String(row.next_retry_at || '') <= now)
    .sort((a, b) => String(a.next_retry_at).localeCompare(String(b.next_retry_at)))
    .slice(0, capped)
    .map(rowToRetry);
}

async function processDueFbLeadSyncRetries({ limit = DEFAULT_PROCESS_LIMIT } = {}) {
  if (usePostgres()) {
    await ensureFbLeadSyncRetriesTable();
  }
  const due = await listDueFbLeadSyncRetries({ limit });
  const results = [];
  let updated = 0;
  let failed = 0;
  let stillPending = 0;

  for (const retryRow of due) {
    try {
      const outcome = await syncFbLeadIdForContact(retryRow.clientId, retryRow.contactId, {
        source: 'fb-lead-retry',
        logHistory: true,
      });
      const mark = await markFbLeadSyncRetryResult(retryRow, outcome);
      if (outcome.updated > 0) updated += 1;
      if (mark.status === 'failed') failed += 1;
      if (mark.status === 'pending') stillPending += 1;
      results.push({ retryId: retryRow.id, clientId: retryRow.clientId, contactId: retryRow.contactId, mark, outcome });
    } catch (error) {
      failed += 1;
      const mark = await markFbLeadSyncRetryResult(retryRow, {
        status: 'error',
        updated: 0,
        error: error.message,
        retryable: true,
      });
      if (mark.status === 'pending') stillPending += 1;
      results.push({
        retryId: retryRow.id,
        clientId: retryRow.clientId,
        contactId: retryRow.contactId,
        mark,
        error: error.message,
      });
    }
  }

  return {
    processed: due.length,
    updated,
    failed,
    stillPending,
    results,
  };
}

module.exports = {
  DEFAULT_MAX_ATTEMPTS,
  DEFAULT_PROCESS_LIMIT,
  computeNextRetryAt,
  enqueueFbLeadSyncRetry,
  cancelFbLeadSyncRetry,
  getRetryScheduleMinutes,
  listDueFbLeadSyncRetries,
  markFbLeadSyncRetryResult,
  processDueFbLeadSyncRetries,
};
