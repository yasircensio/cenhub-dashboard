const assert = require('assert');
const crypto = require('crypto');
const {
  decryptGhlSsoPayload,
  extractLocationId,
  normalizeSsoSession,
} = require('../lib/ghl-sso');

function evpEncrypt(password, plaintext) {
  const salt = crypto.randomBytes(8);
  let result = Buffer.alloc(0);
  let block = Buffer.alloc(0);
  const keyLen = 32;
  const ivLen = 16;

  while (result.length < keyLen + ivLen) {
    const hash = crypto.createHash('md5');
    if (block.length) hash.update(block);
    hash.update(Buffer.from(password, 'utf8'));
    hash.update(salt);
    block = hash.digest();
    result = Buffer.concat([result, block]);
  }

  const key = result.subarray(0, keyLen);
  const iv = result.subarray(keyLen, keyLen + ivLen);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const padLen = 16 - (Buffer.byteLength(plaintext, 'utf8') % 16);
  const padded = Buffer.concat([
    Buffer.from(plaintext, 'utf8'),
    Buffer.alloc(padLen, padLen),
  ]);
  const encrypted = Buffer.concat([cipher.update(padded), cipher.final()]);
  return Buffer.concat([Buffer.from('Salted__'), salt, encrypted]).toString('base64');
}

function main() {
  const secret = 'test-shared-secret';
  process.env.GHL_SSO_SHARED_SECRET = secret;

  const payload = {
    userId: 'user-1',
    companyId: 'company-1',
    role: 'admin',
    type: 'location',
    activeLocation: 'XTl96fVPBYqWgZdWkfFM',
    userName: 'Test User',
    email: 'test@example.com',
  };

  const encrypted = evpEncrypt(secret, JSON.stringify(payload));
  const decrypted = decryptGhlSsoPayload(encrypted);
  assert.strictEqual(decrypted.activeLocation, payload.activeLocation);
  assert.strictEqual(extractLocationId(decrypted), payload.activeLocation);

  const session = normalizeSsoSession(decrypted);
  assert.strictEqual(session.locationId, payload.activeLocation);
  assert.strictEqual(session.email, payload.email);

  console.log('GHL SSO unit tests passed.');
}

main();
