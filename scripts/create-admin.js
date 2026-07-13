#!/usr/bin/env node
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const { query, usePostgres } = require('../lib/db');
const { createStaffUser, getStaffUserByEmail, countStaffAdmins } = require('../lib/user-store');

function readArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return '';
  return process.argv[index + 1] || '';
}

async function ensureTables() {
  const sqlPath = path.join(__dirname, '..', 'db', 'migrate-staff-auth.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const statements = sql
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await query([statement]);
  }
}

async function main() {
  if (!usePostgres()) {
    console.error('DATABASE_URL is required.');
    process.exit(1);
  }

  const email = readArg('--email') || process.env.INITIAL_ADMIN_EMAIL || '';
  const name = readArg('--name') || process.env.INITIAL_ADMIN_NAME || 'Admin';
  const password = readArg('--password') || process.env.INITIAL_ADMIN_PASSWORD || '';

  if (!email || !password) {
    console.error('Usage: node scripts/create-admin.js --email you@cenhub.dk --name "Your Name" --password "secure-password"');
    console.error('Or set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD in env.');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  console.log('Ensuring staff auth tables exist...');
  await ensureTables();

  const existing = await getStaffUserByEmail(email);
  if (existing) {
    console.log(`Admin already exists for ${existing.email} (${existing.status}).`);
    process.exit(0);
  }

  const adminCount = await countStaffAdmins();
  const user = await createStaffUser({
    email,
    name,
    password,
    role: 'admin',
    status: 'active',
  });

  console.log('First admin created successfully.');
  console.log(`  Email: ${user.email}`);
  console.log(`  Name:  ${user.name}`);
  console.log(`  Role:  ${user.role}`);
  console.log(`  Active admins: ${adminCount + 1}`);
  console.log('');
  console.log('You can now log in at /login');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
