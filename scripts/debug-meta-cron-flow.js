#!/usr/bin/env node
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { logMetaSyncRunForInngest, listMetaSyncRuns } = require('../lib/sync-history');
const { listMetaSyncableClientIds } = require('../lib/account-store');

async function main() {
  console.log('=== debug meta cron flow ===');
  console.log('DATABASE_URL:', Boolean(process.env.DATABASE_URL));
  console.log('CRON_SECRET:', Boolean(process.env.CRON_SECRET));
  console.log('META_SYSTEM_USER_TOKEN:', Boolean(process.env.META_SYSTEM_USER_TOKEN));

  const tickAt = new Date().toISOString();
  await logMetaSyncRunForInngest(null, {
    status: 'cron_tick',
    source: 'vercel-cron',
    errorMessage: `Local debug script tick at ${tickAt}`,
    startedAt: tickAt,
    finishedAt: tickAt,
  });

  const clientIds = await listMetaSyncableClientIds();
  console.log('syncable clients:', clientIds);

  const list = await listMetaSyncRuns({ limit: 5 });
  console.log('latest rows:', list.runs.map((r) => ({
    id: r.id,
    client: r.clientId,
    status: r.status,
    source: r.source,
    at: r.startedAt,
  })));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
