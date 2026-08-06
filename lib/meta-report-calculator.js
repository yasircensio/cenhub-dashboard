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

function isLeadActionType(actionType) {
  const normalized = String(actionType || '').toLowerCase();
  if (!normalized) return false;
  if (normalized === 'lead') return true;
  if (normalized.includes('lead')) return true;
  return false;
}

function computeConversionRatePercent(clicks, impressions) {
  const clickCount = parseAmount(clicks);
  const impressionCount = parseAmount(impressions);
  if (impressionCount <= 0) return 0;
  return roundRatio((clickCount / impressionCount) * 100);
}

function computeMetaReportMetrics(input = {}) {
  const spend = parseAmount(input.spend);
  const clicks = parseAmount(input.clicks);
  const impressions = parseAmount(input.impressions);
  const reach = parseAmount(input.reach);
  const cpm = parseAmount(input.cpm);
  const leads = parseAmount(input.leads);
  const wonLeads = parseAmount(input.wonLeads);
  const avgLeadValue = parseAmount(input.avgLeadValue);
  const avgProfitPerWon = parseAmount(input.avgProfitPerWon);
  const showBottomline = Boolean(input.showBottomline);
  const feeMode = input.feeMode || (input.feeEnabled ? 'performance' : null);
  const feePercent = parseAmount(input.feePercent) || 20;
  const marketingFeeAmount = parseAmount(input.marketingFeeAmount);
  const feeActive = Boolean(showBottomline && feeMode);

  const totalLeadValue = roundMoney(wonLeads * avgLeadValue);
  const cpl = leads > 0 ? roundMoney(spend / leads) : 0;
  const cac = wonLeads > 0 ? roundMoney(spend / wonLeads) : 0;
  // Sheet: ROAS kr = lead value - spend; ROAS % (x) = ROAS kr / spend
  const roasKr = roundMoney(totalLeadValue - spend);
  const roasX = spend > 0 ? roundRatio(roasKr / spend) : 0;

  const totalProfit = roundMoney(wonLeads * avgProfitPerWon);
  // Sheet: POAS kr = total profit - spend; POAS % (x) = POAS kr / spend
  const poasKr = roundMoney(totalProfit - spend);
  const poasX = spend > 0 ? roundRatio(poasKr / spend) : 0;

  let censioFee = 0;
  let feeLabel = '';
  if (feeActive && feeMode === 'performance') {
    censioFee = roundMoney(Math.max(0, poasKr) * (feePercent / 100));
    feeLabel = `Censio performance fee (${roundMoney(feePercent)}%)`;
  } else if (feeActive && feeMode === 'marketing') {
    censioFee = roundMoney(marketingFeeAmount);
    feeLabel = 'Censio marketing fee';
  }

  // Sheet (Jan): POI = POAS - fee; POI % (x) = POI / spend
  const poiKr = roundMoney(poasKr - censioFee);
  const poiX = spend > 0 ? roundRatio(poiKr / spend) : 0;

  const emptyMonth = spend <= 0 && impressions <= 0 && clicks <= 0 && leads <= 0;

  return {
    inputs: {
      wonLeads,
      avgLeadValue,
      avgProfitPerWon,
    },
    meta: {
      spend,
      cpm,
      impressions,
      reach,
      clicks,
      conversionRatePercent: computeConversionRatePercent(clicks, impressions),
      leads,
      emptyMonth,
    },
    topline: {
      leads,
      cpl,
      wonLeads,
      totalLeadValue,
      avgLeadValue,
      cac,
      roasKr,
      roasX,
    },
    bottomline: showBottomline ? {
      leads,
      wonLeads,
      totalLeadValue,
      avgLeadValue,
      cac,
      totalProfit,
      avgProfitPerWon,
      poasKr,
      poasX,
      censioFee,
      feeMode: feeActive ? feeMode : null,
      feePercent: feeActive && feeMode === 'performance' ? feePercent : 0,
      marketingFeeAmount: feeActive && feeMode === 'marketing' ? marketingFeeAmount : 0,
      feeLabel,
      poiKr,
      poiX,
    } : null,
  };
}

module.exports = {
  computeConversionRatePercent,
  computeMetaReportMetrics,
  isLeadActionType,
  parseAmount,
  roundMoney,
  roundRatio,
};
