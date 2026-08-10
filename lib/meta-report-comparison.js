const COMPARISON_MODES = new Set(['mom', 'yoy_month', 'ytd', 'custom']);

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseAmount(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundMoney(value) {
  return Math.round(parseAmount(value) * 100) / 100;
}

function roundRatio(value) {
  return Math.round(parseAmount(value) * 100000000) / 100000000;
}

function addMonthsToMonthKey(monthKey, offset = 0) {
  const normalized = String(monthKey || '').trim();
  if (!/^\d{4}-\d{2}$/.test(normalized)) return null;
  const [year, month] = normalized.split('-').map(Number);
  const date = new Date(year, (month - 1) + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabelFromMonthKey(monthKey) {
  const month = Number.parseInt(String(monthKey || '').slice(5, 7), 10);
  return MONTH_LABELS[month - 1] || monthKey;
}

function formatPeriodLabel(startKey, endKey) {
  if (!startKey || !endKey) return '—';
  if (startKey === endKey) {
    const year = String(startKey).slice(0, 4);
    return `${monthLabelFromMonthKey(startKey)} ${year}`;
  }
  const startYear = String(startKey).slice(0, 4);
  const endYear = String(endKey).slice(0, 4);
  if (startYear === endYear) {
    return `${monthLabelFromMonthKey(startKey)}–${monthLabelFromMonthKey(endKey)} ${startYear}`;
  }
  return `${monthLabelFromMonthKey(startKey)} ${startYear}–${monthLabelFromMonthKey(endKey)} ${endYear}`;
}

function monthKeysInRange(startKey, endKey) {
  if (!startKey || !endKey) return [];
  const [start, end] = startKey <= endKey ? [startKey, endKey] : [endKey, startKey];
  const keys = [];
  let cursor = start;
  while (cursor && cursor <= end) {
    keys.push(cursor);
    if (cursor === end) break;
    cursor = addMonthsToMonthKey(cursor, 1);
  }
  return keys;
}

function monthHasComparisonData(monthPayload) {
  if (!monthPayload || monthPayload.meta?.emptyMonth) return false;
  const spend = parseAmount(monthPayload.meta?.spend);
  const leads = parseAmount(monthPayload.topline?.leads);
  return spend > 0 || leads > 0;
}

function aggregateMonthRange(monthsMap = {}, startKey, endKey) {
  const rangeKeys = monthKeysInRange(startKey, endKey);
  const included = [];
  let hasBottomline = false;

  let spend = 0;
  let impressions = 0;
  let reach = 0;
  let clicks = 0;
  let leads = 0;
  let wonLeads = 0;
  let totalLeadValue = 0;
  let totalProfit = 0;
  let poasKrSum = 0;
  let roasKrSum = 0;
  let censioFeeSum = 0;
  let poiKrSum = 0;
  let weightedLeadValue = 0;
  let weightedProfitPerWon = 0;
  let weightedCpm = 0;
  let cpmWeight = 0;

  for (const key of rangeKeys) {
    const month = monthsMap[key];
    if (!monthHasComparisonData(month)) continue;
    included.push(key);
    if (month.bottomline) hasBottomline = true;

    const monthSpend = parseAmount(month.meta?.spend);
    const monthImpressions = parseAmount(month.meta?.impressions);
    const monthLeads = parseAmount(month.topline?.leads);
    const monthWon = parseAmount(month.topline?.wonLeads);

    spend += monthSpend;
    impressions += monthImpressions;
    reach += parseAmount(month.meta?.reach);
    clicks += parseAmount(month.meta?.clicks);
    leads += monthLeads;
    wonLeads += monthWon;
    totalLeadValue += parseAmount(month.topline?.totalLeadValue);
    roasKrSum += parseAmount(month.topline?.roasKr);

    if (monthWon > 0) {
      weightedLeadValue += parseAmount(month.topline?.avgLeadValue) * monthWon;
      if (month.bottomline) {
        weightedProfitPerWon += parseAmount(month.bottomline.avgProfitPerWon) * monthWon;
      }
    }

    if (monthImpressions > 0) {
      weightedCpm += parseAmount(month.meta?.cpm) * monthImpressions;
      cpmWeight += monthImpressions;
    }

    if (month.bottomline) {
      totalProfit += parseAmount(month.bottomline.totalProfit);
      poasKrSum += parseAmount(month.bottomline.poasKr);
      censioFeeSum += parseAmount(month.bottomline.censioFee);
      poiKrSum += parseAmount(month.bottomline.poiKr);
    }
  }

  const cpl = leads > 0 ? roundMoney(spend / leads) : 0;
  const cac = wonLeads > 0 ? roundMoney(spend / wonLeads) : 0;
  const avgLeadValue = wonLeads > 0 ? roundMoney(weightedLeadValue / wonLeads) : 0;
  const avgProfitPerWon = wonLeads > 0 ? roundMoney(weightedProfitPerWon / wonLeads) : 0;
  const cpm = cpmWeight > 0 ? roundMoney(weightedCpm / cpmWeight) : 0;
  const conversionRatePercent = impressions > 0 ? roundRatio((clicks / impressions) * 100) : 0;
  const roasKr = roundMoney(totalLeadValue - spend);
  const roasX = spend > 0 ? roundRatio(roasKr / spend) : 0;
  const poasKr = roundMoney(totalProfit - spend);
  const poasX = spend > 0 ? roundRatio(poasKr / spend) : 0;
  const poiKr = hasBottomline ? roundMoney(poasKr - censioFeeSum) : 0;
  const poiX = spend > 0 && hasBottomline ? roundRatio(poiKr / spend) : 0;

  return {
    startKey,
    endKey,
    label: formatPeriodLabel(startKey, endKey),
    monthKeys: included,
    monthCount: included.length,
    expectedMonthCount: rangeKeys.length,
    partialData: included.length > 0 && included.length < rangeKeys.length,
    hasBottomline,
    metrics: {
      spend,
      cpm,
      impressions,
      reach,
      clicks,
      conversionRatePercent,
      leads,
      cpl,
      wonLeads,
      totalLeadValue,
      avgLeadValue,
      cac,
      roasKr,
      roasX,
      totalProfit,
      avgProfitPerWon,
      poasKr,
      poasX,
      censioFee: censioFeeSum,
      poiKr,
      poiX,
    },
  };
}

function computeDeltaPct(periodAValue, periodBValue) {
  const base = parseAmount(periodBValue);
  const next = parseAmount(periodAValue);
  if (!base) return null;
  return roundRatio(((next - base) / Math.abs(base)) * 100);
}

function computeDeltaAbs(periodAValue, periodBValue) {
  return roundMoney(parseAmount(periodAValue) - parseAmount(periodBValue));
}

function resolveComparisonPresets({
  activeMonthKey = null,
  selectedYear = null,
  mode = 'mom',
  customPeriodA = null,
  customPeriodB = null,
} = {}) {
  const normalizedMode = COMPARISON_MODES.has(mode) ? mode : 'mom';
  const anchorKey = activeMonthKey || (selectedYear ? `${selectedYear}-01` : null);

  if (normalizedMode === 'custom') {
    const periodA = customPeriodA?.startMonthKey && customPeriodA?.endMonthKey
      ? { startMonthKey: customPeriodA.startMonthKey, endMonthKey: customPeriodA.endMonthKey }
      : null;
    const periodB = customPeriodB?.startMonthKey && customPeriodB?.endMonthKey
      ? { startMonthKey: customPeriodB.startMonthKey, endMonthKey: customPeriodB.endMonthKey }
      : null;
    return { mode: normalizedMode, periodA, periodB };
  }

  if (!anchorKey) {
    return { mode: normalizedMode, periodA: null, periodB: null };
  }

  if (normalizedMode === 'mom') {
    const previousKey = addMonthsToMonthKey(anchorKey, -1);
    return {
      mode: normalizedMode,
      periodA: { startMonthKey: anchorKey, endMonthKey: anchorKey },
      periodB: previousKey ? { startMonthKey: previousKey, endMonthKey: previousKey } : null,
    };
  }

  if (normalizedMode === 'yoy_month') {
    const priorKey = addMonthsToMonthKey(anchorKey, -12);
    return {
      mode: normalizedMode,
      periodA: { startMonthKey: anchorKey, endMonthKey: anchorKey },
      periodB: priorKey ? { startMonthKey: priorKey, endMonthKey: priorKey } : null,
    };
  }

  if (normalizedMode === 'ytd') {
    const year = String(anchorKey).slice(0, 4);
    const month = String(anchorKey).slice(5, 7);
    const priorYear = String(Number(year) - 1);
    return {
      mode: normalizedMode,
      periodA: { startMonthKey: `${year}-01`, endMonthKey: anchorKey },
      periodB: { startMonthKey: `${priorYear}-01`, endMonthKey: `${priorYear}-${month}` },
    };
  }

  return { mode: normalizedMode, periodA: null, periodB: null };
}

function buildYtdByMonthComparison(monthsMapA = {}, monthsMapB = {}, periodA, periodB) {
  if (!periodA || !periodB) return [];
  const keysA = monthKeysInRange(periodA.startMonthKey, periodA.endMonthKey);
  const monthIndex = String(periodA.startMonthKey || '').slice(5, 7);
  const priorYear = String(periodB.startMonthKey || '').slice(0, 4);

  return keysA.map((keyA) => {
    const monthPart = String(keyA).slice(5, 7);
    const keyB = `${priorYear}-${monthPart}`;
    const aggA = aggregateMonthRange(monthsMapA, keyA, keyA);
    const aggB = aggregateMonthRange(monthsMapB, keyB, keyB);
    return {
      monthKey: keyA,
      label: monthLabelFromMonthKey(keyA),
      periodA: aggA.metrics,
      periodB: aggB.metrics,
      hasDataA: aggA.monthCount > 0,
      hasDataB: aggB.monthCount > 0,
    };
  }).filter((row) => row.hasDataA || row.hasDataB);
}

function getComparisonMetricDefs(hasBottomline = false) {
  const defs = [
    { id: 'spend', label: 'Ad spend', group: 'meta', format: 'kr', higherIsBetter: null },
    { id: 'leads', label: 'Leads', group: 'topline', format: 'num', higherIsBetter: true },
    { id: 'wonLeads', label: 'Won leads', group: 'topline', format: 'num', higherIsBetter: true },
    { id: 'totalLeadValue', label: 'Total lead value', group: 'topline', format: 'kr', higherIsBetter: true },
    { id: 'roasKr', label: 'ROAS', group: 'topline', format: 'kr', higherIsBetter: true },
    { id: 'roasX', label: 'ROAS %', group: 'topline', format: 'x', higherIsBetter: true },
    { id: 'cpl', label: 'CPL', group: 'topline', format: 'kr', higherIsBetter: false },
    { id: 'cac', label: 'CAC', group: 'topline', format: 'kr', higherIsBetter: false },
    { id: 'impressions', label: 'Impressions', group: 'meta', format: 'num', higherIsBetter: true },
    { id: 'clicks', label: 'Clicks', group: 'meta', format: 'num', higherIsBetter: true },
    { id: 'conversionRatePercent', label: 'CTR', group: 'meta', format: 'pct', higherIsBetter: true },
  ];

  if (hasBottomline) {
    defs.push(
      { id: 'totalProfit', label: 'Total profit', group: 'bottomline', format: 'kr', higherIsBetter: true },
      { id: 'poasKr', label: 'POAS', group: 'bottomline', format: 'kr', higherIsBetter: true },
      { id: 'poasX', label: 'POAS %', group: 'bottomline', format: 'x', higherIsBetter: true },
      { id: 'poiKr', label: 'POI', group: 'bottomline', format: 'kr', higherIsBetter: true },
      { id: 'poiX', label: 'POI %', group: 'bottomline', format: 'x', higherIsBetter: true },
    );
  }

  return defs;
}

function getHeroMetricIds(hasBottomline = false) {
  if (hasBottomline) {
    return ['spend', 'leads', 'wonLeads', 'roasKr', 'totalLeadValue', 'poasKr'];
  }
  return ['spend', 'leads', 'wonLeads', 'roasKr', 'totalLeadValue'];
}

function getChartMetricIds(hasBottomline = false, chartMode = 'kr') {
  const base = ['spend', 'leads', 'totalLeadValue'];
  if (chartMode === 'x') {
    return [...base, 'roasX', ...(hasBottomline ? ['poasX'] : [])];
  }
  return [...base, 'roasKr', ...(hasBottomline ? ['poasKr'] : [])];
}

function buildComparison({
  monthsMapA = {},
  monthsMapB = {},
  periodA = null,
  periodB = null,
  mode = 'mom',
} = {}) {
  if (!periodA?.startMonthKey || !periodA?.endMonthKey || !periodB?.startMonthKey || !periodB?.endMonthKey) {
    return {
      mode,
      insufficientData: true,
      samePeriod: false,
      periodA: null,
      periodB: null,
      deltas: {},
      heroMetrics: [],
      detailRows: [],
      chartMetrics: [],
      ytdByMonth: [],
      hasBottomline: false,
    };
  }

  const samePeriod = periodA.startMonthKey === periodB.startMonthKey
    && periodA.endMonthKey === periodB.endMonthKey;

  const aggA = aggregateMonthRange(monthsMapA, periodA.startMonthKey, periodA.endMonthKey);
  const aggB = aggregateMonthRange(monthsMapB, periodB.startMonthKey, periodB.endMonthKey);
  const hasBottomline = aggA.hasBottomline || aggB.hasBottomline;
  const insufficientData = aggA.monthCount === 0 && aggB.monthCount === 0;

  const metricDefs = getComparisonMetricDefs(hasBottomline);
  const deltas = {};
  const detailRows = metricDefs.map((def) => {
    const valueA = aggA.metrics[def.id];
    const valueB = aggB.metrics[def.id];
    const pct = computeDeltaPct(valueA, valueB);
    const abs = computeDeltaAbs(valueA, valueB);
    deltas[def.id] = { pct, abs };
    return {
      ...def,
      valueA,
      valueB,
      deltaPct: pct,
      deltaAbs: abs,
    };
  });

  const heroMetrics = getHeroMetricIds(hasBottomline).map((id) => {
    const def = metricDefs.find((entry) => entry.id === id);
    return {
      id,
      label: def?.label || id,
      valueA: aggA.metrics[id],
      valueB: aggB.metrics[id],
      deltaPct: deltas[id]?.pct ?? null,
      format: def?.format || 'num',
      higherIsBetter: def?.higherIsBetter ?? null,
    };
  });

  const ytdByMonth = mode === 'ytd'
    ? buildYtdByMonthComparison(monthsMapA, monthsMapB, periodA, periodB)
    : [];

  return {
    mode,
    insufficientData,
    samePeriod,
    hasBottomline,
    periodA: aggA,
    periodB: aggB,
    deltas,
    heroMetrics,
    detailRows,
    chartMetrics: getChartMetricIds(hasBottomline, 'kr'),
    ytdByMonth,
  };
}

function mergeMonthsMaps(...maps) {
  return Object.assign({}, ...maps);
}

function yearsNeededForComparison(periodA, periodB) {
  const years = new Set();
  for (const period of [periodA, periodB]) {
    if (!period?.startMonthKey) continue;
    years.add(String(period.startMonthKey).slice(0, 4));
    years.add(String(period.endMonthKey).slice(0, 4));
  }
  return [...years].filter(Boolean);
}

module.exports = {
  COMPARISON_MODES,
  MONTH_LABELS,
  addMonthsToMonthKey,
  aggregateMonthRange,
  buildComparison,
  buildYtdByMonthComparison,
  computeDeltaAbs,
  computeDeltaPct,
  formatPeriodLabel,
  getChartMetricIds,
  getComparisonMetricDefs,
  getHeroMetricIds,
  mergeMonthsMaps,
  monthHasComparisonData,
  monthKeysInRange,
  monthLabelFromMonthKey,
  resolveComparisonPresets,
  yearsNeededForComparison,
};
