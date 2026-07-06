const { getDashboardData } = require('../lib/dashboard-data');
const { normalizeClientId, DEFAULT_ACCOUNT_ID } = require('../lib/account-store');
const { requireClientAccess } = require('../lib/client-access');

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
    const query = request.query || {};
    const clientId = query.client ? normalizeClientId(query.client) : DEFAULT_ACCOUNT_ID;
    requireClientAccess(clientId, query, request.headers || {});

    const data = await getDashboardData(query);
    response.status(200).json(data);
  } catch (error) {
    if (!error.statusCode || error.statusCode >= 500) {
      console.error('[api/dashboard] request failed:', error.message);
    }
    response.status(error.statusCode || 502).json({
      error: error.message || 'Failed to load dashboard data.',
    });
  }
};
