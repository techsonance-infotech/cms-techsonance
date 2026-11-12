import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/server/http/errors';
import { getAdminRouteSupabase, resolveTenantId } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant information required');

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let query = supabase
    .from('wellness_programs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('schedule_date', { ascending: true });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: dbPrograms, error } = await query;
  if (error) throw new BadRequestError(error.message);

  // Sync actual enrolled counts from active appointments
  const { data: apptCounts } = await supabase
    .from('wellness_appointments')
    .select('program_id')
    .eq('tenant_id', tenantId)
    .not('program_id', 'is', null)
    .neq('status', 'Cancelled');

  const countMap = new Map<string, number>();
  (apptCounts || []).forEach((a: any) => {
    if (a.program_id) {
      countMap.set(a.program_id, (countMap.get(a.program_id) || 0) + 1);
    }
  });

  const programs = (dbPrograms || []).map((p: any) => ({
    ...p,
    enrolled_count: countMap.get(p.id) ?? p.enrolled_count ?? 0
  }));

  return NextResponse.json({
    success: true,
    data: programs
  });
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const userRole = (user.role || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const canApprove = ['admin', 'hr_manager', 'project_manager'].includes(userRole);

  if (!canApprove) {
    throw new ForbiddenError('Only administrators and HR managers can create wellness programs');
  }

  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant information required');

  const body = await request.json();
  const {
    title,
    category = 'Health Checkups',
    description,
    scheduleDate,
    location = 'Onsite Clinic / Tele-Health',
    capacity = 100,
    status = 'Active'
  } = body;

  if (!title || !description) {
    throw new BadRequestError('Title and description are required');
  }

  const { data, error } = await supabase
    .from('wellness_programs')
    .insert({
      tenant_id: tenantId,
      title: title.trim(),
      category: category.trim(),
      description: description.trim(),
      schedule_date: scheduleDate ? new Date(scheduleDate).toISOString() : new Date().toISOString(),
      location: location.trim(),
      capacity: Number(capacity) || 100,
      enrolled_count: 0,
      status: status.trim()
    })
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);

  return NextResponse.json({
    success: true,
    message: 'Wellness program created successfully',
    data
  }, { status: 201 });
}, { requireAuth: true });

export const PATCH = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const userRole = (user.role || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const canApprove = ['admin', 'hr_manager', 'project_manager'].includes(userRole);

  if (!canApprove) {
    throw new ForbiddenError('Only administrators and HR managers can update wellness programs');
  }

  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant information required');

  const body = await request.json();
  const { id, title, category, description, scheduleDate, location, capacity, status, enrolledCount } = body;

  if (!id) throw new BadRequestError('Program ID is required');

  const updates: Record<string, any> = {};
  if (title !== undefined) updates.title = title.trim();
  if (category !== undefined) updates.category = category.trim();
  if (description !== undefined) updates.description = description.trim();
  if (scheduleDate !== undefined) updates.schedule_date = new Date(scheduleDate).toISOString();
  if (location !== undefined) updates.location = location.trim();
  if (capacity !== undefined) updates.capacity = Number(capacity);
  if (status !== undefined) updates.status = status.trim();
  if (enrolledCount !== undefined) updates.enrolled_count = Number(enrolledCount);

  const { data, error } = await supabase
    .from('wellness_programs')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);
  if (!data) throw new NotFoundError('Wellness program not found');

  return NextResponse.json({
    success: true,
    message: 'Wellness program updated successfully',
    data
  });
}, { requireAuth: true });

export const DELETE = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const userRole = (user.role || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const canApprove = ['admin', 'hr_manager', 'project_manager'].includes(userRole);

  if (!canApprove) {
    throw new ForbiddenError('Only administrators and HR managers can delete wellness programs');
  }

  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant information required');

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) throw new BadRequestError('Program ID is required');

  const { error } = await supabase
    .from('wellness_programs')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId);

  if (error) throw new BadRequestError(error.message);

  return NextResponse.json({
    success: true,
    message: 'Wellness program deleted successfully'
  });
}, { requireAuth: true });

