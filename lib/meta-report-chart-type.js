const META_REPORT_SPEND_CHART_TYPES = new Set(['area', 'bar', 'line', 'scatter']);

function normalizeMetaReportSpendChartType(value, fallback = 'area') {
  const normalized = String(value || fallback).trim().toLowerCase();
  return META_REPORT_SPEND_CHART_TYPES.has(normalized) ? normalized : fallback;
}

module.exports = {
  META_REPORT_SPEND_CHART_TYPES,
  normalizeMetaReportSpendChartType,
};
