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
  let queryString = queryIndex >= 0 ? rawUrl.slice(queryIndex) : '';

  if (!queryString && request.query && typeof request.query === 'object') {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(request.query)) {
      if (key === 'path') continue;
      if (Array.isArray(value)) {
        value.forEach((entry) => {
          if (entry != null && entry !== '') params.append(key, String(entry));
        });
        continue;
      }
      if (value != null && value !== '') params.set(key, String(value));
    }
    const built = params.toString();
    if (built) queryString = `?${built}`;
  }

  if (queryString) {
    const params = new URLSearchParams(queryString.startsWith('?') ? queryString.slice(1) : queryString);
    request.query = { ...(request.query || {}) };
    for (const [key, value] of params.entries()) {
      request.query[key] = value;
    }
  }
  request.url = suffix ? `/api/auth/${suffix}${queryString}` : `/api/auth${queryString}`;

  await handleAuthRequest(request, response);
};
