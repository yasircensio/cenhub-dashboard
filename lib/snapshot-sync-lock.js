class SyncInProgressError extends Error {
  constructor(clientId) {
    super(`GHL full sync in progress for "${clientId}".`);
    this.name = 'SyncInProgressError';
    this.code = 'SYNC_IN_PROGRESS';
    this.clientId = clientId;
  }
}

async function assertClientNotSyncing(clientId, snapshot = null) {
  const { getSnapshot } = require('./account-store');
  const row = snapshot || await getSnapshot(clientId);
  if (row?.sync_status === 'syncing') {
    throw new SyncInProgressError(clientId);
  }
}

module.exports = {
  SyncInProgressError,
  assertClientNotSyncing,
};
