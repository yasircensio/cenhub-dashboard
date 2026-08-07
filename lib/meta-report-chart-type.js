const META_REPORT_SPEND_CHART_TYPES = new Set(['area', 'bar']);
const LEGACY_META_REPORT_SPEND_CHART_TYPES = new Set(['line', 'scatter']);

function normalizeMetaReportSpendChartType(value, fallback = 'area') {
  const normalized = String(value || fallback).trim().toLowerCase();
  if (LEGACY_META_REPORT_SPEND_CHART_TYPES.has(normalized)) return fallback;
  return META_REPORT_SPEND_CHART_TYPES.has(normalized) ? normalized : fallback;
}

module.exports = {
  META_REPORT_SPEND_CHART_TYPES,
  normalizeMetaReportSpendChartType,
};
