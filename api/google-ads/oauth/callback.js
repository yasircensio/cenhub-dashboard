const { handleGoogleAdsOAuthCallback } = require('../../../lib/google-ads-oauth-handler');
const { mergeOAuthQueryString } = require('../../../lib/google-ads-oauth-request');

module.exports = async function googleAdsOAuthCallbackHandler(request, response) {
  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }
  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  await handleGoogleAdsOAuthCallback(
    mergeOAuthQueryString(request, '/api/google-ads/oauth/callback'),
    response,
  );
};
