const { syncFbLeadIdForContact, isRetryableSyncOutcome } = require('./meta-lead-ghl-sync');
const { enqueueFbLeadSyncRetry, cancelFbLeadSyncRetry, computeNextRetryAt } = require('./fb-lead-sync-retry-queue');

const CREATE_EVENTS = new Set([
  'OpportunityCreate',
  'opportunity.create',
]);

function isOpportunityCreateEvent(eventType) {
  return CREATE_EVENTS.has(String(eventType || '').trim());
}

async function triggerFbLeadSyncForOpportunity(account, opportunity, {
  eventType,
  webhookId = null,
} = {}) {
  if (!isOpportunityCreateEvent(eventType)) {
    return { skipped: true, reason: 'not_create_event' };
  }
  if (!account?.fbLeadSyncEnabled) {
    return { skipped: true, reason: 'auto_sync_disabled' };
  }

  const contactId = opportunity?.contactId || opportunity?.contact_id || null;
  if (!contactId) {
    return { skipped: true, reason: 'missing_contact_id' };
  }

  const opportunityId = opportunity?.id || opportunity?.opportunityId || null;

  try {
    const outcome = await syncFbLeadIdForContact(account.clientId, contactId, {
      source: 'ghl-webhook',
      logHistory: true,
      account,
    });

    if (outcome.updated > 0 || outcome.status === 'already_has_id' || outcome.status === 'already_correct') {
      await cancelFbLeadSyncRetry(account.clientId, contactId);
      return { synced: true, outcome, webhookId };
    }

    if (isRetryableSyncOutcome(outcome.status) || outcome.retryable) {
      await enqueueFbLeadSyncRetry({
        clientId: account.clientId,
        contactId,
        opportunityId,
        attempt: 1,
        nextRetryAt: computeNextRetryAt(1),
        triggerSource: 'ghl-webhook',
      });
      return { enqueued: true, outcome, webhookId };
    }

    return { done: true, outcome, webhookId };
  } catch (error) {
    try {
      await enqueueFbLeadSyncRetry({
        clientId: account.clientId,
        contactId,
        opportunityId,
        attempt: 1,
        nextRetryAt: computeNextRetryAt(1),
        triggerSource: 'ghl-webhook',
      });
    } catch {
      // ignore enqueue failures — webhook must not fail
    }
    return {
      error: error.message,
      enqueued: true,
      webhookId,
    };
  }
}

module.exports = {
  CREATE_EVENTS,
  isOpportunityCreateEvent,
  triggerFbLeadSyncForOpportunity,
};
