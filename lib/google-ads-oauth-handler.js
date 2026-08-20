const crypto = require('crypto');
const { exchangeGoogleAdsAuthCode } = require('./google-ads-auth');
const {
  assertGoogleAdsOAuthConfig,
  getGoogleAdsConfig,
  GOOGLE_ADS_SCOPE,
  resolveGoogleAdsOAuthRedirectUri,
} = require('./google-ads-config');

const OAUTH_STATE_COOKIE = 'google_ads_oauth_state';
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

function sendHtml(response, statusCode, html) {
  if (typeof response.status === 'function') {
    response.status(statusCode).setHeader('Content-Type', 'text/html; charset=utf-8');
    response.end(html);
    return;
  }
  response.writeHead(statusCode, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end(html);
}

function sendJson(response, statusCode, payload) {
  if (typeof response.status === 'function') {
    response.status(statusCode).json(payload);
    return;
  }
  response.writeHead(statusCode, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(payload));
}

function redirect(response, location) {
  if (typeof response.redirect === 'function') {
    response.redirect(302, location);
    return;
  }
  response.writeHead(302, { Location: location });
  response.end();
}

function parseCookies(cookieHeader = '') {
  const cookies = {};
  for (const part of String(cookieHeader).split(';')) {
    const [rawKey, ...rest] = part.trim().split('=');
    if (!rawKey) continue;
    cookies[rawKey] = decodeURIComponent(rest.join('='));
  }
  return cookies;
}

function buildOAuthStateCookie(state, request) {
  const secure = String(request?.headers?.['x-forwarded-proto'] || 'https') === 'https';
  const parts = [
    `${OAUTH_STATE_COOKIE}=${encodeURIComponent(state)}`,
    'Path=/api/auth/google-ads',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(OAUTH_STATE_TTL_MS / 1000)}`,
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

function buildClearOAuthStateCookie(request) {
  const secure = String(request?.headers?.['x-forwarded-proto'] || 'https') === 'https';
  const parts = [
    `${OAUTH_STATE_COOKIE}=`,
    'Path=/api/auth/google-ads',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

function appendSetCookie(response, cookie) {
  const existing = response.getHeader?.('Set-Cookie');
  if (!existing) {
    response.setHeader('Set-Cookie', cookie);
    return;
  }
  response.setHeader('Set-Cookie', Array.isArray(existing) ? [...existing, cookie] : [existing, cookie]);
}

function buildGoogleAuthUrl(config, redirectUri, state) {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_ADS_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function renderOAuthResultHtml({ title, body, refreshToken = null }) {
  const tokenBlock = refreshToken ? `
    <p><strong>Add this to Vercel → Environment Variables:</strong></p>
    <pre style="background:#f4f4f5;padding:12px;border-radius:8px;overflow:auto">GOOGLE_ADS_REFRESH_TOKEN=${refreshToken}</pre>
    <p>Then redeploy. Do not commit this token to git.</p>
  ` : '';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family:system-ui,sans-serif;padding:32px;max-width:720px;margin:auto;line-height:1.5">
<h1>${title}</h1>
${body}
${tokenBlock}
</body></html>`;
}

async function runGoogleAdsOAuthStart(request, response) {
  const config = assertGoogleAdsOAuthConfig(getGoogleAdsConfig());
  const redirectUri = resolveGoogleAdsOAuthRedirectUri(request);
  const state = crypto.randomBytes(24).toString('hex');
  appendSetCookie(response, buildOAuthStateCookie(state, request));
  redirect(response, buildGoogleAuthUrl(config, redirectUri, state));
}

async function handleGoogleAdsOAuthStart(request, response) {
  try {
    const { requireStaffSession } = require('./admin-auth');
    await requireStaffSession(request);
    await runGoogleAdsOAuthStart(request, response);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    if (statusCode === 401) {
      sendHtml(response, 401, renderOAuthResultHtml({
        title: 'Sign in required',
        body: '<p>Log into <a href="/admin">/admin</a>, then open <a href="/api/auth/google-ads/start">/api/auth/google-ads/start</a> again.</p>',
      }));
      return;
    }
    sendJson(response, statusCode, { error: error.message || 'Request failed.' });
  }
}

async function handleGoogleAdsOAuthCallback(request, response) {
  const config = assertGoogleAdsOAuthConfig(getGoogleAdsConfig());
  const redirectUri = resolveGoogleAdsOAuthRedirectUri(request);
  const url = new URL(request.url || '/', 'https://localhost');
  const query = request.query || {};
  const error = query.error || url.searchParams.get('error');
  const code = query.code || url.searchParams.get('code');
  const state = query.state || url.searchParams.get('state') || '';
  const cookies = parseCookies(request.headers?.cookie || request.headers?.Cookie || '');
  const expectedState = cookies[OAUTH_STATE_COOKIE] || '';

  appendSetCookie(response, buildClearOAuthStateCookie(request));

  if (error) {
    sendHtml(response, 400, renderOAuthResultHtml({
      title: 'Google Ads authorization failed',
      body: `<p>${error}</p>`,
    }));
    return;
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    sendHtml(response, 400, renderOAuthResultHtml({
      title: 'Invalid OAuth callback',
      body: '<p>Start again from <a href="/api/auth/google-ads/start">/api/auth/google-ads/start</a> while logged into admin.</p>',
    }));
    return;
  }

  try {
    const tokens = await exchangeGoogleAdsAuthCode(code, redirectUri, config);
    if (!tokens.refresh_token) {
      sendHtml(response, 200, renderOAuthResultHtml({
        title: 'Connected, but no refresh token returned',
        body: `
          <p>Revoke this app at <a href="https://myaccount.google.com/permissions">Google account permissions</a>, then run the flow again.</p>
          <p><a href="/api/auth/google-ads/start">Try again</a></p>
        `,
      }));
      return;
    }

    sendHtml(response, 200, renderOAuthResultHtml({
      title: 'Google Ads connected',
      body: '<p>Copy the refresh token below into Vercel env vars, redeploy, then run the metrics test.</p>',
      refreshToken: tokens.refresh_token,
    }));
  } catch (err) {
    sendHtml(response, 500, renderOAuthResultHtml({
      title: 'Token exchange failed',
      body: `<p>${err.message || err}</p><p><a href="/api/auth/google-ads/start">Try again</a></p>`,
    }));
  }
}

async function handleGoogleAdsOAuthRequest(request, response) {
  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  const segments = request.query?.path;
  const suffix = Array.isArray(segments) ? segments.join('/') : String(segments || '');
  const action = suffix.split('/').filter(Boolean)[0] || '';

  try {
    if (action === 'start' && request.method === 'GET') {
      await handleGoogleAdsOAuthStart(request, response);
      return;
    }
    if (action === 'callback' && request.method === 'GET') {
      await handleGoogleAdsOAuthCallback(request, response);
      return;
    }
    sendJson(response, 404, { error: 'Not found.' });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    if (statusCode === 401) {
      sendHtml(response, 401, renderOAuthResultHtml({
        title: 'Sign in required',
        body: '<p>Log into <a href="/admin">/admin</a>, then open <a href="/api/auth/google-ads/start">/api/auth/google-ads/start</a> again.</p>',
      }));
      return;
    }
    sendJson(response, statusCode, { error: error.message || 'Request failed.' });
  }
}

module.exports = {
  handleGoogleAdsOAuthRequest,
  handleGoogleAdsOAuthStart,
  handleGoogleAdsOAuthCallback,
  runGoogleAdsOAuthStart,
};
