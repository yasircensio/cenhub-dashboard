const GOOGLE_ADS_SCOPE = 'https://www.googleapis.com/auth/adwords';

function readEnv(name) {
  return String(process.env[name] || '').trim();
}

function normalizeGoogleAdsCustomerId(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length === 10 ? digits : null;
}

function formatGoogleAdsCustomerId(value) {
  const id = normalizeGoogleAdsCustomerId(value);
  if (!id) return null;
  return `${id.slice(0, 3)}-${id.slice(3, 6)}-${id.slice(6)}`;
}

function getGoogleAdsConfig(options = {}) {
  const developerToken = readEnv(options.developerTokenEnv || 'GOOGLE_ADS_DEVELOPER_TOKEN');
  const clientId = readEnv(options.clientIdEnv || 'GOOGLE_ADS_CLIENT_ID');
  const clientSecret = readEnv(options.clientSecretEnv || 'GOOGLE_ADS_CLIENT_SECRET');
  const refreshToken = readEnv(options.refreshTokenEnv || 'GOOGLE_ADS_REFRESH_TOKEN');
  const loginCustomerId = normalizeGoogleAdsCustomerId(
    readEnv(options.loginCustomerIdEnv || 'GOOGLE_ADS_LOGIN_CUSTOMER_ID'),
  );
  const apiVersion = readEnv(options.apiVersionEnv || 'GOOGLE_ADS_API_VERSION') || 'v18';

  return {
    developerToken,
    clientId,
    clientSecret,
    refreshToken,
    loginCustomerId,
    apiVersion,
    scope: GOOGLE_ADS_SCOPE,
  };
}

function assertGoogleAdsOAuthConfig(config = getGoogleAdsConfig()) {
  const missing = [];
  if (!config.clientId) missing.push('GOOGLE_ADS_CLIENT_ID');
  if (!config.clientSecret) missing.push('GOOGLE_ADS_CLIENT_SECRET');
  if (missing.length) {
    const error = new Error(`Missing Google Ads OAuth env: ${missing.join(', ')}`);
    error.code = 'GOOGLE_ADS_CONFIG';
    throw error;
  }
  return config;
}

function assertGoogleAdsQueryConfig(config = getGoogleAdsConfig()) {
  assertGoogleAdsOAuthConfig(config);
  const missing = [];
  if (!config.developerToken) missing.push('GOOGLE_ADS_DEVELOPER_TOKEN');
  if (!config.refreshToken) missing.push('GOOGLE_ADS_REFRESH_TOKEN');
  if (missing.length) {
    const error = new Error(`Missing Google Ads query env: ${missing.join(', ')}`);
    error.code = 'GOOGLE_ADS_CONFIG';
    throw error;
  }
  return config;
}

function resolveGoogleAdsOAuthRedirectUri(request = null) {
  const explicit = readEnv('GOOGLE_ADS_OAUTH_REDIRECT_URI');
  if (explicit) return explicit.replace(/\/$/, '');

  const appBase = readEnv('APP_BASE_URL')
    || readEnv('DASHBOARD_PUBLIC_URL')
    || (readEnv('VERCEL_URL') ? `https://${readEnv('VERCEL_URL')}` : '');
  if (appBase) {
    return `${appBase.replace(/\/$/, '')}/api/google-ads/oauth/callback`;
  }

  const host = request?.headers?.['x-forwarded-host'] || request?.headers?.host || '';
  if (host) {
    const proto = request?.headers?.['x-forwarded-proto'] || 'https';
    return `${proto}://${host}/api/google-ads/oauth/callback`;
  }

  return 'https://analytics.censio.dk/api/auth/google-ads/callback';
}

module.exports = {
  GOOGLE_ADS_SCOPE,
  readEnv,
  normalizeGoogleAdsCustomerId,
  formatGoogleAdsCustomerId,
  getGoogleAdsConfig,
  assertGoogleAdsOAuthConfig,
  assertGoogleAdsQueryConfig,
  resolveGoogleAdsOAuthRedirectUri,
};
