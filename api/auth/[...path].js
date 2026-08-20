const { handleAuthRequest } = require('../lib/auth-handler');

module.exports = async function authPathHandler(request, response) {
  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  const segments = request.query.path || [];
  const suffix = Array.isArray(segments) ? segments.join('/') : String(segments || '');
  const rawUrl = String(request.url || '');
  const queryIndex = rawUrl.indexOf('?');
  const query = queryIndex >= 0 ? rawUrl.slice(queryIndex) : '';
  request.url = suffix ? `/api/auth/${suffix}${query}` : `/api/auth${query}`;

  await handleAuthRequest(request, response);
};
