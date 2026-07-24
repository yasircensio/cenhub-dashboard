const { handleSyncHistoryRequest } = require('../lib/sync-history-handler');
const { handleMetaSyncCronRequest } = require('../lib/meta-sync-cron-handler');
const { handleGhlSyncCronRequest } = require('../lib/ghl-sync-cron-handler');
const { handleFbLeadSyncCronRequest } = require('../lib/fb-lead-sync-cron-handler');

module.exports = async function syncHistoryHandler(request, response) {
  const query = request.query || {};
  if (query.__cron === 'meta') {
    await handleMetaSyncCronRequest(request, response);
    return;
  }
  if (query.__cron === 'ghl') {
    await handleGhlSyncCronRequest(request, response);
    return;
  }
  if (query.__cron === 'fb') {
    await handleFbLeadSyncCronRequest(request, response);
    return;
  }

  await handleSyncHistoryRequest(request, response);
};
