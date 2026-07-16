const { monthKeyFromDate } = require('./marketing-metrics');

const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v21.0';
const INSIGHT_FIELDS = 'spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,date_start,date_stop';
const MAX_PAGING_PAGES = 20;

function normalizeMetaAdAccountId(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  return raw.replace(/^act_/i, '');
}

function normalizeMetaAccessToken(value) {
  let token = String(value || '').trim();
  if (!token) return '';
  if (
    (token.startsWith('"') && token.endsWith('"'))
    || (token.startsWith("'") && token.endsWith("'"))
  ) {
    token = token.slice(1, -1).trim();
  }
  if (token.toLowerCase().startsWith('bearer ')) {
    token = token.slice(7).trim();
  }
  return token;
}

function validateMetaAccessToken(token) {
  const normalized = normalizeMetaAccessToken(token);
  if (!normalized) {
    return { ok: false, reason: 'Missing Meta system user access token.' };
  }
  if (/^\d{8,20}$/.test(normalized)) {
    return {
      ok: false,
      reason: 'This looks like a Meta App ID or Ad Account ID, not an access token. In Business Settings → System users → Generate token, copy the long token string (usually starts with EAA…).',
    };
  }
  if (normalized.length < 40) {
    return {
      ok: false,
      reason: 'Meta access token is too short. Paste the full System User token from Business Settings (not the App ID).',
    };
  }
  return { ok: true, token: normalized };
}

function parseGraphError(body, statusCode) {
  const message = body?.error?.message || body?.error?.error_user_msg || `Graph API HTTP ${statusCode}`;
  const code = body?.error?.code;
  if (code === 190) return new Error(`Meta access token invalid or expired: ${message}`);
  if (code === 200 && /valid app id/i.test(message)) {
    return new Error(
      'Meta rejected the access token (#200 Provide valid app ID). '
      + 'Use the System User token generated for the Cenhub Connection app in Business Settings — not the App ID, Ad Account ID, or Page ID.',
    );
  }
  if (code === 100 || code === 803) return new Error(`Meta ad account not accessible: ${message}`);
  if (code === 4 || code === 17 || code === 32) return new Error(`Meta rate limit: ${message}`);
  return new Error(message);
}

async function graphFetch(url, accessToken) {
  const token = normalizeMetaAccessToken(accessToken);
  const fullUrl = url.startsWith('http')
    ? url
    : `${url}${url.includes('?') ? '&' : '?'}access_token=${encodeURIComponent(token)}`;
  const response = await fetch(fullUrl, { method: 'GET' });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.error) {
    throw parseGraphError(body, response.status);
  }
  return body;
}

function insightRowToBucket(row) {
  if (!row) return null;
  return {
    spend: row.spend ?? '0',
    impressions: row.impressions ?? '0',
    clicks: row.clicks ?? '0',
    ctr: row.ctr ?? '0',
    cpc: row.cpc ?? '0',
    cpm: row.cpm ?? '0',
    reach: row.reach ?? '0',
    frequency: row.frequency ?? '0',
    date_start: row.date_start || null,
    date_stop: row.date_stop || null,
  };
}

function insightRowToMonthly(row) {
  if (!row) return null;
  const month = row.date_start ? monthKeyFromDate(row.date_start) : null;
  if (!month) return null;
  return {
    month,
    spend: row.spend ?? '0',
    impressions: row.impressions ?? '0',
    clicks: row.clicks ?? '0',
    ctr: row.ctr ?? '0',
    cpc: row.cpc ?? '0',
    date_start: row.date_start || null,
    date_stop: row.date_stop || null,
  };
}

async function fetchInsightsBucket(adAccountId, accessToken, { datePreset }) {
  const id = normalizeMetaAdAccountId(adAccountId);
  if (!id) {
    throw new Error('Meta ad account ID is required.');
  }
  const path = `https://graph.facebook.com/${GRAPH_VERSION}/act_${id}/insights?fields=${INSIGHT_FIELDS}&date_preset=${encodeURIComponent(datePreset)}`;
  const body = await graphFetch(path, accessToken);
  return insightRowToBucket(body.data?.[0]);
}

async function fetchMonthlyInsights(adAccountId, accessToken) {
  const id = normalizeMetaAdAccountId(adAccountId);
  if (!id) {
    throw new Error('Meta ad account ID is required.');
  }

  let url = `https://graph.facebook.com/${GRAPH_VERSION}/act_${id}/insights?fields=${INSIGHT_FIELDS}&time_increment=monthly&date_preset=maximum`;
  const rows = [];
  let pages = 0;

  while (url && pages < MAX_PAGING_PAGES) {
    const body = await graphFetch(url, accessToken);
    for (const row of body.data || []) {
      const monthly = insightRowToMonthly(row);
      if (monthly) rows.push(monthly);
    }
    url = body.paging?.next || null;
    pages += 1;
  }

  return rows;
}

async function fetchAllInsightsBuckets(adAccountId, accessToken) {
  const [thisMonth, lastMonth, yearly, monthly] = await Promise.all([
    fetchInsightsBucket(adAccountId, accessToken, { datePreset: 'this_month' }),
    fetchInsightsBucket(adAccountId, accessToken, { datePreset: 'last_month' }),
    fetchInsightsBucket(adAccountId, accessToken, { datePreset: 'this_year' }),
    fetchMonthlyInsights(adAccountId, accessToken),
  ]);

  return { this_month: thisMonth, last_month: lastMonth, yearly, monthly };
}

function transformToMetricsPayload(clientId, accountName, buckets) {
  const metricsKey = clientId;
  const payload = {
    client_id: metricsKey,
    account_name: accountName || metricsKey,
    currency: 'DKK',
  };

  if (buckets.this_month) payload.this_month = buckets.this_month;
  if (buckets.last_month) payload.last_month = buckets.last_month;
  if (buckets.yearly) payload.yearly = buckets.yearly;
  if (buckets.monthly?.length) payload.monthly = buckets.monthly;

  return payload;
}

module.exports = {
  MAX_PAGING_PAGES,
  fetchAllInsightsBuckets,
  fetchInsightsBucket,
  fetchMonthlyInsights,
  normalizeMetaAdAccountId,
  normalizeMetaAccessToken,
  transformToMetricsPayload,
  validateMetaAccessToken,
};
