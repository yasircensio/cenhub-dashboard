const {
  getSessionIdFromRequest,
  setSessionCookie,
  clearSessionCookie,
  verifyPassword,
  toPublicStaffUser,
} = require('./session');
const {
  getStaffUserByEmail,
  getStaffUserById,
  getStaffUserBySessionId,
  listStaffUsers,
  createStaffUser,
  updateStaffUser,
  setStaffPassword,
  touchStaffLogin,
  createStaffSession,
  deleteStaffSession,
  createPasswordToken,
  consumePasswordToken,
  normalizeEmail,
  requireDatabase,
  countStaffAdmins,
  deleteStaffUser,
} = require('./user-store');

async function assertCanChangeAdminAccess(targetUser, patch) {
  if (!targetUser || targetUser.role !== 'admin' || targetUser.status !== 'active') return;

  const demoting = patch.role === 'member';
  const disabling = patch.status === 'disabled';
  if (!demoting && !disabling) return;

  const adminCount = await countStaffAdmins();
  if (adminCount <= 1) {
    const error = new Error('Cannot remove the last active admin.');
    error.statusCode = 400;
    throw error;
  }
}

async function assertCanDeleteStaffUser(admin, targetUser) {
  if (admin.id === targetUser.id) {
    const error = new Error('You cannot delete your own account.');
    error.statusCode = 400;
    throw error;
  }

  if (targetUser.role === 'admin' && targetUser.status === 'active') {
    const adminCount = await countStaffAdmins();
    if (adminCount <= 1) {
      const error = new Error('Cannot delete the last active admin.');
      error.statusCode = 400;
      throw error;
    }
  }
}

function sendJson(response, statusCode, payload) {
  if (typeof response.status === 'function') {
    response.status(statusCode).json(payload);
    return;
  }
  response.writeHead(statusCode, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(payload));
}

function parseJsonBody(body) {
  if (!body) return {};
  if (typeof body === 'object') return body;
  try {
    return JSON.parse(body);
  } catch {
    const error = new Error('Invalid JSON body.');
    error.statusCode = 400;
    throw error;
  }
}

function parseAuthPath(urlPath = '') {
  const normalized = String(urlPath || '').split('?')[0].replace(/\/+$/, '');
  const prefix = '/api/auth';
  if (normalized === prefix) return { kind: 'root' };
  if (!normalized.startsWith(`${prefix}/`)) return { kind: 'unknown' };
  const remainder = normalized.slice(prefix.length + 1);
  const segments = remainder.split('/').filter(Boolean);
  if (!segments.length) return { kind: 'root' };
  if (segments[0] === 'login' && segments.length === 1) return { kind: 'login' };
  if (segments[0] === 'logout' && segments.length === 1) return { kind: 'logout' };
  if (segments[0] === 'me' && segments.length === 1) return { kind: 'me' };
  if (segments[0] === 'set-password' && segments.length === 1) return { kind: 'set-password' };
  if (segments[0] === 'users' && segments.length === 1) return { kind: 'users-list' };
  if (segments[0] === 'users' && segments.length === 2) {
    return { kind: 'users-item', userId: segments[1] };
  }
  if (segments[0] === 'users' && segments.length === 3 && segments[2] === 'reset-password') {
    return { kind: 'users-reset-password', userId: segments[1] };
  }
  return { kind: 'unknown' };
}

async function resolveStaffUser(request) {
  const sessionId = getSessionIdFromRequest(request);
  if (!sessionId) return null;
  const user = await getStaffUserBySessionId(sessionId);
  if (!user || user.status !== 'active') return null;
  return user;
}

async function requireActiveStaff(request) {
  const user = await resolveStaffUser(request);
  if (!user) {
    const error = new Error('Unauthorized.');
    error.statusCode = 401;
    throw error;
  }
  return user;
}

async function requireAdminStaff(request) {
  const user = await requireActiveStaff(request);
  if (user.role !== 'admin') {
    const error = new Error('Admin access required.');
    error.statusCode = 403;
    throw error;
  }
  return user;
}

function buildPasswordSetupUrl(request, token) {
  const headers = request.headers || {};
  const host = headers['x-forwarded-host'] || headers.host || 'localhost:3000';
  const proto = headers['x-forwarded-proto'] || 'http';
  const origin = process.env.APP_ORIGIN || `${proto}://${host}`;
  return `${origin.replace(/\/+$/, '')}/login?token=${encodeURIComponent(token)}`;
}

