const { getSnapshot } = require('./account-store');
const { monthKeyFromDate } = require('./marketing-metrics');
const { getWonDate } = require('./metrics-model');
const {
  autoSyncMetaReportGhlAfterSnapshot,
  syncGhlMonthsFromSnapshotSafe,
} = require('./meta-report-ghl-service');

function shouldAutoSyncMetaReportGhl(account) {
  return Boolean(
    account?.metaReportEnabled
    && account?.metaReportGhlDataEnabled
    && account?.metaReportToplineMode === 'cenhub',
  );
}

function resolveAffectedMonthKeys(opportunity, account) {
  const timeZone = account?.timezone || 'Europe/Copenhagen';
  const keys = new Set();

  const createdAt = opportunity?.createdAt || opportunity?.created_at || null;
  if (createdAt) {
    const createdMonth = monthKeyFromDate(createdAt, timeZone);
    if (createdMonth) keys.add(createdMonth);
  }

  if (String(opportunity?.status || '').toLowerCase() === 'won') {
    const wonMonth = monthKeyFromDate(getWonDate(opportunity), timeZone);
    if (wonMonth) keys.add(wonMonth);
  }

  const updatedAt = opportunity?.updatedAt || opportunity?.updated_at || null;
  if (updatedAt) {
    const updatedMonth = monthKeyFromDate(updatedAt, timeZone);
    if (updatedMonth) keys.add(updatedMonth);
  }

  return [...keys];
}

async function triggerMetaReportGhlSyncForOpportunity(account, opportunity, {
  deleted = false,
  opportunityId = null,
} = {}) {
  if (!shouldAutoSyncMetaReportGhl(account)) {
    return { skipped: true, reason: 'not_cenhub_report' };
  }

  let monthKeys = resolveAffectedMonthKeys(opportunity, account);
  if (!monthKeys.length && opportunityId) {
    const snapshot = await getSnapshot(account.clientId);
    const existing = (snapshot?.opportunities || []).find(
      (row) => String(row?.id) === String(opportunityId),
    );
    monthKeys = resolveAffectedMonthKeys(existing, account);
  }

  if (!monthKeys.length) {
    const { getCurrentMonthKey } = require('./marketing-metrics');
    monthKeys = [getCurrentMonthKey(account.timezone)];
  }

  const result = await syncGhlMonthsFromSnapshotSafe(account.clientId, monthKeys, {
    overwriteManual: false,
  });

  return {
    deleted,
    monthKeys,
    ...result,
  };
}

async function triggerMetaReportGhlSyncAfterFullSnapshot(account, options = {}) {
  if (!shouldAutoSyncMetaReportGhl(account)) {
    return { skipped: true, reason: 'not_cenhub_report' };
  }
  return autoSyncMetaReportGhlAfterSnapshot(account.clientId, options);
}

module.exports = {
  resolveAffectedMonthKeys,
  shouldAutoSyncMetaReportGhl,
  triggerMetaReportGhlSyncAfterFullSnapshot,
  triggerMetaReportGhlSyncForOpportunity,
};
