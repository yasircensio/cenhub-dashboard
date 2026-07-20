const {
  getAccount,
  setMetaSyncState,
  updateAccount,
} = require('./account-store');
const { saveClientMetrics } = require('./facebook-metrics-handler');
const { logMetaSyncRun } = require('./sync-history');
const {
  fetchAllInsightsBuckets,
  transformToMetricsPayload,
} = require('./meta-insights');
const {
  resolveMetaAccessToken,
  verifyMetaAccessToken,
} = require('./meta-token');

async function recordMetaSyncRun(clientId, payload) {
  try {
    await logMetaSyncRun(clientId, payload);
  } catch {
    // History logging should not block sync.
  }
}

async function syncMetaMetrics(clientId, options = {}) {
  const source = options.source || 'unknown';
  const startedAt = new Date().toISOString();
  const account = await getAccount(clientId, { includeSecrets: true });
  if (!account) {
    const error = new Error(`Account "${clientId}" not found.`);
    error.statusCode = 404;
    throw error;
  }

  if (!account.metaAdAccountId) {
    const reason = 'Missing Meta ad account ID.';
    const finishedAt = new Date().toISOString();
    await recordMetaSyncRun(clientId, {
      status: 'skipped',
      source,
      errorMessage: reason,
      startedAt,
      finishedAt,
    });
    return { skipped: true, clientId, reason };
  }

  if (options.clearAccountTokenOverride) {
    await updateAccount(clientId, { clearMetaSystemUserToken: true });
    account.metaSystemUserToken = '';
  }

  let resolved = resolveMetaAccessToken(account);
  if (!resolved.token) {
    const reason = resolved.reason || 'Missing Meta system user token.';
    const finishedAt = new Date().toISOString();
    await recordMetaSyncRun(clientId, {
      status: 'skipped',
      source,
      errorMessage: reason,
      startedAt,
      finishedAt,
    });
    return {
      skipped: true,
      clientId,
      reason,
      tokenSource: resolved.source,
      ignoredAccountOverride: resolved.ignoredAccountOverride || false,
    };
  }

  let verified = await verifyMetaAccessToken(resolved.token, {
    adAccountId: account.metaAdAccountId,
  });

  if (!verified.ok && resolved.source === 'account') {
    const envResolved = resolveMetaAccessToken({ ...account, metaSystemUserToken: '' });
    if (envResolved.token && envResolved.source === 'env') {
      const envVerified = await verifyMetaAccessToken(envResolved.token, {
        adAccountId: account.metaAdAccountId,
      });
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
    let message = verified.reason || 'Meta token verification failed.';
    if (resolved.source === 'env') {
      message += ` Using Vercel env token${resolved.hint ? ` (${resolved.hint})` : ''}. Re-copy the System User token from Meta Business Settings into META_SYSTEM_USER_TOKEN, redeploy, and sync again.`;
    } else if (resolved.source === 'account') {
      message += ' Clear the saved token override in admin and use META_SYSTEM_USER_TOKEN on Vercel instead.';
    }
    const finishedAt = new Date().toISOString();
    await setMetaSyncState(clientId, {
      metaSyncStatus: 'error',
      metaSyncError: message,
      metaLastSyncedAt: account.metaLastSyncedAt || null,
    });
    await recordMetaSyncRun(clientId, {
      status: 'error',
      source,
      errorMessage: message,
      startedAt,
      finishedAt,
    });
    const error = new Error(message);
    error.statusCode = 400;
    throw error;
  }

  const metricsKey = account.facebookClientId || account.clientId;
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
    const thisMonthSpend = buckets.this_month?.spend != null ? Number(buckets.this_month.spend) : null;
    const spendDateStop = buckets.this_month?.date_stop || null;

    await setMetaSyncState(clientId, {
      metaSyncStatus: 'ok',
      metaSyncError: null,
      metaLastSyncedAt: finishedAt,
    });
    await recordMetaSyncRun(clientId, {
      status: 'success',
      source,
      startedAt,
      finishedAt,
      thisMonthSpend,
      spendDateStop,
      metricsClientId: savedClientId,
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
    const finishedAt = new Date().toISOString();
    await setMetaSyncState(clientId, {
      metaSyncStatus: 'error',
      metaSyncError: error.message || 'Meta sync failed.',
      metaLastSyncedAt: account.metaLastSyncedAt || null,
    });
    await recordMetaSyncRun(clientId, {
      status: 'error',
      source,
      errorMessage: error.message || 'Meta sync failed.',
      startedAt,
      finishedAt,
    });
    error.tokenMeta = tokenMeta;
    throw error;
  }
}

module.exports = {
  syncMetaMetrics,
};
