const assert = require('assert');
const {
  BUNDLINJE_FIELD_KEY,
  enrichOpportunityCustomFields,
  findBundlinjeField,
  isBundlinjeField,
  resolveBundlinjeFieldId,
} = require('../lib/bundlinje-field');

assert.strictEqual(BUNDLINJE_FIELD_KEY, 'opportunity.bundlinje');

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

assert.strictEqual(
  isBundlinjeField({ fieldKey: 'opportunity.bundlinje' }),
  true,
);

assert.strictEqual(
  isBundlinjeField({ id: 'legacy-id' }, 'legacy-id'),
  true,
);

const enriched = enrichOpportunityCustomFields(
  [{
    id: 'opp-1',
    customFields: [{ id: 'def', fieldValueString: '15000' }],
  }],
  [{ id: 'def', name: 'Bundlinje', fieldKey: 'opportunity.bundlinje' }],
);

assert.strictEqual(enriched[0].customFields[0].fieldKey, 'opportunity.bundlinje');
assert.strictEqual(
  findBundlinjeField(enriched[0].customFields)?.fieldValueString,
  '15000',
);

console.log('Bundlinje field resolver tests passed.');
