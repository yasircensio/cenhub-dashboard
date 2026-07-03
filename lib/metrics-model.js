const DEFAULT_TIMEZONE = process.env.DASHBOARD_TIMEZONE || 'Europe/Copenhagen';

const calendarFormatters = new Map();

function getCalendarDateFormatter(timeZone) {
  if (!calendarFormatters.has(timeZone)) {
    calendarFormatters.set(
      timeZone,
      new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }),
    );
  }
  return calendarFormatters.get(timeZone);
}

function getDateValue(opportunity, field) {
  const value = opportunity?.[field];
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getCalendarDateString(date, timeZone = DEFAULT_TIMEZONE) {
  if (!date) return null;
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return null;
  return getCalendarDateFormatter(timeZone).format(value);
}

function isCalendarDateInRange(date, dateFrom, dateTo, timeZone = DEFAULT_TIMEZONE) {
  const calendarDate = getCalendarDateString(date, timeZone);
  if (!calendarDate) return false;
  if (dateFrom && calendarDate < dateFrom) return false;
  if (dateTo && calendarDate > dateTo) return false;
  return true;
}

function getWonDate(opportunity) {
  return getDateValue(opportunity, 'lastStatusChangeAt')
    || getDateValue(opportunity, 'updatedAt')
    || getDateValue(opportunity, 'createdAt');
}

function resolveMetricsModel(account = {}) {
  const dedupeEnabled = account.dedupeEnabled != null
    ? Boolean(account.dedupeEnabled)
    : Boolean(account.afterSalesPipelineId);

  const explicitWinPipelineId = account.winPipelineId || null;

  if (dedupeEnabled) {
    return {
      dedupeEnabled: true,
      winMode: 'pipeline',
      winPipelineId: explicitWinPipelineId
        || account.afterSalesPipelineId
        || account.salesPipelineId
        || null,
    };
  }

  if (explicitWinPipelineId) {
    return {
      dedupeEnabled: false,
      winMode: 'pipeline',
      winPipelineId: explicitWinPipelineId,
    };
  }

  return {
    dedupeEnabled: false,
    winMode: 'all',
    winPipelineId: null,
  };
}

function selectWinOpportunities(rawOpportunities, metricsModel) {
  let candidates = (rawOpportunities || []).filter((opportunity) => opportunity.status === 'won');

  if (metricsModel.winMode === 'pipeline' && metricsModel.winPipelineId) {
    candidates = candidates.filter(
      (opportunity) => opportunity.pipelineId === metricsModel.winPipelineId,
    );
  }

  return candidates;
}

function filterWinOpportunitiesByDate(opportunities, filters, timeZone = DEFAULT_TIMEZONE) {
  if (!filters || (!filters.dateFrom && !filters.dateTo)) {
    return opportunities;
  }

  return opportunities.filter((opportunity) =>
    isCalendarDateInRange(getWonDate(opportunity), filters.dateFrom, filters.dateTo, timeZone),
  );
}

function getWinOpportunities(rawOpportunities, accountOrModel, filters = {}, options = {}) {
  const { applyDateFilter = false } = options;
  const metricsModel = accountOrModel?.winMode
    ? accountOrModel
    : resolveMetricsModel(accountOrModel || {});
  const timeZone = filters.timeZone || DEFAULT_TIMEZONE;

  let candidates = selectWinOpportunities(rawOpportunities, metricsModel);
  if (applyDateFilter) {
    candidates = filterWinOpportunitiesByDate(candidates, filters, timeZone);
  }
  return candidates;
}

function parseAmount(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const parsed = Number.parseFloat(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getMonetary(opportunity) {
  return parseAmount(opportunity?.monetaryValue);
}

function computeWinMetrics(rawOpportunities, accountOrModel, filters = {}) {
  const wonOpportunities = getWinOpportunities(rawOpportunities, accountOrModel, filters, {
    applyDateFilter: true,
  });

  const contactIds = new Set();
  const opportunityIds = new Set();
  let wonRevenue = 0;

  for (const opportunity of wonOpportunities) {
    wonRevenue += getMonetary(opportunity);

    if (opportunity.contactId) {
      contactIds.add(opportunity.contactId);
      continue;
    }

    if (opportunity.id) opportunityIds.add(opportunity.id);
  }

  return {
    wonRevenue,
    wonOpportunityCount: wonOpportunities.length,
    clientsWon: contactIds.size + opportunityIds.size,
    wonOpportunities,
  };
}

function describeMetricsModel(account = {}, pipelines = []) {
  const model = resolveMetricsModel(account);
  const pipelineMap = new Map((pipelines || []).map((pipeline) => [pipeline.id, pipeline.name]));
  const winPipelineName = model.winPipelineId
    ? (pipelineMap.get(model.winPipelineId) || model.winPipelineId)
    : null;

  if (model.dedupeEnabled) {
    return {
      modelType: 'dedupe',
      label: 'Funnel + deduplication',
      winSourceLabel: winPipelineName ? `Win pipeline: ${winPipelineName}` : 'Win pipeline not set',
      dedupeEnabled: true,
      winMode: model.winMode,
      winPipelineId: model.winPipelineId,
    };
  }

  if (model.winMode === 'all') {
    return {
      modelType: 'simple',
      label: 'Simple (no deduplication)',
      winSourceLabel: 'All won opportunities',
      dedupeEnabled: false,
      winMode: 'all',
      winPipelineId: null,
    };
  }

  return {
    modelType: 'pipeline',
    label: 'Simple (single win pipeline)',
    winSourceLabel: winPipelineName ? `Win pipeline: ${winPipelineName}` : 'Win pipeline not set',
    dedupeEnabled: false,
    winMode: 'pipeline',
    winPipelineId: model.winPipelineId,
  };
}

function validateMetricsModelInput(input = {}) {
  const dedupeEnabled = Boolean(input.dedupeEnabled);
  const winPipelineId = input.winPipelineId ? String(input.winPipelineId).trim() : null;

  if (dedupeEnabled && !winPipelineId) {
    const error = new Error('Win pipeline is required when opportunity deduplication is enabled.');
    error.statusCode = 400;
    throw error;
  }

  return { dedupeEnabled, winPipelineId: dedupeEnabled || winPipelineId ? winPipelineId : null };
}

module.exports = {
  computeWinMetrics,
  describeMetricsModel,
  filterWinOpportunitiesByDate,
  getWinOpportunities,
  getWonDate,
  resolveMetricsModel,
  selectWinOpportunities,
  validateMetricsModelInput,
};
