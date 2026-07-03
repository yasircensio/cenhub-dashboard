require('dotenv').config();

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { getDashboardData } = require('./lib/dashboard-data');
const { handleFacebookMetrics } = require('./lib/facebook-metrics-handler');
const { handleClientsRequest } = require('./lib/clients-handler');
const { isValidSlug, normalizeClientId, RESERVED_SLUGS } = require('./lib/account-store');

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function createLocalResponse(serverResponse) {
  return {
    statusCode: 200,
    setHeader(name, value) {
      serverResponse.setHeader(name, value);
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      if (!serverResponse.headersSent) {
        serverResponse.writeHead(this.statusCode, { 'Content-Type': 'application/json' });
      }
      serverResponse.end(JSON.stringify(payload));
    },
    end() {
      if (!serverResponse.headersSent) {
        serverResponse.writeHead(this.statusCode);
      }
      serverResponse.end();
    },
  };
}

function serveDashboardHtml(response, mode, clientSlug = null) {
  let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const bodyAttrs = [`data-dashboard-mode="${mode}"`];
  if (clientSlug) bodyAttrs.push(`data-client-slug="${clientSlug}"`);

  html = html.replace('<body>', `<body ${bodyAttrs.join(' ')}>`);

  if (mode === 'hub') {
    html = html.replace(
      '<title>SunTech Nordic · Censio Dashboard</title>',
      '<title>Censio · Client Admin Hub</title>',
    );
  } else if (mode === 'admin') {
    html = html.replace(
      '<title>SunTech Nordic · Censio Dashboard</title>',
      '<title>Client setup · Censio Dashboard</title>',
    );
  } else if (mode === 'client') {
    html = html.replace(
      '<title>SunTech Nordic · Censio Dashboard</title>',
      '<title>Censio Dashboard</title>',
    );
  }

  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end(html);
}

function resolveAdminClientSlugFromPath(urlPath) {
  const parts = String(urlPath || '').replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  if (parts[0] !== 'admin' || parts.length !== 2) return null;
  const slug = normalizeClientId(parts[1]);
  if (!isValidSlug(slug) || RESERVED_SLUGS.has(slug)) return null;
  return slug;
}

function resolveClientSlugFromPath(urlPath) {
  const parts = String(urlPath || '').replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  if (parts.length !== 1) return null;
  const slug = normalizeClientId(parts[0]);
  if (!isValidSlug(slug) || RESERVED_SLUGS.has(slug)) return null;
  return slug;
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const url = requestUrl.pathname;

  if (url === '/api/dashboard') {
    if (request.method !== 'GET') {
      response.writeHead(405, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    try {
      const query = Object.fromEntries(requestUrl.searchParams);
      const data = await getDashboardData(query);
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(data, null, 2));
    } catch (error) {
      response.writeHead(502, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: error.message || 'Failed to load dashboard data.' }));
    }
    return;
  }

  if (url === '/api/inngest') {
    try {
      const rawBody = ['POST', 'PUT', 'PATCH'].includes(request.method)
        ? await readRequestBody(request)
        : '';
      const localResponse = createLocalResponse(response);
      const { handleInngestRequest } = require('./lib/inngest-handler');
      await handleInngestRequest({
        method: request.method,
        url,
        headers: request.headers,
        body: rawBody,
      }, localResponse);
    } catch (error) {
      response.writeHead(500, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: error.message || 'Inngest handler failed.' }));
    }
    return;
  }

  if (url === '/api/ghl-sso') {
    try {
      const rawBody = request.method === 'POST' ? await readRequestBody(request) : '';
      const localResponse = createLocalResponse(response);
      const handleGhlSsoRequest = require('./lib/ghl-sso-handler');
      await handleGhlSsoRequest({
        method: request.method,
        headers: request.headers,
        body: rawBody,
      }, localResponse);
    } catch (error) {
      response.writeHead(500, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: error.message || 'GHL SSO failed.' }));
    }
    return;
  }

  if (url === '/api/clients' || url.startsWith('/api/clients/')) {
    try {
      const rawBody = ['POST', 'PUT', 'PATCH'].includes(request.method)
        ? await readRequestBody(request)
        : '';
      const localResponse = createLocalResponse(response);
      await handleClientsRequest({
        method: request.method,
        url,
        headers: request.headers,
        query: Object.fromEntries(requestUrl.searchParams),
        body: rawBody,
      }, localResponse);
    } catch (error) {
      response.writeHead(500, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: error.message || 'Clients API failed.' }));
    }
    return;
  }

  if (url === '/api/facebook-metrics') {
    try {
      const query = Object.fromEntries(requestUrl.searchParams);
      const rawBody = request.method === 'POST' ? await readRequestBody(request) : '';
      const localResponse = createLocalResponse(response);

      await handleFacebookMetrics({
        method: request.method,
        headers: request.headers,
        query,
        body: rawBody,
      }, localResponse);
    } catch (error) {
      response.writeHead(500, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: error.message || 'Failed to handle Facebook metrics.' }));
    }
    return;
  }

  if (url === '/' || url === '/index.html') {
    serveDashboardHtml(response, 'client');
    return;
  }

  if (url === '/admin' || url === '/admin.html') {
    serveDashboardHtml(response, 'hub');
    return;
  }

  const adminClientSlug = resolveAdminClientSlugFromPath(url);
  if (adminClientSlug) {
    serveDashboardHtml(response, 'admin', adminClientSlug);
    return;
  }

  const clientSlug = resolveClientSlugFromPath(url);
  if (clientSlug) {
    serveDashboardHtml(response, 'client', clientSlug);
    return;
  }

  if (url.startsWith('/lib/')) {
    const filePath = path.join(ROOT, url);
    if (!filePath.startsWith(path.join(ROOT, 'lib')) || !fs.existsSync(filePath)) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    const ext = path.extname(filePath);
    const contentType = ext === '.js'
      ? 'application/javascript; charset=utf-8'
      : 'text/plain; charset=utf-8';
    response.writeHead(200, { 'Content-Type': contentType });
    response.end(fs.readFileSync(filePath, 'utf8'));
    return;
  }

  response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end('Not found');
});

server.listen(PORT, () => {
  console.log('');
  console.log('Censio dashboard running locally');
  console.log(`  Client dashboard: http://localhost:${PORT}/suntech-nordic`);
  console.log(`  Admin hub:        http://localhost:${PORT}/admin`);
  console.log(`  Client setup:     http://localhost:${PORT}/admin/suntech-nordic`);
  console.log(`  API JSON:         http://localhost:${PORT}/api/dashboard`);
  console.log(`  Clients API:      http://localhost:${PORT}/api/clients`);
  console.log('');
  console.log('Press Ctrl+C to stop');
});
