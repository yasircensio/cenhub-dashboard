const { handleSyncHistoryRequest } = require('../lib/sync-history-handler');
const { handleMetaSyncCronRequest } = require('../lib/meta-sync-cron-handler');

module.exports = async function syncHistoryHandler(request, response) {
  const query = request.query || {};
  if (query.__cron === 'meta') {
    await handleMetaSyncCronRequest(request, response);
    return;
  }

  await handleSyncHistoryRequest(request, response);
};
