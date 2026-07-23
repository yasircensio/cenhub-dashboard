#!/usr/bin/env node
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log('DATABASE_URL not set — skip leads_cache migration.');
    return;
  }

  const sqlPath = path.join(__dirname, '..', 'db', 'migrate-fb-lead-sync-cache.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const query = neon(process.env.DATABASE_URL);
  const statements = sql.split(';').map((s) => s.trim()).filter(Boolean);
  for (const statement of statements) {
    await query(statement);
  }
  console.log('FB lead sync leads_cache migration applied.');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
