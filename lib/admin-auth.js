const crypto = require('crypto');
const { isAdminAuthorized, timingSafeStringEquals, getAdminApiKey } = require('./admin-auth-legacy');
const { resolveStaffUser } = require('./auth-handler');

async function getStaffUserFromRequest(request = {}) {
  try {
    const sessionUser = await resolveStaffUser(request);
    if (sessionUser) return sessionUser;
  } catch {
    // DATABASE_URL missing — fall through to legacy API key if configured
  }

  const headers = request.headers || {};
  if (isAdminAuthorized(headers)) {
    return {
      id: 'legacy-api-key',
      email: 'api-key@legacy.local',
      name: 'API Key Admin',
      role: 'admin',
      status: 'active',
      legacy: true,
    };
  }

  return null;
}

async function requireStaffSession(request = {}, options = {}) {
  const user = await getStaffUserFromRequest(request);
  if (!user) {
    const error = new Error('Unauthorized.');
    error.statusCode = 401;
    throw error;
  }
  if (options.adminOnly && user.role !== 'admin') {
    const error = new Error('Admin access required.');
    error.statusCode = 403;
    throw error;
  }
  return user;
}

module.exports = {
  getStaffUserFromRequest,
  requireStaffSession,
  timingSafeStringEquals,
  isAdminAuthorized,
  getAdminApiKey,
};
