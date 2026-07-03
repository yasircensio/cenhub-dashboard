const { serve } = require('inngest/express');
const { inngest, isInngestConfigured } = require('../lib/inngest-client');
const { inngestFunctions } = require('../inngest/functions');

let handler = null;

function getInngestHandler() {
  if (!handler) {
    handler = serve({
      client: inngest,
      functions: inngestFunctions,
    });
  }
  return handler;
}

async function handleInngestRequest(request, response) {
  if (!isInngestConfigured()) {
    response.status(503).json({
      error: 'Inngest is not configured. Set INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY, or use POST /api/clients/:clientId/sync.',
    });
    return;
  }

  await getInngestHandler()(request, response);
}

module.exports = {
  getInngestHandler,
  handleInngestRequest,
};
