module.exports = function debugOAuthRequest(request, response) {
  const safeHeaders = {};
  const allowed = ['host', 'x-forwarded-host', 'x-forwarded-proto', 'x-forwarded-uri',
    'x-vercel-forwarded-uri', 'x-vercel-deployment-url', 'x-vercel-id', 'content-type'];
  for (const h of allowed) {
    if (request.headers[h]) safeHeaders[h] = request.headers[h];
  }
  response.status(200).json({
    url: request.url,
    method: request.method,
    query: request.query,
    safeHeaders,
  });
};
