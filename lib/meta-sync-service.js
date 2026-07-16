const {
  getAccount,
  setMetaSyncState,
  updateAccount,
} = require('./account-store');
const { saveClientMetrics } = require('./facebook-metrics-handler');
const {
  fetchAllInsightsBuckets,
  transformToMetricsPayload,
} = require('./meta-insights');
const {
  resolveMetaAccessToken,
  verifyMetaAccessToken,
} = require('./meta-token');

async function syncMetaMetrics(clientId, options = {}) {
  const account = await getAccount(clientId, { includeSecrets: true });
  if (!account) {
    const error = new Error(`Account "${clientId}" not found.`);
    error.statusCode = 404;
    throw error;
  }

  if (!account.metaAdAccountId) {
    return { skipped: true, clientId, reason: 'Missing Meta ad account ID.' };
  }

  if (options.clearAccountTokenOverride) {
    await updateAccount(clientId, { clearMetaSystemUserToken: true });
    account.metaSystemUserToken = '';
  }

  let resolved = resolveMetaAccessToken(account);
  if (!resolved.token) {
    return {
      skipped: true,
      clientId,
      reason: resolved.reason || 'Missing Meta system user token.',
      tokenSource: resolved.source,
      ignoredAccountOverride: resolved.ignoredAccountOverride || false,
    };
  }

  let verified = await verifyMetaAccessToken(resolved.token);

  if (!verified.ok && resolved.source === 'account') {
    const envResolved = resolveMetaAccessToken({ ...account, metaSystemUserToken: '' });
    if (envResolved.token && envResolved.source === 'env') {
      const envVerified = await verifyMetaAccessToken(envResolved.token);
      if (envVerified.ok) {
        resolved = {
          ...envResolved,
          ignoredAccountOverride: true,
          accountOverrideIssue: verified.reason,
        };
        verified = envVerified;
        await updateAccount(clientId, { clearMetaSystemUserToken: true });
      }
    }
  }

  if (!verified.ok) {
    const message = verified.reason || 'Meta token verification failed.';
    await setMetaSyncState(clientId, {
      metaSyncStatus: 'error',
      metaSyncError: message,
      metaLastSyncedAt: account.metaLastSyncedAt || null,
    });
    const error = new Error(message);
    error.statusCode = 400;
    throw error;
  }

  const metricsKey = account.facebookClientId || account.clientId;
  const startedAt = new Date().toISOString();
  const tokenMeta = {
    tokenSource: resolved.source,
    tokenHint: resolved.hint,
    ignoredAccountOverride: Boolean(resolved.ignoredAccountOverride),
  };

  try {
    const buckets = await fetchAllInsightsBuckets(account.metaAdAccountId, verified.token);
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
      ...tokenMeta,
    };
  } catch (error) {
    await setMetaSyncState(clientId, {
      metaSyncStatus: 'error',
      metaSyncError: error.message || 'Meta sync failed.',
      metaLastSyncedAt: account.metaLastSyncedAt || null,
    });
    error.tokenMeta = tokenMeta;
    throw error;
  }
}

module.exports = {
  syncMetaMetrics,
};
