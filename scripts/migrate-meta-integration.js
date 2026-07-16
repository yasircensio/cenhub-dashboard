#!/usr/bin/env node
require('dotenv').config();

const fs = require('fs');
const path = require('path');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }

  const sql = fs.readFileSync(
    path.join(__dirname, '..', 'db', 'migrate-meta-integration.sql'),
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

  console.log('Applied Meta integration migration.');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
