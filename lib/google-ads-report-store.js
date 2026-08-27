const fs = require('fs');
const path = require('path');
const { query, usePostgres } = require('./db');
const {
  formatGoogleAdsCustomerId,
  normalizeGoogleAdsCustomerId,
} = require('./google-ads-config');
const {
  getCurrentMonthKey,
  monthBoundsIso,
} = require('./marketing-metrics');
const {
  buildUniqueReportToken,
  normalizeReportSlug,
  parseHybridReportToken,
  rebuildReportTokenWithSlug,
  reportSlugFromAccountName,
  rotateReportAccessToken,
  isReportSlugTaken,
  isReportTokenTaken,
} = require('./report-access');
const { normalizeMetaReportSpendChartType } = require('./meta-report-chart-type');
const { normalizeMetaReportExcelSheetUrl } = require('./meta-report-excel-sheet-url');
const {
  normalizeMetaReportBudgetBaseline,
  normalizeMetaReportBudgetMultiplier,
  normalizeMetaReportScenarioMonthWindow,
  normalizeScenarioPillValue,
} = require('./meta-report-scenario-settings');

const DATA_FILE = path.join(__dirname, '..', '.data', 'google-ads-reports-store.json');

function readFileStore() {
  if (!fs.existsSync(DATA_FILE)) {
    return { clients: {}, months: {} };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return {
      clients: parsed.clients || {},
      months: parsed.months || {},
    };
  } catch {
    return { clients: {}, months: {} };
  }
}

function writeFileStore(store) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

