const { query, usePostgres } = require('./db');
const {
  hashPassword,
  hashToken,
  generateToken,
  generateSessionId,
  sessionExpiresAt,
  passwordTokenExpiresAt,
  toPublicStaffUser,
} = require('./session');

function requireDatabase() {
  if (!usePostgres()) {
    const error = new Error('Staff auth requires DATABASE_URL (Neon Postgres).');
    error.statusCode = 503;
    throw error;
  }
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function mapStaffRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    password_hash: row.password_hash,
    role: row.role,
    status: row.status,
    created_at: row.created_at,
    approved_at: row.approved_at,
    approved_by: row.approved_by,
    last_login_at: row.last_login_at,
  };
}

async function getStaffUserById(id) {
  requireDatabase();
  const rows = await query`SELECT * FROM staff_users WHERE id = ${id} LIMIT 1`;
  return mapStaffRow(rows[0]);
}

async function getStaffUserByEmail(email) {
  requireDatabase();
  const normalized = normalizeEmail(email);
  const rows = await query`SELECT * FROM staff_users WHERE email = ${normalized} LIMIT 1`;
  return mapStaffRow(rows[0]);
}

async function listStaffUsers() {
  requireDatabase();
  const rows = await query`
    SELECT * FROM staff_users
    ORDER BY created_at ASC
  `;
  return rows.map((row) => toPublicStaffUser(mapStaffRow(row)));
}

async function createStaffUser(input = {}) {
  requireDatabase();
  const email = normalizeEmail(input.email);
  const name = String(input.name || '').trim();
  const role = input.role === 'admin' ? 'admin' : 'member';
  const status = input.status === 'active' ? 'active' : 'pending';
  const approvedBy = input.approvedBy || null;

  if (!email) {
    const error = new Error('Email is required.');
    error.statusCode = 400;
    throw error;
  }

  let passwordHash = null;
  if (input.password) {
    passwordHash = await hashPassword(input.password);
  }

  const rows = await query`
    INSERT INTO staff_users (email, name, password_hash, role, status, approved_at, approved_by)
    VALUES (
      ${email},
      ${name || email},
      ${passwordHash},
      ${role},
      ${status},
      ${status === 'active' ? new Date().toISOString() : null},
      ${approvedBy}
    )
    RETURNING *
  `;
  return mapStaffRow(rows[0]);
}

async function updateStaffUser(id, patch = {}) {
  requireDatabase();
  const existing = await getStaffUserById(id);
  if (!existing) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  const name = patch.name !== undefined ? String(patch.name || '').trim() : existing.name;
  const role = patch.role !== undefined ? (patch.role === 'admin' ? 'admin' : 'member') : existing.role;
  const status = patch.status !== undefined ? patch.status : existing.status;
  const approvedAt = patch.approvedAt !== undefined
    ? patch.approvedAt
    : (status === 'active' && !existing.approved_at ? new Date().toISOString() : existing.approved_at);
  const approvedBy = patch.approvedBy !== undefined ? patch.approvedBy : existing.approved_by;

  const rows = await query`
    UPDATE staff_users
    SET
      name = ${name},
      role = ${role},
      status = ${status},
      approved_at = ${approvedAt},
      approved_by = ${approvedBy}
    WHERE id = ${id}
    RETURNING *
  `;
  return mapStaffRow(rows[0]);
}

async function setStaffPassword(userId, plainPassword) {
  requireDatabase();
  const passwordHash = await hashPassword(plainPassword);
  const rows = await query`
    UPDATE staff_users
    SET password_hash = ${passwordHash}
    WHERE id = ${userId}
    RETURNING *
  `;
  return mapStaffRow(rows[0]);
}

async function touchStaffLogin(userId) {
  requireDatabase();
  await query`
    UPDATE staff_users
    SET last_login_at = NOW()
    WHERE id = ${userId}
  `;
}

async function createStaffSession(userId) {
  requireDatabase();
  const sessionId = generateSessionId();
  const expiresAt = sessionExpiresAt().toISOString();
  await query`
    INSERT INTO staff_sessions (id, user_id, expires_at)
    VALUES (${sessionId}, ${userId}, ${expiresAt})
  `;
  return { id: sessionId, userId, expiresAt };
}

async function getStaffUserBySessionId(sessionId) {
  requireDatabase();
  if (!sessionId) return null;
  const rows = await query`
    SELECT u.*
    FROM staff_sessions s
    JOIN staff_users u ON u.id = s.user_id
    WHERE s.id = ${sessionId}
      AND s.expires_at > NOW()
    LIMIT 1
  `;
  return mapStaffRow(rows[0]);
}

async function deleteStaffSession(sessionId) {
  requireDatabase();
  if (!sessionId) return;
  await query`DELETE FROM staff_sessions WHERE id = ${sessionId}`;
}

async function deleteExpiredSessions() {
  requireDatabase();
  await query`DELETE FROM staff_sessions WHERE expires_at <= NOW()`;
}

async function createPasswordToken(userId, purpose = 'set_password') {
  requireDatabase();
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = passwordTokenExpiresAt().toISOString();
  await query`
    INSERT INTO password_tokens (token_hash, user_id, purpose, expires_at)
    VALUES (${tokenHash}, ${userId}, ${purpose}, ${expiresAt})
  `;
  return { token, expiresAt, purpose };
}

async function consumePasswordToken(rawToken, purpose = null) {
  requireDatabase();
  const tokenHash = hashToken(rawToken);
  const rows = purpose
    ? await query`
      SELECT *
      FROM password_tokens
      WHERE token_hash = ${tokenHash}
        AND purpose = ${purpose}
        AND used_at IS NULL
        AND expires_at > NOW()
      LIMIT 1
    `
    : await query`
      SELECT *
      FROM password_tokens
      WHERE token_hash = ${tokenHash}
        AND used_at IS NULL
        AND expires_at > NOW()
      LIMIT 1
    `;
  const row = rows[0];
  if (!row) {
    const error = new Error('Invalid or expired password link.');
    error.statusCode = 400;
    throw error;
  }

  await query`
    UPDATE password_tokens
    SET used_at = NOW()
    WHERE id = ${row.id}
  `;

  const user = await getStaffUserById(row.user_id);
  return { user, tokenRow: row };
}

async function countStaffAdmins() {
  requireDatabase();
  const rows = await query`
    SELECT COUNT(*)::int AS count
    FROM staff_users
    WHERE role = 'admin' AND status = 'active'
  `;
  return rows[0]?.count || 0;
}

async function deleteStaffUser(id) {
  requireDatabase();
  const existing = await getStaffUserById(id);
  if (!existing) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }
  await query`DELETE FROM staff_users WHERE id = ${id}`;
  return { ok: true, id };
}

module.exports = {
  normalizeEmail,
  toPublicStaffUser,
  getStaffUserById,
  getStaffUserByEmail,
  listStaffUsers,
  createStaffUser,
  updateStaffUser,
  setStaffPassword,
  touchStaffLogin,
  createStaffSession,
  getStaffUserBySessionId,
  deleteStaffSession,
  deleteExpiredSessions,
  createPasswordToken,
  consumePasswordToken,
  countStaffAdmins,
  deleteStaffUser,
  requireDatabase,
};
