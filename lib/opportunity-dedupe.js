const AFTER_SALE_PIPELINE_NAME = 'Eftersalg & Betalinger';

function parseAmount(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  const raw = String(value).trim();
  if (!raw) return 0;

  const cleaned = raw.replace(/[^\d,.-]/g, '');
  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');

  let normalized = cleaned;
  if (hasComma && hasDot) {
    normalized = cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')
      ? cleaned.replace(/\./g, '').replace(',', '.')
      : cleaned.replace(/,/g, '');
  } else if (hasDot && /^-?\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    normalized = cleaned.replace(/\./g, '');
  } else if (hasComma) {
    normalized = cleaned.replace(',', '.');
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getAfterSalePipelineId(pipelines, pipelineName = AFTER_SALE_PIPELINE_NAME) {
  return pipelines.find((pipeline) => pipeline.name === pipelineName)?.id || null;
}

function getTimestamp(opportunity, field) {
  const value = opportunity?.[field];
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function getFieldKey(field) {
  return field.id || field.fieldKey || field.name || null;
}

function mergeCustomFields(funnelFields = [], afterSaleFields = []) {
  const merged = new Map();

  for (const field of funnelFields) {
    const key = getFieldKey(field);
    if (key) merged.set(key, { ...field });
  }

  for (const field of afterSaleFields) {
    const key = getFieldKey(field);
    if (!key) continue;
    merged.set(key, { ...field });
  }

  return [...merged.values()];
}

function pickStatus(funnelOpp, afterSaleOpp) {
  if (funnelOpp.status === 'won' || afterSaleOpp.status === 'won') return 'won';
  if (funnelOpp.status === 'open' || afterSaleOpp.status === 'open') return 'open';
  if (funnelOpp.status === 'lost' || afterSaleOpp.status === 'lost') return 'lost';
  return funnelOpp.status || afterSaleOpp.status;
}

function pickWonTimestamp(funnelOpp, afterSaleOpp) {
  if (afterSaleOpp.status === 'won') {
    return afterSaleOpp.lastStatusChangeAt || afterSaleOpp.updatedAt || afterSaleOpp.createdAt;
  }
  if (funnelOpp.status === 'won') {
    return funnelOpp.lastStatusChangeAt || funnelOpp.updatedAt || funnelOpp.createdAt;
  }
  return funnelOpp.lastStatusChangeAt || afterSaleOpp.lastStatusChangeAt || funnelOpp.updatedAt || afterSaleOpp.updatedAt;
}

function mergeOpportunityPair(funnelOpp, afterSaleOpp) {
  const funnelValue = parseAmount(funnelOpp.monetaryValue);
  const afterSaleValue = parseAmount(afterSaleOpp.monetaryValue);
  const monetaryValue = afterSaleValue > 0 ? afterSaleOpp.monetaryValue : funnelOpp.monetaryValue;

  return {
    ...funnelOpp,
    monetaryValue,
    status: pickStatus(funnelOpp, afterSaleOpp),
    lastStatusChangeAt: pickWonTimestamp(funnelOpp, afterSaleOpp),
    customFields: mergeCustomFields(funnelOpp.customFields, afterSaleOpp.customFields),
    _dedupe: {
      merged: true,
      funnelOpportunityId: funnelOpp.id,
      afterSaleOpportunityId: afterSaleOpp.id,
      funnelPipelineId: funnelOpp.pipelineId,
      afterSalePipelineId: afterSaleOpp.pipelineId,
      funnelMonetaryValue: funnelValue,
      afterSaleMonetaryValue: afterSaleValue,
    },
  };
}

function scoreFunnelMatch(funnelOpp, afterSaleOpp) {
  const afterSaleCreated = getTimestamp(afterSaleOpp, 'createdAt') || 0;
  const funnelCreated = getTimestamp(funnelOpp, 'createdAt') || 0;
  const funnelWon = getTimestamp(funnelOpp, 'lastStatusChangeAt') || getTimestamp(funnelOpp, 'updatedAt') || 0;
  const monetaryDelta = Math.abs(parseAmount(funnelOpp.monetaryValue) - parseAmount(afterSaleOpp.monetaryValue));

  let score = 0;
  if (funnelOpp.status === 'won') score += 100;
  if (afterSaleCreated >= funnelCreated) score += 40;
  if (funnelWon && afterSaleCreated >= funnelWon) score += 30;
  if (monetaryDelta < 1) score += 25;
  score += Math.min(funnelCreated / 1_000_000_000_000, 10);

  return score;
}

function findBestFunnelMatch(afterSaleOpp, funnelOpps, usedFunnelIds) {
  const candidates = funnelOpps.filter((opp) => !usedFunnelIds.has(opp.id));
  if (!candidates.length) return null;

  const afterSaleCreated = getTimestamp(afterSaleOpp, 'createdAt') || 0;
  const datedCandidates = candidates.filter((opp) => {
    const funnelCreated = getTimestamp(opp, 'createdAt') || 0;
    return funnelCreated <= afterSaleCreated;
  });

  const pool = datedCandidates.length ? datedCandidates : candidates;

  return pool
    .map((funnelOpp) => ({ funnelOpp, score: scoreFunnelMatch(funnelOpp, afterSaleOpp) }))
    .sort((a, b) => b.score - a.score)[0]?.funnelOpp || null;
}

function groupByContact(opportunities, afterSalePipelineId, funnelPipelineIds = []) {
  const funnelSet = new Set(funnelPipelineIds.filter(Boolean));
  const funnelByContact = new Map();
  const afterSaleByContact = new Map();

  for (const opportunity of opportunities) {
    if (!opportunity.contactId) continue;

    const isAfterSale = afterSalePipelineId && opportunity.pipelineId === afterSalePipelineId;
    const isFunnel = funnelSet.size
      ? funnelSet.has(opportunity.pipelineId)
      : !isAfterSale;

    if (isAfterSale) {
      if (!afterSaleByContact.has(opportunity.contactId)) afterSaleByContact.set(opportunity.contactId, []);
      afterSaleByContact.get(opportunity.contactId).push(opportunity);
    } else if (isFunnel) {
      if (!funnelByContact.has(opportunity.contactId)) funnelByContact.set(opportunity.contactId, []);
      funnelByContact.get(opportunity.contactId).push(opportunity);
    }
  }

  return { funnelByContact, afterSaleByContact };
}

function dedupeOpportunities(opportunities, pipelines, options = {}) {
  const afterSalePipelineId = options.afterSalesPipelineId
    || getAfterSalePipelineId(pipelines, options.afterSalePipelineName)
    || null;
  const funnelPipelineIds = options.funnelPipelineIds || [];
  const dedupeEnabled = options.dedupeEnabled != null
    ? Boolean(options.dedupeEnabled)
    : Boolean(afterSalePipelineId);

  if (!dedupeEnabled || !afterSalePipelineId) {
    return {
      opportunities,
      stats: {
        enabled: false,
        afterSalePipelineId,
        pairsMerged: 0,
        afterSaleHidden: 0,
        unpairedAfterSale: 0,
        unpairedFunnel: 0,
      },
    };
  }

  const { funnelByContact, afterSaleByContact } = groupByContact(
    opportunities,
    afterSalePipelineId,
    funnelPipelineIds,
  );
  const pairedAfterSaleIds = new Set();
  const mergedByFunnelId = new Map();
  let pairsMerged = 0;

  for (const [, afterSaleOpps] of afterSaleByContact) {
    const sortedAfterSale = [...afterSaleOpps].sort((a, b) => {
      const aCreated = getTimestamp(a, 'createdAt') || 0;
      const bCreated = getTimestamp(b, 'createdAt') || 0;
      return aCreated - bCreated;
    });

    for (const afterSaleOpp of sortedAfterSale) {
      const funnelOpps = funnelByContact.get(afterSaleOpp.contactId) || [];
      const usedFunnelIds = new Set(
        [...mergedByFunnelId.values()].map((opp) => opp._dedupe?.funnelOpportunityId).filter(Boolean),
      );

      const funnelMatch = findBestFunnelMatch(afterSaleOpp, funnelOpps, usedFunnelIds);
      if (!funnelMatch) continue;

      pairedAfterSaleIds.add(afterSaleOpp.id);
      mergedByFunnelId.set(funnelMatch.id, mergeOpportunityPair(funnelMatch, afterSaleOpp));
      pairsMerged += 1;
    }
  }

  const dedupedOpportunities = opportunities
    .filter((opportunity) => !pairedAfterSaleIds.has(opportunity.id))
    .map((opportunity) => mergedByFunnelId.get(opportunity.id) || opportunity);
  // Unpaired Eftersalg rows stay in the list (e.g. Salg copy was deleted).

  const unpairedAfterSale = opportunities.filter(
    (opportunity) => opportunity.pipelineId === afterSalePipelineId && !pairedAfterSaleIds.has(opportunity.id),
  ).length;
  const unpairedFunnel = opportunities.filter(
    (opportunity) => opportunity.pipelineId !== afterSalePipelineId && !mergedByFunnelId.has(opportunity.id),
  ).length;

  return {
    opportunities: dedupedOpportunities,
    stats: {
      enabled: true,
      afterSalePipelineId,
      pairsMerged,
      afterSaleHidden: pairedAfterSaleIds.size,
      unpairedAfterSale,
      unpairedFunnel,
      rawCount: opportunities.length,
      dedupedCount: dedupedOpportunities.length,
    },
  };
}

module.exports = {
  AFTER_SALE_PIPELINE_NAME,
  dedupeOpportunities,
  getAfterSalePipelineId,
  mergeOpportunityPair,
};
