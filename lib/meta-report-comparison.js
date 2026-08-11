const COMPARISON_MODES = new Set(['mom', 'months', 'yoy_month', 'ytd', 'custom']);

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

function parseDateOnly(value) {
  const normalized = String(value || '').trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
  const [year, month, day] = normalized.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return normalized;
}

function monthBoundsFromKey(monthKey) {
  const normalized = String(monthKey || '').trim();
  if (!/^\d{4}-\d{2}$/.test(normalized)) return { start: '', end: '' };
  const [year, month] = normalized.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthPart = String(month).padStart(2, '0');
  return {
    start: `${year}-${monthPart}-01`,
    end: `${year}-${monthPart}-${String(daysInMonth).padStart(2, '0')}`,
  };
}

function getMonthEffectivePeriod(monthPayload, monthKey) {
  const bounds = monthBoundsFromKey(monthKey || monthPayload?.monthKey);
  const start = parseDateOnly(monthPayload?.periodStart) || bounds.start;
  const end = parseDateOnly(monthPayload?.periodEnd) || bounds.end;
  if (start && end && start <= end) return { start, end };
  return bounds;
}

function daysInclusive(startDate, endDate) {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  if (!start || !end || start > end) return 0;
  const [sy, sm, sd] = start.split('-').map(Number);
  const [ey, em, ed] = end.split('-').map(Number);
  const startMs = Date.UTC(sy, sm - 1, sd);
  const endMs = Date.UTC(ey, em - 1, ed);
  return Math.floor((endMs - startMs) / 86400000) + 1;
}

function overlapDays(rangeAStart, rangeAEnd, rangeBStart, rangeBEnd) {
  const start = [rangeAStart, rangeBStart].sort().pop();
  const end = [rangeAEnd, rangeBEnd].sort()[0];
  if (!start || !end || start > end) return 0;
  return daysInclusive(start, end);
}

function monthKeyFromDate(dateValue) {
  const parsed = parseDateOnly(dateValue);
  if (!parsed) return null;
  return parsed.slice(0, 7);
}

function monthKeysOverlappingDates(startDate, endDate) {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  if (!start || !end) return [];
  const [rangeStart, rangeEnd] = start <= end ? [start, end] : [end, start];
  const keys = [];
  let cursor = monthKeyFromDate(rangeStart);
  const endKey = monthKeyFromDate(rangeEnd);
  while (cursor && cursor <= endKey) {
    keys.push(cursor);
    if (cursor === endKey) break;
    cursor = addMonthsToMonthKey(cursor, 1);
  }
  return keys;
}

function formatDateLabel(dateValue) {
  const parsed = parseDateOnly(dateValue);
  if (!parsed) return '—';
  const [year, month, day] = parsed.split('-').map(Number);
  return `${day} ${MONTH_LABELS[month - 1] || month} ${year}`;
}

function formatDateRangeLabel(startDate, endDate) {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  if (!start || !end) return '—';
  if (start === end) return formatDateLabel(start);
  const startYear = start.slice(0, 4);
  const endYear = end.slice(0, 4);
  const startMonth = start.slice(5, 7);
  const endMonth = end.slice(5, 7);
  if (startYear === endYear && startMonth === endMonth) {
    const [sy, sm, sd] = start.split('-').map(Number);
    const [, , ed] = end.split('-').map(Number);
    return `${sd}–${ed} ${MONTH_LABELS[sm - 1] || sm} ${startYear}`;
  }
  if (startYear === endYear) {
    return `${formatDateLabel(start).replace(` ${startYear}`, '')}–${formatDateLabel(end)}`;
  }
  return `${formatDateLabel(start)} – ${formatDateLabel(end)}`;
}

function monthPayloadDates(monthPayload, monthKey) {
  const period = getMonthEffectivePeriod(monthPayload, monthKey);
  return {
    startDate: period.start,
    endDate: period.end,
    startMonthKey: monthKey,
    endMonthKey: monthKey,
  };
}

