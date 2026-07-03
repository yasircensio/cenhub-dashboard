const { getAccount, getSnapshot, logSyncRun, lockMetricsModelAfterFirstSync, upsertSnapshot } = require('./account-store');
const { fetchGhlData } = require('./ghl-sync');

async function syncAccount(clientId) {
  const account = await getAccount(clientId, { includeSecrets: true });
  if (!account) {
    const error = new Error(`Account "${clientId}" not found.`);
    error.statusCode = 404;
    throw error;
  }
  if (!account.ghlToken) {
    const error = new Error('Missing GHL token for this account.');
    error.statusCode = 400;
    throw error;
  }
  if (!account.locationId) {
    const error = new Error('Missing GHL location ID for this account.');
    error.statusCode = 400;
    throw error;
  }

  if (!account.metricsModelSetAt) {
    const error = new Error('Configure the metrics model before syncing this account.');
    error.statusCode = 400;
    throw error;
  }

  const startedAt = new Date().toISOString();
  try {
    const data = await fetchGhlData(account.ghlToken, account.locationId);
    await upsertSnapshot(clientId, {
      fetchedAt: data.fetchedAt,
      opportunities: data.opportunities,
      pipelines: data.pipelines,
      users: data.users,
      contactCount: data.contactCount,
      syncStatus: 'success',
      syncError: null,
    });
    await logSyncRun(clientId, {
      status: 'success',
      opportunityCount: data.opportunities.length,
      startedAt,
      finishedAt: new Date().toISOString(),
    });
    await lockMetricsModelAfterFirstSync(clientId);
    return {
      success: true,
      clientId,
      opportunityCount: data.opportunities.length,
      pipelineCount: data.pipelines.length,
      fetchedAt: data.fetchedAt,
      pipelines: data.pipelines,
    };
  } catch (error) {
    const snapshot = await getSnapshot(clientId);
    await upsertSnapshot(clientId, {
      fetchedAt: snapshot?.fetched_at || null,
      opportunities: snapshot?.opportunities || [],
      pipelines: snapshot?.pipelines || [],
      users: snapshot?.users || [],
      contactCount: snapshot?.contact_count || 0,
      syncStatus: 'error',
      syncError: error.message,
    });
    await logSyncRun(clientId, {
      status: 'error',
      errorMessage: error.message,
      startedAt,
      finishedAt: new Date().toISOString(),
    });
    throw error;
  }
}

module.exports = {
  syncAccount,
};
