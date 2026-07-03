const crypto = require('crypto');

function getEncryptionKeyBuffer() {
  const key = process.env.ACCOUNT_CONFIG_ENCRYPTION_KEY || process.env.DASHBOARD_CONFIG_ENCRYPTION_KEY;
  if (!key) return null;
  return crypto.createHash('sha256').update(String(key)).digest();
}

function encryptSecret(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return '';

  const key = getEncryptionKeyBuffer();
  if (!key) {
    throw new Error('Missing ACCOUNT_CONFIG_ENCRYPTION_KEY. Set it before saving account credentials.');
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(normalized, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `enc:v1:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

function decryptSecret(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (!raw.startsWith('enc:v1:')) return raw;

  const key = getEncryptionKeyBuffer();
  if (!key) {
    throw new Error('Missing ACCOUNT_CONFIG_ENCRYPTION_KEY. Cannot decrypt saved account credentials.');
  }

  const parts = raw.split(':');
  if (parts.length !== 5) return '';

  const iv = Buffer.from(parts[2], 'base64');
  const tag = Buffer.from(parts[3], 'base64');
  const encrypted = Buffer.from(parts[4], 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

module.exports = {
  decryptSecret,
  encryptSecret,
};
