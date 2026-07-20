const { getAccount } = require('./account-store');
const { fetchOpportunityById } = require('./ghl-sync');
const { markGhlWebhookProcessed } = require('./ghl-webhook-events');
const {
  mergeOpportunityIntoSnapshot,
  removeOpportunityFromSnapshot,
} = require('./snapshot-merge');

const DELETE_EVENTS = new Set([
  'OpportunityDelete',
  'opportunity.delete',
]);

function normalizeEventType(type) {
  return String(type || '').trim();
}

function extractOpportunityId(payload) {
  return payload?.id
    || payload?.opportunityId
    || payload?.data?.id
    || payload?.data?.opportunityId
    || null;
}

function extractLocationId(payload) {
  return payload?.locationId
    || payload?.location_id
    || payload?.data?.locationId
    || payload?.data?.location_id
    || null;
}

function extractWebhookId(payload) {
  return payload?.webhookId || payload?.webhook_id || null;
}

async function processGhlOpportunityWebhook(payload) {
  const eventType = normalizeEventType(payload?.type || payload?.event);
  const locationId = extractLocationId(payload);
  const opportunityId = extractOpportunityId(payload);
  const webhookId = extractWebhookId(payload);

  if (!locationId) {
    throw new Error('Webhook payload missing locationId.');
  }

  const account = await getAccount(locationId, { byLocationId: true, includeSecrets: true });
  if (!account) {
    const error = new Error(`No dashboard account for GHL location "${locationId}".`);
    error.statusCode = 404;
    throw error;
  }

  if (!account.ghlToken) {
    throw new Error(`Missing GHL token for account "${account.clientId}".`);
  }

  if (DELETE_EVENTS.has(eventType)) {
    if (!opportunityId) {
      throw new Error('Delete webhook missing opportunity id.');
    }
    const result = await removeOpportunityFromSnapshot(account.clientId, opportunityId);
    if (webhookId) {
      await markGhlWebhookProcessed(webhookId, {
        status: 'processed',
        clientId: account.clientId,
        opportunityId,
      });
    }
    return { ...result, eventType, action: 'delete' };
  }

  if (!opportunityId) {
    throw new Error('Webhook payload missing opportunity id.');
  }

  const opportunity = await fetchOpportunityById(
    account.ghlToken,
    opportunityId,
    account.locationId,
  );

  const result = await mergeOpportunityIntoSnapshot(account.clientId, opportunity);
  if (webhookId) {
    await markGhlWebhookProcessed(webhookId, {
      status: 'processed',
      clientId: account.clientId,
      opportunityId,
    });
  }

  return { ...result, eventType, action: 'merge' };
}

async function processGhlOpportunityWebhookSafe(payload) {
  const webhookId = extractWebhookId(payload);
  try {
    return await processGhlOpportunityWebhook(payload);
  } catch (error) {
    if (webhookId) {
      await markGhlWebhookProcessed(webhookId, {
        status: 'failed',
        errorMessage: error.message,
      }).catch(() => {});
    }
    throw error;
  }
}

module.exports = {
  extractLocationId,
  extractOpportunityId,
  extractWebhookId,
  processGhlOpportunityWebhook,
  processGhlOpportunityWebhookSafe,
};
