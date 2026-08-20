const {
  assertGoogleAdsOAuthConfig,
  getGoogleAdsConfig,
} = require('./google-ads-config');

const TOKEN_URL = 'https://oauth2.googleapis.com/token';

async function exchangeGoogleAdsAuthCode(code, redirectUri, config = getGoogleAdsConfig()) {
  assertGoogleAdsOAuthConfig(config);
  const body = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error_description || data.error || `OAuth token exchange failed (${response.status})`);
    error.statusCode = response.status;
    error.details = data;
    throw error;
  }
  return data;
}

async function getGoogleAdsAccessToken(config = getGoogleAdsConfig()) {
  assertGoogleAdsOAuthConfig(config);
  if (!config.refreshToken) {
    const error = new Error('Missing GOOGLE_ADS_REFRESH_TOKEN. Run: node scripts/google-ads-oauth.js');
    error.code = 'GOOGLE_ADS_CONFIG';
    throw error;
  }

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: config.refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error_description || data.error || `OAuth refresh failed (${response.status})`);
    error.statusCode = response.status;
    error.details = data;
    throw error;
  }
  if (!data.access_token) {
    throw new Error('OAuth refresh response did not include access_token.');
  }
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in || null,
    tokenType: data.token_type || 'Bearer',
  };
}

module.exports = {
  exchangeGoogleAdsAuthCode,
  getGoogleAdsAccessToken,
};
