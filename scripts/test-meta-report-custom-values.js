const assert = require('assert');
const {
  classifyCustomInputStatus,
  customInputsUpdatedAt,
  effectiveFeeEnabledForMonth,
} = require('../lib/meta-report-store');

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
  assert.strictEqual(
    customInputsUpdatedAt({ updated_at: '2026-08-05T05:19:00.000Z' }, 'empty'),
    null,
  );
  assert.strictEqual(
    customInputsUpdatedAt({ updated_at: '2026-08-05T05:19:00.000Z' }, 'partial'),
    '2026-08-05T05:19:00.000Z',
  );

  const feeOnSettings = { metaReportFeeEnabled: true, metaReportShowBottomline: true };
  assert.strictEqual(effectiveFeeEnabledForMonth(feeOnSettings, null), false);
  assert.strictEqual(effectiveFeeEnabledForMonth(feeOnSettings, {}), false);
  assert.strictEqual(effectiveFeeEnabledForMonth(feeOnSettings, {
    wonLeads: 2,
    avgLeadValue: 1000,
    avgProfitPerWon: 400,
    lineItems: [],
  }), true);
  assert.strictEqual(effectiveFeeEnabledForMonth(
    { metaReportFeeEnabled: false, metaReportShowBottomline: true },
    { wonLeads: 2, avgLeadValue: 1000, avgProfitPerWon: 400, lineItems: [] },
  ), false);
  assert.strictEqual(effectiveFeeEnabledForMonth(feeOnSettings, {
    wonLeads: null,
    avgLeadValue: null,
    avgProfitPerWon: null,
    lineItems: [],
  }), false);

  console.log('Meta report custom values status tests passed.');
}

main();
