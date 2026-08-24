const crypto = require('crypto');
const { query, usePostgres } = require('./db');
const { timingSafeEquals } = require('./client-access');
const {
  getAccount,
  listClientIds,
  suggestSlugFromName,
  normalizeClientId,
  isValidSlug,
} = require('./account-store');

const HYBRID_TOKEN_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*-\d{4}$/;

function randomReportSuffix() {
  return String(crypto.randomInt(0, 10000)).padStart(4, '0');
}

function reportSlugFromAccountName(accountName, fallbackClientId) {
  const trimmed = String(accountName || '').trim();
  let slug = trimmed ? suggestSlugFromName(trimmed) : suggestSlugFromName(fallbackClientId);
  if (!slug || slug.length < 2) {
    slug = suggestSlugFromName(fallbackClientId) || 'client';
  }
  if (slug.length > 44) {
    slug = slug.slice(0, 44).replace(/-$/, '');
  }
  return slug;
}

function normalizeReportSlug(value) {
  const slug = suggestSlugFromName(String(value || '').trim());
  if (!isValidSlug(slug)) return null;
  if (slug.length > 44) return slug.slice(0, 44).replace(/-$/, '');
  return slug;
}

function resolveReportSlug(account) {
  if (!account) return null;
  if (account.metaReportSlug) return account.metaReportSlug;
  const parsed = parseHybridReportToken(account.metaReportAccessToken);
  return parsed?.slug || null;
}

function buildReportAccessToken(slug, suffix) {
  return `${slug}-${suffix}`;
}

function parseHybridReportToken(token) {
  const normalized = String(token || '').trim();
  const match = normalized.match(/^(.+)-(\d{4})$/);
  if (!match || !HYBRID_TOKEN_PATTERN.test(normalized)) return null;
  return { slug: match[1], suffix: match[2] };
}

function isHybridReportToken(token) {
  return HYBRID_TOKEN_PATTERN.test(String(token || '').trim());
}

function isLegacyReportToken(token) {
  const normalized = String(token || '').trim();
  if (!normalized) return false;
  return !isHybridReportToken(normalized);
}

async function isReportTokenTaken(token, excludeClientId = null) {
  const normalized = String(token || '').trim();
  if (!normalized) return false;
  const excluded = excludeClientId ? normalizeClientId(excludeClientId) : null;

  if (!usePostgres()) {
    const ids = await listClientIds();
    for (const clientId of ids) {
      if (excluded && clientId === excluded) continue;
      const account = await getAccount(clientId);
      if (!account?.metaReportAccessToken) continue;
      if (timingSafeEquals(account.metaReportAccessToken, normalized)) return true;
    }
    try {
      const fs = require('fs');
      const path = require('path');
      const dataFile = path.join(__dirname, '..', '.data', 'google-ads-reports-store.json');
      if (fs.existsSync(dataFile)) {
        const parsed = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        for (const row of Object.values(parsed.clients || {})) {
          if (excluded && row.id === excluded) continue;
          if (!row.access_token) continue;
          if (timingSafeEquals(row.access_token, normalized)) return true;
        }
      }
    } catch {
      // Google Ads store unavailable in this context.
    }
    return false;
  }

  const rows = await query`
    SELECT client_id
    FROM accounts
    WHERE meta_report_access_token = ${normalized}
    LIMIT 1
  `;
  if (rows[0]) {
    if (!excluded || rows[0].client_id !== excluded) return true;
  }

  const googleRows = await query`
    SELECT id
    FROM google_ads_report_clients
    WHERE access_token = ${normalized}
    LIMIT 1
  `;
  if (!googleRows[0]) return false;
  if (excluded && googleRows[0].id === excluded) return false;
  return true;
}

async function isReportSlugTaken(slug, excludeClientId = null) {
  const normalized = normalizeReportSlug(slug);
  if (!normalized) return false;
  const excluded = excludeClientId ? normalizeClientId(excludeClientId) : null;

  if (!usePostgres()) {
    const ids = await listClientIds();
    for (const clientId of ids) {
      if (excluded && clientId === excluded) continue;
      const account = await getAccount(clientId);
      const existing = resolveReportSlug(account);
      if (existing && existing === normalized) return true;
    }
    try {
      const fs = require('fs');
      const path = require('path');
      const dataFile = path.join(__dirname, '..', '.data', 'google-ads-reports-store.json');
      if (fs.existsSync(dataFile)) {
        const parsed = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        for (const row of Object.values(parsed.clients || {})) {
          if (excluded && row.id === excluded) continue;
          const existingSlug = row.report_slug
            || parseHybridReportToken(row.access_token)?.slug
            || null;
          if (existingSlug === normalized) return true;
        }
      }
    } catch {
      // Google Ads store unavailable in this context.
    }
    return false;
  }

  const rows = await query`
    SELECT client_id
    FROM accounts
    WHERE meta_report_slug = ${normalized}
    LIMIT 1
  `;
  if (rows[0]) {
    if (!excluded || rows[0].client_id !== excluded) return true;
  }

  const googleRows = await query`
    SELECT id
    FROM google_ads_report_clients
    WHERE report_slug = ${normalized}
    LIMIT 1
  `;
  if (!googleRows[0]) return false;
  if (excluded && googleRows[0].id === excluded) return false;
  return true;
}

