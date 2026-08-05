const assert = require('assert');
const { classifyCustomInputStatus } = require('../lib/meta-report-store');

function main() {
  assert.strictEqual(classifyCustomInputStatus(null), 'empty');
  assert.strictEqual(classifyCustomInputStatus({}), 'empty');
  assert.strictEqual(classifyCustomInputStatus({ won_leads: 2 }), 'partial');
  assert.strictEqual(classifyCustomInputStatus({
    won_leads: 2,
    avg_lead_value: 1000,
  }), 'complete');
  assert.strictEqual(classifyCustomInputStatus({
    won_leads: 2,
    avg_lead_value: 1000,
  }, { requireProfit: true }), 'partial');
  assert.strictEqual(classifyCustomInputStatus({
    won_leads: 2,
    avg_lead_value: 1000,
    avg_profit_per_won: 400,
  }, { requireProfit: true }), 'complete');
  assert.strictEqual(classifyCustomInputStatus({ line_item_count: 1 }), 'partial');
  console.log('Meta report custom values status tests passed.');
}

main();
