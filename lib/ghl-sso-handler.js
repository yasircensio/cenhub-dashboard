const {
  decryptGhlSsoPayload,
  getSharedSecret,
  normalizeSsoSession,
} = require('../lib/ghl-sso');
const { getAccount } = require('../lib/account-store');

function sendJson(response, statusCode, payload) {
  if (typeof response.status === 'function') {
    response.status(statusCode).json(payload);
    return;
  }
  response.writeHead(statusCode, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(payload));
}

function parseJsonBody(body) {
  if (!body) return {};
  if (typeof body === 'object') return body;
  try {
    return JSON.parse(body);
  } catch {
    const error = new Error('Invalid JSON body.');
    error.statusCode = 400;
    throw error;
  }
}

async function handleGhlSsoRequest(request, response) {
  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {});
    return;
  }

  if (request.method !== 'POST') {
    sendJson(response, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    if (!getSharedSecret()) {
      sendJson(response, 503, {
        error: 'GHL SSO is not configured. Set GHL_SSO_SHARED_SECRET in environment.',
      });
      return;
    }

    const body = parseJsonBody(request.body);
    const payload = body.payload || body.encryptedData || body.data;
    if (!payload) {
      sendJson(response, 400, { error: 'Missing SSO payload.' });
      return;
    }

    const session = normalizeSsoSession(decryptGhlSsoPayload(payload));
    if (!session.locationId) {
      sendJson(response, 400, { error: 'SSO session did not include a location ID.' });
      return;
    }

    const account = await getAccount(session.locationId, { byLocationId: true });
    sendJson(response, 200, {
      session,
      locationId: session.locationId,
      account: account ? {
        clientId: account.clientId,
        accountName: account.accountName,
        readyForGhl: account.readyForGhl,
      } : null,
    });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error.message || 'Failed to decode GHL SSO payload.',
    });
  }
}

module.exports = handleGhlSsoRequest;
