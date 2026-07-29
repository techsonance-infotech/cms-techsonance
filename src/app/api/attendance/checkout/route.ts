import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, ConflictError, NotFoundError } from '@/server/http/errors';
import { checkOutSchema } from '@/server/validation/attendance';
import { getCurrentSupabaseActor, getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { listSupabaseProfilesByAuthIds } from '@/server/supabase/users';
import { getPolicyForEmployee, getShiftForEmployee, applyRounding, parseShiftTime } from '@/server/attendance/engine';
import { logAuditAction, publishDomainEvent } from '@/server/events/dispatcher';

async function resolveSupabaseEmployeeForCheckout(accessToken: string, tenantId: string, tagUid?: string | null, employeeId?: number | null) {
  const supabase = getAdminRouteSupabase();
  if (tagUid) {
    const { data: tag } = await supabase
      .from('nfc_tags')
      .select('*')
      .eq('tag_uid', tagUid)
      .eq('tenant_id', tenantId)
      .single();
    if (!tag) throw new NotFoundError('NFC tag not found');
    if (tag.status !== 'active') throw new ConflictError('NFC tag is not active');
    if (!tag.employee_id) throw new ConflictError('NFC tag is not assigned to an employee');
    return { employeeId: Number(tag.employee_id), tag };
  }
  if (!employeeId) throw new BadRequestError('Either tagUid or employeeId must be provided');
  return { employeeId, tag: null };
}

export const POST = withApiHandler(async (request, context) => {
  const payload = checkOutSchema.parse(await request.json());
  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');
  
  const actor = await getCurrentSupabaseActor(accessToken);
  const supabase = getAdminRouteSupabase();
  const resolved = await resolveSupabaseEmployeeForCheckout(accessToken, tenantId, payload.tagUid, payload.employeeId);
  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    .eq('id', resolved.employeeId)
    .eq('tenant_id', tenantId)
    .single();
  if (!employee) throw new NotFoundError('Employee not found');
  const profiles = await listSupabaseProfilesByAuthIds([String(employee.user_id)], { accessToken, tenantId, useAdmin: true });
  const profile = profiles.get(String(employee.user_id));
  const employeeView = {
    id: Number(employee.id),
    name: `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim(),
    email: profile?.email ?? null,
    department: employee.department,
    photoUrl: profile?.avatar_url ?? null,
  };

  const isAdminLike = actor.role === 'Admin' || actor.role === 'SuperAdmin' || actor.role === 'Manager';
  if (!isAdminLike && String(employee.user_id) !== actor.authUserId) {
    throw new BadRequestError('Insufficient permissions. You can only log your own attendance.');
  }

  const today = new Date().toISOString().split('T')[0];
  const { data: activeCheckIn } = await supabase.from('attendance_records').select('*')
    .eq('employee_id', resolved.employeeId)
    .eq('date', today)
    .eq('tenant_id', tenantId)
    .is('time_out', null)
    .single();
  if (!activeCheckIn) throw new NotFoundError('No active check-in found for today');

  const nowDate = new Date();
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
  const userAgent = request.headers.get('user-agent');

  // --- RESOLVE POLICY & SHIFT RULES ---
  const policy = await getPolicyForEmployee(supabase, tenantId, resolved.employeeId);
  const shift = await getShiftForEmployee(supabase, tenantId, resolved.employeeId, today);

  const roundedIn = applyRounding(new Date(activeCheckIn.time_in), policy.rounding_minutes);
  const roundedOut = applyRounding(nowDate, policy.rounding_minutes);
  const shiftEnd = parseShiftTime(shift.end_time, today);

  // Early Departure Check
  let isEarlyExit = false;
  if (!policy.is_flexible) {
    const earlyThreshold = new Date(shiftEnd.getTime() - policy.grace_period_early_exit_minutes * 60000);
    if (roundedOut < earlyThreshold) {
      isEarlyExit = true;
    }
  }

  // Calculate durations & productive time
  const totalMinutes = Math.floor((roundedOut.getTime() - roundedIn.getTime()) / 60000);
  const breakDeduction = policy.unpaid_break_duration_minutes;
  const productiveMinutes = Math.max(0, totalMinutes - breakDeduction);
  const productiveHours = Number((productiveMinutes / 60).toFixed(2));
  
  // Re-verify status based on productive hours
  let status = activeCheckIn.status; // keep original ('present' or 'late') unless hours are too low
  if (productiveHours < policy.min_hours_half_day) {
    status = 'absent';
  } else if (productiveHours < policy.min_hours_full_day) {
    status = 'half_day';
  }

  // Calculate Overtime
  let overtimeMinutes = 0;
  if (policy.overtime_eligibility) {
    const stdHoursInMinutes = policy.standard_hours * 60;
    if (productiveMinutes > stdHoursInMinutes) {
      const excess = productiveMinutes - stdHoursInMinutes;
      if (excess >= policy.overtime_min_minutes) {
        overtimeMinutes = Math.round(excess);
      }
    }
  }

  // Update check-in record
  const currentMetadata = activeCheckIn.metadata || {};
  const updatedMetadata = {
    ...currentMetadata,
    checkoutClientIp: clientIp,
    checkoutUserAgent: userAgent,
    productiveHours,
    breakDeductionMinutes: breakDeduction,
    overtimeMinutes,
  };

  const { data: updated, error } = await supabase
    .from('attendance_records')
    .update({
      time_out: nowDate.toISOString(),
      duration: totalMinutes,
      status,
      metadata: updatedMetadata
    })
    .eq('id', activeCheckIn.id)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error || !updated) throw error ?? new Error('Failed to update attendance record');

  // Trigger Early Exit Exception if applicable
  if (isEarlyExit) {
    await supabase.from('attendance_exceptions').insert({
      tenant_id: tenantId,
      employee_id: resolved.employeeId,
      date: today,
      exception_type: 'early_departure',
      severity: 'low',
      details: `Checked out early at ${nowDate.toLocaleTimeString()} (Shift end: ${shift.end_time}).`,
      ai_detected: false,
      resolved: false,
      created_at: nowDate.toISOString(),
    });

    await publishDomainEvent(supabase, tenantId, 'AttendancePolicyViolationDetected', {
      employeeId: resolved.employeeId,
      date: today,
      violationType: 'early_departure'
    });
  }

  // Save Overtime Request for Approvals if applicable
  if (overtimeMinutes > 0) {
    await supabase.from('attendance_overtime_requests').insert({
      tenant_id: tenantId,
      employee_id: resolved.employeeId,
      date: today,
      calculated_overtime_minutes: overtimeMinutes,
      approved_overtime_minutes: null,
      status: 'pending',
      reason: 'Auto-calculated overtime check-out',
      created_at: nowDate.toISOString(),
    });

    await publishDomainEvent(supabase, tenantId, 'OvertimeApproved', {
      employeeId: resolved.employeeId,
      date: today,
      overtimeMinutes,
      status: 'pending'
    });
  }

  if (resolved.tag) {
    await supabase
      .from('nfc_tags')
      .update({ last_used_at: nowDate.toISOString() })
      .eq('tag_uid', String(resolved.tag.tag_uid))
      .eq('tenant_id', tenantId);
  }

  // Publish Event
  await publishDomainEvent(supabase, tenantId, 'AttendanceMarked', {
    recordId: updated.id,
    employeeId: resolved.employeeId,
    date: today,
    status
  });

  // Write Audit Log
  await logAuditAction(supabase, {
    tenantId,
    employeeId: resolved.employeeId,
    actorId: actor.legacyUserId ? String(actor.legacyUserId) : null,
    actionType: 'check_out',
    recordId: Number(updated.id),
    clientIp,
    userAgent,
    gpsCoordinates: null,
    metadata: { checkOutMethod: resolved.tag ? 'nfc' : 'manual', status, overtimeMinutes }
  });

  return NextResponse.json({ ...updated, employee: employeeView });
}, { requireAuth: true, roles: ['Employee'] });

