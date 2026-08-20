const { handleGoogleAdsOAuthRequest } = require('../../lib/google-ads-oauth-handler');

module.exports = async function googleAdsOAuthHandler(request, response) {
  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  const segments = request.query?.path;
  const suffix = Array.isArray(segments) ? segments.join('/') : String(segments || '');
  request.url = suffix
    ? `/api/google-ads/oauth/${suffix}`
    : '/api/google-ads/oauth';

  await handleGoogleAdsOAuthRequest(request, response);
};
