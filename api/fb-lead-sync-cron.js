const { handleFbLeadSyncCronRequest } = require('../lib/fb-lead-sync-cron-handler');

module.exports = async function fbLeadSyncCronHandler(request, response) {
  await handleFbLeadSyncCronRequest(request, response);
};
