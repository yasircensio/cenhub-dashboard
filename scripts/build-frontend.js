#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const ROOT = path.join(__dirname, '..');
const APP_SOURCE = path.join(ROOT, 'frontend', 'source', 'app.js');
const OUT_DIR = path.join(ROOT, 'public', 'js');

const ADMIN_START = 'async function fetchStaffMe() {';
const DASHBOARD_START = '(function initDashboardCharts(global) {';
const INIT_START = 'async function initDashboardApp() {';

function extractIconConstants(source) {
  return (source.match(/^const ICON_[A-Z_]+ = '.*?';$/gm) || []).join('\n');
}

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
    icons: extractIconConstants(source),
  };
}

function validateClientBundle(bundleSource, dashboardSource) {
  const requiredFunctions = [
    'resolveTenantParams',
    'appendTenantParams',
    'ensureChartsVisible',
    'loadDashboard',
    'esc',
    'showToast',
  ];

  for (const name of requiredFunctions) {
    if (!bundleSource.includes(`function ${name}`) && !bundleSource.includes(`async function ${name}`)) {
      throw new Error(`Client bundle missing function: ${name}`);
    }
  }

  const iconRefs = new Set();
  const iconPattern = /ICON_[A-Z_]+/g;
  let match;
  while ((match = iconPattern.exec(dashboardSource)) !== null) {
    iconRefs.add(match[0]);
  }

  for (const icon of iconRefs) {
    if (!bundleSource.includes(`const ${icon} =`)) {
      throw new Error(`Client bundle missing icon constant: ${icon}`);
    }
  }
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
  return result.code;
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
  if (IS_ADMIN_SYNC_HISTORY_GHL) {
    await loadSyncHistoryPage('ghl');
    return;
  }
  if (IS_ADMIN_SYNC_HISTORY_META) {
    await loadSyncHistoryPage('meta');
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

  const clientBundleSource = [parts.shared, parts.icons, parts.dashboard, clientInit].join('\n\n');
  const adminBundleSource = [parts.shared, parts.admin, parts.dashboard, adminInit].join('\n\n');

  validateClientBundle(clientBundleSource, parts.dashboard);

  await minifyWrite('admin.bundle.js', adminBundleSource);
  await minifyWrite('client.bundle.js', clientBundleSource);

  console.log('Built public/js/admin.bundle.js and public/js/client.bundle.js');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
