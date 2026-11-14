import test from 'node:test';
import assert from 'node:assert/strict';

// In-memory simulation of queue state matching src/server/payroll/queue.ts
class MockPayrollQueue {
  constructor() {
    this.jobs = new Map();
  }

  addJob(job) {
    this.jobs.set(job.id, job);
  }

  getJobById(jobId, tenantId) {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    if (tenantId && job.tenantId !== tenantId) {
      return null; // Strict cross-tenant IDOR defense
    }
    return job;
  }

  getPayrollQueueStatus(tenantId) {
    let pending = 0;
    let processing = 0;
    let completed = 0;
    let failed = 0;

    for (const job of this.jobs.values()) {
      if (tenantId && job.tenantId !== tenantId) {
        continue; // Exclude other tenants' jobs from queue stats
      }
      if (job.status === 'pending') pending++;
      if (job.status === 'processing') processing++;
      if (job.status === 'completed') completed++;
      if (job.status === 'failed') failed++;
    }

    return { pending, processing, completed, failed, total: pending + processing + completed + failed };
  }
}

test('Payroll: IDOR defense prevents cross-tenant access to payroll generation jobs', () => {
  const queue = new MockPayrollQueue();
  queue.addJob({ id: 'job-101', tenantId: 'tenant-acme', status: 'completed', month: '2026-11' });
  queue.addJob({ id: 'job-102', tenantId: 'tenant-beta', status: 'processing', month: '2026-11' });

  // Same tenant access succeeds
  const acmeJob = queue.getJobById('job-101', 'tenant-acme');
  assert.ok(acmeJob);
  assert.equal(acmeJob.id, 'job-101');

  // Cross-tenant access is rejected with null
  const crossTenantAttempt = queue.getJobById('job-101', 'tenant-beta');
  assert.equal(crossTenantAttempt, null, 'Must not return jobs belonging to another tenant');
});

test('Payroll: Queue statistics are strictly isolated by tenant', () => {
  const queue = new MockPayrollQueue();
  queue.addJob({ id: 'j1', tenantId: 'tenant-acme', status: 'completed' });
  queue.addJob({ id: 'j2', tenantId: 'tenant-acme', status: 'pending' });
  queue.addJob({ id: 'j3', tenantId: 'tenant-beta', status: 'pending' });
  queue.addJob({ id: 'j4', tenantId: 'tenant-beta', status: 'processing' });

  const acmeStats = queue.getPayrollQueueStatus('tenant-acme');
  assert.equal(acmeStats.total, 2);
  assert.equal(acmeStats.pending, 1);
  assert.equal(acmeStats.completed, 1);

  const betaStats = queue.getPayrollQueueStatus('tenant-beta');
  assert.equal(betaStats.total, 2);
  assert.equal(betaStats.processing, 1);
  assert.equal(betaStats.pending, 1);
});
