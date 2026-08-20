#!/usr/bin/env node
/**
 * One-time OAuth flow to obtain GOOGLE_ADS_REFRESH_TOKEN.
 *
 * Prerequisites:
 *   - GOOGLE_ADS_CLIENT_ID
 *   - GOOGLE_ADS_CLIENT_SECRET
 *   - OAuth client redirect URI: http://localhost:3333/oauth2callback
 *
 * Usage:
 *   node scripts/google-ads-oauth.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const http = require('http');
const { execSync } = require('child_process');
const {
  assertGoogleAdsOAuthConfig,
  getGoogleAdsConfig,
  GOOGLE_ADS_SCOPE,
} = require('../lib/google-ads-config');
const { exchangeGoogleAdsAuthCode } = require('../lib/google-ads-auth');

const PORT = Number(process.env.GOOGLE_ADS_OAUTH_PORT) || 3333;
const REDIRECT_URI = process.env.GOOGLE_ADS_OAUTH_REDIRECT_URI
  || `http://localhost:${PORT}/oauth2callback`;

function buildAuthUrl(config) {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: GOOGLE_ADS_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function openBrowser(url) {
  try {
    if (process.platform === 'darwin') {
      execSync(`open "${url}"`, { stdio: 'ignore' });
      return;
    }
    if (process.platform === 'win32') {
      execSync(`start "" "${url}"`, { stdio: 'ignore', shell: true });
      return;
    }
    execSync(`xdg-open "${url}"`, { stdio: 'ignore' });
  } catch {
    // Ignore — URL is printed below.
  }
}

function htmlResponse(title, body) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family:system-ui,sans-serif;padding:32px;max-width:640px;margin:auto;line-height:1.5">
<h1>${title}</h1>
${body}
</body></html>`;
}

async function main() {
  const config = assertGoogleAdsOAuthConfig(getGoogleAdsConfig());

  console.log('Google Ads OAuth — one-time refresh token setup\n');
  console.log(`Redirect URI (must match Google Cloud OAuth client): ${REDIRECT_URI}\n`);

  const authUrl = buildAuthUrl(config);
  const server = http.createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url || '/', `http://localhost:${PORT}`);
      if (requestUrl.pathname !== '/oauth2callback') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
      }

      const error = requestUrl.searchParams.get('error');
      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(htmlResponse('Authorization failed', `<p>${error}</p><p>You can close this tab.</p>`));
        console.error(`OAuth error: ${error}`);
        server.close();
        process.exit(1);
        return;
      }

      const code = requestUrl.searchParams.get('code');
      if (!code) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(htmlResponse('Missing code', '<p>No authorization code returned.</p>'));
        return;
      }

      const tokens = await exchangeGoogleAdsAuthCode(code, REDIRECT_URI, config);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(htmlResponse(
        'Google Ads connected',
        '<p>Success. You can close this tab and return to the terminal.</p>',
      ));

      console.log('\nSuccess. Add these to .env and Vercel:\n');
      if (tokens.refresh_token) {
        console.log(`GOOGLE_ADS_REFRESH_TOKEN=${tokens.refresh_token}`);
      } else {
        console.log('No refresh_token returned.');
        console.log('If you already authorized this app before, revoke access at');
        console.log('https://myaccount.google.com/permissions and run this script again.');
      }
      if (tokens.access_token) {
        console.log('\n# Short-lived access token (for debugging only):');
        console.log(`# access_token=${tokens.access_token.slice(0, 12)}...`);
      }
      console.log('\nNext: node scripts/test-google-ads-insights.js 9103268801\n');

      server.close();
      process.exit(0);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(htmlResponse('Token exchange failed', `<p>${err.message || err}</p>`));
      console.error(err.message || err);
      server.close();
      process.exit(1);
    }
  });

  server.listen(PORT, () => {
    console.log(`Listening on http://localhost:${PORT}`);
    console.log('\nOpen this URL in the browser (use marketing@censio.dk or your MCC admin):\n');
    console.log(authUrl);
    console.log('');
    openBrowser(authUrl);
  });
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
