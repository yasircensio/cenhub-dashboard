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

  // #region agent log
  fetch('http://127.0.0.1:7412/ingest/8036624f-bbd1-4142-b516-bb72c323b06c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f182bb'},body:JSON.stringify({sessionId:'f182bb',location:'api/auth/[...path].js:A-entry',message:'catch-all entry',data:{rawUrl,queryFromRawUrl:queryString,queryKeys:Object.keys(request.query||{}),queryCode:(request.query||{}).code,queryState:(request.query||{}).state},timestamp:Date.now(),hypothesisId:'A-C'})}).catch(()=>{});
  // #endregion

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

  // #region agent log
  fetch('http://127.0.0.1:7412/ingest/8036624f-bbd1-4142-b516-bb72c323b06c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f182bb'},body:JSON.stringify({sessionId:'f182bb',location:'api/auth/[...path].js:B-after-set',message:'after url set',data:{finalUrl:request.url,queryStringBuilt:queryString,queryCode:(request.query||{}).code,queryState:(request.query||{}).state,urlWritable:request.url.includes('?')},timestamp:Date.now(),hypothesisId:'B-D'})}).catch(()=>{});
  // #endregion

  await handleAuthRequest(request, response);
};
