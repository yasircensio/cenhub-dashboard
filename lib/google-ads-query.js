const { getGoogleAdsAccessToken } = require('./google-ads-auth');
const {
  assertGoogleAdsQueryConfig,
  getGoogleAdsConfig,
  normalizeGoogleAdsCustomerId,
} = require('./google-ads-config');

function buildGoogleAdsSearchUrl(customerId, config = getGoogleAdsConfig()) {
  const id = normalizeGoogleAdsCustomerId(customerId);
  if (!id) {
    throw new Error('Google Ads customer ID must be 10 digits, e.g. 9103268801.');
  }
  return `https://googleads.googleapis.com/${config.apiVersion}/customers/${id}/googleAds:search`;
}

function buildGoogleAdsHeaders(accessToken, config = getGoogleAdsConfig(), loginCustomerId = config.loginCustomerId) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'developer-token': config.developerToken,
    'Content-Type': 'application/json',
  };
  const loginId = normalizeGoogleAdsCustomerId(loginCustomerId);
  if (loginId) {
    headers['login-customer-id'] = loginId;
  }
  return headers;
}

function parseGoogleAdsErrorBody(data, statusCode) {
  const error = data?.error || {};
  const details = Array.isArray(error.details) ? error.details : [];
  const requestErrors = [];
  details.forEach((detail) => {
    const failures = detail?.errors || [];
    failures.forEach((entry) => {
      if (entry?.message) requestErrors.push(entry.message);
    });
  });
  const message = requestErrors[0]
    || error.message
    || (typeof data === 'string' && data.trim() ? data.slice(0, 180) : null)
    || (statusCode ? `Google Ads API request failed (HTTP ${statusCode}).` : 'Google Ads API request failed.');
  return message;
}

function extractGoogleAdsErrorMeta(data) {
  const failures = [];
  const details = Array.isArray(data?.error?.details) ? data.error.details : [];
  details.forEach((detail) => {
    (detail?.errors || []).forEach((entry) => {
      failures.push({
        message: entry?.message || null,
        errorCode: entry?.errorCode || null,
      });
    });
  });
  return {
    httpMessage: data?.error?.message || null,
    status: data?.error?.status || null,
    failures,
  };
}

async function searchGoogleAds(customerId, query, options = {}) {
  const config = assertGoogleAdsQueryConfig(options.config || getGoogleAdsConfig());
  const gaql = String(query || '').trim();
  if (!gaql) {
    throw new Error('GAQL query is required.');
  }

  const { accessToken } = options.accessToken
    ? { accessToken: options.accessToken }
    : await getGoogleAdsAccessToken(config);

  const url = buildGoogleAdsSearchUrl(customerId, config);
  let loginCustomerId = normalizeGoogleAdsCustomerId(
    options.loginCustomerId || config.loginCustomerId,
  );
  if (!loginCustomerId && !options.skipLoginResolve) {
    loginCustomerId = await resolveGoogleAdsLoginCustomerId(config, { ...options, accessToken });
  }
  const headers = buildGoogleAdsHeaders(accessToken, config, loginCustomerId);
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: gaql }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(parseGoogleAdsErrorBody(data, response.status));
    error.statusCode = response.status;
    error.details = data;
    error.googleErrorMeta = extractGoogleAdsErrorMeta(data);
    throw error;
  }
  return data.results || [];
}

function microsToCurrency(micros) {
  const value = Number(micros);
  if (!Number.isFinite(value)) return 0;
  return Math.round((value / 1_000_000) * 100) / 100;
}

