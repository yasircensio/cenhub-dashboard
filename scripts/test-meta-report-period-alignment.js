const assert = require('assert');

// Load store internals via a tiny harness
const fs = require('fs');
const path = require('path');
const storePath = path.join(__dirname, '..', 'lib', 'meta-report-store.js');
const storeSource = fs.readFileSync(storePath, 'utf8');

function extractFunction(name) {
  const match = storeSource.match(new RegExp(`function ${name}\\([\\s\\S]*?\\n}\\n`));
  if (!match) throw new Error(`Could not extract ${name}`);
  return match[0];
}

const { monthBoundsIso } = require('../lib/marketing-metrics');

eval(`
${extractFunction('formatDate')}
${extractFunction('parseMonthKey')}
${extractFunction('monthPeriodMatchesKey')}
`);

function main() {
  assert.strictEqual(formatDate('2026-07-01'), '2026-07-01');
  assert.strictEqual(formatDate('2026-07-01T00:00:00.000Z'), '2026-07-01');
  assert.strictEqual(formatDate(new Date('2026-07-31T00:00:00.000Z')), '2026-07-31');

  const bounds = monthBoundsIso('2026-07');
  assert.strictEqual(bounds.start, '2026-07-01');
  assert.strictEqual(bounds.end, '2026-07-31');

  assert.strictEqual(
    monthPeriodMatchesKey('2026-07', bounds.start, bounds.end),
    true,
  );
  assert.strictEqual(
    monthPeriodMatchesKey('2026-07', new Date('2026-07-01T00:00:00.000Z'), new Date('2026-07-31T00:00:00.000Z')),
    true,
  );
  assert.strictEqual(
    monthPeriodMatchesKey('2026-07', '2026-08-01', '2026-08-31'),
    false,
  );

  console.log('Meta report period alignment tests passed.');
}

main();
