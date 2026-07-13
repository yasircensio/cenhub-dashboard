const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const SESSION_COOKIE_NAME = 'cenhub_staff_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const PASSWORD_TOKEN_TTL_MS = 48 * 60 * 60 * 1000;
const BCRYPT_ROUNDS = 12;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET || '';
  if (!secret || secret.length < 16) {
    throw new Error('SESSION_SECRET must be set (at least 16 characters).');
  }
  return secret;
}

function hashPassword(plainText) {
  return bcrypt.hash(String(plainText || ''), BCRYPT_ROUNDS);
}

async function verifyPassword(plainText, passwordHash) {
  if (!passwordHash) return false;
  return bcrypt.compare(String(plainText || ''), passwordHash);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token || ''), 'utf8').digest('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function generateSessionId() {
  return crypto.randomUUID();
}

function sessionExpiresAt() {
  return new Date(Date.now() + SESSION_TTL_MS);
}

function passwordTokenExpiresAt() {
  return new Date(Date.now() + PASSWORD_TOKEN_TTL_MS);
}

function parseCookies(cookieHeader = '') {
  const cookies = {};
  for (const part of String(cookieHeader).split(';')) {
    const [rawKey, ...rest] = part.trim().split('=');
    if (!rawKey) continue;
    cookies[rawKey] = decodeURIComponent(rest.join('='));
  }
  return cookies;
}

function getSessionIdFromRequest(request = {}) {
  const headers = request.headers || {};
  const cookieHeader = headers.cookie || headers.Cookie || '';
  const cookies = parseCookies(cookieHeader);
  return cookies[SESSION_COOKIE_NAME] || null;
}

function buildSessionCookie(sessionId, options = {}) {
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ];
  if (options.secure !== false) {
    parts.push('Secure');
  }
  return parts.join('; ');
}

function buildClearSessionCookie() {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure`;
}

function isSecureRequest(request = {}) {
  if (process.env.NODE_ENV !== 'production') return false;
  const headers = request.headers || {};
  const proto = headers['x-forwarded-proto'] || headers['X-Forwarded-Proto'];
  return proto === 'https';
}

function setSessionCookie(response, sessionId, request) {
  const cookie = buildSessionCookie(sessionId, { secure: isSecureRequest(request) });
  response.setHeader('Set-Cookie', cookie);
}

function clearSessionCookie(response) {
  response.setHeader('Set-Cookie', buildClearSessionCookie());
}

function toPublicStaffUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    approvedAt: row.approved_at,
    lastLoginAt: row.last_login_at,
    hasPassword: Boolean(row.password_hash),
  };
}

module.exports = {
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  PASSWORD_TOKEN_TTL_MS,
  BCRYPT_ROUNDS,
  getSessionSecret,
  hashPassword,
  verifyPassword,
  hashToken,
  generateToken,
  generateSessionId,
  sessionExpiresAt,
  passwordTokenExpiresAt,
  parseCookies,
  getSessionIdFromRequest,
  buildSessionCookie,
  buildClearSessionCookie,
  setSessionCookie,
  clearSessionCookie,
  isSecureRequest,
  toPublicStaffUser,
};
