const { resolveMetricsModel } = require('./metrics-model');

function buildPipelineSlots(account = {}) {
  const newLeadsPipelineId = account.newLeadsPipelineId || null;
  const salesPipelineId = account.salesPipelineId || null;
  const afterSalesPipelineId = account.afterSalesPipelineId || null;
  const metrics = resolveMetricsModel(account);

  const funnelPipelineIds = [newLeadsPipelineId, salesPipelineId].filter(Boolean);
  const defaultPipelineIds = [...funnelPipelineIds];
  if (afterSalesPipelineId) defaultPipelineIds.push(afterSalesPipelineId);

  return {
    newLeadsPipelineId,
    salesPipelineId,
    afterSalesPipelineId,
    funnelPipelineIds,
    defaultPipelineIds,
    dedupeEnabled: metrics.dedupeEnabled,
    winMode: metrics.winMode,
    winPipelineId: metrics.winPipelineId,
    pipelineMode: afterSalesPipelineId ? '3-pipeline' : '2-pipeline',
    openPipelineIds: salesPipelineId ? [salesPipelineId] : funnelPipelineIds,
    leadPipelineIds: newLeadsPipelineId ? [newLeadsPipelineId] : funnelPipelineIds,
  };
}

function isInPipeline(opportunity, pipelineId) {
  if (!pipelineId) return false;
  return opportunity.pipelineId === pipelineId;
}

function isInFunnel(opportunity, slots) {
  if (!opportunity?.pipelineId) return false;
  if (slots.funnelPipelineIds.includes(opportunity.pipelineId)) return true;
  if (
    opportunity._dedupe?.merged
    && opportunity._dedupe.afterSalePipelineId
    && slots.funnelPipelineIds.some((id) => id === opportunity._dedupe.funnelPipelineId)
  ) {
    return true;
  }
  return false;
}

function isNewLeadOpportunity(opportunity, slots) {
  if (!slots.newLeadsPipelineId) return isInFunnel(opportunity, slots);
  return isInPipeline(opportunity, slots.newLeadsPipelineId);
}

module.exports = {
  buildPipelineSlots,
  isInFunnel,
  isInPipeline,
  isNewLeadOpportunity,
};
