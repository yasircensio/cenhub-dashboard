const fs = require('fs');
const path = require('path');
const { query, usePostgres } = require('./db');
const {
  getAccount,
  listClientIds,
  normalizeClientId,
  resolveMetaSystemUserToken,
} = require('./account-store');
const {
  rotateReportAccessToken,
  resolveReportSlug,
  parseHybridReportToken,
  reportSlugFromAccountName,
  normalizeReportSlug,
  isReportSlugTaken,
  buildUniqueReportToken,
  rebuildReportTokenWithSlug,
} = require('./report-access');
const {
  getCurrentMonthKey,
  monthBoundsIso,
} = require('./marketing-metrics');

const DATA_FILE = path.join(__dirname, '..', '.data', 'meta-reports-store.json');
const { normalizeMetaReportSpendChartType } = require('./meta-report-chart-type');
const {
  normalizeMetaReportBudgetBaseline,
  normalizeMetaReportBudgetMultiplier,
  normalizeMetaReportScenarioMonthWindow,
  normalizeScenarioPillValue,
} = require('./meta-report-scenario-settings');

function readFileStore() {
  if (!fs.existsSync(DATA_FILE)) {
    return { months: {} };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return {
      months: parsed.months || {},
    };
  } catch {
    return { months: {} };
  }
}

function writeFileStore(store) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

function monthStoreKey(clientId, monthKey) {
  return `${normalizeClientId(clientId)}::${monthKey}`;
}

