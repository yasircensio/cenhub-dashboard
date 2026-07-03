const { handleInngestRequest } = require('../lib/inngest-handler');

module.exports = async function inngestHandler(request, response) {
  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  await handleInngestRequest(request, response);
};
