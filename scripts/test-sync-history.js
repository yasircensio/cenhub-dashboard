require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { listMetaSyncRuns, listGhlSyncRuns } = require('../lib/sync-history');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const meta = await listMetaSyncRuns({ limit: 5 });
  assert(meta.type === 'meta', 'meta type');
  assert(Array.isArray(meta.runs), 'meta runs array');
  assert(meta.summary.schedule, 'meta schedule present');

  const ghl = await listGhlSyncRuns({ limit: 5 });
  assert(ghl.type === 'ghl', 'ghl type');
  assert(Array.isArray(ghl.runs), 'ghl runs array');
  assert(ghl.summary.schedule.includes('3 * * *'), 'ghl schedule');

  console.log('Sync history tests passed.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
