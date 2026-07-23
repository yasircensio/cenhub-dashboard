const { getAccount } = require('./account-store');
const { resolveMetaAccessToken } = require('./meta-token');
const { fetchMetaLeads } = require('../scripts/fetch-meta-leads');
const {
  createFbLeadSyncRun,
  finishFbLeadSyncRun,
  getFbLeadSyncRun,
  getFbLeadSyncLeadsCache,
  updateFbLeadSyncRun,
} = require('./fb-lead-sync-history');

const API_BASE = 'https://services.leadconnectorhq.com';
const API_VERSION = '2021-07-28';
const DEFAULT_FB_LEAD_FIELD_ID = process.env.GHL_FB_LEAD_FIELD_ID || 'EbtgGgyZr0GJ4ghuNXUB';
const FB_LEAD_FIELD_NAME = 'Fb Lead id';
const FB_LEAD_FIELD_KEY = 'contact.fb_lead_id';
const DEFAULT_SYNC_DAYS = Number(process.env.FB_LEAD_SYNC_DAYS || 2);
const BACKFILL_DAYS = 90;
const DEFAULT_BATCH_LIMIT = Number(process.env.FB_LEAD_SYNC_BATCH_LIMIT || 25);
const PREVIEW_BATCH_LIMIT = Number(process.env.FB_LEAD_SYNC_PREVIEW_BATCH || 12);
const APPLY_BATCH_LIMIT = Number(process.env.FB_LEAD_SYNC_APPLY_BATCH || 10);
const GHL_RETRY_ATTEMPTS = 3;
const PREFLIGHT_SAMPLE_SIZE = 20;

const SYNC_MODES = {
  recent: { days: DEFAULT_SYNC_DAYS, label: 'recent' },
  backfill: { days: BACKFILL_DAYS, label: 'backfill' },
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.length > 8 ? digits.slice(-8) : digits;
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function resolveModeOptions(mode) {
  const key = SYNC_MODES[mode] ? mode : 'recent';
  return { mode: key, days: SYNC_MODES[key].days };
}

function resolveFbLeadFieldId(account) {
  return account?.ghlFbLeadFieldId
    || process.env.GHL_FB_LEAD_FIELD_ID
    || DEFAULT_FB_LEAD_FIELD_ID;
}

function normalizeFieldLabel(value) {
  return String(value || '').trim().toLowerCase();
}

function isFbLeadFieldDefinition(field) {
  if (!field) return false;
  const name = normalizeFieldLabel(field.name);
  const key = String(field.fieldKey || '').toLowerCase();
  return name === normalizeFieldLabel(FB_LEAD_FIELD_NAME)
    || key === FB_LEAD_FIELD_KEY
    || key.endsWith('.fb_lead_id');
}

function findFbLeadFieldDefinition(definitions, preferredFieldId = null) {
  const fields = Array.isArray(definitions) ? definitions : [];
  if (preferredFieldId) {
    const byId = fields.find((field) => field.id === preferredFieldId);
    if (byId) return byId;
  }
  return fields.find(isFbLeadFieldDefinition) || null;
}

async function fetchContactCustomFieldDefinitions(token, locationId) {
  const data = await ghlRequest(token, 'GET', `/locations/${locationId}/customFields?model=contact`);
  return data.customFields || [];
}

async function verifyFbLeadCustomField(account, { fieldIdOverride = null } = {}) {
  const configuredFieldId = fieldIdOverride || resolveFbLeadFieldId(account);
  const result = {
    configuredFieldId,
    fieldExists: false,
    fieldId: configuredFieldId,
    fieldName: null,
    fieldKey: null,
    missing: true,
    error: null,
    hint: `Create a contact custom field named "${FB_LEAD_FIELD_NAME}" in GHL (Settings → Custom Fields → Contact), then click Refresh on this page.`,
  };

  if (!account?.ghlToken || !account?.locationId) {
    result.error = 'Missing GHL token or location.';
    return result;
  }

  try {
    const definitions = await fetchContactCustomFieldDefinitions(account.ghlToken, account.locationId);
    const match = findFbLeadFieldDefinition(definitions, configuredFieldId);
    if (match) {
      result.fieldExists = true;
      result.missing = false;
      result.fieldId = match.id;
      result.fieldName = match.name || FB_LEAD_FIELD_NAME;
      result.fieldKey = match.fieldKey || null;
      result.hint = null;
    }
  } catch (error) {
    result.error = error.message;
  }

  return result;
}

function parseFieldData(fieldData = []) {
  const out = {};
  for (const row of fieldData) {
    const key = String(row.name || '').toLowerCase();
    const val = row.values?.[0];
    if (val != null && val !== '') out[key] = String(val).trim();
  }
  const email = out.email
    || out.work_email
    || out.workemail
    || out.e_mail
    || out['e-mail']
    || '';
  const phone = out.phone || out.phone_number || out.mobile || out.telefon || '';
  const name = out.full_name || out.fullname || out.name || '';
  return { email, phone, name, raw: out };
}

function getFbLeadIdFromContact(contact, fieldId) {
  const fields = contact.customFields || contact.customField || [];
  const match = fields.find((f) => f.id === fieldId || f.fieldKey === 'contact.fb_lead_id');
  if (!match) return '';
  return String(
    match.value
    ?? match.fieldValue
    ?? match.fieldValueString
    ?? match.field_value
    ?? '',
  ).trim();
}

function isRetryableGhlError(error) {
  const message = String(error?.message || error || '').toLowerCase();
  return /fetch failed|timeout|timed out|econnreset|network|429|502|503|504|rate limit/.test(message);
}

async function sleepMs(ms) {
  return sleep(ms);
}

async function ghlRequest(token, method, path, body, { attempt = 1 } = {}) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Version: API_VERSION,
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    let json = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = { raw: text };
    }
    if (!response.ok) {
      const err = new Error(`GHL ${method} ${path} → ${response.status}: ${json.message || text.slice(0, 200)}`);
      err.statusCode = response.status;
      throw err;
    }
    return json;
  } catch (error) {
    if (attempt < GHL_RETRY_ATTEMPTS && isRetryableGhlError(error)) {
      await sleepMs(400 * attempt);
      return ghlRequest(token, method, path, body, { attempt: attempt + 1 });
    }
    throw error;
  }
}