function aggregateGoogleAdsCustomerRows(rows = []) {
  const totals = {
    impressions: 0,
    clicks: 0,
    spend: 0,
    conversions: 0,
    conversionsValue: 0,
  };

  rows.forEach((row) => {
    const metrics = row.metrics || {};
    totals.impressions += Number(metrics.impressions) || 0;
    totals.clicks += Number(metrics.clicks) || 0;
    totals.spend += microsToCurrency(metrics.costMicros ?? metrics.cost_micros);
    totals.conversions += Number(metrics.conversions) || 0;
    totals.conversionsValue += Number(metrics.conversionsValue ?? metrics.conversions_value) || 0;
  });

  totals.ctr = totals.impressions > 0
    ? Math.round((totals.clicks / totals.impressions) * 10000) / 100
    : 0;
  totals.cpm = totals.impressions > 0
    ? Math.round((totals.spend / totals.impressions) * 1000 * 100) / 100
    : 0;
  totals.cpc = totals.clicks > 0
    ? Math.round((totals.spend / totals.clicks) * 100) / 100
    : 0;

  return totals;
}

const DEFAULT_CUSTOMER_METRICS_QUERY = `
SELECT
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros,
  metrics.ctr,
  metrics.average_cpm,
  metrics.average_cpc,
  metrics.conversions,
  metrics.conversions_value
FROM customer
WHERE segments.date DURING LAST_30_DAYS
`.trim();

function monthRangeMetricsQuery(startDate, endDate) {
  return `
SELECT
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros,
  metrics.conversions,
  metrics.conversions_value
FROM customer
WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
`.trim();
}

async function fetchGoogleAdsCustomerMetrics(customerId, options = {}) {
  const query = options.query || DEFAULT_CUSTOMER_METRICS_QUERY;
  const rows = await searchGoogleAds(customerId, query, options);
  return {
    customerId: normalizeGoogleAdsCustomerId(customerId),
    rowCount: rows.length,
    query,
    totals: aggregateGoogleAdsCustomerRows(rows),
    rows,
  };
}

async function fetchGoogleAdsMonthMetrics(customerId, startDate, endDate, options = {}) {
  const query = monthRangeMetricsQuery(startDate, endDate);
  const result = await fetchGoogleAdsCustomerMetrics(customerId, { ...options, query });
  let budget = 0;
  try {
    budget = await fetchGoogleAdsMonthlyBudget(customerId, startDate, endDate, options);
  } catch {
    budget = 0;
  }
  return {
    ...result,
    totals: {
      ...result.totals,
      budget,
      sales: 0,
    },
  };
}

function daysInclusive(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 30;
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
}

async function fetchGoogleAdsMonthlyBudget(customerId, startDate, endDate, options = {}) {
  const rows = await searchGoogleAds(customerId, `
SELECT
  campaign_budget.amount_micros,
  campaign_budget.period,
  campaign.status
FROM campaign
WHERE campaign.status = 'ENABLED'
`.trim(), options);

  let dailyMicros = 0;
  rows.forEach((row) => {
    const amount = Number(row.campaignBudget?.amountMicros ?? row.campaign_budget?.amount_micros) || 0;
    const period = String(row.campaignBudget?.period || row.campaign_budget?.period || 'DAILY').toUpperCase();
    if (period === 'CUSTOM_PERIOD') return;
    dailyMicros += amount;
  });
  return Math.round(microsToCurrency(dailyMicros) * daysInclusive(startDate, endDate) * 100) / 100;
}

function customerClientRowToAccount(row) {
  const client = row.customerClient || row.customer_client || {};
  const googleCustomerId = normalizeGoogleAdsCustomerId(client.id);
  if (!googleCustomerId) return null;
  return {
    googleCustomerId,
    accountName: String(client.descriptiveName || client.descriptive_name || googleCustomerId).trim(),
    manager: Boolean(client.manager),
    status: client.status || null,
    currencyCode: client.currencyCode || client.currency_code || null,
  };
}

