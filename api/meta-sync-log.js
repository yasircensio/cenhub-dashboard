const { handleMetaSyncLogRequest } = require('../lib/meta-sync-log-handler');

module.exports = async function metaSyncLogHandler(request, response) {
  await handleMetaSyncLogRequest(request, response);
};