async function searchContact(token, locationId, { email, phone }) {
  const normalizedEmail = normalizeEmail(email);
  if (normalizedEmail) {
    const byEmail = await ghlRequest(token, 'POST', '/contacts/search', {
      locationId,
      pageLimit: 5,
      filters: [{ field: 'email', operator: 'eq', value: normalizedEmail }],
    });
    const hit = (byEmail.contacts || [])[0];
    if (hit) return hit;
  }

  if (phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits) {
      const byPhone = await ghlRequest(token, 'POST', '/contacts/search', {
        locationId,
        pageLimit: 5,
        filters: [{ field: 'phone', operator: 'contains', value: digits.slice(-8) }],
      });
      const hit = (byPhone.contacts || []).find((c) =>
        normalizePhone(c.phone) === normalizePhone(phone)
        || String(c.phone || '').replace(/\D/g, '').endsWith(digits.slice(-8)),
      ) || (byPhone.contacts || [])[0];
      if (hit) return hit;
    }
  }

  return null;
}

async function updateContactFbLeadId(token, contactId, fieldId, leadId) {
  return ghlRequest(token, 'PUT', `/contacts/${contactId}`, {
    customFields: [{ id: fieldId, value: String(leadId) }],
  });
}

function filterLeadsByDays(leads, days) {
  if (!days || days <= 0) return leads;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return leads.filter((lead) => {
    const created = Date.parse(lead.created_time || '');
    return Number.isFinite(created) && created >= cutoff;
  });
}

