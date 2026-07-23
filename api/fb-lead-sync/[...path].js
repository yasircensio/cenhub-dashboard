const { handleFbLeadSyncRequest } = require('../../lib/fb-lead-sync-handler');

module.exports = async function fbLeadSyncPathHandler(request, response) {
  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  const segments = request.query.path || [];
  const suffix = Array.isArray(segments) ? segments.join('/') : String(segments || '');
  request.url = suffix ? `/api/fb-lead-sync/${suffix}` : '/api/fb-lead-sync';

  await handleFbLeadSyncRequest(request, response);
};
