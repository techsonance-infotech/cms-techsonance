import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { assetRequestSchema } from '@/server/validation/assets';

export const GET = withApiHandler(async (request, context) => {
  let tenantId = context.auth?.user.tenantId;
  const supabase = getAdminRouteSupabase();

  if (!tenantId && context.auth?.user.id) {
    const { data: u } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', context.auth.user.id)
      .single();
    if (u?.tenant_id) tenantId = u.tenant_id;
  }
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const searchParams = new URL(request.url).searchParams;
  const employeeId = searchParams.get('employeeId');

  let query = supabase
    .from('asset_requests')
    .select('*, asset_categories(*)')
    .eq('tenant_id', tenantId);

  if (employeeId) {
    query = query.eq('employee_id', Number(employeeId));
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new BadRequestError(error.message);

  // Enrich with employee & user info
  const { data: emps } = await supabase
    .from('employees')
    .select('id, employee_id, department, designation, user_id')
    .eq('tenant_id', tenantId);

  const { data: users } = await supabase
    .from('users')
    .select('id, first_name, last_name, email')
    .eq('tenant_id', tenantId);

  const userMap = new Map<string, any>((users || []).map((u: any) => [u.id, u]));
  const empMap = new Map<number, any>((emps || []).map((e: any) => [e.id, {
    ...e,
    user: userMap.get(e.user_id)
  }]));

  const enriched = (data || []).map((req: any) => {
    const emp: any = empMap.get(req.employee_id);
    const user: any = emp?.user;
    const requesterName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : (emp?.employee_id ? `Employee (${emp.employee_id})` : `Employee #${req.employee_id}`);
    return {
      ...req,
      requester_name: requesterName,
      requester_department: emp?.department || 'Operations',
      requester_designation: emp?.designation || 'Staff',
      requester_code: emp?.employee_id || ''
    };
  });

  return NextResponse.json(enriched);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  let tenantId = context.auth?.user.tenantId;
  const supabase = getAdminRouteSupabase();

  if (!tenantId && context.auth?.user.id) {
    const { data: u } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', context.auth.user.id)
      .single();
    if (u?.tenant_id) tenantId = u.tenant_id;
  }
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const body = await request.json();
  const validated = assetRequestSchema.parse(body);

  const { data, error } = await supabase
    .from('asset_requests')
    .insert({
      tenant_id: tenantId,
      employee_id: validated.employeeId,
      category_id: validated.categoryId,
      reason: validated.reason,
      status: 'pending',
    })
    .select('*, asset_categories(*)')
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

export const PUT = withApiHandler(async (request, context) => {
  let tenantId = context.auth?.user.tenantId;
  const supabase = getAdminRouteSupabase();

  if (!tenantId && context.auth?.user.id) {
    const { data: u } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', context.auth.user.id)
      .single();
    if (u?.tenant_id) tenantId = u.tenant_id;
  }
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const body = await request.json();
  const { id, status, managerComments } = body;
  if (!id || !status) throw new BadRequestError('id and status are required');

  const { data, error } = await supabase
    .from('asset_requests')
    .update({
      status,
      manager_comments: managerComments,
    })
    .eq('id', Number(id))
    .eq('tenant_id', tenantId)
    .select('*, asset_categories(*)')
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });
