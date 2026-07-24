const { handleFbLeadSyncRetryRequest } = require('../lib/fb-lead-sync-retry-handler');

module.exports = async function fbLeadSyncRetriesHandler(request, response) {
  await handleFbLeadSyncRetryRequest(request, response);
};
