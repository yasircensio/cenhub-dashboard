#!/usr/bin/env node
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { listClientIds } = require('../lib/account-store');
const { syncAllGhlInline } = require('../lib/sync-batch');

async function main() {
  const clientIds = await listClientIds();
  if (!clientIds.length) {
    console.log('No clients found.');
    return;
  }

  console.log(`Syncing ${clientIds.length} client(s): ${clientIds.join(', ')}`);
  const results = await syncAllGhlInline(clientIds, { source: process.argv.includes('--cron') ? 'vercel-cron' : 'manual' });

  for (const row of results) {
    if (row.success) {
      console.log(`OK  ${row.clientId}: ${row.opportunityCount ?? '?'} opportunities`);
    } else {
      console.log(`ERR ${row.clientId}: ${row.error}`);
    }
  }

  const failed = results.filter((row) => !row.success).length;
  if (failed) {
    process.exit(1);
  }
  console.log('GHL sync all completed.');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
