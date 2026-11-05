import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, ForbiddenError } from '@/server/http/errors';
import { getAdminRouteSupabase, resolveActorUuid } from '@/server/supabase/route-helpers';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveUserUuid(supabase: any, rawId: any, email?: string): Promise<string | null> {
  if (!rawId && !email) return null;
  const strId = String(rawId || '').trim();

  if (UUID_REGEX.test(strId)) {
    const { data } = await supabase.from('users').select('id').eq('id', strId).maybeSingle();
    if (data?.id) return data.id;
  }

  const numId = parseInt(strId, 10);
  if (!isNaN(numId)) {
    const { data: byLegacy } = await supabase.from('users').select('id').eq('legacy_user_id', numId).maybeSingle();
    if (byLegacy?.id) return byLegacy.id;

    const { data: byEmp } = await supabase.from('employees').select('user_id').eq('id', numId).maybeSingle();
    if (byEmp?.user_id && UUID_REGEX.test(byEmp.user_id)) return byEmp.user_id;
  }

  if (email) {
    const { data: byEmail } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
    if (byEmail?.id) return byEmail.id;
  }

  return null;
}

export const POST = withApiHandler(async (request, context) => {
  const payload = await request.json();
  const {
    requestIds = [],
    action = 'approve', // 'approve', 'fulfill', 'reject'
    resolutionNotes = ''
  } = payload;

  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  // RBAC Permission Enforcement: Admin, SuperAdmin, HR Manager, and Project Manager can approve/reject tickets
  const userRole = (user.role || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const isAuthorizedApprover = ['admin', 'super_admin', 'superadmin', 'business_owner', 'owner', 'manager', 'hr_manager', 'project_manager'].includes(userRole);

  if (!isAuthorizedApprover) {
    throw new ForbiddenError('Insufficient RBAC permissions. Only Managers and HR Admins can approve or fulfill requests.');
  }

  if (!Array.isArray(requestIds) || requestIds.length === 0) {
    throw new BadRequestError('Request IDs list is required');
  }

  const supabase = getAdminRouteSupabase();

  // Resolve authentic Supabase UUID for current actor
  const actorUuid = await resolveActorUuid(context, supabase);
  const effectiveUserId = actorUuid || (await resolveUserUuid(supabase, user.id, user.email));
  const approverUuid = effectiveUserId && UUID_REGEX.test(effectiveUserId) ? effectiveUserId : null;

  const newStatus = action === 'approve'
    ? 'Approved'
    : (action === 'fulfill' ? 'Fulfilled' : 'Rejected');

  // Group IDs by source table
  const wfhIds: string[] = [];
  const leaveIds: number[] = [];
  const attIds: string[] = [];
  const hrIds: string[] = [];
  const empReqIds: string[] = [];

  for (const rawId of requestIds) {
    const strId = String(rawId).trim();
    if (strId.startsWith('wfh-')) {
      const clean = strId.replace('wfh-', '').trim();
      if (clean) wfhIds.push(clean);
    } else if (strId.startsWith('leave-')) {
      const num = parseInt(strId.replace('leave-', ''), 10);
      if (!isNaN(num)) leaveIds.push(num);
    } else if (strId.startsWith('att-')) {
      const clean = strId.replace('att-', '').trim();
      if (clean) attIds.push(clean);
    } else if (strId.startsWith('hr-')) {
      const clean = strId.replace('hr-', '').trim();
      if (clean) hrIds.push(clean);
    } else {
      empReqIds.push(strId);
    }
  }

  // 1. Update WFH Requests
  if (wfhIds.length > 0) {
    try {
      const updateData: any = {
        status: newStatus,
        approved_at: newStatus !== 'Rejected' ? new Date().toISOString() : null,
        manager_comments: resolutionNotes ? resolutionNotes.trim() : `Decision: ${newStatus} by HR Approver`
      };
      if (approverUuid) {
        updateData.approver_id = approverUuid;
      }
      const { error } = await supabase.from('wfh_requests')
        .update(updateData)
        .in('id', wfhIds)
        .eq('tenant_id', tenantId);
      if (error) console.error('wfh_requests approval update DB error:', error);
    } catch (err) {
      console.warn('wfh_requests approval update DB error:', err);
    }
  }

  // 2. Update Leave Requests
  if (leaveIds.length > 0) {
    try {
      const updateData: any = {
        status: newStatus.toLowerCase(),
        updated_at: new Date().toISOString()
      };
      if (approverUuid) {
        updateData.approved_by = approverUuid;
      }
      const { error } = await supabase.from('leave_requests')
        .update(updateData)
        .in('id', leaveIds)
        .eq('tenant_id', tenantId);
      if (error) console.error('leave_requests approval update DB error:', error);
    } catch (err) {
      console.warn('leave_requests approval update DB error:', err);
    }
  }

  // 3. Update Attendance Requests
  if (attIds.length > 0) {
    try {
      const updateData: any = {
        status: newStatus.toLowerCase(),
        updated_at: new Date().toISOString()
      };
      if (approverUuid) {
        updateData.approver_id = approverUuid;
      }
      if (resolutionNotes) {
        updateData.resolution_notes = resolutionNotes.trim();
      }
      const { error } = await supabase.from('attendance_requests')
        .update(updateData)
        .in('id', attIds)
        .eq('tenant_id', tenantId);
      if (error) console.error('attendance_requests approval update DB error:', error);
    } catch (err) {
      console.warn('attendance_requests approval update DB error:', err);
    }
  }

  // 4. Update HR Service Tickets
  if (hrIds.length > 0) {
    try {
      const updateData: any = {
        status: newStatus === 'Approved' ? 'Resolved' : (newStatus === 'Rejected' ? 'Closed' : newStatus),
        resolved_at: newStatus === 'Approved' ? new Date().toISOString() : null,
        resolution_notes: resolutionNotes ? resolutionNotes.trim() : `Case processed: ${newStatus}`,
        updated_at: new Date().toISOString()
      };
      const { error } = await supabase.from('hr_service_tickets')
        .update(updateData)
        .in('id', hrIds)
        .eq('tenant_id', tenantId);
      if (error) console.error('hr_service_tickets approval update DB error:', error);
    } catch (err) {
      console.warn('hr_service_tickets approval update DB error:', err);
    }
  }

  // 5. Update Employee Requests & sync child records if applicable
  if (empReqIds.length > 0) {
    try {
      const { data: updatedReqs } = await supabase
        .from('employee_requests')
        .select('request_number, category')
        .in('id', empReqIds)
        .eq('tenant_id', tenantId);

      const updateData: any = {
        status: newStatus,
        approved_at: newStatus !== 'Rejected' ? new Date().toISOString() : null,
        resolution_notes: resolutionNotes ? resolutionNotes.trim() : null,
        updated_at: new Date().toISOString()
      };
      if (approverUuid) {
        updateData.approver_id = approverUuid;
      }
      const { error } = await supabase.from('employee_requests')
        .update(updateData)
        .in('id', empReqIds)
        .eq('tenant_id', tenantId);
      if (error) console.error('employee_requests approval update DB error:', error);

      // Sync corresponding wfh_requests if request_number matches
      if (updatedReqs && updatedReqs.length > 0) {
        const reqNumbers = updatedReqs.map(r => r.request_number).filter(Boolean);
        if (reqNumbers.length > 0) {
          const wfhUpdate: any = {
            status: newStatus,
            approved_at: newStatus !== 'Rejected' ? new Date().toISOString() : null,
            manager_comments: resolutionNotes ? resolutionNotes.trim() : `Decision: ${newStatus} by HR Approver`
          };
          if (approverUuid) wfhUpdate.approver_id = approverUuid;
          await supabase.from('wfh_requests')
            .update(wfhUpdate)
            .in('request_code', reqNumbers)
            .eq('tenant_id', tenantId);
        }
      }
    } catch (err) {
      console.warn('employee_requests approval update DB error:', err);
    }
  }

  return NextResponse.json({
    success: true,
    processedCount: requestIds.length,
    status: newStatus,
    message: requestIds.length > 1
      ? `Bulk ${action} executed for ${requestIds.length} requests!`
      : `Request ticket ${action}d successfully!`,
    timestamp: new Date().toISOString()
  });
}, { requireAuth: true });
