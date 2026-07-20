const { handleSyncHistoryRequest } = require('../lib/sync-history-handler');

module.exports = async function syncHistoryHandler(request, response) {
  await handleSyncHistoryRequest(request, response);
};
