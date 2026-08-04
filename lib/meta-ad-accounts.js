const { graphFetch } = require('./meta-token');

const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v21.0';
const MAX_PAGES = 20;

function normalizeAdAccountId(value) {
  const raw = String(value || '').trim().replace(/^act_/i, '');
  return raw || null;
}

async function fetchPaged(url, accessToken, collectField = 'data') {
  const rows = [];
  let nextUrl = url;
  let pages = 0;

  while (nextUrl && pages < MAX_PAGES) {
    const body = await graphFetch(nextUrl, accessToken);
    const chunk = body[collectField] || body.data || [];
    rows.push(...chunk);
    nextUrl = body.paging?.next || null;
    pages += 1;
  }

  return rows;
}

async function resolveBusinessId(accessToken) {
  const configured = String(process.env.META_BUSINESS_ID || '').trim();
  if (configured) return configured;

  try {
    const url = `https://graph.facebook.com/${GRAPH_VERSION}/me/businesses?fields=id,name&limit=25`;
    const body = await graphFetch(url, accessToken);
    const businesses = body.data || [];
    if (businesses.length === 1) return businesses[0].id;
    if (businesses.length > 1) {
      const named = businesses.find((row) => /censio|cenhub/i.test(String(row.name || '')));
      return (named || businesses[0]).id;
    }
  } catch {
    // fall through
  }
  return null;
}

async function fetchBusinessAdAccountLists(accessToken, businessId) {
  const fields = 'id,account_id,name,account_status,currency';
  const ownedUrl = `https://graph.facebook.com/${GRAPH_VERSION}/${businessId}/owned_ad_accounts?fields=${fields}&limit=100`;
  const clientUrl = `https://graph.facebook.com/${GRAPH_VERSION}/${businessId}/client_ad_accounts?fields=${fields}&limit=100`;

  const [owned, clients] = await Promise.all([
    fetchPaged(ownedUrl, accessToken).catch(() => []),
    fetchPaged(clientUrl, accessToken).catch(() => []),
  ]);

  return { owned, clients };
}

function rowToPartnerAccount(row, source) {
  const accountId = normalizeAdAccountId(row.account_id || row.id);
  if (!accountId) return null;
  return {
    metaAdAccountId: accountId,
    accountName: String(row.name || accountId).trim(),
    accountStatus: row.account_status != null ? Number(row.account_status) : null,
    currency: row.currency || 'DKK',
    source,
  };
}

async function fetchPartnerAdAccounts(accessToken) {
  const businessId = await resolveBusinessId(accessToken);
  if (!businessId) {
    return {
      businessId: null,
      accounts: [],
      error: 'Set META_BUSINESS_ID in Vercel env, or ensure the token can read /me/businesses.',
    };
  }

  const { owned, clients } = await fetchBusinessAdAccountLists(accessToken, businessId);
  const byId = new Map();

  for (const row of owned) {
    const parsed = rowToPartnerAccount(row, 'owned');
    if (!parsed) continue;
    if (!byId.has(parsed.metaAdAccountId)) byId.set(parsed.metaAdAccountId, parsed);
  }
  for (const row of clients) {
    const parsed = rowToPartnerAccount(row, 'partner');
    if (!parsed) continue;
    if (!byId.has(parsed.metaAdAccountId)) byId.set(parsed.metaAdAccountId, parsed);
  }

  return {
    businessId,
    accounts: Array.from(byId.values()).sort((a, b) => a.accountName.localeCompare(b.accountName)),
    error: null,
  };
}

module.exports = {
  fetchPartnerAdAccounts,
  normalizeAdAccountId,
  resolveBusinessId,
};
