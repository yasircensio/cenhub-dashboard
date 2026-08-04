const { handleMetaReportsRequest } = require('../lib/meta-reports-handler');

module.exports = async function metaReportsHandler(request, response) {
  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  await handleMetaReportsRequest(request, response);
};
