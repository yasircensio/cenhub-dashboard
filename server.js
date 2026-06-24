require('dotenv').config();

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { getDashboardData } = require('./lib/dashboard-data');

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;

function serveDashboardHtml(response, mode) {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')
    .replace('<body>', `<body data-dashboard-mode="${mode}">`)
    .replace(
      '<title>SunTech Nordic · Censio Dashboard</title>',
      mode === 'admin'
        ? '<title>SunTech Nordic · Dashboard Admin</title>'
        : '<title>SunTech Nordic · Censio Dashboard</title>',
    );
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end(html);
}

const server = http.createServer(async (request, response) => {
  const url = request.url.split('?')[0];

  if (url === '/api/dashboard') {
    if (request.method !== 'GET') {
      response.writeHead(405, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    try {
      const query = Object.fromEntries(new URL(request.url, `http://${request.headers.host}`).searchParams);
      const data = await getDashboardData(query);
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(data, null, 2));
    } catch (error) {
      response.writeHead(502, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: error.message || 'Failed to load dashboard data.' }));
    }
    return;
  }

  if (url === '/' || url === '/index.html') {
    serveDashboardHtml(response, 'client');
    return;
  }

  if (url === '/admin' || url === '/admin.html') {
    serveDashboardHtml(response, 'admin');
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
  console.log('SunTech dashboard running locally');
  console.log(`  Client dashboard: http://localhost:${PORT}`);
  console.log(`  Admin settings:   http://localhost:${PORT}/admin`);
  console.log(`  API JSON:         http://localhost:${PORT}/api/dashboard`);
  console.log('');
  console.log('Press Ctrl+C to stop');
});
