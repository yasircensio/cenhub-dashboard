const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '..', 'lib', 'marketing-metrics.js');
const copy = path.join(__dirname, '..', 'public', 'lib', 'marketing-metrics.js');

const sourceContent = fs.readFileSync(source, 'utf8');
const copyContent = fs.existsSync(copy) ? fs.readFileSync(copy, 'utf8') : '';

if (sourceContent !== copyContent) {
  console.error('public/lib/marketing-metrics.js is out of sync with lib/marketing-metrics.js.');
  console.error('Run: npm run build');
  process.exit(1);
}

console.log('lib/marketing-metrics.js and public/lib copy are in sync.');
