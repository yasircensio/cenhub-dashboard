const assert = require('assert');
const {
  clampReportYear,
  getAllowedReportYears,
  getYearMonthKeys,
} = require('../lib/meta-report-store');

function main() {
  const tz = 'Europe/Copenhagen';
  const allowed = getAllowedReportYears(tz);
  assert.strictEqual(allowed.length, 2);
  assert.strictEqual(allowed[0], allowed[1] + 1);

  assert.strictEqual(clampReportYear(allowed[0], tz), allowed[0]);
  assert.strictEqual(clampReportYear(allowed[1], tz), allowed[1]);
  assert.strictEqual(clampReportYear(allowed[0] - 5, tz), allowed[0]);
  assert.strictEqual(clampReportYear(allowed[0] + 3, tz), allowed[0]);
  assert.strictEqual(clampReportYear('nope', tz), allowed[0]);

  // Selecting previous year must not change the allowed window.
  assert.deepStrictEqual(getAllowedReportYears(tz), [allowed[0], allowed[1]]);
  assert.strictEqual(clampReportYear(allowed[1], tz), allowed[1]);

  const currentKeys = getYearMonthKeys(allowed[0], tz);
  assert.ok(currentKeys.length >= 1);
  assert.ok(currentKeys.every((key) => key.startsWith(`${allowed[0]}-`)));

  console.log('Meta report year limits tests passed.');
}

main();
