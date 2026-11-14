import test from 'node:test';
import assert from 'node:assert/strict';

// Simulated tenant authorization logic reflecting src/app/api/tenants/route.ts
function authorizeTenantRead(user) {
  const isSuperAdmin = user.role === 'SuperAdmin';
  if (isSuperAdmin) {
    return { scope: 'all' };
  }
  if (!user.tenantId) {
    throw new Error('Tenant ID not found in session');
  }
  return { scope: 'single', tenantId: user.tenantId };
}

function authorizeTenantUpdate(user, targetTenantId, updates) {
  const isSuperAdmin = user.role === 'SuperAdmin';
  if (!isSuperAdmin) {
    if (targetTenantId !== user.tenantId) {
      throw new Error('Forbidden: You can only update your own organization');
    }
    if (updates.status !== undefined) {
      throw new Error('Forbidden: Only SuperAdmins can alter organization status');
    }
  }
  return { allowed: true };
}

function authorizeTenantDelete(user) {
  if (user.role !== 'SuperAdmin') {
    throw new Error('Forbidden: Only SuperAdmin can delete organizations');
  }
  return { allowed: true };
}

test('Tenants: SuperAdmin can view all tenants; Tenant Admin sees only self', () => {
  const superAdmin = { role: 'SuperAdmin', tenantId: 'tenant-1' };
  const tenantAdmin = { role: 'Admin', tenantId: 'tenant-1' };

  assert.deepEqual(authorizeTenantRead(superAdmin), { scope: 'all' });
  assert.deepEqual(authorizeTenantRead(tenantAdmin), { scope: 'single', tenantId: 'tenant-1' });
});

test('Tenants: Non-superadmin cannot update other organizations', () => {
  const tenantAdmin = { role: 'Admin', tenantId: 'tenant-1' };

  assert.throws(
    () => authorizeTenantUpdate(tenantAdmin, 'tenant-2', { name: 'Compromised Org' }),
    /Forbidden: You can only update your own organization/
  );
});

test('Tenants: Non-superadmin cannot modify organization status', () => {
  const tenantAdmin = { role: 'Admin', tenantId: 'tenant-1' };

  assert.throws(
    () => authorizeTenantUpdate(tenantAdmin, 'tenant-1', { status: 'active' }),
    /Forbidden: Only SuperAdmins can alter organization status/
  );
});

test('Tenants: Non-superadmin cannot delete any organization', () => {
  const tenantAdmin = { role: 'Admin', tenantId: 'tenant-1' };
  const superAdmin = { role: 'SuperAdmin', tenantId: 'tenant-1' };

  assert.throws(
    () => authorizeTenantDelete(tenantAdmin),
    /Forbidden: Only SuperAdmin can delete organizations/
  );
  assert.equal(authorizeTenantDelete(superAdmin).allowed, true);
});
