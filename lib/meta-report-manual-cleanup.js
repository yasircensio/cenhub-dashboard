const { getAccount, normalizeClientId } = require('./account-store');
const { query, usePostgres } = require('./db');
const {
  aggregateGhlMonthForReport,
  canUseGhlForMonth,
} = require('./meta-report-ghl-aggregator');
const { switchMonthToMetaSource } = require('./meta-report-ghl-service');
const {
  getMonthRecord,
  listMetaReportClients,
} = require('./meta-report-store');
const { isCenhubManualStored } = require('./meta-report-topline-mode');

const fs = require('fs');
const path = require('path');

const META_REPORTS_FILE = path.join(__dirname, '..', '.data', 'meta-reports-store.json');

function readLocalMetaMonths() {
  if (!fs.existsSync(META_REPORTS_FILE)) return {};
  try {
    const parsed = JSON.parse(fs.readFileSync(META_REPORTS_FILE, 'utf8'));
    return parsed.months || {};
  } catch {
    return {};
  }
}

async function listManualMonthKeys(clientId) {
  const id = normalizeClientId(clientId);

  if (usePostgres()) {
    const rows = await query`
      SELECT month_key
      FROM meta_report_months
      WHERE client_id = ${id}
        AND manual_override = TRUE
        AND topline_source = 'manual'
    `;
    return rows.map((row) => row.month_key);
  }

  const prefix = `${id}::`;
  return Object.keys(readLocalMetaMonths())
    .filter((key) => key.startsWith(prefix))
    .map((key) => key.slice(prefix.length))
    .filter((monthKey) => {
      const row = readLocalMetaMonths()[`${id}::${monthKey}`];
      return Boolean(row?.manual_override) && row?.topline_source === 'manual';
    });
}

function clientEligibleForCleanup(account) {
  return Boolean(
    account?.metaReportEnabled
    && account?.metaReportGhlDataEnabled
    && account?.metaReportToplineMode === 'cenhub',
  );
}

async function isStuckManualMonth(clientId, monthKey) {
  const account = await getAccount(clientId);
  if (!clientEligibleForCleanup(account)) return false;

  const month = await getMonthRecord(clientId, monthKey);
  if (!isCenhubManualStored(month)) return false;

  const aggregated = await aggregateGhlMonthForReport(clientId, monthKey);
  return !canUseGhlForMonth(aggregated);
}

async function findStuckManualMonths({ clientId = null } = {}) {
  const stuck = [];
  const clients = (await listMetaReportClients({ filter: 'all' }))
    .filter((row) => !clientId || row.clientId === normalizeClientId(clientId))
    .filter((row) => row.metaReportGhlDataEnabled && row.metaReportToplineMode === 'cenhub');

  for (const client of clients) {
    const account = await getAccount(client.clientId);
    if (!clientEligibleForCleanup(account)) continue;

    const monthKeys = await listManualMonthKeys(client.clientId);
    for (const monthKey of monthKeys) {
      if (await isStuckManualMonth(client.clientId, monthKey)) {
        stuck.push({
          clientId: client.clientId,
          accountName: client.accountName,
          monthKey,
          reason: 'manual_without_cenhub_data',
        });
      }
    }
  }

  return stuck;
}

async function cleanupStuckManualMonths({ clientId = null, dryRun = true } = {}) {
  const stuck = await findStuckManualMonths({ clientId });
  const results = {
    dryRun,
    found: stuck.length,
    restored: [],
    errors: [],
  };

  if (dryRun) {
    return { ...results, items: stuck };
  }

  for (const item of stuck) {
    try {
      await switchMonthToMetaSource(item.clientId, item.monthKey);
      results.restored.push(item);
    } catch (error) {
      results.errors.push({
        ...item,
        message: error.message || String(error),
      });
    }
  }

  return results;
}

module.exports = {
  cleanupStuckManualMonths,
  findStuckManualMonths,
  isStuckManualMonth,
};
