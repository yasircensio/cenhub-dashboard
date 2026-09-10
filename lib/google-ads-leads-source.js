function normalizeGoogleAdsLeadsSource(value) {
  return value === 'manual' ? 'manual' : 'google';
}

function resolveEffectiveGoogleAdsLeads(monthRecord = {}, settings = {}) {
  const mode = normalizeGoogleAdsLeadsSource(
    settings.googleAdsReportLeadsSource
    || settings.leadsSource
    || monthRecord.leadsSource,
  );
  const googleLeads = monthRecord.googleConversions != null
    ? Number(monthRecord.googleConversions)
    : (monthRecord.google_conversions != null ? Number(monthRecord.google_conversions) : null);
  const manualLeads = monthRecord.manualLeads != null
    ? Number(monthRecord.manualLeads)
    : (monthRecord.manual_leads != null ? Number(monthRecord.manual_leads) : null);
  if (mode === 'manual' && manualLeads != null && Number.isFinite(manualLeads)) {
    return {
      mode,
      leads: manualLeads,
      googleLeads: Number.isFinite(googleLeads) ? googleLeads : null,
      manualLeads,
      overridden: true,
    };
  }
  return {
    mode,
    leads: Number.isFinite(googleLeads) ? googleLeads : null,
    googleLeads: Number.isFinite(googleLeads) ? googleLeads : null,
    manualLeads,
    overridden: false,
  };
}

function displayedGoogleAdsLeads(monthRecord = {}, settings = {}) {
  return resolveEffectiveGoogleAdsLeads(monthRecord, settings).leads;
}

function resolveManualLeadsToStore(inputLeads, googleConversions, existingManualLeads, mode) {
  if (normalizeGoogleAdsLeadsSource(mode) !== 'manual') {
    return existingManualLeads != null ? Number(existingManualLeads) : null;
  }
  if (inputLeads == null || inputLeads === '') return null;
  const parsed = Number(inputLeads);
  if (!Number.isFinite(parsed)) return null;
  const googleLeads = googleConversions != null ? Number(googleConversions) : null;
  if (googleLeads != null && Number.isFinite(googleLeads) && parsed === googleLeads) {
    return null;
  }
  return parsed;
}

module.exports = {
  displayedGoogleAdsLeads,
  normalizeGoogleAdsLeadsSource,
  resolveEffectiveGoogleAdsLeads,
  resolveManualLeadsToStore,
};
