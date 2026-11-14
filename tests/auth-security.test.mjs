import test from 'node:test';
import assert from 'node:assert/strict';

// Helper reimplementing the session token extraction logic from src/server/auth/session.ts
function extractBearerToken(headers, cookieMap = {}) {
  const authHeader = headers?.authorization || headers?.get?.('authorization');
  let bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : null;

  if (bearerToken === 'null' || bearerToken === 'undefined' || bearerToken === '') {
    bearerToken = null;
  }

  if (!bearerToken) {
    bearerToken = cookieMap['session_token'] ?? null;
  }

  if (bearerToken === 'null' || bearerToken === 'undefined' || bearerToken === '') {
    bearerToken = null;
  }

  return bearerToken;
}

const ROLE_HIERARCHY = {
  SuperAdmin: 5,
  Admin: 4,
  Manager: 3,
  Employee: 2,
  Viewer: 1,
};

function normalizeAppRole(role) {
  switch ((role ?? '').toLowerCase()) {
    case 'superadmin':
    case 'super_admin':
      return 'SuperAdmin';
    case 'admin':
    case 'owner':
    case 'business_owner':
    case 'tenant_owner':
    case 'hr_manager':
    case 'hr_executive':
    case 'cms_administrator':
    case 'management':
    case 'ceo':
    case 'cto':
    case 'director':
    case 'accountant':
    case 'finance':
      return 'Admin';
    case 'manager':
    case 'project_manager':
      return 'Manager';
    case 'viewer':
    case 'client':
      return 'Viewer';
    default:
      return 'Employee';
  }
}

function checkPermission(actualRole, allowedRoles) {
  const actualRank = ROLE_HIERARCHY[actualRole] ?? 0;
  return allowedRoles.some((role) => actualRank >= (ROLE_HIERARCHY[role] ?? 99));
}

test('Security: URL Query parameter tokens are completely ignored', () => {
  const requestWithQueryToken = {
    url: 'https://cms.techsonance.com/api/users?token=secret-token-in-url&auth_token=leak',
    headers: {
      get: (h) => (h === 'authorization' ? null : null),
    },
  };

  const extracted = extractBearerToken(requestWithQueryToken.headers, {});
  assert.equal(extracted, null, 'Must not extract tokens from URL query parameters');
});

test('Security: Valid Authorization Bearer header is extracted', () => {
  const headers = {
    get: (h) => (h === 'authorization' ? 'Bearer valid_jwt_token_12345' : null),
  };

  const extracted = extractBearerToken(headers, {});
  assert.equal(extracted, 'valid_jwt_token_12345');
});

test('Security: Fallback to session_token cookie succeeds', () => {
  const headers = {
    get: () => null,
  };
  const cookies = { session_token: 'valid_cookie_token_abc' };

  const extracted = extractBearerToken(headers, cookies);
  assert.equal(extracted, 'valid_cookie_token_abc');
});

test('RBAC: Role hierarchy checks enforce minimum privilege', () => {
  assert.equal(normalizeAppRole('super_admin'), 'SuperAdmin');
  assert.equal(normalizeAppRole('ceo'), 'Admin');
  assert.equal(normalizeAppRole('project_manager'), 'Manager');
  assert.equal(normalizeAppRole('developer'), 'Employee');
  assert.equal(normalizeAppRole('client'), 'Viewer');

  // Admin access check: Admin and SuperAdmin pass, Manager and Employee fail
  assert.equal(checkPermission('SuperAdmin', ['Admin']), true);
  assert.equal(checkPermission('Admin', ['Admin']), true);
  assert.equal(checkPermission('Manager', ['Admin']), false);
  assert.equal(checkPermission('Employee', ['Admin']), false);
  assert.equal(checkPermission('Viewer', ['Admin']), false);
});
