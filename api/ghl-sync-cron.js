const { handleGhlSyncCronRequest } = require('../lib/ghl-sync-cron-handler');

module.exports = async function ghlSyncCronHandler(request, response) {
  await handleGhlSyncCronRequest(request, response);
};
