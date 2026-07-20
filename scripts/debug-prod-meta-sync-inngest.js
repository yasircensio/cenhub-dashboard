#!/usr/bin/env node
/**
 * Calls production /api/meta-sync-inngest using INNGEST_EVENT_KEY from .env
 * Usage: node scripts/debug-prod-meta-sync-inngest.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const url = 'https://cenhub-dashboard.vercel.app/api/meta-sync-inngest';
const key = String(process.env.INNGEST_EVENT_KEY || '').trim();

async function main() {
  if (!key) {
    console.error('INNGEST_EVENT_KEY missing in .env — copy Production value from Vercel.');
    process.exit(1);
  }

  console.log('POST', url);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ runId: 'local-debug', schedule: 'manual' }),
  });

  const text = await response.text();
  console.log('status:', response.status);
  console.log('body:', text);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
