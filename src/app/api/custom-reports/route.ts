import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const supabase = getAdminRouteSupabase();

  // Query primary tables counts for cross-module mapping
  const { count: employeesCount } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  const { count: projectsCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  const { count: tasksCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  const { count: invoicesCount } = await supabase
    .from('saas_invoices')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  const { count: ticketsCount } = await supabase
    .from('helpdesk_tickets')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  const { count: complianceCount } = await supabase
    .from('compliance_items')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  return NextResponse.json({
    success: true,
    modules: {
      employees: employeesCount || 0,
      projects: projectsCount || 0,
      tasks: tasksCount || 0,
      invoices: invoicesCount || 0,
      tickets: ticketsCount || 0,
      compliance: complianceCount || 0
    },
    reportsQueue: [
      { name: 'Unified Workforce Cost Summary', module: 'HR & Payroll', author: 'System Job', format: 'CSV' },
      { name: 'Resource Allocation Matrix', module: 'PSA Projects', author: 'PMO Lead', format: 'CSV' },
      { name: 'Accounts Outstanding collections', module: 'Finance Accounts', author: 'AI Audit Engine', format: 'CSV' },
      { name: 'Compliance Upload Progression', module: 'DMS Verification', author: 'Auditor Bot', format: 'CSV' }
    ]
  });
}, { requireAuth: true, roles: ['Manager'] });
