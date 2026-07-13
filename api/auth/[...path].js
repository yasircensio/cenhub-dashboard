const { handleAuthRequest } = require('../lib/auth-handler');

module.exports = async function authPathHandler(request, response) {
  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  const segments = request.query.path || [];
  const suffix = Array.isArray(segments) ? segments.join('/') : String(segments || '');
  request.url = suffix ? `/api/auth/${suffix}` : '/api/auth';

  await handleAuthRequest(request, response);
};
