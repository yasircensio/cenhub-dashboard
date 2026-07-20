#!/usr/bin/env node
const assert = require('assert');
const { verifyGhlWebhookSignature } = require('../lib/ghl-webhook-verify');

function testMissingSignature() {
  const result = verifyGhlWebhookSignature('{"type":"OpportunityCreate"}', {});
  assert.strictEqual(result.ok, false);
  assert.match(String(result.reason), /signature/i);
}

function testInvalidSignature() {
  const result = verifyGhlWebhookSignature(
    '{"type":"OpportunityCreate"}',
    { 'x-ghl-signature': 'not-valid-base64-signature' },
  );
  assert.strictEqual(result.ok, false);
}

testMissingSignature();
testInvalidSignature();
console.log('GHL webhook verify smoke tests passed.');
