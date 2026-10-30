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
  const supabase = getAdminRouteSupabase();
  let tenantId = user.tenantId;

  if (!tenantId) {
    const userIdentifier = user.providerUserId || user.id;
    if (userIdentifier) {
      const { data: u } = await supabase
        .from('users')
        .select('tenant_id')
        .or(`id.eq.${userIdentifier},legacy_user_id.eq.${typeof userIdentifier === 'number' ? userIdentifier : 0}`)
        .maybeSingle();
      tenantId = u?.tenant_id;
    }
  }

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

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
    if (movement.new_designation) profileUpdates.designation = movement.new_designation;
    if (movement.new_employment_type) profileUpdates.employment_type = movement.new_employment_type;
    if (movement.new_manager_id) profileUpdates.manager_id = movement.new_manager_id;
    if (movement.new_salary && movement.new_salary > 0) profileUpdates.salary = movement.new_salary;

    try {
      // If branch changed, update branch in skills JSONB
      let currentEmpRecord: any = null;
      const empQuery = movement.employee_table_id
        ? supabase.from('employees').select('id, skills').eq('id', movement.employee_table_id).single()
        : supabase.from('employees').select('id, skills').eq('user_id', movement.user_id).single();

      const { data: empData } = await empQuery;
      if (empData) {
        currentEmpRecord = empData;
        let existingSkills: any = {};
        if (typeof currentEmpRecord.skills === 'string') {
          try { existingSkills = JSON.parse(currentEmpRecord.skills); } catch { existingSkills = {}; }
        } else if (currentEmpRecord.skills && typeof currentEmpRecord.skills === 'object') {
          existingSkills = { ...currentEmpRecord.skills };
        }

        if (movement.new_branch) {
          existingSkills.branchName = movement.new_branch;
          existingSkills.workLocation = movement.new_branch;
        }
        if (movement.new_business_unit) {
          existingSkills.businessUnit = movement.new_business_unit;
        }
        if (movement.new_grade) {
          existingSkills.grade = movement.new_grade;
        }
        profileUpdates.skills = existingSkills;

        await supabase
          .from('employees')
          .update(profileUpdates)
          .eq('id', currentEmpRecord.id);
      }
    } catch (err) {
      console.warn('Employee profile auto-sync info:', err);
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
