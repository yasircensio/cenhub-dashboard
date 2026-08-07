const assert = require('assert');
const { normalizeMetaReportSpendChartType } = require('../lib/meta-report-chart-type');

function main() {
  assert.strictEqual(normalizeMetaReportSpendChartType('area'), 'area');
  assert.strictEqual(normalizeMetaReportSpendChartType('BAR'), 'bar');
  assert.strictEqual(normalizeMetaReportSpendChartType('line'), 'area');
  assert.strictEqual(normalizeMetaReportSpendChartType('scatter'), 'area');
  assert.strictEqual(normalizeMetaReportSpendChartType('invalid'), 'area');
  assert.strictEqual(normalizeMetaReportSpendChartType(null, 'bar'), 'bar');
  console.log('Meta report chart type tests passed.');
}

main();
