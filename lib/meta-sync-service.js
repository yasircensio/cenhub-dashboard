const {
  getAccount,
  resolveMetaSystemUserToken,
  setMetaSyncState,
} = require('./account-store');
const { saveClientMetrics } = require('./facebook-metrics-handler');
const {
  fetchAllInsightsBuckets,
  transformToMetricsPayload,
  validateMetaAccessToken,
} = require('./meta-insights');

async function syncMetaMetrics(clientId) {
  const account = await getAccount(clientId, { includeSecrets: true });
  if (!account) {
    const error = new Error(`Account "${clientId}" not found.`);
    error.statusCode = 404;
    throw error;
  }

  const accessToken = resolveMetaSystemUserToken(account);
  if (!account.metaAdAccountId) {
    return { skipped: true, clientId, reason: 'Missing Meta ad account ID.' };
  }
  const tokenCheck = validateMetaAccessToken(accessToken);
  if (!tokenCheck.ok) {
    return {
      skipped: true,
      clientId,
      reason: tokenCheck.reason,
    };
  }

  const metricsKey = account.facebookClientId || account.clientId;
  const startedAt = new Date().toISOString();

  try {
    const buckets = await fetchAllInsightsBuckets(account.metaAdAccountId, tokenCheck.token);
    const payload = transformToMetricsPayload(metricsKey, account.accountName, buckets);
    const { clientId: savedClientId } = await saveClientMetrics(payload);
    const finishedAt = new Date().toISOString();

    await setMetaSyncState(clientId, {
      metaSyncStatus: 'ok',
      metaSyncError: null,
      metaLastSyncedAt: finishedAt,
    });

    return {
      success: true,
      skipped: false,
      clientId,
      metricsClientId: savedClientId,
      metaLastSyncedAt: finishedAt,
      startedAt,
      finishedAt,
    };
  } catch (error) {
    await setMetaSyncState(clientId, {
      metaSyncStatus: 'error',
      metaSyncError: error.message || 'Meta sync failed.',
      metaLastSyncedAt: account.metaLastSyncedAt || null,
    });
    throw error;
  }
}

module.exports = {
  syncMetaMetrics,
};
