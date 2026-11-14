import test from 'node:test';
import assert from 'node:assert/strict';

function validateInvoiceDeletion(userRole, invoice) {
  const allowedRoles = ['Admin', 'SuperAdmin'];
  if (!allowedRoles.includes(userRole)) {
    throw new Error('Forbidden: Only Admins can delete invoices');
  }

  if (invoice.status === 'paid') {
    throw new Error('BadRequest: Paid invoices cannot be deleted for accounting and compliance integrity');
  }

  return { success: true };
}

test('Invoices: Employees and non-admins cannot delete invoices', () => {
  const draftInvoice = { id: 'inv-1', status: 'draft', tenantId: 'tenant-1' };

  assert.throws(
    () => validateInvoiceDeletion('Employee', draftInvoice),
    /Forbidden: Only Admins can delete invoices/
  );
  assert.throws(
    () => validateInvoiceDeletion('Manager', draftInvoice),
    /Forbidden: Only Admins can delete invoices/
  );
  assert.throws(
    () => validateInvoiceDeletion('Viewer', draftInvoice),
    /Forbidden: Only Admins can delete invoices/
  );
});

test('Invoices: Paid invoices cannot be deleted even by Admins', () => {
  const paidInvoice = { id: 'inv-2', status: 'paid', tenantId: 'tenant-1' };

  assert.throws(
    () => validateInvoiceDeletion('Admin', paidInvoice),
    /Paid invoices cannot be deleted for accounting and compliance integrity/
  );
  assert.throws(
    () => validateInvoiceDeletion('SuperAdmin', paidInvoice),
    /Paid invoices cannot be deleted for accounting and compliance integrity/
  );
});

test('Invoices: Draft or unpaid invoice can be deleted by Admin', () => {
  const draftInvoice = { id: 'inv-3', status: 'draft', tenantId: 'tenant-1' };
  const result = validateInvoiceDeletion('Admin', draftInvoice);
  assert.equal(result.success, true);
});
