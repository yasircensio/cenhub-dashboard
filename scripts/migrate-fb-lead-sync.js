#!/usr/bin/env node
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log('DATABASE_URL not set — file store will use account fields in JSON when saved via admin.');
    return;
  }

  const sqlPath = path.join(__dirname, '..', 'db', 'migrate-fb-lead-sync.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const query = neon(process.env.DATABASE_URL);
  const statements = sql.split(';').map((s) => s.trim()).filter(Boolean);
  for (const statement of statements) {
    await query(statement);
  }
  console.log('FB lead sync migration applied.');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
