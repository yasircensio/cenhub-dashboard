const { inngest, isInngestConfigured } = require('./inngest-client');
const { listClientIds, listMetaSyncableClientIds, setSyncState } = require('./account-store');
const { syncAccount } = require('./sync-service');
const { syncMetaMetrics } = require('./meta-sync-service');

const INLINE_SYNC_MAX_CLIENTS = 20;

function createBatchId() {
  return `batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildAccountSyncEvents(clientIds, { batchId = null, source = 'manual' } = {}) {
  return clientIds.map((clientId) => ({
    name: 'dashboard/sync.account',
    data: {
      clientId,
      batchId,
      source,
    },
  }));
}

async function syncAllInline(clientIds) {
  return Promise.all(
    clientIds.map(async (clientId) => {
      try {
        const result = await syncAccount(clientId);
        return { clientId, success: true, ...result };
      } catch (error) {
        return { clientId, success: false, error: error.message };
      }
    }),
  );
}

async function queueSyncAll({ source = 'admin' } = {}) {
  if (!isInngestConfigured()) {
    const error = new Error('Inngest is not configured. Set INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY.');
    error.statusCode = 503;
    throw error;
  }

  const clientIds = await listClientIds();
  const batchId = createBatchId();

  if (clientIds.length) {
    await Promise.all(
      clientIds.map((clientId) => setSyncState(clientId, { syncStatus: 'syncing', syncError: null })),
    );
    await inngest.send(buildAccountSyncEvents(clientIds, { batchId, source }));
  }

  return {
    queued: true,
    batchId,
    clientIds,
    count: clientIds.length,
  };
}

async function syncAllMetaInline(clientIds) {
  const results = [];
  for (const clientId of clientIds) {
    try {
      const result = await syncMetaMetrics(clientId);
      results.push({ clientId, success: !result.skipped, ...result });
    } catch (error) {
      results.push({ clientId, success: false, error: error.message });
    }
  }
  return results;
}

module.exports = {
  INLINE_SYNC_MAX_CLIENTS,
  buildAccountSyncEvents,
  createBatchId,
  queueSyncAll,
  syncAllInline,
  syncAllMetaInline,
};
