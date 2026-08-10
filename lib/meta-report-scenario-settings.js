const META_REPORT_SCENARIO_MONTH_WINDOWS = new Set(['3', '6', '9', '12', 'all']);

const META_REPORT_BUDGET_BASELINES = new Set(['year', 'month']);

const META_REPORT_SCENARIO_MONTH_WINDOW_OPTIONS = [
  { value: '3', label: 'Last 3 ad months' },
  { value: '6', label: 'Last 6 ad months' },
  { value: '9', label: 'Last 9 ad months' },
  { value: '12', label: 'Last 12 ad months' },
  { value: 'all', label: 'All ad-active months' },
];

const META_REPORT_SCENARIO_MODEL_PILLS = [
  { id: 'smoothUneven', label: 'Remove uneven months', defaultOn: true },
  { id: 'blendHistory', label: 'Balance recent months', defaultOn: false },
  { id: 'includeTrend', label: 'Follow trend', defaultOn: false },
  { id: 'cautionStrongMonths', label: 'Cap hot streak', defaultOn: false },
];

const META_REPORT_SCENARIO_FIXED_ELASTICITY = 0.80;

function normalizeMetaReportScenarioMonthWindow(value, fallback = '6') {
  const normalized = String(value || fallback).trim().toLowerCase();
  return META_REPORT_SCENARIO_MONTH_WINDOWS.has(normalized) ? normalized : fallback;
}

function normalizeScenarioPillValue(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (value == null) return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'true' || normalized === '1') return true;
  if (normalized === 'false' || normalized === '0') return false;
  return fallback;
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

function resolveScenarioElasticity() {
  return META_REPORT_SCENARIO_FIXED_ELASTICITY;
}

function defaultScenarioModelPills() {
  return META_REPORT_SCENARIO_MODEL_PILLS.reduce((acc, pill) => {
    acc[pill.id] = Boolean(pill.defaultOn);
    return acc;
  }, {});
}

function normalizeScenarioModelPills(input = {}) {
  const defaults = defaultScenarioModelPills();
  return META_REPORT_SCENARIO_MODEL_PILLS.reduce((acc, pill) => {
    acc[pill.id] = normalizeScenarioPillValue(input[pill.id], defaults[pill.id]);
    return acc;
  }, {});
}

function describeActiveScenarioPills(pills = {}) {
  return META_REPORT_SCENARIO_MODEL_PILLS
    .filter((pill) => Boolean(pills[pill.id]))
    .map((pill) => pill.label);
}

function resolveScenarioMonthWindowLimit(windowValue) {
  const normalized = normalizeMetaReportScenarioMonthWindow(windowValue);
  if (normalized === 'all') return Infinity;
  return Number.parseInt(normalized, 10) || 6;
}

module.exports = {
  META_REPORT_BUDGET_BASELINES,
  META_REPORT_SCENARIO_FIXED_ELASTICITY,
  META_REPORT_SCENARIO_MODEL_PILLS,
  META_REPORT_SCENARIO_MONTH_WINDOW_OPTIONS,
  META_REPORT_SCENARIO_MONTH_WINDOWS,
  defaultScenarioModelPills,
  describeActiveScenarioPills,
  normalizeMetaReportBudgetBaseline,
  normalizeMetaReportBudgetMultiplier,
  normalizeMetaReportScenarioMonthWindow,
  normalizeScenarioModelPills,
  normalizeScenarioPillValue,
  resolveScenarioElasticity,
  resolveScenarioMonthWindowLimit,
};
