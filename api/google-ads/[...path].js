const {
  handleGoogleAdsOAuthCallback,
  handleGoogleAdsOAuthStart,
} = require('../../lib/google-ads-oauth-handler');
const { mergeOAuthQueryString } = require('../../lib/google-ads-oauth-request');

module.exports = async function googleAdsPathHandler(request, response) {
  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  const segments = request.query?.path || [];
  const suffix = Array.isArray(segments) ? segments.join('/') : String(segments || '');

  if (suffix === 'oauth/callback') {
    if (request.method !== 'GET') {
      response.status(405).json({ error: 'Method not allowed' });
      return;
    }
    await handleGoogleAdsOAuthCallback(
      mergeOAuthQueryString(request, '/api/google-ads/oauth/callback'),
      response,
    );
    return;
  }

  if (suffix === 'oauth/start') {
    if (request.method !== 'GET') {
      response.status(405).json({ error: 'Method not allowed' });
      return;
    }
    await handleGoogleAdsOAuthStart(
      mergeOAuthQueryString(request, '/api/google-ads/oauth/start'),
      response,
    );
    return;
  }

  response.status(404).json({ error: 'Not found' });
};
