const assert = require('assert');
const { resolveBundlinjeFieldId } = require('../lib/ghl-sync');

assert.strictEqual(
  resolveBundlinjeFieldId([
    { id: 'abc', name: 'Notes', fieldKey: 'opportunity.notes' },
    { id: 'def', name: 'Bundlinje', fieldKey: 'opportunity.bundlinje' },
  ]),
  'def',
);

assert.strictEqual(
  resolveBundlinjeFieldId([
    { id: 'xyz', name: 'Profit', fieldKey: 'opportunity.bundlinje_total' },
  ]),
  'xyz',
);

assert.strictEqual(resolveBundlinjeFieldId([]), null);

console.log('Bundlinje field resolver tests passed.');
