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

function getQueryParam(request, name) {
  const { collectVercelQuery } = require('./google-ads-oauth-request');
  const mergedQuery = collectVercelQuery(request);
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
  // #region agent log
  fetch('http://127.0.0.1:7412/ingest/8036624f-bbd1-4142-b516-bb72c323b06c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f182bb'},body:JSON.stringify({sessionId:'f182bb',location:'lib/google-ads-oauth-handler.js:C-callback-entry',message:'callback handler entry',data:{url:request.url,originalUrl:request.originalUrl,queryKeys:Object.keys(request.query||{}),queryCode:(request.query||{}).code,queryState:(request.query||{}).state,xForwardedUri:request.headers?.['x-forwarded-uri'],xVercelUri:request.headers?.['x-vercel-forwarded-uri']},timestamp:Date.now(),hypothesisId:'A-B-C-D-E'})}).catch(()=>{});
  // #endregion
  const config = assertGoogleAdsOAuthConfig(getGoogleAdsConfig());
  const redirectUri = resolveGoogleAdsOAuthRedirectUri(request);
  const error = getQueryParam(request, 'error');
  const code = getQueryParam(request, 'code');
  const state = getQueryParam(request, 'state');

  if (error) {
    sendHtml(response, 400, renderOAuthResultHtml({
      title: 'Google Ads authorization failed',
      body: `<p>${error}</p>`,
    }));
    return;
  }

  if (!code) {
    const { collectVercelQuery } = require('./google-ads-oauth-request');
    const debugQuery = collectVercelQuery(request);
    const catchAllDebug = request._debugCatchAll || {};
    const headers = request.headers || {};
    const rawQuery = request.query || {};
    let queryJson = '';
    try {
      queryJson = JSON.stringify(rawQuery);
    } catch {
      queryJson = '[unserializable]';
    }
    const debugDetails = `<pre style="background:#f4f4f5;padding:12px;border-radius:8px;overflow:auto;font-size:12px">-- in callback handler --
url=${String(request?.url || '')}
ownKeys=${Object.keys(request).join(',') || '(none)'}
queryType=${typeof request.query}
queryKeys=${Object.keys(debugQuery).join(', ') || '(none)'}
directCode=${typeof rawQuery.code}
inQueryCode=${rawQuery && typeof rawQuery === 'object' && 'code' in rawQuery}
queryJson=${queryJson}
hasCode=${Boolean(debugQuery.code)}
hasState=${Boolean(debugQuery.state)}
headerHint=${JSON.stringify(Object.keys(headers).filter((name) => /invoke|forwarded|query|url|host/i.test(name)))}
invokeQueryPresent=${Boolean(headers['x-invoke-query'] || headers['X-Invoke-Query'])}
xForwardedUriHasSearch=${String(headers['x-forwarded-uri'] || '').includes('?')}
-- from wrap --
rawUrl=${catchAllDebug.rawUrl ?? 'n/a'}
queryKeysAtEntry=${JSON.stringify(catchAllDebug.queryKeysAtEntry ?? 'n/a')}
hasCode@wrap=${catchAllDebug.hasCode ?? 'n/a'}
hasState@wrap=${catchAllDebug.hasState ?? 'n/a'}
invokeQueryPresent@wrap=${catchAllDebug.invokeQueryPresent ?? 'n/a'}
invokeQueryKeys=${JSON.stringify(catchAllDebug.invokeQueryKeys ?? 'n/a')}
headerHint@wrap=${JSON.stringify(catchAllDebug.headerHint ?? 'n/a')}
queryStringBuilt=${catchAllDebug.queryStringBuilt ?? 'n/a'}</pre>`;
    sendHtml(response, 400, renderOAuthResultHtml({
      title: 'Invalid OAuth callback (v2)',
      body: `${describeOAuthCallbackFailure(request, state)}${debugDetails}`,
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
