function shouldSnapshotMetaInputs(existing = {}) {
  const source = existing.toplineSource || null;
  if (source === 'ghl' || source === 'manual') return false;
  return true;
}

function buildMetaInputsSnapshot(existing = {}) {
  return {
    metaSavedWonLeads: existing.wonLeads ?? null,
    metaSavedAvgLeadValue: existing.avgLeadValue ?? null,
    metaSavedAvgProfitPerWon: existing.avgProfitPerWon ?? null,
  };
}

function restoreMetaInputsPatch(existing = {}) {
  const hasSaved = existing.metaSavedWonLeads != null
    || existing.metaSavedAvgLeadValue != null
    || existing.metaSavedAvgProfitPerWon != null;
  if (!hasSaved) return {};
  return {
    wonLeads: existing.metaSavedWonLeads ?? existing.wonLeads ?? null,
    avgLeadValue: existing.metaSavedAvgLeadValue ?? existing.avgLeadValue ?? null,
    avgProfitPerWon: existing.metaSavedAvgProfitPerWon ?? existing.avgProfitPerWon ?? null,
  };
}

module.exports = {
  buildMetaInputsSnapshot,
  restoreMetaInputsPatch,
  shouldSnapshotMetaInputs,
};
