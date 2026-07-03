const { handleClientsRequest } = require('../../lib/clients-handler');

module.exports = async function clientsPathHandler(request, response) {
  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  const segments = request.query.path || [];
  const suffix = Array.isArray(segments) ? segments.join('/') : String(segments || '');
  request.url = suffix ? `/api/clients/${suffix}` : '/api/clients';

  await handleClientsRequest(request, response);
};
