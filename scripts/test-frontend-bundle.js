#!/usr/bin/env node
/**
 * Validate client/admin bundles for live-critical symbols.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const APP_SOURCE = path.join(ROOT, 'frontend', 'source', 'app.js');
const CLIENT_BUNDLE = path.join(ROOT, 'public/js/client.bundle.js');
const ADMIN_BUNDLE = path.join(ROOT, 'public/js/admin.bundle.js');

const DASHBOARD_START = '(function initDashboardCharts(global) {';
const INIT_START = 'async function initDashboardApp() {';

function getDashboardSource(source) {
  const dashboardIndex = source.indexOf(DASHBOARD_START);
  const initIndex = source.indexOf(INIT_START);
  if (dashboardIndex < 0) throw new Error('Dashboard section not found in app source');
  const dashboardEnd = initIndex >= 0 ? initIndex : source.length;
  return source.slice(dashboardIndex, dashboardEnd);
}

function collectIconRefs(source) {
  const icons = new Set();
  const pattern = /ICON_[A-Z_]+/g;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    icons.add(match[0]);
  }
  return icons;
}

function assertIncludes(label, bundle, tokens) {
  const missing = tokens.filter((token) => !bundle.includes(token));
  if (missing.length) {
    console.error(`${label} missing: ${missing.join(', ')}`);
    process.exit(1);
  }
}

function main() {
  for (const file of [CLIENT_BUNDLE, ADMIN_BUNDLE, APP_SOURCE]) {
    if (!fs.existsSync(file)) {
      console.error(`Missing required file: ${file}`);
      process.exit(1);
    }
  }

  const source = fs.readFileSync(APP_SOURCE, 'utf8');
  const dashboard = getDashboardSource(source);
  const client = fs.readFileSync(CLIENT_BUNDLE, 'utf8');
  const admin = fs.readFileSync(ADMIN_BUNDLE, 'utf8');

  try {
    // eslint-disable-next-line no-new-func
    new Function(client);
    new Function(admin);
  } catch (error) {
    console.error('Bundle syntax error:', error.message);
    process.exit(1);
  }

  const clientRequired = [
    'bootClientApp',
    'resolveTenantParams',
    'appendTenantParams',
    'ensureChartsVisible',
    'loadDashboard',
    'fetchJson',
    'fetchDashboardData',
    'applyMarketingToDashboard',
    'mountCharts',
    'DashboardCharts',
    'esc',
    'showToast',
    'fmtDkk',
    'CLIENT_SLUG',
    'tenantParams',
  ];

  const adminRequired = [
    'bootAdminApp',
    'loadAdminHub',
    'loadTeamPage',
    'renderLoginPage',
    'initAdminClientPage',
    'loadSetupAccount',
    'syncAllClients',
    'renderStaffUsersTable',
    'adminFetch',
    'requireStaffAuth',
  ];

  assertIncludes('client.bundle.js', client, clientRequired);
  assertIncludes('admin.bundle.js', admin, adminRequired);

  const iconRefs = collectIconRefs(dashboard);
  assertIncludes('client.bundle.js (icons)', client, [...iconRefs]);

  if (client.includes('loadAdminHub')) {
    console.error('client.bundle.js should not include admin hub code (loadAdminHub found)');
    process.exit(1);
  }

  console.log(`Frontend bundle validation passed (client ${client.length} B, admin ${admin.length} B, ${iconRefs.size} icons).`);
}

main();
