#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const APP_SOURCE = path.join(ROOT, 'frontend', 'source', 'app.js');
const CLIENT_BUNDLE = path.join(ROOT, 'public', 'js', 'client.bundle.js');

const ADMIN_START = 'async function fetchStaffMe() {';
const DASHBOARD_START = '(function initDashboardCharts(global) {';
const INIT_START = 'async function initDashboardApp() {';

function getDashboardSource() {
  const source = fs.readFileSync(APP_SOURCE, 'utf8');
  const dashboardIndex = source.indexOf(DASHBOARD_START);
  const initIndex = source.indexOf(INIT_START);
  if (dashboardIndex < 0) throw new Error('Dashboard section not found');
  const dashboardEnd = initIndex >= 0 ? initIndex : source.length;
  return source.slice(dashboardIndex, dashboardEnd);
}

function main() {
  if (!fs.existsSync(CLIENT_BUNDLE)) {
    console.error('Missing client.bundle.js — run npm run build first.');
    process.exit(1);
  }

  const bundle = fs.readFileSync(CLIENT_BUNDLE, 'utf8');
  const dashboard = getDashboardSource();

  const iconRefs = new Set();
  const iconPattern = /ICON_[A-Z_]+/g;
  let match;
  while ((match = iconPattern.exec(dashboard)) !== null) {
    iconRefs.add(match[0]);
  }

  for (const icon of iconRefs) {
    if (!bundle.includes(icon)) {
      console.error(`Client bundle missing icon reference: ${icon}`);
      process.exit(1);
    }
  }

  const required = ['resolveTenantParams', 'appendTenantParams', 'loadDashboard', 'ICON_CALENDAR'];
  for (const token of required) {
    if (!bundle.includes(token)) {
      console.error(`Client bundle missing required token: ${token}`);
      process.exit(1);
    }
  }

  console.log('Frontend bundle validation passed.');
}

main();
