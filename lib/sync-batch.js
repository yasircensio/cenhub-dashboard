const { syncAccount } = require('./sync-service');
const { syncMetaMetrics } = require('./meta-sync-service');

const INLINE_SYNC_MAX_CLIENTS = 20;

function createBatchId() {
  return `batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function syncAllInline(clientIds, { source = 'manual' } = {}) {
  return Promise.all(
    clientIds.map(async (clientId) => {
      try {
        const result = await syncAccount(clientId, { source });
        return { clientId, success: true, ...result };
      } catch (error) {
        return { clientId, success: false, error: error.message };
      }
    }),
  );
}

async function syncAllGhlInline(clientIds, { source = 'manual' } = {}) {
  const results = [];
  for (const clientId of clientIds) {
    try {
      const result = await syncAccount(clientId, { source });
      results.push({ clientId, success: true, ...result });
    } catch (error) {
      results.push({ clientId, success: false, error: error.message });
    }
  }
  return results;
}

async function syncAllMetaInline(clientIds, { source = 'manual' } = {}) {
  const results = [];
  for (const clientId of clientIds) {
    try {
      const result = await syncMetaMetrics(clientId, { source });
      results.push({ clientId, success: Boolean(result.success), ...result });
    } catch (error) {
      results.push({ clientId, success: false, error: error.message });
    }
  }
  return results;
}

module.exports = {
  INLINE_SYNC_MAX_CLIENTS,
  createBatchId,
  syncAllGhlInline,
  syncAllInline,
  syncAllMetaInline,
};
