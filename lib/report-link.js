function resolveDualPlatforms(pair, origin) {
  if (!pair) return origin === 'google-ads' ? ['google-ads'] : ['meta'];
  const platforms = [];
  if (origin === 'meta' || pair.metaEnabled) platforms.push('meta');
  if (origin === 'google-ads' || pair.googleEnabled) platforms.push('google-ads');
  return platforms;
}

function summarizeLinkedPair(metaAccount, googleClient) {
  if (!metaAccount || !googleClient?.linkedMetaClientId) return null;
  if (String(googleClient.linkedMetaClientId) !== String(metaAccount.clientId || metaAccount.id)) {
    return null;
  }
  return {
    metaClientId: metaAccount.clientId || metaAccount.id,
    metaAccountName: metaAccount.accountName || metaAccount.clientId,
    metaEnabled: Boolean(metaAccount.metaReportEnabled),
    googleClientId: googleClient.clientId || googleClient.id,
    googleAccountName: googleClient.accountName,
    googleEnabled: googleClient.enabled !== false,
  };
}

async function getLinkedReportPair({ metaClientId, googleClientId } = {}) {
  const {
    getGoogleAdsReportClient,
    getGoogleAdsReportClientByLinkedMetaClientId,
  } = require('./google-ads-report-store');
  const { getAccount } = require('./account-store');

  let google = null;
  let meta = null;

  if (googleClientId) {
    google = await getGoogleAdsReportClient(googleClientId);
    if (google?.linkedMetaClientId) {
      meta = await getAccount(google.linkedMetaClientId);
    }
  } else if (metaClientId) {
    meta = await getAccount(metaClientId);
    google = await getGoogleAdsReportClientByLinkedMetaClientId(metaClientId);
  }

  return summarizeLinkedPair(meta, google);
}

function buildDualPublicReportShape({ origin, pair, meta, google }) {
  const platforms = resolveDualPlatforms(pair, origin);
  if (platforms.length < 2) return null;
  return {
    reportKind: 'dual',
    origin: origin === 'google-ads' ? 'google-ads' : 'meta',
    platforms,
    pair,
    meta,
    google,
    accountName: origin === 'google-ads' ? google?.accountName : meta?.accountName,
    year: origin === 'google-ads' ? google?.year : meta?.year,
  };
}

async function buildDualPublicReportPayload({ origin, year, metaClientId, googleClientId }) {
  const pair = await getLinkedReportPair({ metaClientId, googleClientId });
  if (!pair) return null;

  const platforms = resolveDualPlatforms(pair, origin);
  if (platforms.length < 2) return null;

  const { buildClientYearPayload: buildMetaYear } = require('./meta-report-service');
  const { buildClientYearPayload: buildGoogleYear } = require('./google-ads-report-service');

  const [meta, google] = await Promise.all([
    buildMetaYear(pair.metaClientId, year, { includeUnpublished: false }),
    buildGoogleYear(pair.googleClientId, year, { includeUnpublished: false }),
  ]);

  return buildDualPublicReportShape({ origin, pair, meta, google });
}

async function attachLinkedPair(payload, { metaClientId, googleClientId } = {}) {
  if (!payload) return payload;
  const pair = await getLinkedReportPair({
    metaClientId: metaClientId || (payload.reportKind === 'google-ads' ? null : payload.clientId),
    googleClientId: googleClientId || (payload.reportKind === 'google-ads' ? payload.clientId : null),
  });
  payload.linkedPair = pair;
  return payload;
}

async function mapMetaToGoogleLinks() {
  const { listGoogleAdsReportClients } = require('./google-ads-report-store');
  const googleClients = await listGoogleAdsReportClients({ filter: 'all' });
  const byMeta = new Map();
  for (const client of googleClients) {
    if (!client.linkedMetaClientId) continue;
    byMeta.set(String(client.linkedMetaClientId), {
      linkedGoogleClientId: client.clientId,
      linkedGoogleAccountName: client.accountName,
      linkedGoogleEnabled: client.enabled !== false,
    });
  }
  return byMeta;
}

async function mapGoogleToMetaLinkNames(googleClients = []) {
  const { getAccount } = require('./account-store');
  const ids = [...new Set(
    googleClients
      .map((client) => client.linkedMetaClientId)
      .filter(Boolean)
      .map((id) => String(id)),
  )];
  const names = new Map();
  await Promise.all(ids.map(async (id) => {
    const account = await getAccount(id);
    names.set(id, account?.accountName || id);
  }));
  return names;
}

module.exports = {
  attachLinkedPair,
  buildDualPublicReportPayload,
  buildDualPublicReportShape,
  getLinkedReportPair,
  mapGoogleToMetaLinkNames,
  mapMetaToGoogleLinks,
  resolveDualPlatforms,
  summarizeLinkedPair,
};
