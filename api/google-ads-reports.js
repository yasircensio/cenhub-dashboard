const { handleGoogleAdsReportsRequest } = require('../lib/google-ads-reports-handler');

module.exports = async function googleAdsReportsHandler(request, response) {
  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  await handleGoogleAdsReportsRequest(request, response);
};
