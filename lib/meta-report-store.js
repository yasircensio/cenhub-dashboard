const fs = require('fs');
const path = require('path');
const { query, usePostgres } = require('./db');
const {
  getAccount,
  listClientIds,
  normalizeClientId,
  resolveMetaSystemUserToken,
} = require('./account-store');
const { generateReportAccessToken } = require('./report-access');
const {
  getCurrentMonthKey,
  monthBoundsIso,
} = require('./marketing-metrics');

const DATA_FILE = path.join(__dirname, '..', '.data', 'meta-reports-store.json');

function readFileStore() {
  if (!fs.existsSync(DATA_FILE)) {
    return { months: {}, lineItems: {} };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return {
      months: parsed.months || {},
      lineItems: parsed.lineItems || {},
    };
  } catch {
    return { months: {}, lineItems: {} };
  }
}

function writeFileStore(store) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

function monthStoreKey(clientId, monthKey) {
  return `${normalizeClientId(clientId)}::${monthKey}`;
}

function rowToMonthRecord(row, lineItems = []) {
  if (!row) return null;
  return {
    id: row.id,
    clientId: row.client_id,
    monthKey: row.month_key,
    periodStart: formatDate(row.period_start),
    periodEnd: formatDate(row.period_end),
    metaSpend: row.meta_spend != null ? Number(row.meta_spend) : null,
    metaCpm: row.meta_cpm != null ? Number(row.meta_cpm) : null,
    metaImpressions: row.meta_impressions != null ? Number(row.meta_impressions) : null,
    metaReach: row.meta_reach != null ? Number(row.meta_reach) : null,
    metaClicks: row.meta_clicks != null ? Number(row.meta_clicks) : null,
    metaLeads: row.meta_leads != null ? Number(row.meta_leads) : null,
    metaFetchedAt: row.meta_fetched_at || null,
    wonLeads: row.won_leads != null ? Number(row.won_leads) : null,
    avgLeadValue: row.avg_lead_value != null ? Number(row.avg_lead_value) : null,
    avgProfitPerWon: row.avg_profit_per_won != null ? Number(row.avg_profit_per_won) : null,
    published: row.published !== false,
    lineItems: lineItems.map(rowToLineItem),
    updatedAt: row.updated_at || null,
  };
}

function rowToLineItem(row) {
  return {
    id: row.id,
    label: row.label,
    amount: Number(row.amount) || 0,
    sortOrder: Number(row.sort_order) || 0,
  };
}

