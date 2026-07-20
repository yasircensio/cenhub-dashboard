#!/usr/bin/env node
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log('DATABASE_URL not set — file store will use metaSyncRuns in .data automatically.');
    return;
  }

  const sql = fs.readFileSync(
    path.join(__dirname, '..', 'db', 'migrate-sync-history.sql'),
    'utf8',
  );
  const statements = sql
    .split(';')
    .map((part) => part.replace(/--[^\n]*/g, '').trim())
    .filter(Boolean);

  const { neon } = require('@neondatabase/serverless');
  const query = neon(process.env.DATABASE_URL);

  for (const statement of statements) {
    await query(`${statement};`);
    console.log(`OK: ${statement.slice(0, 72)}…`);
  }

  console.log('Applied sync history migration.');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
