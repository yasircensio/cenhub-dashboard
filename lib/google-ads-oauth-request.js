function mergeOAuthQueryString(request, pathname) {
  const rawUrl = String(request?.url || '');
  const queryIndex = rawUrl.indexOf('?');
  let queryString = queryIndex >= 0 ? rawUrl.slice(queryIndex) : '';

  if (!queryString && request?.query && typeof request.query === 'object') {
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

  return {
    ...request,
    url: `${pathname}${queryString}`,
  };
}

module.exports = {
  mergeOAuthQueryString,
};
