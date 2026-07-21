const { verifyGhlWebhookSignature } = require('./ghl-webhook-verify');
const { recordGhlWebhookReceived } = require('./ghl-webhook-events');
const { inngest, isInngestConfigured } = require('./inngest-client');
const { processGhlOpportunityWebhookSafe } = require('./ghl-webhook-processor');
const { SyncInProgressError } = require('./snapshot-sync-lock');

function useInlineGhlWebhookProcessing() {
  const flag = String(process.env.GHL_WEBHOOK_INLINE || '').trim();
  if (flag === '1') return true;
  if (flag === '0') return false;
  // Production default: inline (~2–3s). Inngest queue caused 6–17 min delays.
  if (process.env.VERCEL_ENV === 'production') return true;
  return !isInngestConfigured();
}

function isWebhookEnabled() {
  if (String(process.env.GHL_WEBHOOK_DISABLED || '').trim() === '1') {
    return false;
  }
  if (String(process.env.GHL_WEBHOOK_ENABLED || '').trim() === '1') {
    return true;
  }
  if (process.env.VERCEL_ENV === 'production') {
    return true;
  }
  return false;
}

function sendJson(response, statusCode, payload) {
  if (typeof response.status === 'function') {
    response.status(statusCode).json(payload);
    return;
  }
  response.writeHead(statusCode, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(payload));
}

async function readRawBody(request) {
  if (typeof request.text === 'function') {
    return request.text();
  }

  if (typeof request.body === 'string') {
    return request.body;
  }

  if (Buffer.isBuffer(request.body)) {
    return request.body.toString('utf8');
  }

  if (request.body && typeof request.body === 'object') {
    return JSON.stringify(request.body);
  }

  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    request.on('error', reject);
  });
}

async function queueGhlWebhook(payload) {
  const eventData = {
    ...payload,
    locationId: payload.locationId || payload.location_id || payload.data?.locationId || null,
  };

  if (!useInlineGhlWebhookProcessing()) {
    await inngest.send({
      name: 'dashboard/ghl.opportunity',
      data: eventData,
    });
    return { queued: true };
  }

  try {
    const result = await processGhlOpportunityWebhookSafe(eventData);
    return { queued: false, processedInline: true, result };
  } catch (error) {
    if (error instanceof SyncInProgressError || error.code === 'SYNC_IN_PROGRESS') {
      const retryError = new Error(error.message);
      retryError.statusCode = 503;
      retryError.retryable = true;
      throw retryError;
    }
    throw error;
  }
}

async function handleGhlWebhookRequest(request, response) {
  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {});
    return;
  }

  if (request.method === 'GET') {
    sendJson(response, 200, {
      ok: true,
      endpoint: '/api/ghl-webhook',
      enabled: isWebhookEnabled(),
      inline: useInlineGhlWebhookProcessing(),
      inngest: isInngestConfigured() && !useInlineGhlWebhookProcessing(),
    });
    return;
  }

  if (request.method !== 'POST') {
    sendJson(response, 405, { error: 'Method not allowed' });
    return;
  }

  if (!isWebhookEnabled()) {
    sendJson(response, 200, {
      ok: true,
      ignored: true,
      reason: 'GHL webhooks disabled (set GHL_WEBHOOK_ENABLED=1 locally or use production)',
    });
    return;
  }

  try {
    const rawBody = await readRawBody(request);
    const verification = verifyGhlWebhookSignature(rawBody, request.headers || {});
    if (!verification.ok) {
      sendJson(response, 401, { error: 'Invalid webhook signature', reason: verification.reason });
      return;
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      sendJson(response, 400, { error: 'Invalid JSON body' });
      return;
    }

    const dedupe = await recordGhlWebhookReceived(payload);
    if (dedupe.duplicate) {
      sendJson(response, 200, { ok: true, duplicate: true, webhookId: dedupe.webhookId });
      return;
    }

    const outcome = await queueGhlWebhook({ ...payload, webhookId: dedupe.webhookId });
    sendJson(response, 200, {
      ok: true,
      accepted: true,
      webhookId: dedupe.webhookId,
      processedInline: Boolean(outcome.processedInline),
    });
  } catch (error) {
    console.error('[ghl-webhook] handler error:', error.message);
    const statusCode = error.statusCode || 500;
    sendJson(response, statusCode, {
      error: error.message || 'Webhook processing failed',
      retryable: Boolean(error.retryable),
    });
  }
}

module.exports = {
  handleGhlWebhookRequest,
  isWebhookEnabled,
  useInlineGhlWebhookProcessing,
};
