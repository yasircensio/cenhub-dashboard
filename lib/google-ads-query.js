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

function buildGoogleAdsHeaders(accessToken, config = getGoogleAdsConfig()) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'developer-token': config.developerToken,
    'Content-Type': 'application/json',
  };
  if (config.loginCustomerId) {
    headers['login-customer-id'] = config.loginCustomerId;
  }
  return headers;
}

function parseGoogleAdsErrorBody(data) {
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
    || (typeof data === 'string' ? data : null)
    || 'Google Ads API request failed.';
  return message;
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
  const response = await fetch(url, {
    method: 'POST',
    headers: buildGoogleAdsHeaders(accessToken, config),
    body: JSON.stringify({ query: gaql }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(parseGoogleAdsErrorBody(data));
    error.statusCode = response.status;
    error.details = data;
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

module.exports = {
  buildGoogleAdsSearchUrl,
  searchGoogleAds,
  microsToCurrency,
  aggregateGoogleAdsCustomerRows,
  fetchGoogleAdsCustomerMetrics,
  DEFAULT_CUSTOMER_METRICS_QUERY,
};
