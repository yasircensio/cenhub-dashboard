const { inngest, isInngestConfigured } = require('./inngest-client');
const { listAccounts, setSyncState } = require('./account-store');

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

async function queueSyncAll({ source = 'admin' } = {}) {
  if (!isInngestConfigured()) {
    const error = new Error('Inngest is not configured. Set INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY.');
    error.statusCode = 503;
    throw error;
  }

  const clients = await listAccounts();
  const clientIds = clients.map((client) => client.clientId);
  const batchId = createBatchId();

  if (clientIds.length) {
    await Promise.all(
      clientIds.map((clientId) => setSyncState(clientId, { syncStatus: 'syncing', syncError: null })),
    );
    await inngest.send({
      name: 'dashboard/sync.all',
      data: { batchId, source },
    });
  }

  return {
    queued: true,
    batchId,
    clientIds,
    count: clientIds.length,
  };
}

module.exports = {
  buildAccountSyncEvents,
  createBatchId,
  queueSyncAll,
};
