#!/usr/bin/env node
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { cleanupStuckManualMonths } = require('../lib/meta-report-manual-cleanup');

function readArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return '';
  return process.argv[index + 1] || '';
}

async function main() {
  const apply = process.argv.includes('--apply');
  const clientId = readArg('--client') || null;

  const result = await cleanupStuckManualMonths({
    clientId,
    dryRun: !apply,
  });

  if (result.dryRun) {
    console.log(`Found ${result.found} stuck manual month(s) (no Cenhub data — should use Meta instead).`);
    if (!result.found) {
      console.log('Nothing to clean up.');
      return;
    }
    for (const item of result.items) {
      console.log(`  - ${item.accountName} (${item.clientId}) · ${item.monthKey}`);
    }
    console.log('\nDry run only. Re-run with --apply to restore these months to Meta.');
    return;
  }

  console.log(`Restored ${result.restored.length} month(s) to Meta.`);
  if (result.errors.length) {
    console.error(`Failed on ${result.errors.length} month(s):`);
    for (const item of result.errors) {
      console.error(`  - ${item.clientId} · ${item.monthKey}: ${item.message}`);
    }
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