function buildReadiness(account) {
  const metaToken = Boolean(String(account?.metaPageAccessToken || '').trim())
    || Boolean(resolveMetaAccessToken(account).token);
  return {
    metaPageId: Boolean(account?.metaPageId),
    ghlToken: Boolean(account?.ghlToken),
    locationId: Boolean(account?.locationId),
    metaToken,
    fieldId: Boolean(resolveFbLeadFieldId(account)),
    ready: Boolean(
      account?.metaPageId
      && account?.ghlToken
      && account?.locationId
      && metaToken
      && resolveFbLeadFieldId(account),
    ),
  };
}

async function evaluateLeadMatch(account, lead, { fbLeadFieldId, dryRun, force }) {
  const { email, phone, name } = parseFieldData(lead.field_data);
  const row = {
    metaLeadId: lead.id,
    created_time: lead.created_time,
    formId: lead.formId,
    formName: lead.formName,
    email,
    phone,
    name,
    status: 'pending',
  };

  if (!email && !phone) {
    row.status = 'no_email_or_phone';
    return { row, updated: 0, skippedHasId: 0, skippedNoMatch: 1, errors: 0 };
  }

  const contact = await searchContact(account.ghlToken, account.locationId, { email, phone });
  if (!contact?.id) {
    row.status = 'ghl_contact_not_found';
    return { row, updated: 0, skippedHasId: 0, skippedNoMatch: 1, errors: 0 };
  }

  row.contactId = contact.id;
  row.contactName = contact.name || contact.contactName || name;

  const full = await ghlRequest(account.ghlToken, 'GET', `/contacts/${contact.id}`);
  const existing = getFbLeadIdFromContact(full.contact || full, fbLeadFieldId);
  row.existingFbLeadId = existing || null;

  if (existing === String(lead.id)) {
    row.status = 'already_correct';
    return { row, updated: 0, skippedHasId: 1, skippedNoMatch: 0, errors: 0 };
  }

  if (existing && !force) {
    row.status = 'already_has_different_id';
    return { row, updated: 0, skippedHasId: 1, skippedNoMatch: 0, errors: 0 };
  }

  if (dryRun) {
    row.status = 'would_update';
    return { row, updated: 1, skippedHasId: 0, skippedNoMatch: 0, errors: 0 };
  }

  await updateContactFbLeadId(account.ghlToken, contact.id, fbLeadFieldId, lead.id);
  const verified = await ghlRequest(account.ghlToken, 'GET', `/contacts/${contact.id}`);
  const written = getFbLeadIdFromContact(verified.contact || verified, fbLeadFieldId);
  if (written !== String(lead.id)) {
    row.status = 'error';
    row.error = written
      ? `GHL stored "${written}" instead of Meta lead id ${lead.id}. Check the Fb Lead id custom field.`
      : 'GHL did not persist Fb Lead id after update.';
    return { row, updated: 0, skippedHasId: 0, skippedNoMatch: 0, errors: 1 };
  }
  row.status = 'updated';
  return { row, updated: 1, skippedHasId: 0, skippedNoMatch: 0, errors: 0 };
}

