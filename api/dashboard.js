const { getDashboardData } = require('../lib/dashboard-data');

module.exports = async function dashboardHandler(request, response) {
  response.setHeader('Cache-Control', 'private, no-store');

  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const data = await getDashboardData(request.query || {});
    response.status(200).json(data);
  } catch (error) {
    response.status(502).json({
      error: error.message || 'Failed to load dashboard data.',
    });
  }
};
