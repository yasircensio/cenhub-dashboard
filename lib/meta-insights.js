const { monthKeyFromDate } = require('./marketing-metrics');
const { graphFetch, parseGraphError } = require('./meta-token');

const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v21.0';
const INSIGHT_FIELDS = 'spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,date_start,date_stop';
const MAX_PAGING_PAGES = 20;

function normalizeMetaAdAccountId(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  return raw.replace(/^act_/i, '');
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
  const thisMonth = await fetchInsightsBucket(adAccountId, accessToken, { datePreset: 'this_month' });
  const lastMonth = await fetchInsightsBucket(adAccountId, accessToken, { datePreset: 'last_month' });
  const yearly = await fetchInsightsBucket(adAccountId, accessToken, { datePreset: 'this_year' });
  const monthly = await fetchMonthlyInsights(adAccountId, accessToken);

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
  transformToMetricsPayload,
  parseGraphError,
};
