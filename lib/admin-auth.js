function getAdminApiKey() {
  return process.env.DASHBOARD_ADMIN_API_KEY || '';
}

function isAdminAuthorized(headers = {}) {
  const configuredKey = getAdminApiKey();
  if (!configuredKey) return false;

  const headerKey = headers['x-api-key']
    || headers['X-Api-Key']
    || headers['x-admin-key']
    || headers['X-Admin-Key'];

  return Boolean(headerKey && headerKey === configuredKey);
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
};
