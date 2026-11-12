import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/server/http/errors';
import { getAdminRouteSupabase, resolveTenantId } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant information required');

  const user = context.auth!.user;
  const userRole = (user.role || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const canApprove = ['admin', 'hr_manager', 'project_manager'].includes(userRole);

  if (!canApprove) {
    throw new ForbiddenError('Only administrators can view program participant rosters');
  }

  const { searchParams } = new URL(request.url);
  const programId = searchParams.get('programId');

  if (!programId) {
    throw new BadRequestError('Program ID is required');
  }

  // 1. Fetch Program Info
  const { data: program, error: progErr } = await supabase
    .from('wellness_programs')
    .select('*')
    .eq('id', programId)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (progErr || !program) {
    throw new NotFoundError('Wellness program not found');
  }

  // 2. Fetch Users in Tenant
  let usersList: any[] = [];
  try {
    const { data: uData } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role')
      .eq('tenant_id', tenantId);
    if (uData) usersList = uData;
  } catch (err) {
    console.warn('Users fetch error in participants:', err);
  }
  const userMap = new Map(usersList.map((u: any) => [u.id, u]));

  // 3. Fetch Employees in Tenant
  let employeesList: any[] = [];
  try {
    const { data: eData } = await supabase
      .from('employees')
      .select('id, user_id, department, designation')
      .eq('tenant_id', tenantId);
    if (eData) employeesList = eData;
  } catch (err) {
    console.warn('Employees fetch error in participants:', err);
  }
  const empMap = new Map(employeesList.map((e: any) => [e.user_id, e]));

  // 4. Fetch Registered Appointments for this Program
  const { data: appts, error: apptsErr } = await supabase
    .from('wellness_appointments')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('program_id', programId)
    .order('created_at', { ascending: false });

  if (apptsErr) throw new BadRequestError(apptsErr.message);

  const participants = (appts || []).map((a: any) => {
    const u = userMap.get(a.user_id);
    const emp = empMap.get(a.user_id);
    const fullName = u
      ? `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email
      : 'Employee';

    return {
      appointmentId: a.id,
      userId: a.user_id,
      name: fullName,
      email: u?.email || 'N/A',
      department: emp?.department || 'General',
      designation: emp?.designation || (u?.role ? u.role.toUpperCase() : 'Staff Member'),
      status: a.status || 'Scheduled',
      appointmentDate: a.appointment_date,
      registeredAt: a.created_at,
      doctorCounselorName: a.doctor_counselor_name || 'Pending Admin Assignment',
      notes: a.notes || ''
    };
  });

  const activeCount = participants.filter((p: any) => p.status !== 'Cancelled').length;

  return NextResponse.json({
    success: true,
    program: {
      id: program.id,
      title: program.title,
      category: program.category,
      capacity: program.capacity,
      enrolledCount: activeCount,
      status: program.status,
      scheduleDate: program.schedule_date,
      location: program.location
    },
    totalParticipants: activeCount,
    participants
  });
}, { requireAuth: true });

export const DELETE = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant information required');

  const user = context.auth!.user;
  const userRole = (user.role || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const canApprove = ['admin', 'hr_manager', 'project_manager'].includes(userRole);

  if (!canApprove) {
    throw new ForbiddenError('Only administrators can remove participants from programs');
  }

  const { searchParams } = new URL(request.url);
  const appointmentId = searchParams.get('appointmentId');

  if (!appointmentId) {
    throw new BadRequestError('Appointment ID is required');
  }

  const { data: existing, error: fetchErr } = await supabase
    .from('wellness_appointments')
    .select('id, program_id, user_id')
    .eq('id', appointmentId)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (fetchErr || !existing) {
    throw new NotFoundError('Registration record not found');
  }

  const { error: delErr } = await supabase
    .from('wellness_appointments')
    .delete()
    .eq('id', appointmentId)
    .eq('tenant_id', tenantId);

  if (delErr) throw new BadRequestError(delErr.message);

  // Recalculate and update enrolled count on program
  if (existing.program_id) {
    const { count: actualCount } = await supabase
      .from('wellness_appointments')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('program_id', existing.program_id)
      .neq('status', 'Cancelled');

    await supabase
      .from('wellness_programs')
      .update({ enrolled_count: actualCount || 0 })
      .eq('id', existing.program_id)
      .eq('tenant_id', tenantId);
  }

  return NextResponse.json({
    success: true,
    message: 'Participant registration removed successfully'
  });
}, { requireAuth: true });

