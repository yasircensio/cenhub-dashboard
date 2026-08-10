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
  { value: 'conservative', label: 'Conservative scaling', description: 'Stronger diminishing returns when spend increases (0.70).' },
  { value: 'balanced', label: 'Balanced scaling', description: 'Default saturation curve for most clients (0.75).' },
  { value: 'optimistic', label: 'Optimistic scaling', description: 'Milder diminishing returns — capped for realism (0.80).' },
];

const META_REPORT_SCENARIO_MODEL_PILLS = [
  {
    id: 'smoothUneven',
    label: 'Smooth uneven months',
    description: 'Softens months with unusual CPL or lead spikes so one bad tracking month does not skew the forecast.',
    defaultOn: true,
  },
  {
    id: 'blendHistory',
    label: 'Blend with full history',
    description: 'Mixes recent months with the full window average instead of only weighting the latest streak.',
    defaultOn: false,
  },
  {
    id: 'includeTrend',
    label: 'Include trend direction',
    description: 'Adds a small up or down adjustment when efficiency has been moving consistently over time.',
    defaultOn: false,
  },
  {
    id: 'cautionStrongMonths',
    label: 'Caution after strong months',
    description: 'Pulls projections back when the last 3 months look much better than the full period.',
    defaultOn: false,
  },
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

function defaultScenarioModelPills() {
  return META_REPORT_SCENARIO_MODEL_PILLS.reduce((acc, pill) => {
    acc[pill.id] = Boolean(pill.defaultOn);
    return acc;
  }, {});
}

function deriveScenarioPillsFromTrendMethod(trendMethod) {
  const method = normalizeMetaReportScenarioTrendMethod(trendMethod);
  const pills = defaultScenarioModelPills();
  if (method === 'robust_trend') {
    pills.includeTrend = true;
  } else if (method === 'conservative_blend') {
    pills.blendHistory = true;
    pills.cautionStrongMonths = true;
    pills.includeTrend = true;
  }
  return pills;
}

function resolveTrendMethodFromScenarioPills(pills = {}) {
  const blendHistory = Boolean(pills.blendHistory);
  const cautionStrongMonths = Boolean(pills.cautionStrongMonths);
  const includeTrend = Boolean(pills.includeTrend);
  if (blendHistory || cautionStrongMonths) return 'conservative_blend';
  if (includeTrend) return 'robust_trend';
  return 'recency_weighted';
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
  ELASTICITY_BY_PRESET,
  META_REPORT_BUDGET_BASELINES,
  META_REPORT_SCENARIO_ELASTICITY_OPTIONS,
  META_REPORT_SCENARIO_ELASTICITY_PRESETS,
  META_REPORT_SCENARIO_MODEL_PILLS,
  META_REPORT_SCENARIO_MONTH_WINDOW_OPTIONS,
  META_REPORT_SCENARIO_MONTH_WINDOWS,
  META_REPORT_SCENARIO_TREND_METHOD_OPTIONS,
  META_REPORT_SCENARIO_TREND_METHODS,
  defaultScenarioModelPills,
  deriveScenarioPillsFromTrendMethod,
  describeActiveScenarioPills,
  normalizeMetaReportBudgetBaseline,
  normalizeMetaReportBudgetMultiplier,
  normalizeMetaReportScenarioElasticity,
  normalizeMetaReportScenarioMonthWindow,
  normalizeMetaReportScenarioTrendMethod,
  resolveScenarioElasticity,
  resolveScenarioMonthWindowLimit,
  resolveTrendMethodFromScenarioPills,
};
