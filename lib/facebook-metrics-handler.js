const {
  getAllMetrics,
  getClientList,
  getMetrics,
  setClientList,
  setMetrics,
} = require('./facebook-metrics-store');
const { resolveMonthlyFromPayload } = require('./marketing-metrics');

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
}

function getWebhookSecret() {
  return process.env.MAKE_WEBHOOK_SECRET || '';
}

function parseBody(req) {
  if (!req.body) return null;
  if (typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.trim()) {
    return JSON.parse(req.body);
  }
  return null;
}

async function saveClientMetrics(data) {
  const clientId = data.client_id;

  if (!clientId) {
    const error = new Error('client_id is required');
    error.statusCode = 400;
    throw error;
  }

  const monthly = resolveMonthlyFromPayload(data);
  const payload = {
    ...data,
    last_updated: new Date().toISOString(),
  };
  if (monthly.length) {
    payload.monthly = monthly;
  }
  delete payload.monthly_json;

  await setMetrics(clientId, payload);

  const clients = await getClientList();
  if (!clients.includes(clientId)) {
    clients.push(clientId);
    await setClientList(clients);
  }

  return { clientId, payload };
}

async function handleFacebookMetrics(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    const secret = getWebhookSecret();
    if (!secret) {
      res.status(500).json({ error: 'Missing MAKE_WEBHOOK_SECRET environment variable.' });
      return;
    }

    const auth = req.headers['x-api-key'];
    if (auth !== secret) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const data = parseBody(req);
      if (!data) {
        res.status(400).json({ error: 'Request body must be JSON' });
        return;
      }

      const { clientId } = await saveClientMetrics(data);
      res.status(200).json({
        success: true,
        message: `Data saved for ${clientId}`,
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to save Facebook metrics.',
      });
    }
    return;
  }

  if (req.method === 'GET') {
    try {
      const clientId = req.query?.client;

      if (clientId) {
        const metrics = await getMetrics(clientId);
        if (!metrics) {
          res.status(404).json({ error: 'No data found for this client' });
          return;
        }
        res.status(200).json(metrics);
        return;
      }

      const all = await getAllMetrics();
      res.status(200).json(all);
    } catch (error) {
      res.status(500).json({
        error: error.message || 'Failed to load Facebook metrics.',
      });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}

module.exports = {
  handleFacebookMetrics,
  saveClientMetrics,
};