function formatDate(value) {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function parseMonthKey(monthKey) {
  const normalized = String(monthKey || '').trim();
  if (!/^\d{4}-\d{2}$/.test(normalized)) {
    const error = new Error('Invalid month key. Expected YYYY-MM.');
    error.statusCode = 400;
    throw error;
  }
  return normalized;
}

function getYearMonthKeys(year, timeZone) {
  const numericYear = Number(year) || Number(getCurrentMonthKey(timeZone).slice(0, 4));
  const currentKey = getCurrentMonthKey(timeZone);
  const currentYear = Number(currentKey.slice(0, 4));
  const currentMonth = Number(currentKey.slice(5, 7));
  const keys = [];
  for (let month = 1; month <= 12; month += 1) {
    if (numericYear > currentYear) continue;
    if (numericYear === currentYear && month > currentMonth) continue;
    keys.push(`${numericYear}-${String(month).padStart(2, '0')}`);
  }
  return keys;
}

function accountReportFields(account) {
  return {
    metaReportEnabled: Boolean(account.metaReportEnabled),
    metaReportShowBottomline: Boolean(account.metaReportShowBottomline),
    metaReportFeeEnabled: Boolean(account.metaReportFeeEnabled),
    metaReportFeePercent: account.metaReportFeePercent != null
      ? Number(account.metaReportFeePercent)
      : 20,
    metaReportShowOther: account.metaReportShowOther !== false,
    metaReportAccessToken: account.metaReportAccessToken || null,
    metaReportDefaultWonLeads: account.metaReportDefaultWonLeads != null
      ? Number(account.metaReportDefaultWonLeads)
      : null,
    metaReportDefaultAvgLeadValue: account.metaReportDefaultAvgLeadValue != null
      ? Number(account.metaReportDefaultAvgLeadValue)
      : null,
    metaReportDefaultAvgProfitPerWon: account.metaReportDefaultAvgProfitPerWon != null
      ? Number(account.metaReportDefaultAvgProfitPerWon)
      : null,
  };
}

async function listMetaReportClients({ filter = 'all' } = {}) {
  const ids = await listClientIds();
  const clients = [];
  for (const clientId of ids) {
    const account = await getAccount(clientId);
    if (!account?.metaAdAccountId) continue;
    const hasGhl = Boolean(account.hasGhlToken && account.locationId);
    if (filter === 'enabled' && !account.metaReportEnabled) continue;
    if (filter === 'meta-only' && hasGhl) continue;
    clients.push({
      clientId: account.clientId,
      accountName: account.accountName,
      metaAdAccountId: account.metaAdAccountId,
      hasGhl,
      hasMetaToken: Boolean(resolveMetaSystemUserToken(account)),
      ...accountReportFields(account),
      reportUrl: account.metaReportAccessToken
        ? `/report/${account.metaReportAccessToken}`
        : null,
      inApp: true,
      needsSetup: false,
    });
  }
  return clients.sort((a, b) => a.accountName.localeCompare(b.accountName));
}

async function getMetaReportsDashboard({ filter = 'all' } = {}) {
  const configuredClients = await listMetaReportClients({ filter: 'all' });
  const byAdAccountId = new Map();
  for (const client of configuredClients) {
    byAdAccountId.set(String(client.metaAdAccountId), client);
  }

  let partnerFetch = { accounts: [], businessId: null, error: null };
  const { resolveMetaAccessToken } = require('./meta-token');
  const tokenResolved = resolveMetaAccessToken({});
  if (tokenResolved.token) {
    try {
      const { fetchPartnerAdAccounts } = require('./meta-ad-accounts');
      partnerFetch = await fetchPartnerAdAccounts(tokenResolved.token);
    } catch (error) {
      partnerFetch.error = error.message || 'Failed to load Meta ad accounts.';
    }
  } else {
    partnerFetch.error = tokenResolved.reason || 'Meta system user token is not configured.';
  }

  const merged = [];
  const seenAdIds = new Set();

  for (const partner of partnerFetch.accounts) {
    seenAdIds.add(partner.metaAdAccountId);
    const linked = byAdAccountId.get(partner.metaAdAccountId);
    if (linked) {
      merged.push({
        ...linked,
        partnerSource: partner.source,
        metaName: partner.accountName,
      });
    } else {
      merged.push({
        clientId: null,
        accountName: partner.accountName,
        metaAdAccountId: partner.metaAdAccountId,
        hasGhl: false,
        hasMetaToken: true,
        metaReportEnabled: false,
        metaReportShowBottomline: false,
        metaReportFeeEnabled: false,
        metaReportFeePercent: 20,
        metaReportAccessToken: null,
        reportUrl: null,
        partnerSource: partner.source,
        inApp: false,
        needsSetup: true,
      });
    }
  }

  for (const client of configuredClients) {
    if (!seenAdIds.has(String(client.metaAdAccountId))) {
      merged.push({ ...client, partnerSource: 'app-only' });
    }
  }

  let clients = merged;
  if (filter === 'enabled') clients = merged.filter((row) => row.metaReportEnabled);
  if (filter === 'meta-only') clients = merged.filter((row) => !row.hasGhl);
  if (filter === 'needs-setup') clients = merged.filter((row) => row.needsSetup);

  clients.sort((a, b) => a.accountName.localeCompare(b.accountName));

  return {
    summary: {
      partnerAccountCount: partnerFetch.accounts.length,
      inAppCount: merged.filter((row) => row.inApp).length,
      enabledCount: merged.filter((row) => row.metaReportEnabled).length,
      needsSetupCount: merged.filter((row) => row.needsSetup).length,
      visibleCount: clients.length,
    },
    clients,
    meta: {
      businessId: partnerFetch.businessId,
      partnerFetchError: partnerFetch.error,
    },
  };
}

async function provisionMetaReportClient(input = {}) {
  const {
    createAccount,
    getAccount,
    updateAccount,
    suggestSlugFromName,
    normalizeMetaAdAccountId,
  } = require('./account-store');

  const accountName = String(input.accountName || '').trim();
  const adId = normalizeMetaAdAccountId(input.metaAdAccountId);
  if (!accountName || !adId) {
    const error = new Error('accountName and metaAdAccountId are required.');
    error.statusCode = 400;
    throw error;
  }

  const ids = await listClientIds();
  for (const id of ids) {
    const existing = await getAccount(id);
    if (existing?.metaAdAccountId === adId) {
      await updateMetaReportSettings(id, {
        metaReportEnabled: input.metaReportEnabled !== false,
      });
      return getAccount(id);
    }
  }

  let slug = input.clientId ? normalizeClientId(input.clientId) : suggestSlugFromName(accountName);
  let account = await getAccount(slug);
  if (!account) {
    account = await createAccount({
      clientId: slug,
      accountName,
      metaAdAccountId: adId,
      readyForGhl: false,
    });
  } else {
    account = await updateAccount(slug, { accountName, metaAdAccountId: adId });
  }

  if (input.metaReportEnabled !== false) {
    await updateMetaReportSettings(slug, { metaReportEnabled: true });
  }

  return getAccount(slug);
}

async function updateMetaReportSettings(clientId, input = {}) {
  const account = await getAccount(clientId);
  if (!account) {
    const error = new Error('Account not found.');
    error.statusCode = 404;
    throw error;
  }

  const patch = {};
  if (input.metaReportEnabled != null) patch.metaReportEnabled = Boolean(input.metaReportEnabled);
  if (input.metaReportShowBottomline != null) {
    patch.metaReportShowBottomline = Boolean(input.metaReportShowBottomline);
  }
  if (input.metaReportFeeEnabled != null) patch.metaReportFeeEnabled = Boolean(input.metaReportFeeEnabled);
  if (input.metaReportFeePercent != null) patch.metaReportFeePercent = Number(input.metaReportFeePercent);
  if (input.metaReportShowOther != null) patch.metaReportShowOther = Boolean(input.metaReportShowOther);
  if (input.metaReportDefaultWonLeads !== undefined) {
    patch.metaReportDefaultWonLeads = input.metaReportDefaultWonLeads;
  }
  if (input.metaReportDefaultAvgLeadValue !== undefined) {
    patch.metaReportDefaultAvgLeadValue = input.metaReportDefaultAvgLeadValue;
  }
  if (input.metaReportDefaultAvgProfitPerWon !== undefined) {
    patch.metaReportDefaultAvgProfitPerWon = input.metaReportDefaultAvgProfitPerWon;
  }
  if (input.rotateAccessToken) {
    patch.metaReportAccessToken = generateReportAccessToken();
  } else if (input.metaReportEnabled && !account.metaReportAccessToken) {
    patch.metaReportAccessToken = generateReportAccessToken();
  }

  const { updateAccount } = require('./account-store');
  return updateAccount(clientId, patch);
}

async function getLineItemsForMonth(monthId) {
  if (!usePostgres()) {
    const store = readFileStore();
    return (store.lineItems[monthId] || []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
  }
  const rows = await query`
    SELECT * FROM meta_report_line_items
    WHERE meta_report_month_id = ${monthId}
    ORDER BY sort_order ASC, id ASC
  `;
  return rows.map(rowToLineItem);
}

async function getMonthRecord(clientId, monthKey) {
  const id = normalizeClientId(clientId);
  const key = parseMonthKey(monthKey);

  if (!usePostgres()) {
    const store = readFileStore();
    const row = store.months[monthStoreKey(id, key)];
    if (!row) return null;
    const lineItems = store.lineItems[row.id] || [];
    return rowToMonthRecord(row, lineItems);
  }

  const rows = await query`
    SELECT * FROM meta_report_months
    WHERE client_id = ${id} AND month_key = ${key}
    LIMIT 1
  `;
  if (!rows[0]) return null;
  const lineItems = await getLineItemsForMonth(rows[0].id);
  return rowToMonthRecord(rows[0], lineItems);
}

async function ensureMonthRecord(clientId, monthKey, account, timeZone) {
  const id = normalizeClientId(clientId);
  const key = parseMonthKey(monthKey);
  const existing = await getMonthRecord(id, key);
  if (existing) return existing;

  const bounds = monthBoundsIso(key);
  const defaults = accountReportFields(account);
  const record = {
    client_id: id,
    month_key: key,
    period_start: bounds.start,
    period_end: bounds.end,
    won_leads: defaults.metaReportDefaultWonLeads,
    avg_lead_value: defaults.metaReportDefaultAvgLeadValue,
    avg_profit_per_won: defaults.metaReportDefaultAvgProfitPerWon,
    published: true,
    updated_at: new Date().toISOString(),
  };

  if (!usePostgres()) {
    const store = readFileStore();
    const monthId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const saved = { id: monthId, ...record };
    store.months[monthStoreKey(id, key)] = saved;
    store.lineItems[monthId] = [];
    writeFileStore(store);
    return rowToMonthRecord(saved, []);
  }

  const rows = await query`
    INSERT INTO meta_report_months (
      client_id, month_key, period_start, period_end,
      won_leads, avg_lead_value, avg_profit_per_won, published, updated_at
    ) VALUES (
      ${id}, ${key}, ${record.period_start}, ${record.period_end},
      ${record.won_leads}, ${record.avg_lead_value}, ${record.avg_profit_per_won},
      TRUE, NOW()
    )
    ON CONFLICT (client_id, month_key) DO UPDATE SET updated_at = NOW()
    RETURNING *
  `;
  return rowToMonthRecord(rows[0], []);
}

async function saveMonthRecord(clientId, monthKey, input = {}) {
  const account = await getAccount(clientId);
  if (!account) {
    const error = new Error('Account not found.');
    error.statusCode = 404;
    throw error;
  }

  const id = normalizeClientId(clientId);
  const key = parseMonthKey(monthKey);
  await ensureMonthRecord(id, key, account, account.timezone);

  const existing = await getMonthRecord(id, key);
  const periodStart = input.periodStart ? formatDate(input.periodStart) : existing.periodStart;
  const periodEnd = input.periodEnd ? formatDate(input.periodEnd) : existing.periodEnd;
  const wonLeads = input.wonLeads !== undefined ? input.wonLeads : existing.wonLeads;
  const avgLeadValue = input.avgLeadValue !== undefined ? input.avgLeadValue : existing.avgLeadValue;
  const avgProfitPerWon = input.avgProfitPerWon !== undefined
    ? input.avgProfitPerWon
    : existing.avgProfitPerWon;
  const published = input.published != null ? Boolean(input.published) : existing.published !== false;

  if (!usePostgres()) {
    const store = readFileStore();
    const storeKey = monthStoreKey(id, key);
    const prev = store.months[storeKey] || {};
    const next = {
      ...prev,
      client_id: id,
      month_key: key,
      period_start: periodStart,
      period_end: periodEnd,
      won_leads: wonLeads,
      avg_lead_value: avgLeadValue,
      avg_profit_per_won: avgProfitPerWon,
      published,
      updated_at: new Date().toISOString(),
    };
    store.months[storeKey] = next;
    writeFileStore(store);
    const lineItems = store.lineItems[next.id] || [];
    return rowToMonthRecord(next, lineItems);
  }

  const rows = await query`
    UPDATE meta_report_months SET
      period_start = ${periodStart},
      period_end = ${periodEnd},
      won_leads = ${wonLeads},
      avg_lead_value = ${avgLeadValue},
      avg_profit_per_won = ${avgProfitPerWon},
      published = ${published},
      updated_at = NOW()
    WHERE client_id = ${id} AND month_key = ${key}
    RETURNING *
  `;

  const updated = rows[0];
  if (!updated) {
    const error = new Error('Month record not found.');
    error.statusCode = 404;
    throw error;
  }
  const lineItems = await getLineItemsForMonth(updated.id);
  return rowToMonthRecord(updated, lineItems);
}

async function saveMetaSnapshot(clientId, monthKey, snapshot = {}) {
  const id = normalizeClientId(clientId);
  const key = parseMonthKey(monthKey);

  if (!usePostgres()) {
    const store = readFileStore();
    const storeKey = monthStoreKey(id, key);
    const prev = store.months[storeKey];
    if (!prev) return null;
    store.months[storeKey] = {
      ...prev,
      meta_spend: snapshot.spend ?? null,
      meta_cpm: snapshot.cpm ?? null,
      meta_impressions: snapshot.impressions ?? null,
      meta_reach: snapshot.reach ?? null,
      meta_clicks: snapshot.clicks ?? null,
      meta_leads: snapshot.leads ?? null,
      meta_fetched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    writeFileStore(store);
    return rowToMonthRecord(store.months[storeKey], store.lineItems[prev.id] || []);
  }

  const rows = await query`
    UPDATE meta_report_months SET
      meta_spend = ${snapshot.spend ?? null},
      meta_cpm = ${snapshot.cpm ?? null},
      meta_impressions = ${snapshot.impressions ?? null},
      meta_reach = ${snapshot.reach ?? null},
      meta_clicks = ${snapshot.clicks ?? null},
      meta_leads = ${snapshot.leads ?? null},
      meta_fetched_at = NOW(),
      updated_at = NOW()
    WHERE client_id = ${id} AND month_key = ${key}
    RETURNING *
  `;
  if (!rows[0]) return null;
  const lineItems = await getLineItemsForMonth(rows[0].id);
  return rowToMonthRecord(rows[0], lineItems);
}

async function replaceLineItems(clientId, monthKey, items = []) {
  const month = await getMonthRecord(clientId, monthKey);
  if (!month) {
    const account = await getAccount(clientId);
    await ensureMonthRecord(clientId, monthKey, account, account?.timezone);
  }
  const refreshed = await getMonthRecord(clientId, monthKey);
  if (!refreshed?.id) {
    const error = new Error('Month record not found.');
    error.statusCode = 404;
    throw error;
  }

  const normalized = (items || []).map((row, index) => ({
    label: String(row.label || '').trim(),
    amount: Number(row.amount) || 0,
    sortOrder: row.sortOrder != null ? Number(row.sortOrder) : index,
  })).filter((row) => row.label);

  if (!usePostgres()) {
    const store = readFileStore();
    store.lineItems[refreshed.id] = normalized.map((row, index) => ({
      id: `line-${refreshed.id}-${index}`,
      ...row,
    }));
    writeFileStore(store);
    return normalized.map((row, index) => ({
      id: `line-${refreshed.id}-${index}`,
      label: row.label,
      amount: row.amount,
      sortOrder: row.sortOrder,
    }));
  }

  await query`DELETE FROM meta_report_line_items WHERE meta_report_month_id = ${refreshed.id}`;
  const saved = [];
  for (const [index, row] of normalized.entries()) {
    const inserted = await query`
      INSERT INTO meta_report_line_items (meta_report_month_id, label, amount, sort_order)
      VALUES (${refreshed.id}, ${row.label}, ${row.amount}, ${row.sortOrder ?? index})
      RETURNING *
    `;
    saved.push(rowToLineItem(inserted[0]));
  }
  return saved;
}

async function listMetaReportEnabledClientIds() {
  const clients = await listMetaReportClients({ filter: 'enabled' });
  return clients.map((row) => row.clientId);
}

module.exports = {
  accountReportFields,
  ensureMonthRecord,
  getLineItemsForMonth,
  getMetaReportsDashboard,
  getMonthRecord,
  getYearMonthKeys,
  listMetaReportClients,
  listMetaReportEnabledClientIds,
  provisionMetaReportClient,
  replaceLineItems,
  saveMetaSnapshot,
  saveMonthRecord,
  updateMetaReportSettings,
};
