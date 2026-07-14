const { cron } = require('inngest');
const { inngest } = require('../lib/inngest-client');
const { listAccounts } = require('../lib/account-store');
const { buildAccountSyncEvents, createBatchId } = require('../lib/sync-batch');
const { syncAccount } = require('../lib/sync-service');

async function listSyncableClientIds() {
  const clients = await listAccounts();
  return clients.map((client) => client.clientId);
}

const dailySyncAll = inngest.createFunction(
  {
    id: 'daily-sync-all-accounts',
    name: 'Daily sync all dashboard accounts',
    triggers: [cron('TZ=Europe/Copenhagen 0 3 * * *')],
  },
  async ({ step }) => {
    const clientIds = await step.run('list-clients', listSyncableClientIds);
    if (!clientIds.length) {
      return { queued: 0 };
    }

    const batchId = createBatchId();
    await step.sendEvent(
      'fan-out-daily-syncs',
      buildAccountSyncEvents(clientIds, { batchId, source: 'cron' }),
    );

    return { queued: clientIds.length, batchId };
  },
);

const syncOneAccount = inngest.createFunction(
  {
    id: 'sync-one-account',
    name: 'Sync one dashboard account',
    triggers: [{ event: 'dashboard/sync.account' }],
  },
  async ({ event, step }) => {
    const clientId = event.data?.clientId;
    if (!clientId) {
      throw new Error('Missing clientId in event data.');
    }

    return step.run(`sync-${clientId}`, () => syncAccount(clientId));
  },
);

const syncAllAccounts = inngest.createFunction(
  {
    id: 'sync-all-accounts-manual',
    name: 'Manual sync all dashboard accounts',
    triggers: [{ event: 'dashboard/sync.all' }],
  },
  async ({ event, step }) => {
    const batchId = event.data?.batchId || createBatchId();
    const source = event.data?.source || 'manual';
    const clientIds = await step.run('list-clients', listSyncableClientIds);

    if (!clientIds.length) {
      return { queued: 0, batchId };
    }

    await step.sendEvent(
      'fan-out-account-syncs',
      buildAccountSyncEvents(clientIds, { batchId, source }),
    );

    return { queued: clientIds.length, batchId, clientIds };
  },
);

module.exports = {
  dailySyncAll,
  syncAllAccounts,
  syncOneAccount,
  inngestFunctions: [dailySyncAll, syncOneAccount, syncAllAccounts],
};
