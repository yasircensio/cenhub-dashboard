const { handleGoogleAdsOAuthCallback } = require('../../../lib/google-ads-oauth-handler');

module.exports = async function googleAdsOAuthCallbackHandler(request, response) {
  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }
  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const rawUrl = String(request.url || '/api/google-ads/oauth/callback');
  const queryIndex = rawUrl.indexOf('?');
  const query = queryIndex >= 0 ? rawUrl.slice(queryIndex) : '';
  request.url = `/api/google-ads/oauth/callback${query}`;
  await handleGoogleAdsOAuthCallback(request, response);
};
