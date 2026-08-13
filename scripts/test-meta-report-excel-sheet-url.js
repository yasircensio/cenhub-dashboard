const assert = require('assert');
const { normalizeMetaReportExcelSheetUrl } = require('../lib/meta-report-excel-sheet-url');

function testNormalizeExcelSheetUrl() {
  assert.strictEqual(normalizeMetaReportExcelSheetUrl(null), null);
  assert.strictEqual(normalizeMetaReportExcelSheetUrl(''), null);
  assert.strictEqual(
    normalizeMetaReportExcelSheetUrl('docs.google.com/spreadsheets/d/abc123/edit'),
    'https://docs.google.com/spreadsheets/d/abc123/edit',
  );
  assert.strictEqual(
    normalizeMetaReportExcelSheetUrl('https://example.com/report.xlsx'),
    'https://example.com/report.xlsx',
  );
  assert.strictEqual(normalizeMetaReportExcelSheetUrl('not a url'), null);
}

testNormalizeExcelSheetUrl();
console.log('Meta report Excel sheet URL tests passed.');
