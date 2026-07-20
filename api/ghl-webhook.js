const { handleGhlWebhookRequest } = require('../lib/ghl-webhook-handler');

async function ghlWebhookHandler(request, response) {
  await handleGhlWebhookRequest(request, response);
}

ghlWebhookHandler.config = {
  api: {
    bodyParser: false,
  },
};

module.exports = ghlWebhookHandler;