function fullMonthPeriodDates(monthKey) {
  const bounds = monthBoundsFromKey(monthKey);
  return {
    startDate: bounds.start,
    endDate: bounds.end,
    startMonthKey: monthKey,
    endMonthKey: monthKey,
  };
}

function formatComparisonDisplayLabel(mode, period) {
  const normalized = normalizeComparisonPeriod(period);
  if (!normalized) return '—';
  const normalizedMode = COMPARISON_MODES.has(mode) ? mode : 'custom';
  if (normalizedMode === 'mom' || normalizedMode === 'months') {
    return formatPeriodLabel(normalized.startMonthKey, normalized.endMonthKey);
  }
  if (normalizedMode === 'ytd') {
    return normalized.startDate.slice(0, 4);
  }
  return formatDateRangeLabel(normalized.startDate, normalized.endDate);
}

function aggregatePeriodForMode(mode, monthsMap = {}, normalizedPeriod) {
  const normalized = normalizeComparisonPeriod(normalizedPeriod);
  if (!normalized) {
    return {
      label: '—',
      monthKeys: [],
      monthCount: 0,
      expectedMonthCount: 0,
      partialData: false,
      hasData: false,
      hasBottomline: false,
      metrics: aggregateDateRange({}, null, null).metrics,
    };
  }

  let agg;
  if (mode === 'mom' || mode === 'months') {
    const monthKey = normalized.startMonthKey;
    agg = aggregateMonthRange(monthsMap, monthKey, monthKey);
  } else {
    agg = aggregateDateRange(monthsMap, normalized.startDate, normalized.endDate);
  }
  agg.label = formatComparisonDisplayLabel(mode, normalized);
  return agg;
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
    hasData: included.length > 0,
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

function aggregateDateRange(monthsMap = {}, startDate, endDate) {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  if (!start || !end) {
    return {
      startDate: startDate || null,
      endDate: endDate || null,
      label: '—',
      monthKeys: [],
      monthCount: 0,
      expectedMonthCount: 0,
      partialData: false,
      hasData: false,
      hasBottomline: false,
      metrics: {
        spend: 0,
        cpm: 0,
        impressions: 0,
        reach: 0,
        clicks: 0,
        conversionRatePercent: 0,
        leads: 0,
        cpl: 0,
        wonLeads: 0,
        totalLeadValue: 0,
        avgLeadValue: 0,
        cac: 0,
        roasKr: 0,
        roasX: 0,
        totalProfit: 0,
        avgProfitPerWon: 0,
        poasKr: 0,
        poasX: 0,
        censioFee: 0,
        poiKr: 0,
        poiX: 0,
      },
    };
  }

  const [rangeStart, rangeEnd] = start <= end ? [start, end] : [end, start];
  const rangeKeys = monthKeysOverlappingDates(rangeStart, rangeEnd);
  const included = [];
  let hasBottomline = false;
  let expectedOverlapDays = 0;
  let coveredOverlapDays = 0;

  let spend = 0;
  let impressions = 0;
  let reach = 0;
  let clicks = 0;
  let leads = 0;
  let wonLeads = 0;
  let totalLeadValue = 0;
  let totalProfit = 0;
  let censioFeeSum = 0;
  let weightedLeadValue = 0;
  let weightedProfitPerWon = 0;
  let weightedCpm = 0;
  let cpmWeight = 0;

  for (const key of rangeKeys) {
    const month = monthsMap[key];
    const effective = getMonthEffectivePeriod(month, key);
    const overlap = overlapDays(rangeStart, rangeEnd, effective.start, effective.end);
    if (overlap <= 0) continue;
    expectedOverlapDays += overlap;

    if (!monthHasComparisonData(month)) continue;
    included.push(key);
    coveredOverlapDays += overlap;
    if (month.bottomline) hasBottomline = true;

    const totalDays = daysInclusive(effective.start, effective.end);
    const fraction = totalDays > 0 ? overlap / totalDays : 0;

    const monthSpend = parseAmount(month.meta?.spend) * fraction;
    const monthImpressions = parseAmount(month.meta?.impressions) * fraction;
    const monthLeads = parseAmount(month.topline?.leads) * fraction;
    const monthWon = parseAmount(month.topline?.wonLeads) * fraction;

    spend += monthSpend;
    impressions += monthImpressions;
    reach += parseAmount(month.meta?.reach) * fraction;
    clicks += parseAmount(month.meta?.clicks) * fraction;
    leads += monthLeads;
    wonLeads += monthWon;
    totalLeadValue += parseAmount(month.topline?.totalLeadValue) * fraction;

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
      totalProfit += parseAmount(month.bottomline.totalProfit) * fraction;
      censioFeeSum += parseAmount(month.bottomline.censioFee) * fraction;
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
    startDate: rangeStart,
    endDate: rangeEnd,
    label: formatDateRangeLabel(rangeStart, rangeEnd),
    monthKeys: included,
    monthCount: included.length,
    expectedMonthCount: rangeKeys.length,
    partialData: expectedOverlapDays > 0 && coveredOverlapDays < expectedOverlapDays,
    hasData: included.length > 0,
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

function normalizeComparisonPeriod(period = null) {
  if (!period) return null;
  const startDate = parseDateOnly(period.startDate)
    || (period.startMonthKey ? monthBoundsFromKey(period.startMonthKey).start : null);
  const endDate = parseDateOnly(period.endDate)
    || (period.endMonthKey ? monthBoundsFromKey(period.endMonthKey).end : null);
  if (!startDate || !endDate) return null;
  const [normalizedStart, normalizedEnd] = startDate <= endDate
    ? [startDate, endDate]
    : [endDate, startDate];
  return {
    startDate: normalizedStart,
    endDate: normalizedEnd,
    startMonthKey: monthKeyFromDate(normalizedStart),
    endMonthKey: monthKeyFromDate(normalizedEnd),
  };
}

function resolveComparisonPresetDates({
  activeMonthKey = null,
  mode = 'mom',
  monthsMap = {},
  customPeriodA = null,
  customPeriodB = null,
} = {}) {
  const normalizedMode = COMPARISON_MODES.has(mode) ? mode : 'mom';
  const anchorKey = activeMonthKey || null;

  if (normalizedMode === 'custom') {
    return {
      mode: normalizedMode,
      periodA: normalizeComparisonPeriod(customPeriodA),
      periodB: normalizeComparisonPeriod(customPeriodB),
    };
  }

  if (normalizedMode === 'months') {
    const periodA = normalizeComparisonPeriod(customPeriodA);
    const periodB = normalizeComparisonPeriod(customPeriodB);
    const isSingleMonth = (period) => period && period.startMonthKey === period.endMonthKey;
    if (isSingleMonth(periodA) && isSingleMonth(periodB)) {
      return { mode: normalizedMode, periodA, periodB };
    }
    if (!anchorKey) return { mode: normalizedMode, periodA: null, periodB: null };
    const previousKey = addMonthsToMonthKey(anchorKey, -1);
    return {
      mode: normalizedMode,
      periodA: fullMonthPeriodDates(anchorKey),
      periodB: previousKey ? fullMonthPeriodDates(previousKey) : null,
    };
  }

  if (!anchorKey) {
    return { mode: normalizedMode, periodA: null, periodB: null };
  }

  if (normalizedMode === 'mom') {
    const previousKey = addMonthsToMonthKey(anchorKey, -1);
    return {
      mode: normalizedMode,
      periodA: fullMonthPeriodDates(anchorKey),
      periodB: previousKey ? fullMonthPeriodDates(previousKey) : null,
    };
  }

  if (normalizedMode === 'ytd') {
    const year = String(anchorKey).slice(0, 4);
    const month = String(anchorKey).slice(5, 7);
    const priorYear = String(Number(year) - 1);
    const anchorBounds = monthBoundsFromKey(anchorKey);
    const priorKey = `${priorYear}-${month}`;
    const priorBounds = monthBoundsFromKey(priorKey);
    return {
      mode: normalizedMode,
      periodA: {
        startDate: `${year}-01-01`,
        endDate: anchorBounds.end,
        startMonthKey: `${year}-01`,
        endMonthKey: anchorKey,
      },
      periodB: {
        startDate: `${priorYear}-01-01`,
        endDate: priorBounds.end,
        startMonthKey: `${priorYear}-01`,
        endMonthKey: priorKey,
      },
    };
  }

  return { mode: normalizedMode, periodA: null, periodB: null };
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

function resolveComparisonPresets(options = {}) {
  return resolveComparisonPresetDates(options);
}

function buildYtdByMonthComparison(monthsMapA = {}, monthsMapB = {}, periodA, periodB) {
  if (!periodA || !periodB) return [];
  const keysA = monthKeysInRange(periodA.startMonthKey, periodA.endMonthKey);
  const priorYear = String(periodB.startMonthKey || '').slice(0, 4);

  return keysA.map((keyA) => {
    const monthPart = String(keyA).slice(5, 7);
    const keyB = `${priorYear}-${monthPart}`;
    const aggA = aggregateMonthRange(monthsMapA, keyA, keyA);
    const aggB = aggregateMonthRange(monthsMapB, keyB, keyB);
    return {
      monthKey: keyA,
      label: monthLabelFromMonthKey(keyA),
      periodA: aggA.hasData ? aggA.metrics : null,
      periodB: aggB.hasData ? aggB.metrics : null,
      hasDataA: aggA.hasData,
      hasDataB: aggB.hasData,
    };
  });
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
  monthsMap = {},
  monthsMapA = null,
  monthsMapB = null,
  periodA = null,
  periodB = null,
  mode = 'mom',
} = {}) {
  const mapA = monthsMapA || monthsMap;
  const mapB = monthsMapB || monthsMap;
  const normalizedA = normalizeComparisonPeriod(periodA);
  const normalizedB = normalizeComparisonPeriod(periodB);

  if (!normalizedA?.startDate || !normalizedA?.endDate || !normalizedB?.startDate || !normalizedB?.endDate) {
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

  const samePeriod = normalizedA.startDate === normalizedB.startDate
    && normalizedA.endDate === normalizedB.endDate;

  const aggA = aggregatePeriodForMode(mode, mapA, normalizedA);
  const aggB = aggregatePeriodForMode(mode, mapB, normalizedB);
  const hasBottomline = aggA.hasBottomline || aggB.hasBottomline;
  const insufficientData = !aggA.hasData && !aggB.hasData;

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
    ? buildYtdByMonthComparison(mapA, mapB, normalizedA, normalizedB)
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
    const normalized = normalizeComparisonPeriod(period);
    if (!normalized) continue;
    if (normalized.startDate) years.add(normalized.startDate.slice(0, 4));
    if (normalized.endDate) years.add(normalized.endDate.slice(0, 4));
  }
  return [...years].filter(Boolean);
}

module.exports = {
  COMPARISON_MODES,
  MONTH_LABELS,
  addMonthsToMonthKey,
  aggregatePeriodForMode,
  aggregateDateRange,
  aggregateMonthRange,
  buildComparison,
  buildYtdByMonthComparison,
  computeDeltaAbs,
  computeDeltaPct,
  daysInclusive,
  formatComparisonDisplayLabel,
  formatDateRangeLabel,
  formatPeriodLabel,
  fullMonthPeriodDates,
  getChartMetricIds,
  getComparisonMetricDefs,
  getHeroMetricIds,
  getMonthEffectivePeriod,
  mergeMonthsMaps,
  monthBoundsFromKey,
  monthHasComparisonData,
  monthKeysInRange,
  monthKeysOverlappingDates,
  monthLabelFromMonthKey,
  monthPayloadDates,
  normalizeComparisonPeriod,
  overlapDays,
  parseDateOnly,
  resolveComparisonPresetDates,
  resolveComparisonPresets,
  yearsNeededForComparison,
};
