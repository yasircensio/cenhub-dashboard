#!/usr/bin/env node
const assert = require('assert');
const {
  isDeleteEvent,
  isMergeEvent,
  extractLocationId,
  extractOpportunityId,
} = require('../lib/ghl-webhook-processor');

function testEventRouting() {
  assert.strictEqual(isDeleteEvent('OpportunityDelete'), true);
  assert.strictEqual(isDeleteEvent('opportunity.delete'), true);
  assert.strictEqual(isMergeEvent('OpportunityCreate'), true);
  assert.strictEqual(isMergeEvent('OpportunityUpdate'), true);
  assert.strictEqual(isMergeEvent('OpportunityStatusUpdate'), true);
  assert.strictEqual(isMergeEvent('opportunity.create'), true);
  assert.strictEqual(isMergeEvent('OpportunityDelete'), false);
  assert.strictEqual(isMergeEvent('ContactCreate'), false);
}

function testPayloadExtraction() {
  const payload = {
    type: 'OpportunityUpdate',
    id: 'opp-99',
    locationId: 'loc-abc',
  };
  assert.strictEqual(extractOpportunityId(payload), 'opp-99');
  assert.strictEqual(extractLocationId(payload), 'loc-abc');

  const nested = {
    type: 'OpportunityUpdate',
    data: { id: 'opp-nested', locationId: 'loc-nested' },
  };
  assert.strictEqual(extractOpportunityId(nested), 'opp-nested');
  assert.strictEqual(extractLocationId(nested), 'loc-nested');
}

testEventRouting();
testPayloadExtraction();
console.log('GHL webhook processor tests passed.');