async function getFbLeadSyncPreflight(clientId, { quick = false } = {}) {
  const account = await getAccount(clientId, { includeSecrets: true });
  if (!account) {
    const error = new Error('Account not found.');
    error.statusCode = 404;
    throw error;
  }

  const readiness = buildReadiness(account);
  const fieldCheck = account?.ghlToken && account?.locationId
    ? await verifyFbLeadCustomField(account)
    : {
      fieldExists: false,
      missing: true,
      fieldId: resolveFbLeadFieldId(account),
      hint: `Connect GHL and create a contact custom field named "${FB_LEAD_FIELD_NAME}".`,
    };
  readiness.fieldId = fieldCheck.fieldExists;
  readiness.ready = readiness.ready && fieldCheck.fieldExists;

  const result = {
    clientId: account.clientId,
    accountName: account.accountName,
    fbLeadSyncEnabled: account.fbLeadSyncEnabled,
    fbLeadFieldId: fieldCheck.fieldId,
    fbLeadFieldExists: fieldCheck.fieldExists,
    fbLeadFieldMissing: fieldCheck.missing,
    fbLeadFieldName: fieldCheck.fieldName,
    fbLeadFieldHint: fieldCheck.hint,
    readiness,
    metaLeadCount90d: null,
    estimatedMissing: null,
    sampleSize: 0,
    sampleWouldUpdate: 0,
    metaWindowNote: 'Meta only stores Lead Ads for roughly the last 90 days.',
  };

  if (!readiness.ready) {
    if (fieldCheck.missing && account?.ghlToken && account?.locationId) {
      result.preflightError = `GHL custom field "${FB_LEAD_FIELD_NAME}" not found for this sub-account.`;
    }
    return result;
  }

  if (quick) {
    return result;
  }

  const fbLeadFieldId = fieldCheck.fieldId;

  try {
    const meta = await fetchMetaLeads(clientId, { withFields: true });
    const leads90 = filterLeadsByDays(meta.leads, BACKFILL_DAYS);
    result.metaLeadCount90d = leads90.length;

    const sample = leads90.slice(0, PREFLIGHT_SAMPLE_SIZE);
    result.sampleSize = sample.length;
    let wouldUpdate = 0;

    for (const lead of sample) {
      try {
        const outcome = await evaluateLeadMatch(account, lead, {
          fbLeadFieldId,
          dryRun: true,
          force: false,
        });
        if (outcome.row.status === 'would_update') wouldUpdate += 1;
        await sleep(80);
      } catch {
        // ignore sample errors
      }
    }

    result.sampleWouldUpdate = wouldUpdate;
    result.estimatedMissing = sample.length
      ? Math.round((wouldUpdate / sample.length) * leads90.length)
      : 0;
  } catch (error) {
    result.preflightError = error.message;
  }

  return result;
}

async function prepareFbLeadSyncRun(clientId, {
  mode = 'recent',
  days: daysOverride,
  dryRun = false,
  runId = null,
  source = 'admin',
  logHistory = true,
} = {}) {
  const account = await getAccount(clientId, { includeSecrets: true });
  if (!account?.ghlToken || !account.locationId) {
    throw new Error(`Missing GHL token or locationId for "${clientId}".`);
  }
  if (!account.metaPageId) {
    throw new Error(`Missing metaPageId for "${clientId}".`);
  }

  const { mode: resolvedMode, days: modeDays } = resolveModeOptions(mode);
  const days = daysOverride != null ? Number(daysOverride) : modeDays;
  const fieldCheck = await verifyFbLeadCustomField(account);
  if (fieldCheck.missing) {
    throw new Error(
      `GHL custom field "${FB_LEAD_FIELD_NAME}" was not found in this sub-account. `
      + fieldCheck.hint,
    );
  }

  let activeRunId = runId;
  if (activeRunId) {
    const existingRun = await getFbLeadSyncRun(activeRunId);
    if (existingRun.clientId !== account.clientId) {
      throw new Error('Run does not belong to this client.');
    }
    const cached = await getFbLeadSyncLeadsCache(activeRunId);
    if (cached?.leads?.length) {
      return {
        runId: activeRunId,
        clientId,
        mode: resolvedMode,
        days,
        dryRun,
        prepared: true,
        cached: true,
        metaLeadCount: cached.metaLeadCount ?? cached.leads.length,
        inWindow: cached.leads.length,
        batchOffset: 0,
        nextBatchOffset: 0,
        batchProcessed: 0,
        hasMore: cached.leads.length > 0,
      };
    }
  } else if (logHistory) {
    const created = await createFbLeadSyncRun({
      clientId,
      mode: resolvedMode,
      days,
      dryRun,
      source,
      batchLimit: dryRun ? PREVIEW_BATCH_LIMIT : APPLY_BATCH_LIMIT,
    });
    activeRunId = created.id;
  }

  const meta = await fetchMetaLeads(clientId, { withFields: true });
  const metaLeadCount = meta.leadCount;
  const allInWindow = filterLeadsByDays(meta.leads, days);

  if (activeRunId) {
    await updateFbLeadSyncRun(activeRunId, {
      leadsCache: { metaLeadCount, leads: allInWindow },
      metaLeadCount,
      inWindow: allInWindow.length,
      batchOffset: 0,
      hasMore: allInWindow.length > 0,
      status: 'running',
      finishedAt: null,
      errorMessage: null,
    });
  }

  return {
    runId: activeRunId,
    clientId,
    locationId: account.locationId,
    metaPageId: account.metaPageId,
    fbLeadFieldId: fieldCheck.fieldId,
    mode: resolvedMode,
    days,
    dryRun,
    prepared: true,
    cached: false,
    metaLeadCount,
    inWindow: allInWindow.length,
    batchOffset: 0,
    nextBatchOffset: 0,
    batchProcessed: 0,
    hasMore: allInWindow.length > 0,
    updated: 0,
    skippedHasId: 0,
    skippedNoMatch: 0,
    errors: 0,
    rows: [],
  };
}

