const crypto = require('crypto');
const { isAdminAuthorized } = require('./admin-auth');

function getAccessKeySecret() {
  return process.env.DASHBOARD_ACCESS_KEY_SECRET || '';
}

// Enforcement is opt-in: set DASHBOARD_ACCESS_KEY_SECRET and
// REQUIRE_CLIENT_ACCESS_KEY=1 to require per-client keys on read APIs.
function isAccessKeyEnforced() {
  return process.env.REQUIRE_CLIENT_ACCESS_KEY === '1' && Boolean(getAccessKeySecret());
}

function computeClientAccessKey(clientId) {
  const secret = getAccessKeySecret();
  if (!secret || !clientId) return '';
  return crypto
    .createHmac('sha256', secret)
    .update(String(clientId).toLowerCase())
    .digest('hex')
    .slice(0, 24);
}

function timingSafeEquals(a, b) {
  const bufA = Buffer.from(String(a || ''), 'utf8');
  const bufB = Buffer.from(String(b || ''), 'utf8');
  if (bufA.length === 0 || bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function extractProvidedKey(query = {}, headers = {}) {
  return query.key || query.access_key || headers['x-client-key'] || '';
}

function isClientAccessAuthorized(clientId, query = {}, headers = {}) {
  if (!isAccessKeyEnforced()) return true;
  if (isAdminAuthorized(headers)) return true;

  const expected = computeClientAccessKey(clientId);
  return Boolean(expected) && timingSafeEquals(extractProvidedKey(query, headers), expected);
}

function requireClientAccess(clientId, query = {}, headers = {}) {
  if (isClientAccessAuthorized(clientId, query, headers)) return;
  const error = new Error('Access denied. A valid access key is required for this dashboard.');
  error.statusCode = 403;
  throw error;
}

module.exports = {
  computeClientAccessKey,
  isAccessKeyEnforced,
  isClientAccessAuthorized,
  requireClientAccess,
  timingSafeEquals,
};
