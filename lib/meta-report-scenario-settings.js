const META_REPORT_SCENARIO_TREND_METHODS = new Set([
  'recency_weighted',
  'robust_trend',
  'conservative_blend',
]);

const META_REPORT_SCENARIO_MONTH_WINDOWS = new Set(['3', '6', '9', '12', 'all']);

const META_REPORT_SCENARIO_ELASTICITY_PRESETS = new Set([
  'conservative',
  'balanced',
  'optimistic',
]);

const META_REPORT_BUDGET_BASELINES = new Set(['year', 'month']);

const META_REPORT_SCENARIO_TREND_METHOD_OPTIONS = [
  { value: 'recency_weighted', label: 'Recency-weighted' },
  { value: 'robust_trend', label: 'Robust trend-adjusted' },
  { value: 'conservative_blend', label: 'Conservative blend' },
];

const META_REPORT_SCENARIO_MONTH_WINDOW_OPTIONS = [
  { value: '3', label: 'Last 3 ad months' },
  { value: '6', label: 'Last 6 ad months' },
  { value: '9', label: 'Last 9 ad months' },
  { value: '12', label: 'Last 12 ad months' },
  { value: 'all', label: 'All ad-active months' },
];

const META_REPORT_SCENARIO_ELASTICITY_OPTIONS = [
  { value: 'conservative', label: 'Conservative (0.70)' },
  { value: 'balanced', label: 'Balanced (0.75)' },
  { value: 'optimistic', label: 'Optimistic (0.80)' },
];

const ELASTICITY_BY_PRESET = {
  conservative: 0.70,
  balanced: 0.75,
  optimistic: 0.80,
};

function normalizeMetaReportScenarioTrendMethod(value, fallback = 'recency_weighted') {
  const normalized = String(value || fallback).trim().toLowerCase();
  return META_REPORT_SCENARIO_TREND_METHODS.has(normalized) ? normalized : fallback;
}

function normalizeMetaReportScenarioMonthWindow(value, fallback = '6') {
  const normalized = String(value || fallback).trim().toLowerCase();
  return META_REPORT_SCENARIO_MONTH_WINDOWS.has(normalized) ? normalized : fallback;
}

function normalizeMetaReportScenarioElasticity(value, fallback = 'balanced') {
  const normalized = String(value || fallback).trim().toLowerCase();
  return META_REPORT_SCENARIO_ELASTICITY_PRESETS.has(normalized) ? normalized : fallback;
}

function normalizeMetaReportBudgetBaseline(value, fallback = 'year') {
  const normalized = String(value || fallback).trim().toLowerCase();
  return META_REPORT_BUDGET_BASELINES.has(normalized) ? normalized : fallback;
}

function normalizeMetaReportBudgetMultiplier(value, fallback = 2) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(3, Math.max(0.5, Math.round(parsed * 10) / 10));
}

function resolveScenarioElasticity(preset) {
  return ELASTICITY_BY_PRESET[normalizeMetaReportScenarioElasticity(preset)] || 0.75;
}

function resolveScenarioMonthWindowLimit(windowValue) {
  const normalized = normalizeMetaReportScenarioMonthWindow(windowValue);
  if (normalized === 'all') return Infinity;
  return Number.parseInt(normalized, 10) || 6;
}

module.exports = {
  ELASTICITY_BY_PRESET,
  META_REPORT_BUDGET_BASELINES,
  META_REPORT_SCENARIO_ELASTICITY_OPTIONS,
  META_REPORT_SCENARIO_ELASTICITY_PRESETS,
  META_REPORT_SCENARIO_MONTH_WINDOW_OPTIONS,
  META_REPORT_SCENARIO_MONTH_WINDOWS,
  META_REPORT_SCENARIO_TREND_METHOD_OPTIONS,
  META_REPORT_SCENARIO_TREND_METHODS,
  normalizeMetaReportBudgetBaseline,
  normalizeMetaReportBudgetMultiplier,
  normalizeMetaReportScenarioElasticity,
  normalizeMetaReportScenarioMonthWindow,
  normalizeMetaReportScenarioTrendMethod,
  resolveScenarioElasticity,
  resolveScenarioMonthWindowLimit,
};
