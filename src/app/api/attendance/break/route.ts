import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, NotFoundError } from '@/server/http/errors';
import { getAdminRouteSupabase, getCurrentSupabaseActor } from '@/server/supabase/route-helpers';
import { logAuditAction, publishDomainEvent } from '@/server/events/dispatcher';

export const POST = withApiHandler(async (request, context) => {
  const { employeeId, action, breakType = 'other' } = await request.json(); // action: 'start' | 'end', breakType: 'lunch' | 'tea' | 'other'
  
  if (!employeeId || !['start', 'end'].includes(action)) {
    throw new BadRequestError('employeeId and action (start or end) are required');
  }

  const tenantId = context.auth?.user.tenantId;
  const accessToken = context.auth?.accessToken;
  if (!tenantId || !accessToken) throw new BadRequestError('Authorization and tenant info required');

  const supabase = getAdminRouteSupabase();
  const actor = await getCurrentSupabaseActor(accessToken);

  const today = new Date().toISOString().split('T')[0];

  // Fetch active check-in record for today
  const { data: activeCheckIn } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('date', today)
    .eq('tenant_id', tenantId)
    .is('time_out', null)
    .single();

  if (!activeCheckIn) {
    throw new BadRequestError('No active check-in session found. You must Clock In before taking a break.');
  }

  const currentMetadata = activeCheckIn.metadata || {};
  let breaks = currentMetadata.breaks || [];
  let lastBreakState = currentMetadata.lastBreakState || 'paused';
  const now = new Date().toISOString();

  if (action === 'start') {
    if (lastBreakState === 'active') {
      throw new BadRequestError('You are already on an active break.');
    }
    // Create new break session
    breaks.push({
      type: breakType,
      startTime: now,
      endTime: null,
      durationMinutes: 0
    });
    lastBreakState = 'active';
  } else if (action === 'end') {
    if (lastBreakState !== 'active') {
      throw new BadRequestError('No active break session found to end.');
    }
    // Find the break entry where endTime is null
    const activeBreakIndex = breaks.findIndex((b: any) => b.endTime === null);
    if (activeBreakIndex !== -1) {
      const activeBreak = breaks[activeBreakIndex];
      const durationMs = new Date(now).getTime() - new Date(activeBreak.startTime).getTime();
      const durationMinutes = Math.max(0, Math.round(durationMs / 60000));
      
      breaks[activeBreakIndex] = {
        ...activeBreak,
        endTime: now,
        durationMinutes
      };
    }
    lastBreakState = 'paused';
  }

  // Calculate total break minutes
  const totalBreakMinutes = breaks.reduce((acc: number, b: any) => acc + (b.durationMinutes || 0), 0);

  const updatedMetadata = {
    ...currentMetadata,
    breaks,
    lastBreakState,
    totalBreakMinutes
  };

  const { data: updated, error } = await supabase
    .from('attendance_records')
    .update({
      metadata: updatedMetadata
    })
    .eq('id', activeCheckIn.id)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error || !updated) throw error ?? new Error('Failed to update break logs');

  // Trigger Events
  await publishDomainEvent(supabase, tenantId, action === 'start' ? 'AttendanceMarked' : 'AttendanceCorrected', { // Use generic event for sync
    employeeId,
    date: today,
    breakAction: action,
    breakType,
    totalBreakMinutes
  });

  // Log compliance audit trace
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
  const userAgent = request.headers.get('user-agent');
  await logAuditAction(supabase, {
    tenantId,
    employeeId,
    actorId: actor.legacyUserId ? String(actor.legacyUserId) : null,
    actionType: action === 'start' ? 'check_in' : 'check_out', // mapping to existing actions
    recordId: Number(updated.id),
    clientIp,
    userAgent,
    metadata: { breakAction: action, breakType, totalBreakMinutes }
  });

  return NextResponse.json({ success: true, record: updated });
}, { requireAuth: true });
