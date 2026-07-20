const { handleMetaSyncInngestRequest } = require('../lib/meta-sync-inngest-handler');

module.exports = async function metaSyncInngestHandler(request, response) {
  await handleMetaSyncInngestRequest(request, response);
};
