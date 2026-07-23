#!/usr/bin/env node
/**
 * Fetch Facebook Lead Ads from Meta, match GHL contacts by email/phone,
 * and write Meta lead id into contact custom field "Fb Lead id".
 *
 * Usage:
 *   node scripts/sync-meta-lead-ids-to-ghl.js censio --dry-run
 *   node scripts/sync-meta-lead-ids-to-ghl.js censio --days 90
 *   node scripts/sync-meta-lead-ids-to-ghl.js censio --apply
 *
 * Hourly production sync: GitHub Actions → GET /api/fb-lead-sync-cron
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const {
  DEFAULT_FB_LEAD_FIELD_ID,
  DEFAULT_SYNC_DAYS,
  syncMetaLeadIdsToGhl,
} = require('../lib/meta-lead-ghl-sync');

async function main() {
  const args = process.argv.slice(2);
  const clientId = args.find((a) => !a.startsWith('--')) || 'censio';
  const dryRun = !args.includes('--apply');
  const force = args.includes('--force');
  const daysArg = args.find((a) => a.startsWith('--days='));
  const days = daysArg ? Number(daysArg.split('=')[1]) : DEFAULT_SYNC_DAYS;

  console.log(`Client: ${clientId}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (pass --apply to write)' : 'APPLY'}`);
  console.log(`Window: last ${days} days`);
  console.log(`Field ID: ${DEFAULT_FB_LEAD_FIELD_ID}`);
  console.log('');

  const summary = await syncMetaLeadIdsToGhl(clientId, { days, dryRun, force });

  for (const row of summary.rows) {
    const label = [
      row.status,
      row.metaLeadId,
      row.email || row.phone || 'no-contact-info',
      row.contactId ? `→ ${row.contactId}` : '',
      row.existingFbLeadId ? `(had ${row.existingFbLeadId})` : '',
      row.error ? `[${row.error}]` : '',
    ].filter(Boolean).join(' ');
    console.log(label);
  }

  console.log('');
  console.log(`Meta leads (API): ${summary.metaLeadCount}`);
  console.log(`In ${days}-day window: ${summary.inWindow}`);
  console.log(`${dryRun ? 'Would update' : 'Updated'}: ${summary.updated}`);
  console.log(`Skipped (already has id): ${summary.skippedHasId}`);
  console.log(`Skipped (no GHL match): ${summary.skippedNoMatch}`);
  console.log(`Errors: ${summary.errors}`);

  const outPath = path.join(__dirname, '..', '.data', `${clientId}-fb-lead-id-sync.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify({ ...summary, syncedAt: new Date().toISOString() }, null, 2)}\n`);
  console.log(`\nReport: ${outPath}`);

  if (dryRun && summary.updated > 0) {
    console.log('\nRun with --apply to write missing Fb Lead ids to GHL.');
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}

module.exports = { syncMetaLeadIdsToGhl };
