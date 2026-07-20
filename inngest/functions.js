const { cron } = require('inngest');
const { inngest } = require('../lib/inngest-client');
const { listClientIds, listMetaSyncableClientIds } = require('../lib/account-store');
const { buildAccountSyncEvents, createBatchId } = require('../lib/sync-batch');
const { syncAccount } = require('../lib/sync-service');
const { syncMetaMetrics } = require('../lib/meta-sync-service');
const { logMetaSyncRun } = require('../lib/sync-history');

async function listSyncableClientIds() {
  return listClientIds();
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

    return step.run(`sync-${clientId}`, () => syncAccount(clientId, {
      source: event.data?.source || 'inngest',
    }));
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

const metaSyncCron = process.env.META_SYNC_CRON || 'TZ=Europe/Copenhagen 0 */2 * * *';

const dailyMetaSyncAll = inngest.createFunction(
  {
    id: 'daily-sync-meta-metrics',
    name: 'Sync Meta ad metrics (scheduled, sequential)',
    triggers: [cron(metaSyncCron)],
  },
  async ({ step }) => {
    const clientIds = await step.run('list-meta-clients', listMetaSyncableClientIds);
    if (!clientIds.length) {
      await step.run('log-meta-cron-empty', async () => {
        await logMetaSyncRun(null, {
          status: 'skipped',
          source: 'inngest',
          errorMessage: 'Inngest Meta cron ran but no syncable clients (check META_SYSTEM_USER_TOKEN and meta ad account IDs).',
          startedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString(),
        });
        return { logged: true };
      });
      return { synced: 0, skipped: 0, results: [], schedule: metaSyncCron };
    }

    await step.run('log-meta-cron-start', async () => {
      await logMetaSyncRun(null, {
        status: 'cron_tick',
        source: 'inngest',
        errorMessage: `Inngest Meta cron started for ${clientIds.length} client(s).`,
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
      });
      return { logged: true };
    });

    const results = [];
    for (const clientId of clientIds) {
      const result = await step.run(`sync-meta-${clientId}`, () => syncMetaMetrics(clientId, { source: 'inngest' }));
      results.push({ clientId, ...result });
    }

    const synced = results.filter((row) => row.success).length;
    const skipped = results.filter((row) => row.skipped).length;
    const failed = results.filter((row) => !row.success && !row.skipped).length;

    await step.run('log-meta-cron-finish', async () => {
      await logMetaSyncRun(null, {
        status: failed ? 'error' : 'success',
        source: 'inngest',
        errorMessage: `Inngest Meta cron finished: ${synced} synced, ${skipped} skipped, ${failed} failed.`,
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
      });
      return { logged: true };
    });

    return { synced, skipped, failed, results };
  },
);

module.exports = {
  dailySyncAll,
  dailyMetaSyncAll,
  syncAllAccounts,
  syncOneAccount,
  inngestFunctions: [dailySyncAll, syncOneAccount, syncAllAccounts, dailyMetaSyncAll],
};
