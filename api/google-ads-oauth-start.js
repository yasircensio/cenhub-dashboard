const { handleGoogleAdsOAuthStart } = require('../lib/google-ads-oauth-handler');

module.exports = async function googleAdsOAuthStartHandler(request, response) {
  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }
  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }
  request.url = '/api/google-ads/oauth/start';
  await handleGoogleAdsOAuthStart(request, response);
};
