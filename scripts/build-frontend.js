#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const ROOT = path.join(__dirname, '..');
const APP_SOURCE = path.join(ROOT, 'frontend', 'source', 'app.js');
const OUT_DIR = path.join(ROOT, 'public', 'js');

const ADMIN_START = 'const ADMIN_API_KEY_STORAGE = \'cenhub_admin_api_key\';';
const DASHBOARD_START = '(function initDashboardCharts(global) {';
const INIT_START = 'async function initDashboardApp() {';

function splitAppSource(source) {
  const adminIndex = source.indexOf(ADMIN_START);
  const dashboardIndex = source.indexOf(DASHBOARD_START);
  const initIndex = source.indexOf(INIT_START);

  if (adminIndex < 0 || dashboardIndex < 0 || adminIndex >= dashboardIndex) {
    throw new Error('Could not locate admin/dashboard split markers in frontend/source/app.js');
  }

  const dashboardEnd = initIndex >= 0 ? initIndex : source.length;

  return {
    shared: source.slice(0, adminIndex).trim(),
    admin: source.slice(adminIndex, dashboardIndex).trim(),
    dashboard: source.slice(dashboardIndex, dashboardEnd).trim(),
  };
}

async function minifyWrite(filename, contents) {
  const result = await esbuild.transform(contents, {
    minify: true,
    target: 'es2020',
    sourcemap: 'external',
    legalComments: 'none',
  });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, filename), result.code);
  if (result.map) {
    fs.writeFileSync(path.join(OUT_DIR, `${filename}.map`), result.map);
  }
}

async function main() {
  if (!fs.existsSync(APP_SOURCE)) {
    require('./extract-frontend-source');
  }

  const source = fs.readFileSync(APP_SOURCE, 'utf8');
  const parts = splitAppSource(source);

  const adminInit = `
async function bootAdminApp() {
  if (IS_LOGIN_PAGE) {
    renderLoginPage();
    return;
  }
  if (IS_ADMIN_HUB) {
    loadAdminHub();
    return;
  }
  if (IS_TEAM_PAGE) {
    loadTeamPage();
    return;
  }
  try {
    tenantParams = await resolveTenantParams();
  } catch (error) {
    document.getElementById('dashboard').innerHTML =
      '<div class="error-state" style="padding:24px">' + esc(error.message) + '</div>';
    return;
  }
  if (IS_ADMIN_CLIENT) {
    await initAdminClientPage();
    return;
  }
  ensureChartsVisible();
  loadDashboard(true);
  setTimeout(function () {
    loadDashboard(true, { background: true, forceFresh: true });
  }, 500);
  setInterval(function () {
    loadDashboard(true, { background: true, forceFresh: true });
  }, 2 * 60 * 1000);
}

bootAdminApp();

document.addEventListener('click', function () {
  closeCardMenus();
  closeStaffUserMenu();
});

document.addEventListener('visibilitychange', function () {
  if (document.visibilityState !== 'visible') return;
  if (isFetching && Date.now() - fetchStartedAt > FETCH_TIMEOUT_MS) {
    cancelActiveFetch();
    fetchGeneration += 1;
    resetFetchUiState();
  }
  if (!IS_ADMIN_HUB && cachedData && needsFreshData()) {
    loadDashboard(true, { background: true, forceFresh: true });
  }
});
`.trim();

  const clientInit = `
async function bootClientApp() {
  try {
    tenantParams = await resolveTenantParams();
  } catch (error) {
    document.getElementById('dashboard').innerHTML =
      '<div class="error-state" style="padding:24px">' + esc(error.message) + '</div>';
    return;
  }
  ensureChartsVisible();
  loadDashboard(true);
  setTimeout(function () {
    loadDashboard(true, { background: true, forceFresh: true });
  }, 500);
  setInterval(function () {
    loadDashboard(true, { background: true, forceFresh: true });
  }, 2 * 60 * 1000);
}

bootClientApp();

document.addEventListener('visibilitychange', function () {
  if (document.visibilityState !== 'visible') return;
  if (isFetching && Date.now() - fetchStartedAt > FETCH_TIMEOUT_MS) {
    cancelActiveFetch();
    fetchGeneration += 1;
    resetFetchUiState();
  }
  if (cachedData && needsFreshData()) {
    loadDashboard(true, { background: true, forceFresh: true });
  }
});
`.trim();

  const adminBundle = [parts.shared, parts.admin, parts.dashboard, adminInit].join('\n\n');
  const clientBundle = [parts.shared, parts.dashboard, clientInit].join('\n\n');

  await minifyWrite('admin.bundle.js', adminBundle);
  await minifyWrite('client.bundle.js', clientBundle);

  console.log('Built public/js/admin.bundle.js and public/js/client.bundle.js');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