async function buildUniqueReportToken(slug, excludeClientId) {
  const normalizedSlug = normalizeReportSlug(slug);
  if (!normalizedSlug) {
    const error = new Error('Invalid report link slug.');
    error.statusCode = 400;
    throw error;
  }
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const token = buildReportAccessToken(normalizedSlug, randomReportSuffix());
    if (!(await isReportTokenTaken(token, excludeClientId))) return token;
  }
  const error = new Error('Could not generate a unique report link.');
  error.statusCode = 500;
  throw error;
}

async function rebuildReportTokenWithSlug(currentToken, newSlug, excludeClientId) {
  const normalizedSlug = normalizeReportSlug(newSlug);
  if (!normalizedSlug) {
    const error = new Error('Invalid report link slug.');
    error.statusCode = 400;
    throw error;
  }
  const parsed = parseHybridReportToken(currentToken);
  const suffix = parsed?.suffix || randomReportSuffix();
  const token = buildReportAccessToken(normalizedSlug, suffix);
  const normalizedCurrent = String(currentToken || '').trim();
  if (token === normalizedCurrent) return token;
  if (await isReportTokenTaken(token, excludeClientId)) {
    const error = new Error('That report link is already in use.');
    error.statusCode = 409;
    throw error;
  }
  return token;
}

async function generateReportAccessToken(accountName, { excludeClientId, slug } = {}) {
  const resolvedSlug = slug
    ? normalizeReportSlug(slug)
    : reportSlugFromAccountName(accountName, excludeClientId);
  if (!resolvedSlug) {
    const error = new Error('Invalid report link slug.');
    error.statusCode = 400;
    throw error;
  }
  return buildUniqueReportToken(resolvedSlug, excludeClientId);
}

async function rotateReportAccessToken(currentToken, accountName, excludeClientId, storedSlug = null) {
  const parsed = parseHybridReportToken(currentToken);
  const slug = storedSlug
    ? normalizeReportSlug(storedSlug)
    : (parsed?.slug || reportSlugFromAccountName(accountName, excludeClientId));
  if (!slug) {
    const error = new Error('Invalid report link slug.');
    error.statusCode = 400;
    throw error;
  }
  const normalizedCurrent = String(currentToken || '').trim();

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const token = buildReportAccessToken(slug, randomReportSuffix());
    if (token === normalizedCurrent) continue;
    if (!(await isReportTokenTaken(token, excludeClientId))) return token;
  }

  const error = new Error('Could not rotate report link.');
  error.statusCode = 500;
  throw error;
}

async function getAccountByReportToken(token) {
  const normalized = String(token || '').trim();
  if (!normalized) return null;

  if (!usePostgres()) {
    const ids = await listClientIds();
    for (const clientId of ids) {
      const account = await getAccount(clientId);
      if (!account?.metaReportEnabled) continue;
      if (!account.metaReportAccessToken) continue;
      if (timingSafeEquals(account.metaReportAccessToken, normalized)) {
        return account;
      }
    }
    return null;
  }

  const rows = await query`
    SELECT client_id
    FROM accounts
    WHERE meta_report_access_token = ${normalized}
      AND meta_report_enabled = TRUE
    LIMIT 1
  `;

  if (!rows[0]) return null;
  return getAccount(rows[0].client_id);
}

async function getGoogleAdsClientByReportToken(token) {
  const normalized = String(token || '').trim();
  if (!normalized) return null;
  const { getGoogleAdsReportClientByAccessToken } = require('./google-ads-report-store');
  return getGoogleAdsReportClientByAccessToken(normalized);
}

async function requireReportAccess(token) {
  const account = await getAccountByReportToken(token);
  if (account?.metaReportEnabled) return account;

  const googleClient = await getGoogleAdsClientByReportToken(token);
  if (googleClient?.enabled) {
    return {
      clientId: googleClient.clientId,
      accountName: googleClient.accountName,
      reportKind: 'google-ads',
      googleClient,
    };
  }

  const error = new Error('Report not found.');
  error.statusCode = 404;
  throw error;
}

module.exports = {
  HYBRID_TOKEN_PATTERN,
  buildReportAccessToken,
  buildUniqueReportToken,
  generateReportAccessToken,
  getAccountByReportToken,
  getGoogleAdsClientByReportToken,
  isHybridReportToken,
  isLegacyReportToken,
  isReportSlugTaken,
  isReportTokenTaken,
  normalizeReportSlug,
  parseHybridReportToken,
  randomReportSuffix,
  rebuildReportTokenWithSlug,
  reportSlugFromAccountName,
  requireReportAccess,
  resolveReportSlug,
  rotateReportAccessToken,
};