function googleAdsClientIdFromCustomer(customerId) {
  const id = normalizeGoogleAdsCustomerId(customerId);
  return id ? `gads-${id}` : null;
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

function formatDate(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'string') {
    const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : null;
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const day = String(value.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const text = String(value).trim();
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : text.slice(0, 10);
}

function monthPeriodMatchesKey(monthKey, periodStart, periodEnd) {
  const key = parseMonthKey(monthKey);
  const bounds = monthBoundsIso(key);
  return formatDate(periodStart) === bounds.start && formatDate(periodEnd) === bounds.end;
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

function clientRowToRecord(row) {
  if (!row) return null;
  return {
    id: row.id,
    clientId: row.id,
    googleCustomerId: row.google_customer_id,
    accountName: row.account_name,
    enabled: row.enabled !== false,
    showBottomline: Boolean(row.show_bottomline),
    feeEnabled: Boolean(row.fee_enabled),
    feePercent: row.fee_percent != null ? Number(row.fee_percent) : 20,
    feeMode: row.fee_mode || null,
    marketingFeeAmount: row.marketing_fee_amount != null ? Number(row.marketing_fee_amount) : 0,
    defaultWonLeads: row.default_won_leads != null ? Number(row.default_won_leads) : null,
    defaultAvgLeadValue: row.default_avg_lead_value != null ? Number(row.default_avg_lead_value) : null,
    defaultAvgProfitPerWon: row.default_avg_profit_per_won != null
      ? Number(row.default_avg_profit_per_won)
      : null,
    linkedMetaClientId: row.linked_meta_client_id || null,
    reportSlug: row.report_slug || null,
    accessToken: row.access_token || null,
    excelSheetUrl: normalizeMetaReportExcelSheetUrl(row.excel_sheet_url),
    spendChartType: normalizeMetaReportSpendChartType(row.spend_chart_type),
    scenarioMonthWindow: normalizeMetaReportScenarioMonthWindow(row.scenario_month_window),
    scenarioSmoothUneven: normalizeScenarioPillValue(row.scenario_smooth_uneven, true),
    scenarioBlendHistory: normalizeScenarioPillValue(row.scenario_blend_history, false),
    scenarioIncludeTrend: normalizeScenarioPillValue(row.scenario_include_trend, false),
    budgetMultiplier: normalizeMetaReportBudgetMultiplier(row.budget_multiplier),
    budgetBaseline: normalizeMetaReportBudgetBaseline(row.budget_baseline),
    timezone: row.timezone || 'Europe/Copenhagen',
    updatedAt: row.updated_at || null,
  };
}

function resolveGoogleAdsReportSlug(client) {
  if (!client) return null;
  if (client.reportSlug) return client.reportSlug;
  const parsed = parseHybridReportToken(client.accessToken);
  return parsed?.slug || null;
}

function googleAdsReportUrl(client) {
  if (!client?.accessToken) return null;
  return `/report/${client.accessToken}`;
}

async function ensureGoogleAdsReportShareLink(clientId, { enable = true } = {}) {
  const client = await getGoogleAdsReportClient(clientId);
  if (!client) return null;

  const parsed = parseHybridReportToken(client.accessToken);
  if (client.accessToken) {
    if (!client.reportSlug && parsed?.slug) {
      return updateGoogleAdsReportSettings(clientId, { googleAdsReportSlug: parsed.slug });
    }
    return client;
  }

  const slug = client.reportSlug
    || reportSlugFromAccountName(client.accountName, clientId);
  const patch = {
    googleAdsReportSlug: slug,
    googleAdsReportAccessToken: await buildUniqueReportToken(slug, clientId),
  };
  if (enable) patch.googleAdsReportEnabled = true;
  return updateGoogleAdsReportSettings(clientId, patch);
}

function monthRowToRecord(row) {
  if (!row) return null;
  return {
    id: row.id,
    clientId: row.client_id,
    monthKey: row.month_key,
    periodStart: formatDate(row.period_start),
    periodEnd: formatDate(row.period_end),
    googleSpend: row.google_spend != null ? Number(row.google_spend) : null,
    googleBudget: row.google_budget != null ? Number(row.google_budget) : null,
    googleImpressions: row.google_impressions != null ? Number(row.google_impressions) : null,
    googleClicks: row.google_clicks != null ? Number(row.google_clicks) : null,
    googleConversions: row.google_conversions != null ? Number(row.google_conversions) : null,
    googleSales: row.google_sales != null ? Number(row.google_sales) : null,
    googleConversionsValue: row.google_conversions_value != null
      ? Number(row.google_conversions_value)
      : null,
    googleFetchedAt: row.google_fetched_at || null,
    wonLeads: row.won_leads != null ? Number(row.won_leads) : null,
    avgLeadValue: row.avg_lead_value != null ? Number(row.avg_lead_value) : null,
    avgProfitPerWon: row.avg_profit_per_won != null ? Number(row.avg_profit_per_won) : null,
    published: row.published !== false,
    updatedAt: row.updated_at || null,
  };
}

function clientPublicFields(client) {
  return {
    clientId: client.id || client.clientId,
    accountName: client.accountName,
    googleCustomerId: client.googleCustomerId,
    googleCustomerLabel: formatGoogleAdsCustomerId(client.googleCustomerId),
    googleAdsReportEnabled: client.enabled !== false,
    googleAdsReportShowBottomline: Boolean(client.showBottomline),
    googleAdsReportFeeEnabled: Boolean(client.feeEnabled),
    googleAdsReportFeePercent: client.feePercent != null ? Number(client.feePercent) : 20,
    googleAdsReportFeeMode: client.feeMode || null,
    googleAdsReportMarketingFeeAmount: client.marketingFeeAmount != null
      ? Number(client.marketingFeeAmount)
      : 0,
    googleAdsReportDefaultWonLeads: client.defaultWonLeads,
    googleAdsReportDefaultAvgLeadValue: client.defaultAvgLeadValue,
    googleAdsReportDefaultAvgProfitPerWon: client.defaultAvgProfitPerWon,
    googleAdsReportSlug: resolveGoogleAdsReportSlug(client),
    googleAdsReportAccessToken: client.accessToken || null,
    googleAdsReportExcelSheetUrl: client.excelSheetUrl,
    googleAdsReportSpendChartType: client.spendChartType,
    googleAdsReportScenarioMonthWindow: client.scenarioMonthWindow,
    googleAdsReportScenarioSmoothUneven: client.scenarioSmoothUneven,
    googleAdsReportScenarioBlendHistory: client.scenarioBlendHistory,
    googleAdsReportScenarioIncludeTrend: client.scenarioIncludeTrend,
    googleAdsReportBudgetMultiplier: client.budgetMultiplier,
    googleAdsReportBudgetBaseline: client.budgetBaseline,
    linkedMetaClientId: client.linkedMetaClientId || null,
    linkedMetaAccountName: client.linkedMetaAccountName || null,
    reportUrl: googleAdsReportUrl(client),
    inApp: true,
    needsSetup: false,
  };
}

async function getGoogleAdsReportClientByLinkedMetaClientId(metaClientId) {
  const id = String(metaClientId || '').trim();
  if (!id) return null;
  if (!usePostgres()) {
    const match = Object.values(readFileStore().clients || {}).find((row) => (
      String(row.linked_meta_client_id || '').trim() === id
    ));
    return clientRowToRecord(match || null);
  }
  const rows = await query`
    SELECT *
    FROM google_ads_report_clients
    WHERE linked_meta_client_id = ${id}
    LIMIT 1
  `;
  return clientRowToRecord(rows[0] || null);
}

async function listGoogleAdsReportClients({ filter = 'all' } = {}) {
  let rows = [];
  if (!usePostgres()) {
    rows = Object.values(readFileStore().clients).map(clientRowToRecord);
  } else {
    const dbRows = await query`SELECT * FROM google_ads_report_clients ORDER BY account_name ASC`;
    rows = dbRows.map(clientRowToRecord);
  }
  const hydrated = [];
  for (const row of rows) {
    hydrated.push(await ensureGoogleAdsReportShareLink(row.clientId));
  }
  rows = hydrated.filter(Boolean);
  if (filter === 'enabled') rows = rows.filter((row) => row.enabled);
  return rows.sort((a, b) => String(a.accountName).localeCompare(String(b.accountName)));
}

async function getGoogleAdsReportClient(clientId) {
  const id = String(clientId || '').trim();
  if (!id) return null;
  if (!usePostgres()) {
    return clientRowToRecord(readFileStore().clients[id] || null);
  }
  const rows = await query`SELECT * FROM google_ads_report_clients WHERE id = ${id} LIMIT 1`;
  return clientRowToRecord(rows[0] || null);
}

async function getGoogleAdsReportClientByCustomerId(customerId) {
  const id = normalizeGoogleAdsCustomerId(customerId);
  if (!id) return null;
  if (!usePostgres()) {
    const match = Object.values(readFileStore().clients)
      .find((row) => row.google_customer_id === id);
    return clientRowToRecord(match || null);
  }
  const rows = await query`
    SELECT * FROM google_ads_report_clients
    WHERE google_customer_id = ${id}
    LIMIT 1
  `;
  return clientRowToRecord(rows[0] || null);
}

async function provisionGoogleAdsReportClient(input = {}) {
  const accountName = String(input.accountName || '').trim();
  const customerId = normalizeGoogleAdsCustomerId(input.googleCustomerId);
  if (!accountName || !customerId) {
    const error = new Error('accountName and googleCustomerId are required.');
    error.statusCode = 400;
    throw error;
  }

  const existing = await getGoogleAdsReportClientByCustomerId(customerId);
  const enabled = input.enabled !== false;
  if (existing) {
    const updated = await updateGoogleAdsReportSettings(existing.clientId, {
      accountName,
      googleAdsReportEnabled: enabled,
    });
    return ensureGoogleAdsReportShareLink(updated.clientId, { enable: enabled });
  }

  const id = googleAdsClientIdFromCustomer(customerId);
  const now = new Date().toISOString();
  const row = {
    id,
    google_customer_id: customerId,
    account_name: accountName,
    enabled,
    show_bottomline: false,
    fee_enabled: false,
    fee_percent: 20,
    fee_mode: null,
    marketing_fee_amount: 0,
    default_won_leads: null,
    default_avg_lead_value: null,
    default_avg_profit_per_won: null,
    linked_meta_client_id: null,
    report_slug: null,
    access_token: null,
    excel_sheet_url: null,
    spend_chart_type: 'area',
    scenario_month_window: '6',
    scenario_smooth_uneven: true,
    scenario_blend_history: false,
    scenario_include_trend: false,
    budget_multiplier: 2,
    budget_baseline: 'year',
    timezone: 'Europe/Copenhagen',
    created_at: now,
    updated_at: now,
  };

  if (!usePostgres()) {
    const store = readFileStore();
    store.clients[id] = row;
    writeFileStore(store);
    return clientRowToRecord(row);
  }

  const rows = await query`
    INSERT INTO google_ads_report_clients (
      id, google_customer_id, account_name, enabled
    ) VALUES (
      ${id}, ${customerId}, ${accountName}, ${enabled}
    )
    RETURNING *
  `;
  const created = clientRowToRecord(rows[0]);
  return ensureGoogleAdsReportShareLink(created.clientId, { enable: enabled });
}

async function updateGoogleAdsReportSettings(clientId, input = {}) {
  const existing = await getGoogleAdsReportClient(clientId);
  if (!existing) {
    const error = new Error('Google Ads client not found.');
    error.statusCode = 404;
    throw error;
  }

  const patch = {
    account_name: input.accountName != null ? String(input.accountName).trim() : existing.accountName,
    enabled: input.googleAdsReportEnabled != null
      ? Boolean(input.googleAdsReportEnabled)
      : existing.enabled,
    show_bottomline: input.googleAdsReportShowBottomline != null
      ? Boolean(input.googleAdsReportShowBottomline)
      : existing.showBottomline,
    fee_enabled: input.googleAdsReportFeeEnabled != null
      ? Boolean(input.googleAdsReportFeeEnabled)
      : existing.feeEnabled,
    fee_percent: input.googleAdsReportFeePercent != null
      ? Number(input.googleAdsReportFeePercent)
      : existing.feePercent,
    fee_mode: input.googleAdsReportFeeMode !== undefined
      ? (input.googleAdsReportFeeMode || null)
      : existing.feeMode,
    marketing_fee_amount: input.googleAdsReportMarketingFeeAmount != null
      ? Number(input.googleAdsReportMarketingFeeAmount)
      : existing.marketingFeeAmount,
    default_won_leads: input.googleAdsReportDefaultWonLeads !== undefined
      ? input.googleAdsReportDefaultWonLeads
      : existing.defaultWonLeads,
    default_avg_lead_value: input.googleAdsReportDefaultAvgLeadValue !== undefined
      ? input.googleAdsReportDefaultAvgLeadValue
      : existing.defaultAvgLeadValue,
    default_avg_profit_per_won: input.googleAdsReportDefaultAvgProfitPerWon !== undefined
      ? input.googleAdsReportDefaultAvgProfitPerWon
      : existing.defaultAvgProfitPerWon,
    excel_sheet_url: existing.excelSheetUrl,
    spend_chart_type: existing.spendChartType,
    scenario_month_window: existing.scenarioMonthWindow,
    scenario_smooth_uneven: existing.scenarioSmoothUneven,
    scenario_blend_history: existing.scenarioBlendHistory,
    scenario_include_trend: existing.scenarioIncludeTrend,
    budget_multiplier: existing.budgetMultiplier,
    budget_baseline: existing.budgetBaseline,
    linked_meta_client_id: existing.linkedMetaClientId,
  };

  if (input.googleAdsReportFeeMode !== undefined) {
    patch.fee_enabled = Boolean(input.googleAdsReportFeeMode);
  }

  if (input.googleAdsReportExcelSheetUrl !== undefined) {
    const normalized = normalizeMetaReportExcelSheetUrl(input.googleAdsReportExcelSheetUrl);
    if (String(input.googleAdsReportExcelSheetUrl || '').trim() && !normalized) {
      const error = new Error('Invalid Excel sheet URL.');
      error.statusCode = 400;
      throw error;
    }
    patch.excel_sheet_url = normalized;
  }
  if (input.googleAdsReportSpendChartType != null) {
    patch.spend_chart_type = normalizeMetaReportSpendChartType(input.googleAdsReportSpendChartType);
  }
  if (input.googleAdsReportScenarioMonthWindow != null) {
    patch.scenario_month_window = normalizeMetaReportScenarioMonthWindow(
      input.googleAdsReportScenarioMonthWindow,
    );
  }
  if (input.googleAdsReportScenarioSmoothUneven != null) {
    patch.scenario_smooth_uneven = normalizeScenarioPillValue(
      input.googleAdsReportScenarioSmoothUneven,
      true,
    );
  }
  if (input.googleAdsReportScenarioBlendHistory != null) {
    patch.scenario_blend_history = normalizeScenarioPillValue(
      input.googleAdsReportScenarioBlendHistory,
      false,
    );
  }
  if (input.googleAdsReportScenarioIncludeTrend != null) {
    patch.scenario_include_trend = normalizeScenarioPillValue(
      input.googleAdsReportScenarioIncludeTrend,
      false,
    );
  }
  if (input.googleAdsReportBudgetMultiplier != null) {
    patch.budget_multiplier = normalizeMetaReportBudgetMultiplier(
      input.googleAdsReportBudgetMultiplier,
    );
  }
  if (input.googleAdsReportBudgetBaseline != null) {
    patch.budget_baseline = normalizeMetaReportBudgetBaseline(
      input.googleAdsReportBudgetBaseline,
    );
  }

  if (input.googleAdsReportSlug !== undefined) {
    const normalizedSlug = normalizeReportSlug(input.googleAdsReportSlug);
    if (!normalizedSlug) {
      const error = new Error('Invalid report link slug.');
      error.statusCode = 400;
      throw error;
    }
    if (await isReportSlugTaken(normalizedSlug, existing.clientId)) {
      const error = new Error('That report link slug is already in use.');
      error.statusCode = 409;
      throw error;
    }
    patch.report_slug = normalizedSlug;
    if (normalizedSlug !== resolveGoogleAdsReportSlug(existing)) {
      patch.access_token = await rebuildReportTokenWithSlug(
        existing.accessToken,
        normalizedSlug,
        existing.clientId,
      );
    }
  }

  if (input.rotateAccessToken) {
    patch.access_token = await rotateReportAccessToken(
      existing.accessToken,
      existing.accountName,
      existing.clientId,
      resolveGoogleAdsReportSlug(existing),
    );
  } else if (input.googleAdsReportEnabled && !existing.accessToken) {
    const slug = resolveGoogleAdsReportSlug(existing)
      || reportSlugFromAccountName(existing.accountName, existing.clientId);
    patch.report_slug = slug;
    patch.access_token = await buildUniqueReportToken(slug, existing.clientId);
  }

  if (input.googleAdsReportAccessToken !== undefined) {
    patch.access_token = input.googleAdsReportAccessToken || null;
  }

  if (Object.prototype.hasOwnProperty.call(input, 'linkedMetaClientId')) {
    const nextMetaId = input.linkedMetaClientId == null || input.linkedMetaClientId === ''
      ? null
      : String(input.linkedMetaClientId).trim();
    if (nextMetaId) {
      const { getAccount } = require('./account-store');
      const account = await getAccount(nextMetaId);
      if (!account) {
        const error = new Error('Meta report client not found.');
        error.statusCode = 400;
        throw error;
      }
      const taken = await getGoogleAdsReportClientByLinkedMetaClientId(nextMetaId);
      if (taken && taken.clientId !== existing.clientId) {
        await updateGoogleAdsReportSettings(taken.clientId, { linkedMetaClientId: null });
      }
    }
    patch.linked_meta_client_id = nextMetaId;
  }

  const now = new Date().toISOString();
  if (!usePostgres()) {
    const store = readFileStore();
    store.clients[existing.clientId] = {
      ...store.clients[existing.clientId],
      ...patch,
      updated_at: now,
    };
    writeFileStore(store);
    return clientRowToRecord(store.clients[existing.clientId]);
  }

  const rows = await query`
    UPDATE google_ads_report_clients SET
      account_name = ${patch.account_name},
      enabled = ${patch.enabled},
      show_bottomline = ${patch.show_bottomline},
      fee_enabled = ${patch.fee_enabled},
      fee_percent = ${patch.fee_percent},
      fee_mode = ${patch.fee_mode},
      marketing_fee_amount = ${patch.marketing_fee_amount},
      default_won_leads = ${patch.default_won_leads},
      default_avg_lead_value = ${patch.default_avg_lead_value},
      default_avg_profit_per_won = ${patch.default_avg_profit_per_won},
      report_slug = ${patch.report_slug !== undefined ? patch.report_slug : existing.reportSlug},
      access_token = ${patch.access_token !== undefined ? patch.access_token : existing.accessToken},
      excel_sheet_url = ${patch.excel_sheet_url},
      spend_chart_type = ${patch.spend_chart_type},
      scenario_month_window = ${patch.scenario_month_window},
      scenario_smooth_uneven = ${patch.scenario_smooth_uneven},
      scenario_blend_history = ${patch.scenario_blend_history},
      scenario_include_trend = ${patch.scenario_include_trend},
      budget_multiplier = ${patch.budget_multiplier},
      budget_baseline = ${patch.budget_baseline},
      linked_meta_client_id = ${patch.linked_meta_client_id !== undefined ? patch.linked_meta_client_id : existing.linkedMetaClientId},
      updated_at = NOW()
    WHERE id = ${existing.clientId}
    RETURNING *
  `;
  return clientRowToRecord(rows[0]);
}

async function getGoogleAdsReportClientByAccessToken(token) {
  const normalized = String(token || '').trim();
  if (!normalized) return null;

  if (!usePostgres()) {
    const match = Object.values(readFileStore().clients || {}).find((row) => (
      row.access_token
      && String(row.access_token).trim() === normalized
      && row.enabled !== false
    ));
    return clientRowToRecord(match || null);
  }

  const rows = await query`
    SELECT *
    FROM google_ads_report_clients
    WHERE access_token = ${normalized}
      AND enabled = TRUE
    LIMIT 1
  `;
  return clientRowToRecord(rows[0] || null);
}

async function getGoogleAdsReportsDashboard({ filter = 'all' } = {}) {
  const { getGoogleAdsConfig, getGoogleAdsConfigDebug } = require('./google-ads-config');
  const { listGoogleAdsMccCustomers } = require('./google-ads-query');
  const configured = await listGoogleAdsReportClients({ filter: 'all' });
  const byCustomerId = new Map();
  for (const client of configured) {
    byCustomerId.set(String(client.googleCustomerId), client);
  }

  let partnerFetch = { accounts: [], error: null, debug: null };
  try {
    partnerFetch.debug = getGoogleAdsConfigDebug(getGoogleAdsConfig());
    partnerFetch.accounts = await listGoogleAdsMccCustomers();
  } catch (error) {
    const googleCode = error.googleErrorMeta?.failures?.[0]?.errorCode?.authenticationError;
    partnerFetch.error = googleCode === 'DEVELOPER_TOKEN_INVALID'
      ? 'Google Ads API rejected GOOGLE_ADS_DEVELOPER_TOKEN (DEVELOPER_TOKEN_INVALID). Copy the Developer token from https://ads.google.com/aw/apicenter in the MCC manager account (click View). Do not use a key from Google Cloud Console → APIs & Services → Credentials.'
      : (error.message || 'Failed to load Google Ads accounts.');
    partnerFetch.debug = {
      ...(partnerFetch.debug || {}),
      errorStatus: error.statusCode || null,
      errorMeta: error.googleErrorMeta || null,
    };
  }

  const merged = [];
  const seen = new Set();

  for (const partner of partnerFetch.accounts) {
    seen.add(partner.googleCustomerId);
    const linked = byCustomerId.get(partner.googleCustomerId);
    if (linked) {
      merged.push({
        ...clientPublicFields(linked),
        partnerName: partner.accountName,
        manager: partner.manager,
      });
    } else {
      merged.push({
        clientId: null,
        accountName: partner.accountName,
        googleCustomerId: partner.googleCustomerId,
        googleCustomerLabel: formatGoogleAdsCustomerId(partner.googleCustomerId),
        googleAdsReportEnabled: false,
        googleAdsReportShowBottomline: false,
        googleAdsReportFeeEnabled: false,
        googleAdsReportFeePercent: 20,
        inApp: false,
        needsSetup: true,
        manager: partner.manager,
      });
    }
  }

  for (const client of configured) {
    if (!seen.has(String(client.googleCustomerId))) {
      merged.push({ ...clientPublicFields(client), partnerSource: 'app-only' });
    }
  }

  let clients = merged;
  if (filter === 'enabled') clients = merged.filter((row) => row.googleAdsReportEnabled);
  if (filter === 'needs-setup') clients = merged.filter((row) => row.needsSetup);
  clients.sort((a, b) => String(a.accountName).localeCompare(String(b.accountName)));

  const { mapGoogleToMetaLinkNames } = require('./report-link');
  const metaNames = await mapGoogleToMetaLinkNames(clients);
  clients = clients.map((client) => (
    client.linkedMetaClientId
      ? {
        ...client,
        linkedMetaAccountName: metaNames.get(String(client.linkedMetaClientId)) || client.linkedMetaClientId,
      }
      : client
  ));

  return {
    summary: {
      partnerAccountCount: partnerFetch.accounts.length,
      inAppCount: merged.filter((row) => row.inApp).length,
      enabledCount: merged.filter((row) => row.googleAdsReportEnabled).length,
      needsSetupCount: merged.filter((row) => row.needsSetup).length,
      visibleCount: clients.length,
    },
    clients,
    google: {
      partnerFetchError: partnerFetch.error,
      debug: partnerFetch.debug,
    },
  };
}

function monthStoreKey(clientId, monthKey) {
  return `${clientId}::${monthKey}`;
}

async function getMonthRecord(clientId, monthKey) {
  const id = String(clientId);
  const key = parseMonthKey(monthKey);
  if (!usePostgres()) {
    return monthRowToRecord(readFileStore().months[monthStoreKey(id, key)] || null);
  }
  const rows = await query`
    SELECT * FROM google_ads_report_months
    WHERE client_id = ${id} AND month_key = ${key}
    LIMIT 1
  `;
  return monthRowToRecord(rows[0] || null);
}

async function ensureMonthRecord(clientId, monthKey, client) {
  const id = String(clientId);
  const key = parseMonthKey(monthKey);
  const existing = await getMonthRecord(id, key);
  if (existing) {
    if (!monthPeriodMatchesKey(key, existing.periodStart, existing.periodEnd)) {
      const bounds = monthBoundsIso(key);
      if (!usePostgres()) {
        const store = readFileStore();
        const storeKey = monthStoreKey(id, key);
        store.months[storeKey] = {
          ...store.months[storeKey],
          period_start: bounds.start,
          period_end: bounds.end,
          updated_at: new Date().toISOString(),
        };
        writeFileStore(store);
      } else {
        await query`
          UPDATE google_ads_report_months SET
            period_start = ${bounds.start},
            period_end = ${bounds.end},
            updated_at = NOW()
          WHERE client_id = ${id} AND month_key = ${key}
        `;
      }
      return getMonthRecord(id, key);
    }
    return existing;
  }

  const bounds = monthBoundsIso(key);
  const row = {
    client_id: id,
    month_key: key,
    period_start: bounds.start,
    period_end: bounds.end,
    google_spend: null,
    google_budget: null,
    google_impressions: null,
    google_clicks: null,
    google_conversions: null,
    google_sales: null,
    google_conversions_value: null,
    google_fetched_at: null,
    won_leads: client?.defaultWonLeads ?? null,
    avg_lead_value: client?.defaultAvgLeadValue ?? null,
    avg_profit_per_won: client?.defaultAvgProfitPerWon ?? null,
    published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (!usePostgres()) {
    const store = readFileStore();
    store.months[monthStoreKey(id, key)] = row;
    writeFileStore(store);
    return monthRowToRecord(row);
  }

  const rows = await query`
    INSERT INTO google_ads_report_months (
      client_id, month_key, period_start, period_end,
      won_leads, avg_lead_value, avg_profit_per_won
    ) VALUES (
      ${id}, ${key}, ${bounds.start}, ${bounds.end},
      ${row.won_leads}, ${row.avg_lead_value}, ${row.avg_profit_per_won}
    )
    RETURNING *
  `;
  return monthRowToRecord(rows[0]);
}

async function saveGoogleAdsSnapshot(clientId, monthKey, snapshot = {}) {
  const id = String(clientId);
  const key = parseMonthKey(monthKey);
  const now = new Date().toISOString();

  if (!usePostgres()) {
    const store = readFileStore();
    const storeKey = monthStoreKey(id, key);
    const prev = store.months[storeKey];
    if (!prev) return null;
    store.months[storeKey] = {
      ...prev,
      google_spend: snapshot.spend ?? null,
      google_budget: snapshot.budget ?? null,
      google_impressions: snapshot.impressions ?? null,
      google_clicks: snapshot.clicks ?? null,
      google_conversions: snapshot.conversions ?? null,
      google_sales: snapshot.sales ?? null,
      google_conversions_value: snapshot.conversionsValue ?? null,
      google_fetched_at: now,
      updated_at: now,
    };
    writeFileStore(store);
    return monthRowToRecord(store.months[storeKey]);
  }

  const rows = await query`
    UPDATE google_ads_report_months SET
      google_spend = ${snapshot.spend ?? null},
      google_budget = ${snapshot.budget ?? null},
      google_impressions = ${snapshot.impressions ?? null},
      google_clicks = ${snapshot.clicks ?? null},
      google_conversions = ${snapshot.conversions ?? null},
      google_sales = ${snapshot.sales ?? null},
      google_conversions_value = ${snapshot.conversionsValue ?? null},
      google_fetched_at = NOW(),
      updated_at = NOW()
    WHERE client_id = ${id} AND month_key = ${key}
    RETURNING *
  `;
  return monthRowToRecord(rows[0] || null);
}

function parseOptionalNumber(value) {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function saveGoogleAdsMonthRecord(clientId, monthKey, input = {}) {
  const client = await getGoogleAdsReportClient(clientId);
  if (!client) {
    const error = new Error('Google Ads client not found.');
    error.statusCode = 404;
    throw error;
  }
  const existing = await ensureMonthRecord(client.clientId, monthKey, client);
  const bounds = monthBoundsIso(existing.monthKey);
  const periodStart = bounds.start;
  const periodEnd = bounds.end;
  const wonLeads = input.wonLeads !== undefined ? parseOptionalNumber(input.wonLeads) : existing.wonLeads;
  const avgLeadValue = input.avgLeadValue !== undefined
    ? parseOptionalNumber(input.avgLeadValue)
    : existing.avgLeadValue;
  const avgProfitPerWon = input.avgProfitPerWon !== undefined
    ? parseOptionalNumber(input.avgProfitPerWon)
    : existing.avgProfitPerWon;
  const published = input.published != null ? Boolean(input.published) : existing.published !== false;
  const now = new Date().toISOString();

  if (!usePostgres()) {
    const store = readFileStore();
    const storeKey = monthStoreKey(client.clientId, existing.monthKey);
    store.months[storeKey] = {
      ...store.months[storeKey],
      period_start: periodStart,
      period_end: periodEnd,
      won_leads: wonLeads,
      avg_lead_value: avgLeadValue,
      avg_profit_per_won: avgProfitPerWon,
      published,
      updated_at: now,
    };
    writeFileStore(store);
    return monthRowToRecord(store.months[storeKey]);
  }

  const rows = await query`
    UPDATE google_ads_report_months SET
      period_start = ${periodStart},
      period_end = ${periodEnd},
      won_leads = ${wonLeads},
      avg_lead_value = ${avgLeadValue},
      avg_profit_per_won = ${avgProfitPerWon},
      published = ${published},
      updated_at = NOW()
    WHERE client_id = ${client.clientId} AND month_key = ${existing.monthKey}
    RETURNING *
  `;
  return monthRowToRecord(rows[0]);
}

async function yearHasReportData(clientId, year) {
  const prefix = `${Number(year)}-`;
  if (!usePostgres()) {
    return Object.values(readFileStore().months || {}).some((row) => (
      row.client_id === clientId
      && String(row.month_key || '').startsWith(prefix)
      && row.google_fetched_at
    ));
  }
  const rows = await query`
    SELECT google_fetched_at
    FROM google_ads_report_months
    WHERE client_id = ${clientId} AND month_key LIKE ${`${prefix}%`}
  `;
  return rows.some((row) => row.google_fetched_at);
}

async function listGoogleAdsReportEnabledClientIds() {
  const clients = await listGoogleAdsReportClients({ filter: 'enabled' });
  return clients.map((row) => row.clientId);
}

module.exports = {
  clampReportYear,
  clientPublicFields,
  ensureGoogleAdsReportShareLink,
  ensureMonthRecord,
  getAllowedReportYears,
  getGoogleAdsReportClient,
  getGoogleAdsReportClientByAccessToken,
  getGoogleAdsReportClientByCustomerId,
  getGoogleAdsReportClientByLinkedMetaClientId,
  getGoogleAdsReportsDashboard,
  getMonthRecord,
  getYearMonthKeys,
  googleAdsClientIdFromCustomer,
  googleAdsReportUrl,
  listGoogleAdsReportClients,
  listGoogleAdsReportEnabledClientIds,
  monthPeriodMatchesKey,
  parseMonthKey,
  provisionGoogleAdsReportClient,
  resolveGoogleAdsReportSlug,
  saveGoogleAdsMonthRecord,
  saveGoogleAdsSnapshot,
  updateGoogleAdsReportSettings,
  yearHasReportData,
};
