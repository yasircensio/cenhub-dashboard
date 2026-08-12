const assert = require('assert');
const {
  buildScenarioProjectionMonthKeys,
  buildScenarioProjectionSteps,
  projectScenario,
} = require('../lib/meta-report-scenario-projection');

function approx(actual, expected, tolerance = 0.02) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `Expected ${expected}, got ${actual}`);
}

function testScenarioProjectionAlwaysUsesNextFourMonthsFromToday() {
  const asOfDate = new Date('2026-08-12T12:00:00.000Z');
  const keys = buildScenarioProjectionMonthKeys(4, asOfDate);
  assert.deepStrictEqual(keys, ['2026-09', '2026-10', '2026-11', '2026-12']);
}

function testScenarioProjectionUsesCurrentYearBaselineWhenViewingPastYear() {
  const asOfDate = new Date('2026-08-12T12:00:00.000Z');
  const series = [
    { monthKey: '2026-06', spend: 12000, leads: 50, wonLeads: 5, avgLeadValue: 100000, avgProfitPerWon: 50000, periodEnd: '2026-06-30' },
    { monthKey: '2026-07', spend: 14000, leads: 50, wonLeads: 5, avgLeadValue: 100000, avgProfitPerWon: 50000, periodEnd: '2026-07-31' },
    { monthKey: '2026-08', spend: 9609, leads: 40, wonLeads: 4, avgLeadValue: 100000, avgProfitPerWon: 50000, periodEnd: '2026-08-31' },
  ];
  const projection = projectScenario({
    series,
    baselineMode: 'month',
    activeMonthKey: '2026-08',
    multiplier: 2,
    monthWindow: '6',
    asOfDate,
  });
  const steps = buildScenarioProjectionSteps(projection, {
    months: 4,
    asOfDate,
    targetMultiplier: 2,
  });
  assert.strictEqual(projection.insufficientData, false);
  assert.strictEqual(steps.length, 4);
  assert.strictEqual(steps[0].monthKey, '2026-09');
  assert.strictEqual(steps[3].monthKey, '2026-12');
  approx(projection.baselineSpend, 9609);
}

function main() {
  testScenarioProjectionAlwaysUsesNextFourMonthsFromToday();
  testScenarioProjectionUsesCurrentYearBaselineWhenViewingPastYear();
  console.log('Meta report QA flow tests passed.');
}

main();
