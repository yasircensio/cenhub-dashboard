const crypto = require('crypto');
const { query, usePostgres } = require('./db');
const { timingSafeEquals } = require('./client-access');
const { getAccount, listClientIds } = require('./account-store');

function generateReportAccessToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function getAccountByReportToken(token) {
  const normalized = String(token || '').trim();
  if (!normalized) return null;

  if (!usePostgres()) {
    const ids = await listClientIds();
    for (const clientId of ids) {
      const account = await getAccount(clientId);
      if (!account?.metaReportEnabled) continue;
      if (!account.metaReportAccessToken) continue;
      if (timingSafeEquals(account.metaReportAccessToken, normalized)) {
        return account;
      }
    }
    return null;
  }

  const rows = await query`
    SELECT *
    FROM accounts
    WHERE meta_report_enabled = TRUE
      AND meta_report_access_token IS NOT NULL
      AND meta_report_access_token <> ''
    LIMIT 200
  `;

  for (const row of rows) {
    if (timingSafeEquals(row.meta_report_access_token, normalized)) {
      return getAccount(row.client_id);
    }
  }

  return null;
}

async function requireReportAccess(token) {
  const account = await getAccountByReportToken(token);
  if (!account?.metaReportEnabled) {
    const error = new Error('Report not found.');
    error.statusCode = 404;
    throw error;
  }
  return account;
}

module.exports = {
  generateReportAccessToken,
  getAccountByReportToken,
  requireReportAccess,
};
