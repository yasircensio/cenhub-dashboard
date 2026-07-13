const assert = require('assert');
const {
  hashPassword,
  verifyPassword,
  hashToken,
  generateToken,
  toPublicStaffUser,
} = require('../lib/session');

async function testPasswordHashing() {
  const hash = await hashPassword('test-password-123');
  assert(hash && hash.startsWith('$2'), 'bcrypt hash expected');
  assert(await verifyPassword('test-password-123', hash), 'valid password should verify');
  assert(!(await verifyPassword('wrong-password', hash)), 'invalid password should fail');
}

function testTokenHashing() {
  const token = generateToken();
  assert(token.length >= 32, 'token should be long');
  const a = hashToken(token);
  const b = hashToken(token);
  assert(a === b, 'token hash should be stable');
  assert(a !== token, 'hash should not equal raw token');
}

function testPublicUser() {
  const user = toPublicStaffUser({
    id: '1',
    email: 'admin@cenhub.dk',
    name: 'Admin',
    role: 'admin',
    status: 'active',
    password_hash: 'hash',
    created_at: '2026-01-01T00:00:00.000Z',
    approved_at: null,
    last_login_at: null,
  });
  assert.strictEqual(user.email, 'admin@cenhub.dk');
  assert.strictEqual(user.hasPassword, true);
  assert.strictEqual(user.password_hash, undefined);
}

async function main() {
  await testPasswordHashing();
  testTokenHashing();
  testPublicUser();
  console.log('Staff auth unit tests passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
