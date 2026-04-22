import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, NotFoundError } from '@/server/http/errors';
import { apiSuccess } from '@/server/http/response';
import { getAdminRouteSupabase, getCurrentSupabaseActor, buildLegacyUserIdMap } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const searchParams = new URL(request.url).searchParams;
  const employeeId = searchParams.get('employeeId');

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');

  const supabase = getAdminRouteSupabase();
  let query = supabase.from('employee_documents').select('*').eq('tenant_id', tenantId).order('uploaded_at', { ascending: false });

  if (employeeId) {
    if (!Number.isInteger(Number(employeeId))) throw new BadRequestError('Valid employeeId is required');
    query = query.eq('employee_id', Number(employeeId));
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return NextResponse.json({
    success: true,
    data: data,
    message: 'Documents retrieved successfully',
  });
}, { requireAuth: true, roles: ['Manager', 'Admin', 'Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const payload = await request.json();

  if (!payload.employeeId || !payload.documentType || !payload.name || !payload.fileUrl) {
    throw new BadRequestError('employeeId, documentType, name, and fileUrl are required');
  }

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');

  const actor = await getCurrentSupabaseActor(accessToken);

  const supabase = getAdminRouteSupabase();
  
  // Verify employee exists
  const { data: employeeData, error: employeeError } = await supabase
    .from('employees')
    .select('id')
    .eq('id', payload.employeeId)
    .eq('tenant_id', tenantId)
    .single();

  if (employeeError || !employeeData) {
    throw new NotFoundError('Employee not found');
  }

  const { data, error } = await supabase.from('employee_documents').insert({
    tenant_id: tenantId,
    employee_id: payload.employeeId,
    document_type: payload.documentType,
    name: payload.name,
    file_url: payload.fileUrl,
    uploaded_by: actor.id,
  }).select('*').single();

  if (error || !data) throw error ? new Error(error.message) : new Error('Failed to create document record');

  return NextResponse.json(data, { status: 201 });
}, { requireAuth: true, roles: ['Manager', 'Admin'] });

export const DELETE = withApiHandler(async (request, context) => {
  const searchParams = new URL(request.url).searchParams;
  const id = searchParams.get('id');

  if (!id || !Number.isInteger(Number(id))) {
    throw new BadRequestError('Valid document id is required');
  }

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase.from('employee_documents').delete()
    .eq('id', Number(id))
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new NotFoundError('Document not found');

  return apiSuccess(data, 'Document deleted successfully');
}, { requireAuth: true, roles: ['Manager', 'Admin'] });
