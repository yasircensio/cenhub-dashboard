const { handleMetaSyncCronRequest } = require('../lib/meta-sync-cron-handler');

module.exports = async function metaSyncCronHandler(request, response) {
  await handleMetaSyncCronRequest(request, response);
};