async function handleAuthRequest(request, response) {
  const method = request.method || 'GET';
  const pathInfo = parseAuthPath(request.url || request.path || '/api/auth');

  try {
    requireDatabase();

    if (pathInfo.kind === 'login') {
      if (method !== 'POST') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      const body = parseJsonBody(request.body);
      const email = normalizeEmail(body.email);
      const password = String(body.password || '');
      const user = await getStaffUserByEmail(email);
      if (!user || user.status !== 'active' || !user.password_hash) {
        sendJson(response, 401, { error: 'Invalid email or password.' });
        return;
      }
      const valid = await verifyPassword(password, user.password_hash);
      if (!valid) {
        sendJson(response, 401, { error: 'Invalid email or password.' });
        return;
      }
      const session = await createStaffSession(user.id);
      await touchStaffLogin(user.id);
      setSessionCookie(response, session.id, request);
      sendJson(response, 200, { user: toPublicStaffUser(user) });
      return;
    }

    if (pathInfo.kind === 'logout') {
      if (method !== 'POST') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      const sessionId = getSessionIdFromRequest(request);
      await deleteStaffSession(sessionId);
      clearSessionCookie(response);
      sendJson(response, 200, { ok: true });
      return;
    }

    if (pathInfo.kind === 'me') {
      if (method !== 'GET') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      const user = await resolveStaffUser(request);
      if (!user) {
        sendJson(response, 401, { error: 'Unauthorized.' });
        return;
      }
      sendJson(response, 200, { user: toPublicStaffUser(user) });
      return;
    }

    if (pathInfo.kind === 'set-password') {
      if (method !== 'POST') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      const body = parseJsonBody(request.body);
      const token = String(body.token || '').trim();
      const password = String(body.password || '');
      const confirm = String(body.confirmPassword || body.confirm || '');
      if (!token || password.length < 8) {
        sendJson(response, 400, { error: 'Password must be at least 8 characters.' });
        return;
      }
      if (password !== confirm) {
        sendJson(response, 400, { error: 'Passwords do not match.' });
        return;
      }
      const { user, tokenRow } = await consumePasswordToken(token, null);
      if (!['set_password', 'reset_password'].includes(tokenRow.purpose)) {
        sendJson(response, 400, { error: 'Invalid password link.' });
        return;
      }
      await setStaffPassword(user.id, password);
      await updateStaffUser(user.id, {
        status: 'active',
        approvedAt: new Date().toISOString(),
      });
      sendJson(response, 200, { ok: true });
      return;
    }

    if (pathInfo.kind === 'users-list') {
      if (method === 'GET') {
        await requireAdminStaff(request);
        const users = await listStaffUsers();
        sendJson(response, 200, { users });
        return;
      }
      if (method === 'POST') {
        const admin = await requireAdminStaff(request);
        const body = parseJsonBody(request.body);
        const email = normalizeEmail(body.email);
        const name = String(body.name || '').trim();
        const role = body.role === 'admin' ? 'admin' : 'member';
        if (!email) {
          sendJson(response, 400, { error: 'Email is required.' });
          return;
        }
        const existing = await getStaffUserByEmail(email);
        if (existing) {
          sendJson(response, 409, { error: 'A user with this email already exists.' });
          return;
        }
        const user = await createStaffUser({
          email,
          name,
          role,
          status: 'pending',
          approvedBy: admin.id,
        });
        const tokenInfo = await createPasswordToken(user.id, 'set_password');
        const setupUrl = buildPasswordSetupUrl(request, tokenInfo.token);
        sendJson(response, 201, {
          user: toPublicStaffUser(user),
          setupUrl,
          setupExpiresAt: tokenInfo.expiresAt,
        });
        return;
      }
      sendJson(response, 405, { error: 'Method not allowed' });
      return;
    }

    if (pathInfo.kind === 'users-item') {
      const admin = await requireAdminStaff(request);
      const targetUser = await getStaffUserById(pathInfo.userId);
      if (!targetUser) {
        sendJson(response, 404, { error: 'User not found.' });
        return;
      }

      if (method === 'DELETE') {
        await assertCanDeleteStaffUser(admin, targetUser);
        await deleteStaffUser(pathInfo.userId);
        sendJson(response, 200, { ok: true });
        return;
      }

      if (method !== 'PATCH') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }

      const body = parseJsonBody(request.body);
      const patch = {};
      if (body.name !== undefined) patch.name = body.name;
      if (body.role !== undefined) patch.role = body.role === 'admin' ? 'admin' : 'member';
      if (body.status !== undefined) {
        if (!['pending', 'active', 'disabled'].includes(body.status)) {
          sendJson(response, 400, { error: 'Invalid status.' });
          return;
        }
        patch.status = body.status;
        if (body.status === 'active') {
          patch.approvedAt = new Date().toISOString();
          patch.approvedBy = admin.id;
        }
      }
      await assertCanChangeAdminAccess(targetUser, patch);
      const updated = await updateStaffUser(pathInfo.userId, patch);
      sendJson(response, 200, { user: toPublicStaffUser(updated) });
      return;
    }

    if (pathInfo.kind === 'users-reset-password') {
      if (method !== 'POST') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      await requireAdminStaff(request);
      const user = await getStaffUserById(pathInfo.userId);
      if (!user) {
        sendJson(response, 404, { error: 'User not found.' });
        return;
      }
      const tokenInfo = await createPasswordToken(user.id, 'reset_password');
      const setupUrl = buildPasswordSetupUrl(request, tokenInfo.token);
      sendJson(response, 200, {
        setupUrl,
        setupExpiresAt: tokenInfo.expiresAt,
      });
      return;
    }

    sendJson(response, 404, { error: 'Not found' });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error.message || 'Request failed.',
    });
  }
}

module.exports = {
  handleAuthRequest,
  parseAuthPath,
  resolveStaffUser,
  requireActiveStaff,
  requireAdminStaff,
};
