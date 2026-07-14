#!/usr/bin/env node
/**
 * Extracts inline CSS/JS from index.html into build inputs.
 * Run before build-frontend.js when index.html inline assets change.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const INDEX = path.join(ROOT, 'index.html');
const CSS_OUT = path.join(ROOT, 'public', 'css', 'dashboard.css');
const APP_OUT = path.join(ROOT, 'frontend', 'source', 'app.js');

function dedentScript(source) {
  return source.replace(/\n    /g, '\n').trim();
}

function main() {
  const html = fs.readFileSync(INDEX, 'utf8');

  const styleMatch = html.match(/<style>\s*([\s\S]*?)\s*<\/style>/);
  if (!styleMatch) {
    throw new Error('Could not find <style> block in index.html');
  }

  const scriptMatch = html.match(/<script>\s*([\s\S]*?)\s*<\/script>\s*\n<\/body>/);
  if (!scriptMatch) {
    throw new Error('Could not find inline app <script> block in index.html');
  }

  fs.mkdirSync(path.dirname(CSS_OUT), { recursive: true });
  fs.mkdirSync(path.dirname(APP_OUT), { recursive: true });

  fs.writeFileSync(CSS_OUT, `${styleMatch[1].trim()}\n`);
  fs.writeFileSync(APP_OUT, `${dedentScript(scriptMatch[1])}\n`);

  console.log(`Wrote ${path.relative(ROOT, CSS_OUT)}`);
  console.log(`Wrote ${path.relative(ROOT, APP_OUT)} (${scriptMatch[1].split('\n').length} lines)`);
}

main();
