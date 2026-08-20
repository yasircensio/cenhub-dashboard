const crypto = require('crypto');
const { exchangeGoogleAdsAuthCode } = require('./google-ads-auth');
const {
  assertGoogleAdsOAuthConfig,
  getGoogleAdsConfig,
  GOOGLE_ADS_SCOPE,
  resolveGoogleAdsOAuthRedirectUri,
} = require('./google-ads-config');
const { getSessionSecret } = require('./session');

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

function isVercelResponse(response) {
  return typeof response.status === 'function';
}

function sendHtml(response, statusCode, html) {
  if (isVercelResponse(response)) {
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.status(statusCode).send(html);
    return;
  }
  response.writeHead(statusCode, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end(html);
}

function sendJson(response, statusCode, payload) {
  if (isVercelResponse(response)) {
    response.status(statusCode).json(payload);
    return;
  }
  response.writeHead(statusCode, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(payload));
}

function redirect(response, location) {
  if (isVercelResponse(response)) {
    response.status(302);
    response.setHeader('Location', location);
    response.end();
    return;
  }
  if (typeof response.redirect === 'function') {
    response.redirect(302, location);
    return;
  }
  response.writeHead(302, { Location: location });
  response.end();
}

function createOAuthState() {
  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = String(Date.now());
  const payload = `${nonce}.${timestamp}`;
  const signature = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('hex');
  return `${payload}.${signature}`;
}

function verifyOAuthState(state) {
  const parts = String(state || '').split('.');
  if (parts.length !== 3) return false;

  const [nonce, timestamp, signature] = parts;
  if (!nonce || !timestamp || !signature) return false;

  const payload = `${nonce}.${timestamp}`;
  const expected = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('hex');
  if (signature.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;

  const issuedAt = Number(timestamp);
  if (!Number.isFinite(issuedAt)) return false;
  const ageMs = Date.now() - issuedAt;
  return ageMs >= 0 && ageMs <= OAUTH_STATE_TTL_MS;
}

function parseCallbackBody(body) {
  if (!body) return {};
  if (typeof body === 'object') return body;
  try {
    return JSON.parse(body);
  } catch {
    const params = new URLSearchParams(String(body));
    return Object.fromEntries(params.entries());
  }
}

function readCallbackParams(request) {
  const query = collectVercelQueryFromHandler(request);
  const body = String(request.method || 'GET').toUpperCase() === 'POST'
    ? parseCallbackBody(request.body)
    : {};
  return {
    error: String(body.error || query.error || '').trim(),
    code: String(body.code || query.code || '').trim(),
    state: String(body.state || query.state || '').trim(),
  };
}

function collectVercelQueryFromHandler(request) {
  const { collectVercelQuery } = require('./google-ads-oauth-request');
  return collectVercelQuery(request);
}

function getQueryParam(request, name) {
  const mergedQuery = collectVercelQueryFromHandler(request);
  const raw = mergedQuery[name];
  if (Array.isArray(raw)) return String(raw[0] || '').trim();
  if (raw != null && raw !== '') return String(raw).trim();
  return '';
}

function describeOAuthCallbackFailure(request, state) {
  const code = getQueryParam(request, 'code');
  const stateValue = getQueryParam(request, 'state') || state;

  if (!code && !stateValue) {
    return '<p>Do not open this callback URL directly. Start the flow from <a href="/api/auth/google-ads/start">/api/auth/google-ads/start</a> while logged into admin, then approve access in Google.</p>';
  }
  if (!code) {
    return '<p>Google did not return an authorization code. Start again from <a href="/api/auth/google-ads/start">/api/auth/google-ads/start</a>.</p>';
  }
  if (!stateValue) {
    return '<p>The callback is missing OAuth state. Start again from <a href="/api/auth/google-ads/start">/api/auth/google-ads/start</a> and complete Google sign-in in the same browser tab.</p>';
  }
  if (!verifyOAuthState(stateValue)) {
    return '<p>The authorization link expired or the state could not be verified. Start again from <a href="/api/auth/google-ads/start">/api/auth/google-ads/start</a> and finish within 10 minutes.</p>';
  }
  return '<p>OAuth callback could not be processed. Start again from <a href="/api/auth/google-ads/start">/api/auth/google-ads/start</a>.</p>';
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
  const state = createOAuthState();
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
  const { error, code, state } = readCallbackParams(request);

  if (error) {
    sendHtml(response, 400, renderOAuthResultHtml({
      title: 'Google Ads authorization failed',
      body: `<p>${error}</p>`,
    }));
    return;
  }

  if (!code) {
    const recoverScript = `<script>
(function(){
  var params = new URLSearchParams(window.location.search);
  var code = params.get('code') || '';
  var state = params.get('state') || '';
  var error = params.get('error') || '';
  if (!code && !error) return;
  document.body.insertAdjacentHTML('afterbegin', '<p>Finishing Google Ads connection…</p>');
  fetch(window.location.pathname, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: code, state: state, error: error })
  }).then(function(res){ return res.text(); }).then(function(html){
    document.open();
    document.write(html);
    document.close();
  }).catch(function(err){
    document.body.insertAdjacentHTML('beforeend', '<p>Could not complete OAuth: ' + String(err.message || err) + '</p>');
  });
})();
</script>`;
    sendHtml(response, 400, renderOAuthResultHtml({
      title: 'Invalid OAuth callback',
      body: `${describeOAuthCallbackFailure(request, state)}${recoverScript}`,
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
    if ((action === 'callback' && request.method === 'GET') || (action === 'callback' && request.method === 'POST')) {
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
