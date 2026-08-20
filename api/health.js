const { handleHealthRequest } = require('../lib/health-handler');

module.exports = async function healthHandler(request, response) {
  await handleHealthRequest(response);
};