async function listAccessibleCustomerIds(options = {}) {
  const config = assertGoogleAdsQueryConfig(options.config || getGoogleAdsConfig());
  const { accessToken } = options.accessToken
    ? { accessToken: options.accessToken }
    : await getGoogleAdsAccessToken(config);

  const url = `https://googleads.googleapis.com/${config.apiVersion}/customers:listAccessibleCustomers`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'developer-token': config.developerToken,
  };
  const response = await fetch(url, { method: 'GET', headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(parseGoogleAdsErrorBody(data, response.status));
    error.statusCode = response.status;
    error.details = data;
    error.googleErrorMeta = extractGoogleAdsErrorMeta(data);
    throw error;
  }
  return (data.resourceNames || [])
    .map((name) => normalizeGoogleAdsCustomerId(String(name).replace(/^customers\//, '')))
    .filter(Boolean);
}

let cachedManagerLoginCustomerId = null;

async function resolveGoogleAdsLoginCustomerId(config, options = {}) {
  const explicit = normalizeGoogleAdsCustomerId(
    options.loginCustomerId || config.loginCustomerId,
  );
  if (explicit) return explicit;
  if (cachedManagerLoginCustomerId) return cachedManagerLoginCustomerId;

  const { readEnv } = require('./google-ads-config');
  const preferred = normalizeGoogleAdsCustomerId(readEnv('GOOGLE_ADS_TEST_CUSTOMER_ID'));
  const ids = await listAccessibleCustomerIds({
    ...options,
    config,
  });
  if (preferred && ids.includes(preferred)) {
    cachedManagerLoginCustomerId = preferred;
  } else {
    for (const id of ids) {
      try {
        const account = await fetchGoogleAdsCustomerName(id, {
          ...options,
          config,
          loginCustomerId: id,
          skipLoginResolve: true,
        });
        if (account.manager) {
          cachedManagerLoginCustomerId = id;
          break;
        }
      } catch {
        // Try the next directly accessible account.
      }
    }
    if (!cachedManagerLoginCustomerId && ids[0]) {
      cachedManagerLoginCustomerId = ids[0];
    }
  }
  return cachedManagerLoginCustomerId;
}

async function fetchGoogleAdsCustomerName(customerId, options = {}) {
  const rows = await searchGoogleAds(customerId, `
SELECT
  customer.id,
  customer.descriptive_name,
  customer.manager,
  customer.status
FROM customer
LIMIT 1
`.trim(), options);
  const customer = rows[0]?.customer || {};
  const id = normalizeGoogleAdsCustomerId(customer.id || customerId);
  return {
    googleCustomerId: id,
    accountName: String(customer.descriptiveName || customer.descriptive_name || id).trim(),
    manager: Boolean(customer.manager),
    status: customer.status || null,
  };
}

async function listCustomerClients(managerId, options = {}) {
  const id = normalizeGoogleAdsCustomerId(managerId);
  if (!id) return [];
  const rows = await searchGoogleAds(id, `
SELECT
  customer_client.id,
  customer_client.descriptive_name,
  customer_client.currency_code,
  customer_client.manager,
  customer_client.status,
  customer_client.level
FROM customer_client
WHERE customer_client.status != 'CANCELED'
`.trim(), {
    ...options,
    loginCustomerId: id,
  });
  return rows.map(customerClientRowToAccount).filter(Boolean);
}

function addGoogleAdsAccount(accounts, seen, account) {
  if (!account?.googleCustomerId || seen.has(account.googleCustomerId)) return;
  seen.add(account.googleCustomerId);
  accounts.push(account);
}

async function listGoogleAdsMccCustomers(options = {}) {
  const config = assertGoogleAdsQueryConfig(options.config || getGoogleAdsConfig());
  const accounts = [];
  const seen = new Set();

  async function ingestAccessibleId(id) {
    if (!id || seen.has(id)) return;
    try {
      const account = await fetchGoogleAdsCustomerName(id, {
        ...options,
        loginCustomerId: options.loginCustomerId || config.loginCustomerId || id,
      });
      if (account.manager) {
        const children = await listCustomerClients(id, options);
        children.forEach((child) => {
          if (!child.manager) addGoogleAdsAccount(accounts, seen, child);
        });
        return;
      }
      addGoogleAdsAccount(accounts, seen, account);
    } catch {
      addGoogleAdsAccount(accounts, seen, {
        googleCustomerId: id,
        accountName: id,
        manager: false,
        status: null,
      });
    }
  }

  if (config.loginCustomerId) {
    try {
      const children = await listCustomerClients(config.loginCustomerId, options);
      children.forEach((child) => {
        if (!child.manager) addGoogleAdsAccount(accounts, seen, child);
      });
    } catch {
      // Fall through to accessible customers.
    }
  }

  if (!accounts.length) {
    const ids = await listAccessibleCustomerIds(options);
    for (const id of ids) {
      await ingestAccessibleId(id);
    }
  }

  accounts.sort((a, b) => String(a.accountName).localeCompare(String(b.accountName)));
  return accounts;
}

const CONVERSION_ACTIONS_QUERY = `
SELECT
  conversion_action.id,
  conversion_action.name,
  conversion_action.type,
  conversion_action.category,
  conversion_action.status,
  conversion_action.primary_for_goal,
  conversion_action.origin,
  conversion_action.resource_name,
  conversion_action.tag_snippets
FROM conversion_action
WHERE conversion_action.status != 'REMOVED'
`.trim();

function parseGoogleAdsSendTo(tagSnippets = []) {
  const list = Array.isArray(tagSnippets) ? tagSnippets : [];
  for (const snippet of list) {
    const eventSnippet = snippet.eventSnippet || snippet.event_snippet || '';
    const match = String(eventSnippet).match(/AW-(\d+)\/([A-Za-z0-9_-]+)/);
    if (match) {
      return {
        awConversionId: match[1],
        conversionLabel: match[2],
        sendTo: `AW-${match[1]}/${match[2]}`,
      };
    }
  }
  return { awConversionId: null, conversionLabel: null, sendTo: null };
}

function classifyGoogleAdsConversionAction({ name = '', category = '' } = {}) {
  const cat = String(category || '').toUpperCase();
  if (cat === 'BOOK_APPOINTMENT') return 'appointment';
  if (cat === 'SUBMIT_LEAD_FORM' || cat === 'CONTACT') return 'contact_form';
  const label = String(name || '');
  if (/appointment|booking|booked|\bbook\b|aftale/i.test(label)) return 'appointment';
  if (/contact.?form|kontakt.?form|lead.?form|formular|inquiry|enquiry|kontakt/i.test(label)) {
    return 'contact_form';
  }
  return 'other';
}

function conversionActionRowToRecord(row = {}) {
  const action = row.conversionAction || row.conversion_action || {};
  const tagSnippets = action.tagSnippets || action.tag_snippets || [];
  const sendTo = parseGoogleAdsSendTo(tagSnippets);
  const name = String(action.name || '');
  const category = String(action.category || '');
  return {
    id: action.id != null ? String(action.id) : null,
    name,
    type: action.type || null,
    category: category || null,
    status: action.status || null,
    origin: action.origin || null,
    primaryForGoal: action.primaryForGoal ?? action.primary_for_goal ?? null,
    resourceName: action.resourceName || action.resource_name || null,
    kind: classifyGoogleAdsConversionAction({ name, category }),
    ...sendTo,
  };
}

async function listGoogleAdsConversionActions(customerId, options = {}) {
  const id = normalizeGoogleAdsCustomerId(customerId);
  if (!id) {
    throw new Error('Google Ads customer ID must be 10 digits.');
  }
  const rows = await searchGoogleAds(id, CONVERSION_ACTIONS_QUERY, options);
  return {
    customerId: id,
    conversionActions: rows.map(conversionActionRowToRecord),
  };
}

module.exports = {
  buildGoogleAdsSearchUrl,
  searchGoogleAds,
  microsToCurrency,
  aggregateGoogleAdsCustomerRows,
  fetchGoogleAdsCustomerMetrics,
  fetchGoogleAdsMonthMetrics,
  fetchGoogleAdsMonthlyBudget,
  listGoogleAdsMccCustomers,
  listAccessibleCustomerIds,
  listGoogleAdsConversionActions,
  classifyGoogleAdsConversionAction,
  parseGoogleAdsSendTo,
  CONVERSION_ACTIONS_QUERY,
  DEFAULT_CUSTOMER_METRICS_QUERY,
};
