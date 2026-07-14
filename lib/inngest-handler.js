const { serve } = require('inngest/express');
const { inngest, isInngestConfigured } = require('../lib/inngest-client');
const { inngestFunctions } = require('../inngest/functions');

let handler = null;

function getInngestHandler() {
  if (!handler) {
    handler = serve({
      client: inngest,
      functions: inngestFunctions,
      streaming: true,
    });
  }
  return handler;
}

function toExpressRequest(request, { url = '/api/inngest' } = {}) {
  let body = request.body;
  if (body === undefined || body === null) {
    body = undefined;
  } else if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      // Keep raw string payloads as-is.
    }
  }

  const headers = request.headers || {};
  const host = headers.host || headers.Host || 'localhost';
  const protocol = headers['x-forwarded-proto'] || 'https';

  return {
    method: request.method || 'GET',
    headers,
    url,
    originalUrl: url,
    body,
    query: request.query || {},
    protocol,
  };
}

function toExpressResponse(response) {
  if (typeof response.writeHead === 'function' && typeof response.status !== 'function') {
    let statusCode = 200;
    return {
      setHeader(name, value) {
        response.setHeader(name, value);
      },
      status(code) {
        statusCode = code;
        return this;
      },
      send(payload) {
        if (!response.headersSent) {
          response.writeHead(statusCode);
        }
        response.end(typeof payload === 'string' ? payload : String(payload));
      },
      write(chunk) {
        response.write(chunk);
      },
      end() {
        response.end();
      },
      destroy(error) {
        if (typeof response.destroy === 'function') {
          response.destroy(error);
        }
      },
    };
  }

  return response;
}

async function handleInngestRequest(request, response) {
  if (!isInngestConfigured()) {
    if (typeof response.status === 'function') {
      response.status(503).json({
        error: 'Inngest is not configured. Set INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY, or use POST /api/clients/:clientId/sync.',
      });
      return;
    }
    response.writeHead(503, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({
      error: 'Inngest is not configured. Set INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY, or use POST /api/clients/:clientId/sync.',
    }));
    return;
  }

  const url = request.url || request.path || '/api/inngest';
  const expressReq = toExpressRequest(request, { url });
  const expressRes = toExpressResponse(response);
  await getInngestHandler()(expressReq, expressRes);
}

module.exports = {
  getInngestHandler,
  handleInngestRequest,
  toExpressRequest,
  toExpressResponse,
};
