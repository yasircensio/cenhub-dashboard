const { handleFacebookMetrics } = require('../lib/facebook-metrics-handler');

module.exports = async function facebookMetricsHandler(request, response) {
  await handleFacebookMetrics(request, response);
};
