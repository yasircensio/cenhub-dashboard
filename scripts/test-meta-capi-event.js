#!/usr/bin/env node
/**
 * Send a test "Won" CAPI event directly to Meta and verify the pixel last_fired_time.
 *
 * Usage:
 *   # Add META_SYSTEM_USER_TOKEN to .env (CAPI token from Events Manager, starts with EAA…)
 *   node scripts/test-meta-capi-event.js
 *   node scripts/test-meta-capi-event.js --no-send   # only check pixel last_fired_time
 */
require('dotenv').config();

const crypto = require('crypto');
const {
  GRAPH_VERSION,
  normalizeMetaAccessToken,
  validateMetaAccessToken,
  tokenHint,
} = require('../lib/meta-token');

const PIXEL_ID = '453181757222794';
const TEST_EVENT_CODE = 'TEST5767';
const DEFAULT_LEAD_ID = '2195481287678641';

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function hashEmail(email) {
  return sha256(String(email || '').trim().toLowerCase());
}

function hashPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  return sha256(digits);
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, json };
}

async function getJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  const json = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, json };
}

async function fetchPixelInfo(token) {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}`);
  url.searchParams.set('fields', 'id,name,last_fired_time,is_unavailable');
  url.searchParams.set('access_token', token);
  return getJson(url.toString());
}

async function sendTestEvent(token) {
  const suffix = Date.now();
  const email = `censio-api-test-${suffix}@example.com`;
  const phone = '+4520000' + String(suffix).slice(-4);
  const value = 1500 + (suffix % 1000);
  const eventTime = Math.floor(Date.now() / 1000);

  const event = {
    event_name: 'Won',
    event_time: eventTime,
    action_source: 'system_generated',
    user_data: {
      lead_id: Number(DEFAULT_LEAD_ID),
      em: hashEmail(email),
      ph: hashPhone(phone),
    },
    custom_data: {
      currency: 'DKK',
      value,
    },
  };

  const body = {
    test_event_code: TEST_EVENT_CODE,
    access_token: token,
    data: [event],
  };

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events`;
  const result = await postJson(url, body);

  return {
    ...result,
    testPayload: {
      email,
      phone,
      value,
      lead_id: DEFAULT_LEAD_ID,
      event_time: eventTime,
      test_event_code: TEST_EVENT_CODE,
    },
  };
}

async function main() {
  const send = !process.argv.includes('--no-send');
  const token = normalizeMetaAccessToken(process.env.META_SYSTEM_USER_TOKEN || '');
  const check = validateMetaAccessToken(token);

  if (!check.ok) {
    console.error('Missing or invalid META_SYSTEM_USER_TOKEN in .env');
    console.error(check.reason || 'Add the CAPI token from Events Manager → Settings → Generate access token.');
    console.error('Do not paste the token in chat — add it locally: META_SYSTEM_USER_TOKEN=EAA...');
    process.exit(1);
  }

  console.log(`Using token ${tokenHint(token)}`);
  console.log(`Pixel: ${PIXEL_ID} (Censio website)`);
  console.log('');

  if (send) {
    console.log('1) Sending test Won event (Offline / test code TEST5767)...');
    const sendResult = await sendTestEvent(check.token);
    console.log(JSON.stringify(sendResult.testPayload, null, 2));
    console.log('');
    console.log('Response:', JSON.stringify(sendResult.json, null, 2));

    if (sendResult.json?.events_received === 1) {
      console.log('\n✓ Meta accepted the event (events_received: 1)');
    } else {
      console.error('\n✗ Event may not have been accepted — check messages above.');
      process.exit(1);
    }
  } else {
    console.log('Skipping send (--no-send).');
  }

  console.log('\n2) Checking pixel last_fired_time...');
  const pixel = await fetchPixelInfo(check.token);
  if (!pixel.ok || pixel.json?.error) {
    console.error('Pixel check failed:', JSON.stringify(pixel.json, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify(pixel.json, null, 2));
  if (pixel.json.last_fired_time) {
    console.log(`\n✓ Pixel last fired: ${pixel.json.last_fired_time}`);
  }

  console.log('\nNext: Meta → Test events → Offline (test code TEST5767) — scroll below the instructions.');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
