const crypto = require('crypto');

const SALTED_PREFIX = 'Salted__';
const KEY_SIZE = 32;
const IV_SIZE = 16;

function evpBytesToKey(password, salt, keyLen, ivLen) {
  let result = Buffer.alloc(0);
  let block = Buffer.alloc(0);

  while (result.length < keyLen + ivLen) {
    const hash = crypto.createHash('md5');
    if (block.length) hash.update(block);
    hash.update(password);
    hash.update(salt);
    block = hash.digest();
    result = Buffer.concat([result, block]);
  }

  return {
    key: result.subarray(0, keyLen),
    iv: result.subarray(keyLen, keyLen + ivLen),
  };
}

function unpadPkcs7(buffer) {
  if (!buffer.length) {
    throw new Error('Invalid GHL SSO payload (empty decrypted data).');
  }
  const padLen = buffer[buffer.length - 1];
  if (padLen < 1 || padLen > IV_SIZE) {
    throw new Error('Invalid GHL SSO payload padding.');
  }
  return buffer.subarray(0, buffer.length - padLen);
}

function getSharedSecret() {
  return process.env.GHL_SSO_SHARED_SECRET
    || process.env.GHL_APP_SHARED_SECRET
    || '';
}

function decryptGhlSsoPayload(encryptedPayload, sharedSecret = getSharedSecret()) {
  if (!sharedSecret) {
    const error = new Error('GHL_SSO_SHARED_SECRET is not configured.');
    error.statusCode = 503;
    throw error;
  }

  const raw = Buffer.from(String(encryptedPayload || '').trim(), 'base64');
  if (raw.length < 16 || raw.subarray(0, 8).toString('utf8') !== SALTED_PREFIX) {
    const error = new Error('Invalid GHL SSO payload format.');
    error.statusCode = 400;
    throw error;
  }

  const salt = raw.subarray(8, 16);
  const ciphertext = raw.subarray(16);
  const { key, iv } = evpBytesToKey(Buffer.from(sharedSecret, 'utf8'), salt, KEY_SIZE, IV_SIZE);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  const decrypted = unpadPkcs7(Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]));

  try {
    return JSON.parse(decrypted.toString('utf8'));
  } catch {
    const error = new Error('GHL SSO payload decrypted but was not valid JSON.');
    error.statusCode = 400;
    throw error;
  }
}

function extractLocationId(session = {}) {
  return session.activeLocation
    || session.locationId
    || session.location?.id
    || session.companyId
    || null;
}

function normalizeSsoSession(session = {}) {
  const locationId = extractLocationId(session);
  return {
    userId: session.userId || null,
    companyId: session.companyId || null,
    role: session.role || null,
    type: session.type || null,
    locationId,
    userName: session.userName || null,
    email: session.email || null,
    isAgencyOwner: Boolean(session.isAgencyOwner),
  };
}

module.exports = {
  decryptGhlSsoPayload,
  extractLocationId,
  getSharedSecret,
  normalizeSsoSession,
};
