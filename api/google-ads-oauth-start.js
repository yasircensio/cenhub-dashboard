const { handleGoogleAdsOAuthStart } = require('../lib/google-ads-oauth-handler');
const { mergeOAuthQueryString } = require('../lib/google-ads-oauth-request');

module.exports = async function googleAdsOAuthStartHandler(request, response) {
  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }
  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  await handleGoogleAdsOAuthStart(
    mergeOAuthQueryString(request, '/api/google-ads-oauth-start'),
    response,
  );
};
