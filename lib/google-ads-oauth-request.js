function parseInvokeQuery(headerValue) {
  if (!headerValue) return {};
  try {
    const decoded = decodeURIComponent(String(headerValue));
    const parsed = JSON.parse(decoded);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function appendSearchParams(target, search) {
  if (!search) return;
  const raw = String(search).startsWith('?') ? String(search).slice(1) : String(search);
  for (const [key, value] of new URLSearchParams(raw)) {
    if (target[key] == null || target[key] === '') target[key] = value;
  }
}

function collectVercelQuery(request = {}) {
  const merged = {};
  const query = request.query;
  if (query && typeof query === 'object') {
    for (const [key, value] of Object.entries(query)) {
      if (value == null || value === '') continue;
      merged[key] = value;
    }
  }

  const headers = request.headers || {};
  Object.assign(merged, parseInvokeQuery(headers['x-invoke-query'] || headers['X-Invoke-Query']));

  const uriCandidates = [
    request.url,
    request.originalUrl,
    request.path,
    headers['x-forwarded-uri'],
    headers['x-vercel-forwarded-uri'],
    headers['x-invoke-path'],
  ];
  for (const candidate of uriCandidates) {
    if (!candidate) continue;
    const raw = String(candidate);
    const searchIndex = raw.indexOf('?');
    if (searchIndex >= 0) appendSearchParams(merged, raw.slice(searchIndex + 1));
  }

  return merged;
}

function wrapAuthRequest(request, pathname) {
  const query = collectVercelQuery(request);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (key === 'path') continue;
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry != null && entry !== '') params.append(key, String(entry));
      });
      continue;
    }
    if (value != null && value !== '') params.set(key, String(value));
  }
  const queryString = params.toString() ? `?${params.toString()}` : '';
  const headers = request.headers || {};
  const debug = {
    rawUrl: String(request.url || ''),
    queryKeysAtEntry: Object.keys(request.query || {}),
    hasCode: Boolean(query.code),
    hasState: Boolean(query.state),
    invokeQueryPresent: Boolean(headers['x-invoke-query'] || headers['X-Invoke-Query']),
    invokeQueryKeys: Object.keys(parseInvokeQuery(headers['x-invoke-query'] || headers['X-Invoke-Query'])),
    headerHint: Object.keys(headers).filter((name) => /invoke|forwarded|query|url/i.test(name)),
    queryStringBuilt: queryString,
  };

  return {
    method: request.method,
    headers: request.headers,
    body: request.body,
    query,
    url: `${pathname}${queryString}`,
    originalUrl: request.originalUrl || request.url,
    _debugCatchAll: debug,
  };
}

module.exports = {
  parseInvokeQuery,
  collectVercelQuery,
  wrapAuthRequest,
};
