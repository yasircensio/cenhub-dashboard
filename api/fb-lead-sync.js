const { handleFbLeadSyncRequest } = require('../lib/fb-lead-sync-handler');

module.exports = async function fbLeadSyncHandler(request, response) {
  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  await handleFbLeadSyncRequest(request, response);
};
