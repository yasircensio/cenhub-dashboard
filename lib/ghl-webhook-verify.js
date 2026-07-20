const crypto = require('crypto');

const LEGACY_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAokvo/r9tVgcfZ5DysOSC
Frm602qYV0MaAiNnX9O8KxMbiyRKWeL9JpCpVpt4XHIcBOK4u3cLSqJGOLaPuXw6
dO0t6Q/ZVdAV5Phz+ZtzPL16iCGeK9po6D6JHBpbi989mmzMryUnQJezlYJ3DVfB
csedpinheNnyYeFXolrJvcsjDtfAeRx5ByHQmTnSdFUzuAnC9/GepgLT9SM4nCpv
uxmZMxrJt5Rw+VUaQ9B8JSvbMPpez4peKaJPZHBbU3OdeCVx5klVXXZQGNHOs8g
F3kvoV5rTnXV0IknLBXlcKKAQLZcY/Q9rG6Ifi9c+5vqlvHPCUJFT5XUGG5RKgOK
UJ062fRtN+rLYZUV+BjafxQauvC8wSWeYja63VSUruvmNj8xkx2zE/Juc+yjLjTX
pIocmaiFeAO6fUtNjDeFVkhf5LNb59vECyrHD2SQIrhgXpO4Q3dVNA5rw576PwTz
Nh/AMfHKIjE4xQA1SZuYJmNnmVZLIZBlQAF9Ntd03rfadZ+yDiOXCCs9FkHibELh
CHULgCsnuDJHcrGNd5/Ddm5hxGQ0ASitgHeMZ0kcIOwKDOzOU53lDza6/Y09T7sY
JPQe7z0cvj7aE4B+Ax1ZoZGPzpJlZtGXCsu9aTEGEnKzmsFqwcSsnw3JB31IGKAy
kT1hhTiaCeIY/OwwwNUY2yvcCAwEAAQ==
-----END PUBLIC KEY-----`;

const GHL_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAi2HR1srL4o18O8BRa7gVJY7G7bupbN3H9AwJrHCDiOg=
-----END PUBLIC KEY-----`;

function verifyLegacy(payload, signature) {
  if (!signature || signature === 'N/A') {
    return { ok: false, reason: 'no legacy signature' };
  }
  try {
    const verifier = crypto.createVerify('SHA256');
    verifier.update(payload);
    verifier.end();
    const ok = verifier.verify(LEGACY_PUBLIC_KEY, signature, 'base64');
    return { ok, reason: ok ? null : 'legacy verify failed' };
  } catch (error) {
    return { ok: false, reason: error.message };
  }
}

function verifyGhl(payload, signature) {
  if (!signature || signature === 'N/A') {
    return { ok: false, reason: 'no ghl signature' };
  }
  try {
    const payloadBuffer = Buffer.from(payload, 'utf8');
    const signatureBuffer = Buffer.from(signature, 'base64');
    const ok = crypto.verify(null, payloadBuffer, GHL_PUBLIC_KEY, signatureBuffer);
    return { ok, reason: ok ? null : 'ghl verify failed' };
  } catch (error) {
    return { ok: false, reason: error.message };
  }
}

function verifyGhlWebhookSignature(rawBody, headers = {}) {
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [String(key).toLowerCase(), value]),
  );
  const ghlSig = normalizedHeaders['x-ghl-signature'];
  const legacySig = normalizedHeaders['x-wh-signature'];

  if (ghlSig) {
    return verifyGhl(rawBody, ghlSig);
  }
  if (legacySig) {
    return verifyLegacy(rawBody, legacySig);
  }
  return { ok: false, reason: 'no signature header' };
}

module.exports = {
  verifyGhlWebhookSignature,
};
