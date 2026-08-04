const { handleMetaReportsRequest } = require('../lib/meta-reports-handler');

module.exports = async function metaReportsCatchAllHandler(request, response) {
  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  const suffix = request.query?.path;
  const basePath = '/api/meta-reports';
  const url = suffix
    ? `${basePath}/${Array.isArray(suffix) ? suffix.join('/') : suffix}`
    : basePath;

  await handleMetaReportsRequest({
    ...request,
    url,
    path: url,
  }, response);
};
