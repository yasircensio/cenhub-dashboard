const { cron } = require('inngest');
const { inngest } = require('../lib/inngest-client');
const { listClientIds } = require('../lib/account-store');
const { buildAccountSyncEvents, createBatchId } = require('../lib/sync-batch');
const { syncAccount } = require('../lib/sync-service');

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
const PRODUCTION_APP_URL = (process.env.INNGEST_SERVE_ORIGIN || 'https://cenhub-dashboard.vercel.app').replace(/\/$/, '');

const dailyMetaSyncAll = inngest.createFunction(
  {
    id: 'daily-sync-meta-metrics',
    name: 'Sync Meta ad metrics (scheduled, sequential)',
    triggers: [cron(metaSyncCron)],
  },
  async ({ step, runId }) => {
    return step.run('run-meta-sync-on-production', async () => {
      const eventKey = process.env.INNGEST_EVENT_KEY;
      if (!eventKey) {
        throw new Error('INNGEST_EVENT_KEY is not configured.');
      }

      const response = await fetch(`${PRODUCTION_APP_URL}/api/meta-sync-inngest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${eventKey}`,
        },
        body: JSON.stringify({ runId, schedule: metaSyncCron }),
      });

      const text = await response.text();
      let body = null;
      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          body = { raw: text };
        }
      }

      if (!response.ok) {
        throw new Error(body?.error || text || `Production meta sync failed (${response.status})`);
      }

      return body;
    });
  },
);

module.exports = {
  dailySyncAll,
  dailyMetaSyncAll,
  syncAllAccounts,
  syncOneAccount,
  inngestFunctions: [dailySyncAll, syncOneAccount, syncAllAccounts, dailyMetaSyncAll],
};
