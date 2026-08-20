const { handleHealthRequest } = require('../lib/health-handler');

module.exports = async function healthHandler(request, response) {
  const query = request.query || {};
  if (String(query.debugOAuth || '') === '1') {
    response.status(200).json({
      url: request.url,
      queryKeys: Object.keys(query),
      hasCode: Boolean(query.code),
      directCodeType: typeof query.code,
      inQueryCode: 'code' in query,
      headerHint: Object.keys(request.headers || {}).filter((name) => /invoke|forwarded|query|url/i.test(name)),
      invokeQueryPresent: Boolean(request.headers?.['x-invoke-query'] || request.headers?.['X-Invoke-Query']),
    });
    return;
  }
  await handleHealthRequest(response, request);
};
