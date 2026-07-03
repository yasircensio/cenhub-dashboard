const handleGhlSsoRequest = require('../lib/ghl-sso-handler');

module.exports = async function ghlSsoHandler(request, response) {
  await handleGhlSsoRequest(request, response);
};