async function syncMetaLeadIdsToGhl(clientId, {
  mode = 'recent',
  days: daysOverride,
  dryRun = false,
  force = false,
  fbLeadFieldId: fieldOverride,
  offset = 0,
  limit = DEFAULT_BATCH_LIMIT,
  runId = null,
  previewRunId = null,
  source = 'unknown',
  logHistory = true,
} = {}) {
  const account = await getAccount(clientId, { includeSecrets: true });
  if (!account?.ghlToken || !account.locationId) {
    throw new Error(`Missing GHL token or locationId for "${clientId}".`);
  }
  if (!account.metaPageId) {
    throw new Error(`Missing metaPageId for "${clientId}".`);
  }

  const { mode: resolvedMode, days: modeDays } = resolveModeOptions(mode);
  const days = daysOverride != null ? Number(daysOverride) : modeDays;
  const fieldCheck = await verifyFbLeadCustomField(account, { fieldIdOverride: fieldOverride });
  if (fieldCheck.missing) {
    throw new Error(
      `GHL custom field "${FB_LEAD_FIELD_NAME}" was not found in this sub-account. `
      + fieldCheck.hint,
    );
  }
  const fbLeadFieldId = fieldCheck.fieldId;
  const batchOffset = Math.max(0, Number(offset) || 0);
  const batchLimit = Math.max(1, Number(limit) || DEFAULT_BATCH_LIMIT);

  let activeRunId = runId;
  let existingRun = null;
  if (activeRunId) {
    existingRun = await getFbLeadSyncRun(activeRunId);
    if (existingRun.clientId !== account.clientId) {
      throw new Error('Run does not belong to this client.');
    }
    if (!dryRun && existingRun.dryRun) {
      activeRunId = null;
      existingRun = null;
    } else if (existingRun && existingRun.dryRun === dryRun) {
      const resumeStatus = String(existingRun.status || '').toLowerCase();
      if (resumeStatus === 'interrupted' || resumeStatus === 'error' || resumeStatus === 'running') {
        await updateFbLeadSyncRun(activeRunId, {
          status: 'running',
          finishedAt: null,
          errorMessage: null,
          hasMore: true,
        });
      }
    }
  } else if (logHistory) {
    const created = await createFbLeadSyncRun({
      clientId,
      mode: resolvedMode,
      days,
      dryRun,
      source,
      batchLimit,
    });
    activeRunId = created.id;
  }

  let metaLeadCount = null;
  let allInWindow = null;
  let cached = activeRunId ? await getFbLeadSyncLeadsCache(activeRunId) : null;
  if (!cached?.leads?.length && previewRunId) {
    cached = await getFbLeadSyncLeadsCache(previewRunId);
  }
  if (cached?.leads?.length) {
    allInWindow = cached.leads;
    metaLeadCount = cached.metaLeadCount ?? cached.leads.length;
    if (activeRunId && batchOffset === 0 && !dryRun) {
      await updateFbLeadSyncRun(activeRunId, {
        leadsCache: { metaLeadCount, leads: allInWindow },
        metaLeadCount,
        inWindow: allInWindow.length,
      });
    }
  } else if (batchOffset === 0) {
    const meta = await fetchMetaLeads(clientId, { withFields: true });
    metaLeadCount = meta.leadCount;
    allInWindow = filterLeadsByDays(meta.leads, days);
    if (activeRunId && allInWindow.length) {
      await updateFbLeadSyncRun(activeRunId, {
        leadsCache: { metaLeadCount, leads: allInWindow },
        metaLeadCount,
        inWindow: allInWindow.length,
      });
    }
  } else {
    throw new Error(
      'Sync lead cache is missing for this run. Click Preview again, or use Resume if the run was interrupted.',
    );
  }

  const batchLeads = allInWindow.slice(batchOffset, batchOffset + batchLimit);
  const nextBatchOffset = batchOffset + batchLeads.length;
  const hasMore = nextBatchOffset < allInWindow.length;

  const summary = {
    runId: activeRunId,
    clientId,
    locationId: account.locationId,
    metaPageId: account.metaPageId,
    fbLeadFieldId,
    mode: resolvedMode,
    days,
    dryRun,
    source,
    metaLeadCount,
    inWindow: allInWindow.length,
    batchOffset,
    nextBatchOffset,
    batchLimit,
    batchProcessed: batchLeads.length,
    hasMore,
    updated: existingRun?.updated || 0,
    skippedHasId: existingRun?.skippedHasId || 0,
    skippedNoMatch: existingRun?.skippedNoMatch || 0,
    errors: existingRun?.errors || 0,
    rows: [],
  };

  for (const lead of batchLeads) {
    try {
      const outcome = await evaluateLeadMatch(account, lead, { fbLeadFieldId, dryRun, force });
      summary.rows.push(outcome.row);
      summary.updated += outcome.updated;
      summary.skippedHasId += outcome.skippedHasId;
      summary.skippedNoMatch += outcome.skippedNoMatch;
      summary.errors += outcome.errors;
      await sleep(dryRun ? 50 : 120);
    } catch (error) {
      const { email, phone, name } = parseFieldData(lead.field_data);
      summary.rows.push({
        metaLeadId: lead.id,
        created_time: lead.created_time,
        email,
        phone,
        name,
        status: 'error',
        error: error.message,
      });
      summary.errors += 1;
      await sleep(200);
    }
  }

  if (logHistory && activeRunId) {
    await updateFbLeadSyncRun(activeRunId, {
      metaLeadCount: summary.metaLeadCount,
      inWindow: summary.inWindow,
      updated: summary.updated,
      skippedHasId: summary.skippedHasId,
      skippedNoMatch: summary.skippedNoMatch,
      errors: summary.errors,
      batchOffset: nextBatchOffset,
      batchLimit,
      hasMore,
      appendRows: summary.rows.filter((row) =>
        row.status === 'updated'
        || row.status === 'would_update'
        || row.status === 'error',
      ),
      status: hasMore
        ? 'running'
        : (summary.errors > 0 && summary.updated === 0 && summary.skippedHasId === 0 && summary.skippedNoMatch === 0
          ? 'error'
          : 'success'),
      finishedAt: hasMore ? null : new Date().toISOString(),
      errorMessage: !hasMore && summary.errors > 0
        ? `${summary.errors} contact(s) had errors — expand Audit for details.`
        : null,
    });
  }

  return summary;
}

module.exports = {
  BACKFILL_DAYS,
  DEFAULT_BATCH_LIMIT,
  PREVIEW_BATCH_LIMIT,
  APPLY_BATCH_LIMIT,
  DEFAULT_FB_LEAD_FIELD_ID,
  DEFAULT_SYNC_DAYS,
  FB_LEAD_FIELD_NAME,
  SYNC_MODES,
  buildReadiness,
  filterLeadsByDays,
  findFbLeadFieldDefinition,
  getFbLeadSyncPreflight,
  isFbLeadFieldDefinition,
  parseFieldData,
  resolveFbLeadFieldId,
  resolveModeOptions,
  prepareFbLeadSyncRun,
  syncMetaLeadIdsToGhl,
  verifyFbLeadCustomField,
};
