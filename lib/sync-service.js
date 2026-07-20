const {
  getAccount,
  getSnapshot,
  logSyncRun,
  lockMetricsModelAfterFirstSync,
  setSyncState,
  updateAccount,
  upsertSnapshot,
} = require('./account-store');
const { setDashboardCache } = require('./dashboard-cache');
const { fetchGhlData } = require('./ghl-sync');

async function syncAccount(clientId, options = {}) {
  const source = options.source || 'unknown';
  const account = await getAccount(clientId, { includeSecrets: true });
  if (!account) {
    const error = new Error(`Account "${clientId}" not found.`);
    error.statusCode = 404;
    throw error;
  }

  const startedAt = new Date().toISOString();
  await setSyncState(clientId, { syncStatus: 'syncing', syncError: null });

  async function failSync(message, statusCode = 400) {
    await setSyncState(clientId, { syncStatus: 'error', syncError: message });
    await logSyncRun(clientId, {
      status: 'error',
      errorMessage: message,
      startedAt,
      finishedAt: new Date().toISOString(),
      source,
    });
    const error = new Error(message);
    error.statusCode = statusCode;
    throw error;
  }

  if (!account.ghlToken) {
    await failSync('Missing GHL token for this account.');
  }
  if (!account.locationId) {
    await failSync('Missing GHL location ID for this account.');
  }
  if (!account.metricsModelSetAt) {
    await failSync('Configure the metrics model before syncing this account.');
  }

  try {
    const data = await fetchGhlData(account.ghlToken, account.locationId);
    if (data.bundlinjeFieldId && data.bundlinjeFieldId !== account.profitFieldId) {
      await updateAccount(clientId, { profitFieldId: data.bundlinjeFieldId });
    }
    const finishedAt = new Date().toISOString();
    await upsertSnapshot(clientId, {
      fetchedAt: finishedAt,
      opportunities: data.opportunities,
      pipelines: data.pipelines,
      users: data.users,
      contactCount: data.contactCount,
      syncStatus: 'success',
      syncError: null,
    });
    await setDashboardCache(clientId, data).catch(() => {});
    await logSyncRun(clientId, {
      status: 'success',
      opportunityCount: data.opportunities.length,
      startedAt,
      finishedAt: new Date().toISOString(),
      source,
    });
    await lockMetricsModelAfterFirstSync(clientId);
    return {
      success: true,
      clientId,
      opportunityCount: data.opportunities.length,
      pipelineCount: data.pipelines.length,
      fetchedAt: finishedAt,
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
      source,
    });
    throw error;
  }
}

module.exports = {
  syncAccount,
};
