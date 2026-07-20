const { cron } = require('inngest');
const { inngest } = require('../lib/inngest-client');
const { listClientIds, listMetaSyncableClientIds } = require('../lib/account-store');
const { buildAccountSyncEvents, createBatchId } = require('../lib/sync-batch');
const { syncAccount } = require('../lib/sync-service');
const { syncMetaMetrics } = require('../lib/meta-sync-service');
const { logMetaSyncRun } = require('../lib/sync-history');
const { usePostgres } = require('../lib/db');

async function listSyncableClientIds() {
  return listClientIds();
}

function metaSyncResultToHistory(clientId, result, source = 'inngest') {
  const startedAt = result.startedAt || new Date().toISOString();
  const finishedAt = result.finishedAt || new Date().toISOString();
  if (result.skipped) {
    return {
      status: 'skipped',
      source,
      errorMessage: result.reason || 'Meta sync skipped.',
      startedAt,
      finishedAt,
    };
  }
  if (result.success) {
    return {
      status: 'success',
      source,
      startedAt,
      finishedAt,
      thisMonthSpend: result.thisMonthSpend ?? null,
      spendDateStop: result.spendDateStop ?? null,
      metricsClientId: result.metricsClientId ?? null,
    };
  }
  return {
    status: 'error',
    source,
    errorMessage: result.reason || 'Meta sync failed.',
    startedAt,
    finishedAt,
  };
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
  async ({ step, runId }) => {
    if (!usePostgres()) {
      throw new Error(
        'DATABASE_URL is not configured on this deployment. Inngest is likely invoking a preview URL without Production env vars. Sync Inngest to https://cenhub-dashboard.vercel.app/api/inngest only and set INNGEST_SERVE_ORIGIN on Vercel Production.',
      );
    }

    const tickAt = new Date().toISOString();
    await logMetaSyncRun(null, {
      status: 'cron_tick',
      source: 'inngest',
      errorMessage: `Inngest Meta cron fired (run ${runId}, schedule: ${metaSyncCron}).`,
      startedAt: tickAt,
      finishedAt: tickAt,
    });

    const clientIds = await step.run('list-meta-clients', listMetaSyncableClientIds);
    if (!clientIds.length) {
      const emptyAt = new Date().toISOString();
      await logMetaSyncRun(null, {
        status: 'skipped',
        source: 'inngest',
        errorMessage: 'Inngest Meta cron ran but no syncable clients (check META_SYSTEM_USER_TOKEN and meta ad account IDs).',
        startedAt: emptyAt,
        finishedAt: emptyAt,
      });
      return { synced: 0, skipped: 0, failed: 0, results: [], schedule: metaSyncCron };
    }

    const results = [];
    for (const clientId of clientIds) {
      let syncResult;
      try {
        syncResult = await step.run(`sync-meta-${clientId}`, () => syncMetaMetrics(clientId, {
          source: 'inngest',
          skipHistoryLog: true,
        }));
      } catch (error) {
        const failedAt = new Date().toISOString();
        await logMetaSyncRun(clientId, {
          status: 'error',
          source: 'inngest',
          errorMessage: error.message || 'Meta sync failed.',
          startedAt: failedAt,
          finishedAt: failedAt,
        });
        results.push({
          clientId,
          success: false,
          skipped: false,
          reason: error.message || 'Meta sync failed.',
        });
        continue;
      }

      const historyPayload = metaSyncResultToHistory(clientId, {
        ...syncResult,
        thisMonthSpend: syncResult.thisMonthSpend,
        spendDateStop: syncResult.spendDateStop,
        metricsClientId: syncResult.metricsClientId,
        reason: syncResult.reason,
      });
      await logMetaSyncRun(clientId, historyPayload);
      results.push({
        clientId,
        success: Boolean(syncResult.success),
        skipped: Boolean(syncResult.skipped),
        reason: syncResult.reason || null,
      });
    }

    const synced = results.filter((row) => row.success).length;
    const skipped = results.filter((row) => row.skipped).length;
    const failed = results.filter((row) => !row.success && !row.skipped).length;

    const finishAt = new Date().toISOString();
    await logMetaSyncRun(null, {
      status: failed ? 'error' : 'success',
      source: 'inngest',
      errorMessage: `Inngest Meta cron finished: ${synced} synced, ${skipped} skipped, ${failed} failed.`,
      startedAt: finishAt,
      finishedAt: finishAt,
    });

    return { synced, skipped, failed, schedule: metaSyncCron, runId };
  },
);

module.exports = {
  dailySyncAll,
  dailyMetaSyncAll,
  syncAllAccounts,
  syncOneAccount,
  inngestFunctions: [dailySyncAll, syncOneAccount, syncAllAccounts, dailyMetaSyncAll],
};
