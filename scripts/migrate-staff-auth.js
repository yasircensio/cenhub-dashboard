#!/usr/bin/env node
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const { query, usePostgres } = require('../lib/db');

async function main() {
  if (!usePostgres()) {
    console.error('DATABASE_URL is required.');
    process.exit(1);
  }

  const sqlPath = path.join(__dirname, '..', 'db', 'migrate-staff-auth.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const statements = sql
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await query([statement]);
  }

  console.log('Staff auth migration applied.');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
