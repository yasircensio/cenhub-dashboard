require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const {
  computeNextRetryAt,
  getRetryScheduleMinutes,
} = require('../lib/fb-lead-sync-retry-queue');
const {
  isOpportunityCreateEvent,
} = require('../lib/fb-lead-sync-webhook-hook');
const {
  findMetaLeadForContact,
  metaLeadMatchesContact,
  isRetryableSyncOutcome,
} = require('../lib/meta-lead-ghl-sync');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function main() {
  assert(getRetryScheduleMinutes().join(',') === '5,15,30,60', 'default retry schedule');

  const base = new Date('2026-07-24T12:00:00.000Z');
  assert(computeNextRetryAt(1, base) === '2026-07-24T12:05:00.000Z', 'first retry +5m');
  assert(computeNextRetryAt(2, base) === '2026-07-24T12:15:00.000Z', 'second retry +15m');
  assert(computeNextRetryAt(4, base) === '2026-07-24T13:00:00.000Z', 'fourth retry +60m');

  assert(isOpportunityCreateEvent('OpportunityCreate'), 'create event');
  assert(isOpportunityCreateEvent('opportunity.create'), 'create event snake');
  assert(!isOpportunityCreateEvent('OpportunityUpdate'), 'update not create');

  const contact = { email: 'Lead@Example.com', phone: '+45 12 34 56 78' };
  const leads = [{
    id: 'meta-1',
    field_data: [
      { name: 'email', values: ['lead@example.com'] },
      { name: 'phone', values: ['12345678'] },
    ],
  }];
  assert(metaLeadMatchesContact(leads[0], { email: 'lead@example.com', phone: '12345678' }), 'email match');
  assert(findMetaLeadForContact(contact, leads)?.id === 'meta-1', 'find meta lead for contact');

  assert(isRetryableSyncOutcome('no_meta_match'), 'no meta match retryable');
  assert(!isRetryableSyncOutcome('already_has_id'), 'already has id not retryable');

  console.log('FB lead sync retry queue tests passed.');
}

main();
