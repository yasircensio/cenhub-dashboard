const crypto = require('crypto');

function getAdminApiKey() {
  return process.env.DASHBOARD_ADMIN_API_KEY || '';
}

function timingSafeStringEquals(a, b) {
  const bufA = Buffer.from(String(a || ''), 'utf8');
  const bufB = Buffer.from(String(b || ''), 'utf8');
  if (bufA.length === 0 || bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function isAdminAuthorized(headers = {}) {
  const configuredKey = getAdminApiKey();
  if (!configuredKey) return false;

  const headerKey = headers['x-api-key']
    || headers['X-Api-Key']
    || headers['x-admin-key']
    || headers['X-Admin-Key'];

  return timingSafeStringEquals(headerKey, configuredKey);
}

function requireAdmin(headers = {}) {
  if (!getAdminApiKey()) {
    const error = new Error('DASHBOARD_ADMIN_API_KEY is not configured.');
    error.statusCode = 503;
    throw error;
  }
  if (!isAdminAuthorized(headers)) {
    const error = new Error('Unauthorized.');
    error.statusCode = 401;
    throw error;
  }
}

module.exports = {
  getAdminApiKey,
  isAdminAuthorized,
  requireAdmin,
  timingSafeStringEquals,
};
