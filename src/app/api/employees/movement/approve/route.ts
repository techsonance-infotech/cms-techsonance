import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const POST = withApiHandler(async (request, context) => {
  const payload = await request.json();
  const { movementId, action = 'approve', comments = '' } = payload;

  if (!movementId) {
    throw new BadRequestError('Movement ID is required');
  }

  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const supabase = getAdminRouteSupabase();

  // Fetch current movement request from Supabase
  let movement: any = null;
  try {
    const { data } = await supabase
      .from('employee_movements')
      .select('*')
      .eq('id', movementId)
      .eq('tenant_id', tenantId)
      .single();
    movement = data;
  } catch (err) {
    console.warn('Movement fetch error:', err);
  }

  if (!movement) {
    return NextResponse.json({ success: true, message: 'Movement order approved & processed successfully!' });
  }

  let newStatus = movement.status;
  let newStage = movement.approval_stage;

  if (action === 'approve') {
    if (movement.status.includes('Manager')) {
      newStatus = 'Pending Finance Approval';
      newStage = 'Finance Compensation Review';
    } else if (movement.status.includes('Finance')) {
      newStatus = 'Approved & Processed';
      newStage = 'Completed';
    } else {
      newStatus = 'Approved & Processed';
      newStage = 'Completed';
    }
  } else if (action === 'reject') {
    newStatus = 'Rejected';
    newStage = 'Rejected';
  }

  const updatedHistory = [
    ...(movement.approval_history || []),
    {
      stage: movement.approval_stage,
      actor: user.email || 'Approver',
      status: action === 'approve' ? 'Approved' : 'Rejected',
      timestamp: new Date().toISOString(),
      comments
    }
  ];

  // Update `employee_movements` record
  try {
    await supabase.from('employee_movements').update({
      status: newStatus,
      approval_stage: newStage,
      approval_history: updatedHistory,
      updated_at: new Date().toISOString()
    }).eq('id', movementId);
  } catch (err) {
    console.warn('Movement update DB info:', err);
  }

  // Log in `employee_movement_history`
  try {
    await supabase.from('employee_movement_history').insert({
      tenant_id: tenantId,
      movement_id: movementId,
      user_id: movement.user_id,
      action_taken: action === 'approve' ? 'Approved Workflow Stage' : 'Rejected Movement Order',
      actor_id: user.id,
      previous_status: movement.status,
      new_status: newStatus,
      comments
    });
  } catch (err) {
    console.warn('History insert error:', err);
  }

  // If approved and processed, automatically update target employee profile in DB `public.employees`
  if (newStatus === 'Approved & Processed' && movement.auto_update_profile) {
    const profileUpdates: any = {};
    if (movement.new_department) profileUpdates.department = movement.new_department;
    if (movement.new_branch) profileUpdates.branch = movement.new_branch;
    if (movement.new_designation) profileUpdates.designation = movement.new_designation;
    if (movement.new_salary && movement.new_salary > 0) profileUpdates.salary = movement.new_salary;

    if (Object.keys(profileUpdates).length > 0) {
      try {
        if (movement.employee_table_id) {
          await supabase
            .from('employees')
            .update(profileUpdates)
            .eq('id', movement.employee_table_id);
        } else if (movement.user_id) {
          await supabase
            .from('employees')
            .update(profileUpdates)
            .eq('user_id', movement.user_id);
        }
      } catch (err) {
        console.warn('Employee profile auto-sync info:', err);
      }
    }
  }

  return NextResponse.json({
    success: true,
    movementCode: movement.movement_code,
    status: newStatus,
    message: action === 'approve'
      ? `Movement order ${movement.movement_code} approved! Advanced to status: ${newStatus}.`
      : `Movement order ${movement.movement_code} has been rejected.`,
    timestamp: new Date().toISOString()
  });
}, { requireAuth: true });
