#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const required = [
  'public/css/dashboard.css',
  'public/js/client.bundle.js',
  'public/js/admin.bundle.js',
];

for (const relativePath of required) {
  const fullPath = path.join(ROOT, relativePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`Missing frontend build artifact: ${relativePath}`);
    process.exit(1);
  }
}

console.log('Frontend build artifacts present.');
