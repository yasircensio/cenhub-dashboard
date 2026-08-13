function resolveClientToplineMode(settings = {}) {
  return settings.metaReportToplineMode === 'cenhub' ? 'cenhub' : 'meta';
}

function resolveStoredToplineSource(monthRecord = {}) {
  return monthRecord.toplineSource || 'meta';
}

function isCenhubManualStored(monthRecord = {}) {
  return Boolean(monthRecord.manualOverride)
    && resolveStoredToplineSource(monthRecord) === 'manual';
}

function resolveEffectiveToplineSource(monthRecord = {}, settings = {}) {
  const stored = resolveStoredToplineSource(monthRecord);
  if (!settings.metaReportGhlDataEnabled) return stored;
  if (resolveClientToplineMode(settings) !== 'meta') return stored;
  if (stored === 'manual' || stored === 'ghl') return 'meta';
  return stored;
}

function isActiveCenhubManualMonth(monthRecord = {}, settings = {}) {
  return resolveClientToplineMode(settings) === 'cenhub' && isCenhubManualStored(monthRecord);
}

module.exports = {
  isActiveCenhubManualMonth,
  isCenhubManualStored,
  resolveClientToplineMode,
  resolveEffectiveToplineSource,
  resolveStoredToplineSource,
};
