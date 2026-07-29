import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, NotFoundError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { z } from 'zod';

const staffingRequestSchema = z.object({
  projectId: z.coerce.number().int().positive().optional().nullable(),
  projectName: z.string().trim().min(1).max(255),
  roleRequested: z.string().trim().min(1).max(255),
  skillsRequired: z.string().trim().optional().nullable(),
  seniority: z.string().trim().default('Senior'),
  duration: z.string().trim().default('6 months'),
});

export const GET = withApiHandler(async (request, context) => {
  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('staffing_requests')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return NextResponse.json({
    success: true,
    data: data || [],
    message: 'Staffing requests fetched successfully',
  });
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const payload = staffingRequestSchema.parse(await request.json());

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('staffing_requests')
    .insert({
      tenant_id: tenantId,
      project_id: payload.projectId || null,
      project_name: payload.projectName,
      role_requested: payload.roleRequested,
      skills_required: payload.skillsRequired || null,
      seniority: payload.seniority,
      duration: payload.duration,
      status: 'Pending',
    })
    .select('*')
    .single();

  if (error || !data) throw error || new Error('Failed to create staffing request');

  return NextResponse.json({
    success: true,
    data,
    message: 'Staffing request submitted successfully',
  }, { status: 201 });
}, { requireAuth: true, roles: ['Employee'] });

export const PATCH = withApiHandler(async (request, context) => {
  const searchParams = new URL(request.url).searchParams;
  const id = searchParams.get('id');
  if (!id) throw new BadRequestError('Request ID is required');

  const { status } = z.object({ status: z.enum(['Approved', 'Rejected']) }).parse(await request.json());

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');

  const supabase = getAdminRouteSupabase();

  // Confirm request exists and matches tenant
  const { data: existing, error: existErr } = await supabase
    .from('staffing_requests')
    .select('id')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();

  if (existErr || !existing) throw new NotFoundError('Staffing request not found');

  const { data, error } = await supabase
    .from('staffing_requests')
    .update({ status })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error || !data) throw error || new Error('Failed to update staffing request');

  return NextResponse.json({
    success: true,
    data,
    message: `Staffing request status updated to ${status}`,
  });
}, { requireAuth: true, roles: ['Manager'] });
