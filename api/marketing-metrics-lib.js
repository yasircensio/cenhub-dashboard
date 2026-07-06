const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '..', 'lib', 'marketing-metrics.js');

module.exports = function marketingMetricsLibHandler(_request, response) {
  response.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  response.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  response.status(200).send(fs.readFileSync(FILE_PATH, 'utf8'));
};
