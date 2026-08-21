const { handleGoogleAdsReportsRequest } = require('../../lib/google-ads-reports-handler');

module.exports = async function googleAdsReportsCatchAllHandler(request, response) {
  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  const suffix = request.query?.path;
  const basePath = '/api/google-ads-reports';
  const url = suffix
    ? `${basePath}/${Array.isArray(suffix) ? suffix.join('/') : suffix}`
    : basePath;

  await handleGoogleAdsReportsRequest({
    ...request,
    url,
    path: url,
  }, response);
};