function rowToMonthRecord(row) {
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
    updatedAt: row.updated_at || null,
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

function getAllowedReportYears(timeZone) {
  const currentYear = Number(getCurrentMonthKey(timeZone).slice(0, 4));
  return [currentYear, currentYear - 1];
}

function clampReportYear(year, timeZone) {
  const allowed = getAllowedReportYears(timeZone);
  const numericYear = Number(year);
  if (allowed.includes(numericYear)) return numericYear;
  return allowed[0];
}

function monthRowHasReportData(row, { requirePublished = false } = {}) {
  if (!row) return false;
  if (requirePublished && row.published === false) return false;
  if (!row.meta_fetched_at && !row.metaFetchedAt) return false;
  const spend = Number(row.meta_spend != null ? row.meta_spend : row.metaSpend) || 0;
  const leads = Number(row.meta_leads != null ? row.meta_leads : row.metaLeads) || 0;
  const impressions = Number(row.meta_impressions != null ? row.meta_impressions : row.metaImpressions) || 0;
  const clicks = Number(row.meta_clicks != null ? row.meta_clicks : row.metaClicks) || 0;
  return spend > 0 || leads > 0 || impressions > 0 || clicks > 0;
}

async function yearHasReportData(clientId, year, { requirePublished = false } = {}) {
  const id = normalizeClientId(clientId);
  const numericYear = Number(year);
  if (!Number.isFinite(numericYear)) return false;
  const prefix = `${numericYear}-`;

  if (!usePostgres()) {
    const store = readFileStore();
    return Object.values(store.months || {}).some((row) => (
      row.client_id === id
      && String(row.month_key || '').startsWith(prefix)
      && monthRowHasReportData(row, { requirePublished })
    ));
  }

  const rows = await query`
    SELECT meta_fetched_at, meta_spend, meta_leads, meta_impressions, meta_clicks, published
    FROM meta_report_months
    WHERE client_id = ${id}
      AND month_key LIKE ${`${prefix}%`}
  `;
  return rows.some((row) => monthRowHasReportData(row, { requirePublished }));
}

function accountReportFields(account) {
  const feeEnabled = Boolean(account.metaReportFeeEnabled);
  const storedMode = account.metaReportFeeMode || null;
  return {
    metaReportEnabled: Boolean(account.metaReportEnabled),
    metaReportShowBottomline: Boolean(account.metaReportShowBottomline),
    metaReportFeeEnabled: feeEnabled,
    metaReportFeeMode: storedMode,
    metaReportFeePercent: account.metaReportFeePercent != null
      ? Number(account.metaReportFeePercent)
      : 20,
    metaReportMarketingFeeAmount: account.metaReportMarketingFeeAmount != null
      ? Number(account.metaReportMarketingFeeAmount)
      : 0,
    metaReportTableColumns: Number(account.metaReportTableColumns) === 2 ? 2 : 1,
    metaReportSpendChartType: normalizeMetaReportSpendChartType(account.metaReportSpendChartType),
    metaReportScenarioMonthWindow: normalizeMetaReportScenarioMonthWindow(account.metaReportScenarioMonthWindow),
    metaReportScenarioSmoothUneven: normalizeScenarioPillValue(account.metaReportScenarioSmoothUneven, true),
    metaReportScenarioBlendHistory: normalizeScenarioPillValue(account.metaReportScenarioBlendHistory, false),
    metaReportScenarioIncludeTrend: normalizeScenarioPillValue(account.metaReportScenarioIncludeTrend, false),
    metaReportScenarioCautionStrongMonths: normalizeScenarioPillValue(account.metaReportScenarioCautionStrongMonths, false),
    metaReportBudgetMultiplier: normalizeMetaReportBudgetMultiplier(account.metaReportBudgetMultiplier),
    metaReportBudgetBaseline: normalizeMetaReportBudgetBaseline(account.metaReportBudgetBaseline),
    metaReportSlug: resolveReportSlug(account),
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

async function ensureMetaReportShareLink(clientId, { enable = true } = {}) {
  const account = await getAccount(clientId);
  if (!account?.metaAdAccountId) return account;

  const { updateAccount } = require('./account-store');
  const parsed = parseHybridReportToken(account.metaReportAccessToken);

  if (account.metaReportAccessToken) {
    if (!account.metaReportSlug && parsed?.slug) {
      return updateAccount(clientId, { metaReportSlug: parsed.slug });
    }
    return account;
  }

  const slug = account.metaReportSlug
    || reportSlugFromAccountName(account.accountName, clientId);
  const patch = {
    metaReportSlug: slug,
    metaReportAccessToken: await buildUniqueReportToken(slug, clientId),
  };
  if (enable) patch.metaReportEnabled = true;
  return updateAccount(clientId, patch);
}

async function listMetaReportClients({ filter = 'all' } = {}) {
  const ids = await listClientIds();
  const clients = [];
  for (const clientId of ids) {
    let account = await getAccount(clientId);
    if (!account?.metaAdAccountId) continue;
    account = await ensureMetaReportShareLink(clientId);
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
        metaReportTableColumns: 1,
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
      await ensureMetaReportShareLink(id, { enable: input.metaReportEnabled !== false });
      if (input.metaReportEnabled === false) {
        await updateMetaReportSettings(id, { metaReportEnabled: false });
      }
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

  await ensureMetaReportShareLink(slug, { enable: input.metaReportEnabled !== false });
  if (input.metaReportEnabled === false) {
    await updateMetaReportSettings(slug, { metaReportEnabled: false });
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
  if (input.metaReportFeeEnabled != null) {
    patch.metaReportFeeEnabled = Boolean(input.metaReportFeeEnabled);
    if (
      input.metaReportFeeEnabled
      && input.metaReportFeeMode === undefined
      && !account.metaReportFeeMode
    ) {
      const marketing = Number(account.metaReportMarketingFeeAmount);
      patch.metaReportFeeMode = (Number.isFinite(marketing) && marketing > 0)
        ? 'marketing'
        : 'performance';
    }
  }
  if (input.metaReportFeePercent != null) patch.metaReportFeePercent = Number(input.metaReportFeePercent);
  if (input.metaReportFeeMode !== undefined) {
    const mode = input.metaReportFeeMode || null;
    patch.metaReportFeeMode = mode;
    patch.metaReportFeeEnabled = Boolean(mode);
  }
  if (input.metaReportMarketingFeeAmount != null) {
    patch.metaReportMarketingFeeAmount = Number(input.metaReportMarketingFeeAmount);
  }
  if (input.metaReportTableColumns != null) {
    patch.metaReportTableColumns = Number(input.metaReportTableColumns) === 2 ? 2 : 1;
  }
  if (input.metaReportSpendChartType != null) {
    patch.metaReportSpendChartType = normalizeMetaReportSpendChartType(input.metaReportSpendChartType);
  }
  if (input.metaReportScenarioMonthWindow != null) {
    patch.metaReportScenarioMonthWindow = normalizeMetaReportScenarioMonthWindow(input.metaReportScenarioMonthWindow);
  }
  if (input.metaReportScenarioSmoothUneven != null) {
    patch.metaReportScenarioSmoothUneven = normalizeScenarioPillValue(input.metaReportScenarioSmoothUneven, true);
  }
  if (input.metaReportScenarioBlendHistory != null) {
    patch.metaReportScenarioBlendHistory = normalizeScenarioPillValue(input.metaReportScenarioBlendHistory, false);
  }
  if (input.metaReportScenarioIncludeTrend != null) {
    patch.metaReportScenarioIncludeTrend = normalizeScenarioPillValue(input.metaReportScenarioIncludeTrend, false);
  }
  if (input.metaReportScenarioCautionStrongMonths != null) {
    patch.metaReportScenarioCautionStrongMonths = normalizeScenarioPillValue(input.metaReportScenarioCautionStrongMonths, false);
  }
  if (input.metaReportBudgetMultiplier != null) {
    patch.metaReportBudgetMultiplier = normalizeMetaReportBudgetMultiplier(input.metaReportBudgetMultiplier);
  }
  if (input.metaReportBudgetBaseline != null) {
    patch.metaReportBudgetBaseline = normalizeMetaReportBudgetBaseline(input.metaReportBudgetBaseline);
  }
  if (input.metaReportDefaultWonLeads !== undefined) {
    patch.metaReportDefaultWonLeads = input.metaReportDefaultWonLeads;
  }
  if (input.metaReportDefaultAvgLeadValue !== undefined) {
    patch.metaReportDefaultAvgLeadValue = input.metaReportDefaultAvgLeadValue;
  }
  if (input.metaReportDefaultAvgProfitPerWon !== undefined) {
    patch.metaReportDefaultAvgProfitPerWon = input.metaReportDefaultAvgProfitPerWon;
  }
  if (input.metaReportSlug !== undefined) {
    const normalizedSlug = normalizeReportSlug(input.metaReportSlug);
    if (!normalizedSlug) {
      const error = new Error('Invalid report link slug.');
      error.statusCode = 400;
      throw error;
    }
    if (await isReportSlugTaken(normalizedSlug, clientId)) {
      const error = new Error('That report link slug is already in use.');
      error.statusCode = 409;
      throw error;
    }
    patch.metaReportSlug = normalizedSlug;
    if (normalizedSlug !== resolveReportSlug(account)) {
      patch.metaReportAccessToken = await rebuildReportTokenWithSlug(
        account.metaReportAccessToken,
        normalizedSlug,
        clientId,
      );
    }
  }
  if (input.rotateAccessToken) {
    patch.metaReportAccessToken = await rotateReportAccessToken(
      account.metaReportAccessToken,
      account.accountName,
      clientId,
      resolveReportSlug(account),
    );
  } else if (input.metaReportEnabled && !account.metaReportAccessToken) {
    const slug = resolveReportSlug(account)
      || reportSlugFromAccountName(account.accountName, clientId);
    patch.metaReportSlug = slug;
    patch.metaReportAccessToken = await buildUniqueReportToken(slug, clientId);
  }

  const { updateAccount } = require('./account-store');
  return updateAccount(clientId, patch);
}

async function getMonthRecord(clientId, monthKey) {
  const id = normalizeClientId(clientId);
  const key = parseMonthKey(monthKey);

  if (!usePostgres()) {
    const store = readFileStore();
    const row = store.months[monthStoreKey(id, key)];
    if (!row) return null;
    return rowToMonthRecord(row);
  }

  const rows = await query`
    SELECT * FROM meta_report_months
    WHERE client_id = ${id} AND month_key = ${key}
    LIMIT 1
  `;
  if (!rows[0]) return null;
  return rowToMonthRecord(rows[0]);
}

async function invalidateMetaSnapshot(clientId, monthKey) {
  const id = normalizeClientId(clientId);
  const key = parseMonthKey(monthKey);

  if (!usePostgres()) {
    const store = readFileStore();
    const storeKey = monthStoreKey(id, key);
    const prev = store.months[storeKey];
    if (!prev) return null;
    store.months[storeKey] = {
      ...prev,
      meta_spend: null,
      meta_cpm: null,
      meta_impressions: null,
      meta_reach: null,
      meta_clicks: null,
      meta_leads: null,
      meta_fetched_at: null,
    };
    writeFileStore(store);
    return rowToMonthRecord(store.months[storeKey]);
  }

  const rows = await query`
    UPDATE meta_report_months SET
      meta_spend = NULL,
      meta_cpm = NULL,
      meta_impressions = NULL,
      meta_reach = NULL,
      meta_clicks = NULL,
      meta_leads = NULL,
      meta_fetched_at = NULL
    WHERE client_id = ${id} AND month_key = ${key}
    RETURNING *
  `;
  if (!rows[0]) return null;
  return rowToMonthRecord(rows[0]);
}

async function alignMonthRecordPeriod(clientId, monthKey, existing) {
  const id = normalizeClientId(clientId);
  const key = parseMonthKey(monthKey);
  const bounds = monthBoundsIso(key);
  if (existing.periodStart === bounds.start && existing.periodEnd === bounds.end) {
    return existing;
  }

  if (!usePostgres()) {
    const store = readFileStore();
    const storeKey = monthStoreKey(id, key);
    const prev = store.months[storeKey];
    if (!prev) return existing;
    store.months[storeKey] = {
      ...prev,
      period_start: bounds.start,
      period_end: bounds.end,
      updated_at: new Date().toISOString(),
    };
    writeFileStore(store);
  } else {
    await query`
      UPDATE meta_report_months SET
        period_start = ${bounds.start},
        period_end = ${bounds.end},
        updated_at = NOW()
      WHERE client_id = ${id} AND month_key = ${key}
    `;
  }

  if (existing.metaFetchedAt) {
    await invalidateMetaSnapshot(clientId, monthKey);
  }
  return getMonthRecord(id, key);
}

async function ensureMonthRecord(clientId, monthKey, account, timeZone) {
  const id = normalizeClientId(clientId);
  const key = parseMonthKey(monthKey);
  const existing = await getMonthRecord(id, key);
  if (existing) {
    const bounds = monthBoundsIso(key);
    if (existing.periodStart !== bounds.start || existing.periodEnd !== bounds.end) {
      return alignMonthRecordPeriod(clientId, monthKey, existing);
    }
    return existing;
  }

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
  };

  if (!usePostgres()) {
    const store = readFileStore();
    const monthId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const saved = { id: monthId, ...record };
    store.months[monthStoreKey(id, key)] = saved;
    writeFileStore(store);
    return rowToMonthRecord(saved);
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
    ON CONFLICT (client_id, month_key) DO NOTHING
    RETURNING *
  `;
  if (rows[0]) return rowToMonthRecord(rows[0]);
  const created = await getMonthRecord(id, key);
  return created;
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
  let existing = await getMonthRecord(id, key);
  if (!existing) {
    existing = await ensureMonthRecord(id, key, account, account.timezone);
  }

  const bounds = monthBoundsIso(key);
  const periodStart = bounds.start;
  const periodEnd = bounds.end;
  const periodCorrected = existing.periodStart !== periodStart || existing.periodEnd !== periodEnd;
  if (periodCorrected) {
    existing = await alignMonthRecordPeriod(clientId, monthKey, existing);
  }
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
    return rowToMonthRecord(next);
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
  return rowToMonthRecord(updated);
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
    };
    writeFileStore(store);
    return rowToMonthRecord(store.months[storeKey]);
  }

  const rows = await query`
    UPDATE meta_report_months SET
      meta_spend = ${snapshot.spend ?? null},
      meta_cpm = ${snapshot.cpm ?? null},
      meta_impressions = ${snapshot.impressions ?? null},
      meta_reach = ${snapshot.reach ?? null},
      meta_clicks = ${snapshot.clicks ?? null},
      meta_leads = ${snapshot.leads ?? null},
      meta_fetched_at = NOW()
    WHERE client_id = ${id} AND month_key = ${key}
    RETURNING *
  `;
  if (!rows[0]) return null;
  return rowToMonthRecord(rows[0]);
}

async function listMetaReportEnabledClientIds() {
  const clients = await listMetaReportClients({ filter: 'enabled' });
  return clients.map((row) => row.clientId);
}

function classifyCustomInputStatus(row, { requireProfit = false } = {}) {
  if (!row) return 'empty';
  const hasWon = row.wonLeads != null || row.won_leads != null;
  const hasAvgLead = row.avgLeadValue != null || row.avg_lead_value != null;
  const hasProfit = row.avgProfitPerWon != null || row.avg_profit_per_won != null;
  const filledCore = hasWon && hasAvgLead && (!requireProfit || hasProfit);
  if (filledCore) return 'complete';
  if (hasWon || hasAvgLead || hasProfit) return 'partial';
  return 'empty';
}

function customInputsUpdatedAt(row, status) {
  if (status === 'empty') return null;
  return row?.updated_at || row?.updatedAt || null;
}

function effectiveFeeEnabledForMonth(settings, monthRecord) {
  const status = classifyCustomInputStatus({
    won_leads: monthRecord?.wonLeads,
    avg_lead_value: monthRecord?.avgLeadValue,
    avg_profit_per_won: monthRecord?.avgProfitPerWon,
  }, { requireProfit: Boolean(settings.metaReportShowBottomline) });
  if (status === 'empty') return false;
  const feeMode = settings.metaReportFeeMode || (
    settings.metaReportFeeEnabled ? 'performance' : null
  );
  return Boolean(settings.metaReportShowBottomline && feeMode);
}

async function listMonthInputRowsForYear(year) {
  const numericYear = Number(year);
  if (!Number.isFinite(numericYear)) return [];
  const prefix = `${numericYear}-`;

  if (!usePostgres()) {
    const store = readFileStore();
    return Object.values(store.months || {})
      .filter((row) => String(row.month_key || '').startsWith(prefix))
      .map((row) => ({
        client_id: row.client_id,
        month_key: row.month_key,
        won_leads: row.won_leads,
        avg_lead_value: row.avg_lead_value,
        avg_profit_per_won: row.avg_profit_per_won,
        updated_at: row.updated_at || null,
        meta_fetched_at: row.meta_fetched_at || null,
      }));
  }

  return query`
    SELECT
      m.client_id,
      m.month_key,
      m.won_leads,
      m.avg_lead_value,
      m.avg_profit_per_won,
      m.updated_at,
      m.meta_fetched_at
    FROM meta_report_months m
    WHERE m.month_key LIKE ${`${prefix}%`}
  `;
}

async function getCustomValuesOverview(year, { timeZone } = {}) {
  const tz = timeZone || 'Europe/Copenhagen';
  const allowedYears = getAllowedReportYears(tz);
  const resolvedYear = clampReportYear(year, tz);
  const monthKeys = getYearMonthKeys(resolvedYear, tz);
  const clients = (await listMetaReportClients({ filter: 'all' }))
    .filter((row) => row.clientId && row.metaAdAccountId);
  const monthRows = await listMonthInputRowsForYear(resolvedYear);
  const byClient = new Map();
  for (const row of monthRows) {
    const clientId = normalizeClientId(row.client_id);
    if (!byClient.has(clientId)) byClient.set(clientId, new Map());
    byClient.get(clientId).set(row.month_key, row);
  }

  let completeMonths = 0;
  let partialMonths = 0;
  let emptyMonths = 0;

  const clientPayloads = clients.map((client) => {
    const clientMonths = byClient.get(normalizeClientId(client.clientId)) || new Map();
    const months = {};
    let lastUpdatedAt = null;
    let clientComplete = 0;
    let clientPartial = 0;
    let clientEmpty = 0;

    for (const monthKey of monthKeys) {
      const row = clientMonths.get(monthKey) || null;
      const status = classifyCustomInputStatus(row, {
        requireProfit: Boolean(client.metaReportShowBottomline),
      });
      const updatedAt = customInputsUpdatedAt(row, status);
      if (updatedAt && (!lastUpdatedAt || String(updatedAt) > String(lastUpdatedAt))) {
        lastUpdatedAt = updatedAt;
      }
      if (status === 'complete') {
        clientComplete += 1;
        completeMonths += 1;
      } else if (status === 'partial') {
        clientPartial += 1;
        partialMonths += 1;
      } else {
        clientEmpty += 1;
        emptyMonths += 1;
      }
      months[monthKey] = {
        monthKey,
        status,
        wonLeads: row?.won_leads != null ? Number(row.won_leads) : null,
        avgLeadValue: row?.avg_lead_value != null ? Number(row.avg_lead_value) : null,
        avgProfitPerWon: row?.avg_profit_per_won != null ? Number(row.avg_profit_per_won) : null,
        updatedAt,
        metaFetchedAt: row?.meta_fetched_at || null,
      };
    }

    return {
      clientId: client.clientId,
      accountName: client.accountName,
      metaAdAccountId: client.metaAdAccountId,
      metaReportEnabled: Boolean(client.metaReportEnabled),
      metaReportShowBottomline: Boolean(client.metaReportShowBottomline),
      metaReportFeeEnabled: Boolean(client.metaReportFeeEnabled),
      metaReportFeeMode: client.metaReportFeeMode || null,
      metaReportFeePercent: client.metaReportFeePercent != null ? Number(client.metaReportFeePercent) : 20,
      metaReportMarketingFeeAmount: client.metaReportMarketingFeeAmount != null
        ? Number(client.metaReportMarketingFeeAmount)
        : 0,
      months,
      completeCount: clientComplete,
      partialCount: clientPartial,
      emptyCount: clientEmpty,
      lastUpdatedAt,
    };
  });

  return {
    year: resolvedYear,
    currentYear: allowedYears[0],
    years: allowedYears.map((entryYear) => ({
      year: entryYear,
      available: true,
    })),
    monthKeys,
    clients: clientPayloads,
    summary: {
      clientCount: clientPayloads.length,
      monthCount: monthKeys.length,
      completeMonths,
      partialMonths,
      emptyMonths,
    },
  };
}

module.exports = {
  accountReportFields,
  clampReportYear,
  classifyCustomInputStatus,
  customInputsUpdatedAt,
  effectiveFeeEnabledForMonth,
  ensureMetaReportShareLink,
  ensureMonthRecord,
  getAllowedReportYears,
  getCustomValuesOverview,
  getMetaReportsDashboard,
  getMonthRecord,
  getYearMonthKeys,
  invalidateMetaSnapshot,
  listMetaReportClients,
  listMetaReportEnabledClientIds,
  provisionMetaReportClient,
  saveMetaSnapshot,
  saveMonthRecord,
  updateMetaReportSettings,
  yearHasReportData,
};
