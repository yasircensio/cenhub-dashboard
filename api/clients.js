const { handleClientsRequest } = require('../lib/clients-handler');

module.exports = async function clientsHandler(request, response) {
  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  await handleClientsRequest(request, response);
};
