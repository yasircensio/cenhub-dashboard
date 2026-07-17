const API_BASE_URL = 'https://services.leadconnectorhq.com';
const API_VERSION = '2021-07-28';
const MAX_PAGES = 50;
const PAGE_LIMIT = 100;
const MAX_RETRIES = 4;
const RETRY_BASE_MS = 1500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableGhlError(status, body) {
  const text = String(body || '').toLowerCase();
  if (status === 429 || status >= 502) return true;
  if (status === 401 && (text.includes('timed out') || text.includes('timeout'))) return true;
  return false;
}

function formatGhlError(status, body) {
  let message = String(body || '').trim();
  try {
    const parsed = JSON.parse(message);
    message = parsed.message || message;
  } catch {
    // keep raw body
  }

  if (status === 401 && /timed out|timeout/i.test(message)) {
    return `GHL API timed out (returned 401). This is usually temporary — run the sync again. Detail: ${message}`;
  }
  if (status === 401) {
    return `GHL API rejected the token (401). Check CENHUB_PRIVATE_INTEGRATION_TOKEN in .env and re-run seed. Detail: ${message}`;
  }

  return `API error ${status}: ${message || body}`;
}

async function apiFetch(token, path, query = {}, attempt = 1) {
  const params = new URLSearchParams(query);
  const url = `${API_BASE_URL}${path}${params.toString() ? `?${params}` : ''}`;

  let response;
  try {
    response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Version: API_VERSION,
      },
    });
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      await sleep(RETRY_BASE_MS * attempt);
      return apiFetch(token, path, query, attempt + 1);
    }
    throw new Error(`GHL network error: ${error.message}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    if (isRetryableGhlError(response.status, errorText) && attempt < MAX_RETRIES) {
      await sleep(RETRY_BASE_MS * attempt);
      return apiFetch(token, path, query, attempt + 1);
    }
    throw new Error(formatGhlError(response.status, errorText));
  }

  return response.json();
}

async function fetchOpportunityPage(token, locationId, { startAfter, startAfterId }) {
  const params = {
    location_id: locationId,
    limit: String(PAGE_LIMIT),
    status: 'all',
  };
  if (startAfter) params.startAfter = String(startAfter);
  if (startAfterId) params.startAfterId = startAfterId;
  return apiFetch(token, '/opportunities/search', params);
}

async function fetchAllOpportunities(token, locationId) {
  const opportunities = [];
  let startAfter = null;
  let startAfterId = null;
  let truncated = false;

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const data = await fetchOpportunityPage(token, locationId, { startAfter, startAfterId });
    const pageOpportunities = data.opportunities || [];
    opportunities.push(...pageOpportunities);

    const meta = data.meta || {};
    if (pageOpportunities.length < PAGE_LIMIT || !meta.startAfter) break;
    if (page === MAX_PAGES) {
      truncated = true;
      break;
    }

    startAfter = meta.startAfter;
    startAfterId = meta.startAfterId || null;
  }

  if (truncated) {
    console.warn(
      `[ghl-sync] Opportunity fetch for location ${locationId} hit the ${MAX_PAGES * PAGE_LIMIT} record cap; data may be incomplete.`,
    );
  }

  return opportunities;
}

async function fetchPipelines(token, locationId) {
  const data = await apiFetch(token, '/opportunities/pipelines', { locationId });
  return (data.pipelines || []).map((pipeline) => ({
    id: pipeline.id,
    name: pipeline.name,
  }));
}

async function fetchContactCount(token, locationId) {
  const data = await apiFetch(token, '/contacts/', { locationId, limit: '1' });
  return Number(data.meta?.total) || 0;
}

async function fetchUsers(token, locationId) {
  const data = await apiFetch(token, '/users/', { locationId });
  return (data.users || []).map((user) => ({
    id: user.id,
    name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
  }));
}

async function fetchOpportunityCustomFieldDefinitions(token, locationId) {
  const data = await apiFetch(token, `/locations/${locationId}/customFields`, { model: 'opportunity' });
  return data.customFields || [];
}

const {
  enrichOpportunityCustomFields,
  resolveBundlinjeFieldId,
} = require('./bundlinje-field');

async function fetchGhlData(token, locationId) {
  // Fetch lighter endpoints first; opportunities search is the slowest call.
  const [pipelines, users, contactCount, customFieldDefinitions] = await Promise.all([
    fetchPipelines(token, locationId),
    fetchUsers(token, locationId),
    fetchContactCount(token, locationId),
    fetchOpportunityCustomFieldDefinitions(token, locationId).catch(() => []),
  ]);
  const opportunities = enrichOpportunityCustomFields(
    await fetchAllOpportunities(token, locationId),
    customFieldDefinitions,
  );
  const bundlinjeFieldId = resolveBundlinjeFieldId(customFieldDefinitions);

  return {
    fetchedAt: new Date().toISOString(),
    opportunities,
    pipelines,
    users,
    contactCount,
    bundlinjeFieldId,
    customFieldDefinitions,
  };
}

module.exports = {
  fetchAllOpportunities,
  fetchContactCount,
  fetchGhlData,
  fetchOpportunityCustomFieldDefinitions,
  fetchPipelines,
  fetchUsers,
  resolveBundlinjeFieldId,
};
