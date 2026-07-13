const { cron } = require('inngest');
const { inngest } = require('../lib/inngest-client');
const { listAccounts } = require('../lib/account-store');
const { syncAccount } = require('../lib/sync-service');

const dailySyncAll = inngest.createFunction(
  {
    id: 'daily-sync-all-accounts',
    name: 'Daily sync all dashboard accounts',
    triggers: [cron('TZ=Europe/Copenhagen 0 3 * * *')],
  },
  async () => {
    const clients = await listAccounts();
    const results = [];

    for (const client of clients) {
      try {
        const result = await syncAccount(client.clientId);
        results.push({ clientId: client.clientId, success: true, ...result });
      } catch (error) {
        results.push({
          clientId: client.clientId,
          success: false,
          error: error.message,
        });
      }
    }

    return { synced: results.length, results };
  },
);

const syncOneAccount = inngest.createFunction(
  {
    id: 'sync-one-account',
    name: 'Sync one dashboard account',
    triggers: [{ event: 'dashboard/sync.account' }],
  },
  async ({ event }) => {
    const clientId = event.data?.clientId;
    if (!clientId) {
      throw new Error('Missing clientId in event data.');
    }
    return syncAccount(clientId);
  },
);

const syncAllAccounts = inngest.createFunction(
  {
    id: 'sync-all-accounts-manual',
    name: 'Manual sync all dashboard accounts',
    triggers: [{ event: 'dashboard/sync.all' }],
  },
  async () => {
    const clients = await listAccounts();
    const results = [];

    for (const client of clients) {
      try {
        const result = await syncAccount(client.clientId);
        results.push({ clientId: client.clientId, success: true, ...result });
      } catch (error) {
        results.push({
          clientId: client.clientId,
          success: false,
          error: error.message,
        });
      }
    }

    return { synced: results.length, results };
  },
);

module.exports = {
  dailySyncAll,
  syncAllAccounts,
  syncOneAccount,
  inngestFunctions: [dailySyncAll, syncOneAccount, syncAllAccounts],
};
