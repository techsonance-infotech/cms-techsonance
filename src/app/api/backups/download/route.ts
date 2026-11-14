import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { BadRequestError, NotFoundError } from '@/server/http/errors';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get('file');
  if (!fileName) throw new BadRequestError('File parameter is required');

  const supabase = getAdminRouteSupabase();

  // Verify backup record belongs to caller's tenant
  const { data: backupRecord, error } = await supabase
    .from('tenant_backups')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('file_name', fileName)
    .single();

  if (error || !backupRecord) {
    throw new NotFoundError('Backup file not found for this organization');
  }

  // Compile real live tenant data bundle for download
  const [
    { data: companyData },
    { data: employeesData },
    { data: clientsData },
    { data: projectsData },
    { data: tasksData },
  ] = await Promise.all([
    supabase.from('company_settings').select('*').eq('tenant_id', tenantId).maybeSingle(),
    supabase.from('employees').select('id, employee_id, department, designation, status, date_of_joining').eq('tenant_id', tenantId),
    supabase.from('clients').select('id, company_name, contact_person, email, status').eq('tenant_id', tenantId),
    supabase.from('projects').select('id, name, status, budget').eq('tenant_id', tenantId),
    supabase.from('tasks').select('id, title, status, priority_level').eq('tenant_id', tenantId),
  ]);

  const exportPayload = {
    tenantId,
    backupId: backupRecord.id,
    fileName: backupRecord.file_name,
    exportedAt: backupRecord.created_at || new Date().toISOString(),
    data: {
      settings: companyData || {},
      employees: employeesData || [],
      clients: clientsData || [],
      projects: projectsData || [],
      tasks: tasksData || [],
    },
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);

  return new NextResponse(jsonString, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  });
}, { requireAuth: true, roles: ['Admin', 'SuperAdmin'] });
