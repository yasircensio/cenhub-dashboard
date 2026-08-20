const { handleAuthRequest } = require('../lib/auth-handler');
const { wrapAuthRequest } = require('../lib/google-ads-oauth-request');

module.exports = async function authPathHandler(request, response) {
  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  const segments = request.query.path || [];
  const suffix = Array.isArray(segments) ? segments.join('/') : String(segments || '');
  const pathname = suffix ? `/api/auth/${suffix}` : '/api/auth';
  const wrapped = wrapAuthRequest(request, pathname);

  await handleAuthRequest(wrapped, response);
};
