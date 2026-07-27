import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const searchParams = new URL(request.url).searchParams;
  const employeeId = searchParams.get('employeeId');
  if (!employeeId) throw new BadRequestError('employeeId query param is required');

  const supabase = getAdminRouteSupabase();

  // Find workflow
  let { data: workflow, error } = await supabase
    .from('onboarding_workflows')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('employee_id', Number(employeeId))
    .maybeSingle();

  if (error) throw new BadRequestError(error.message);

  // Auto-initialize workflow instance if not present
  if (!workflow) {
    const { data: newWorkflow, error: initError } = await supabase
      .from('onboarding_workflows')
      .insert({
        tenant_id: tenantId,
        employee_id: Number(employeeId),
        status: 'draft',
        current_stage: 'Offer Acceptance',
        approval_chain: [
          { role: 'hr_manager', name: 'HR Manager Approval', status: 'pending' },
          { role: 'admin', name: 'Operations VP Approval', status: 'pending' }
        ],
        approval_history: [],
        draft_data: {}
      })
      .select()
      .single();

    if (initError) throw new BadRequestError(initError.message);
    workflow = newWorkflow;

    // Log audit entry
    await supabase.from('onboarding_audit_logs').insert({
      tenant_id: tenantId,
      workflow_id: workflow.id,
      employee_id: Number(employeeId),
      stage_name: 'Offer Acceptance',
      action: 'INITIALIZE',
      performed_by: 'System Auto-Trigger',
      ip_address: '127.0.0.1',
      device_info: 'Server Background Thread'
    });
  }

  // Also fetch audits
  const { data: audits } = await supabase
    .from('onboarding_audit_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('employee_id', Number(employeeId))
    .order('created_at', { ascending: false });

  return NextResponse.json({
    workflow,
    auditLogs: audits || []
  });
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const body = await request.json();
  const { employeeId, status, currentStage, approvalChain } = body;
  if (!employeeId) throw new BadRequestError('employeeId is required');

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('onboarding_workflows')
    .insert({
      tenant_id: tenantId,
      employee_id: Number(employeeId),
      status: status || 'draft',
      current_stage: currentStage || 'Offer Acceptance',
      approval_chain: approvalChain || [
        { role: 'hr_manager', name: 'HR Manager Approval', status: 'pending' },
        { role: 'admin', name: 'Operations VP Approval', status: 'pending' }
      ],
      approval_history: [],
      draft_data: {}
    })
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);

  // Log Audit
  await supabase.from('onboarding_audit_logs').insert({
    tenant_id: tenantId,
    workflow_id: data.id,
    employee_id: Number(employeeId),
    stage_name: currentStage || 'Offer Acceptance',
    action: 'CREATE',
    performed_by: context.auth?.user.email || 'Admin User',
    ip_address: '127.0.0.1',
    device_info: 'HR Administration Portal'
  });

  return NextResponse.json(data);
}, { requireAuth: true });

export const PUT = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const body = await request.json();
  const { id, status, currentStage, approvalChain, approvalHistory, draftData, comments, action, performedBy } = body;
  if (!id) throw new BadRequestError('Workflow id is required');

  const supabase = getAdminRouteSupabase();

  // Get previous workflow state for audit log comparison
  const { data: prevWorkflow } = await supabase
    .from('onboarding_workflows')
    .select('*')
    .eq('id', Number(id))
    .eq('tenant_id', tenantId)
    .single();

  const updateFields: any = {};
  if (status !== undefined) updateFields.status = status;
  if (currentStage !== undefined) updateFields.current_stage = currentStage;
  if (approvalChain !== undefined) updateFields.approval_chain = approvalChain;
  if (approvalHistory !== undefined) updateFields.approval_history = approvalHistory;
  if (draftData !== undefined) updateFields.draft_data = draftData;
  updateFields.updated_at = new Date().toISOString();

  const { data: updatedWorkflow, error } = await supabase
    .from('onboarding_workflows')
    .update(updateFields)
    .eq('id', Number(id))
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);

  // Log Audit trail
  await supabase.from('onboarding_audit_logs').insert({
    tenant_id: tenantId,
    workflow_id: Number(id),
    employee_id: updatedWorkflow.employee_id,
    stage_name: currentStage || prevWorkflow?.current_stage || 'onboarding',
    action: action || 'UPDATE',
    previous_value: prevWorkflow ? JSON.stringify({ status: prevWorkflow.status, stage: prevWorkflow.current_stage }) : undefined,
    new_value: JSON.stringify({ status: updatedWorkflow.status, stage: updatedWorkflow.current_stage }),
    performed_by: performedBy || context.auth?.user.email || 'System Account',
    ip_address: '127.0.0.1',
    device_info: comments || 'Workflow lifecycle updated'
  });

  // Event Broker: If stage transitioned, publish a domain event in onboarding_events
  if (currentStage && prevWorkflow && prevWorkflow.current_stage !== currentStage) {
    let eventType = 'StageTransitioned';
    if (currentStage === 'Pre-Onboarding') eventType = 'OfferAccepted';
    if (currentStage === 'Background Verification') eventType = 'KYCCompleted';
    if (currentStage === 'IT Provisioning') eventType = 'BackgroundVerified';
    if (status === 'completed') eventType = 'EmployeeActivated';

    await supabase.from('onboarding_events').insert({
      tenant_id: tenantId,
      workflow_id: Number(id),
      event_type: eventType,
      payload: {
        employeeId: updatedWorkflow.employee_id,
        stage: currentStage,
        status: status,
        updatedAt: new Date().toISOString()
      },
      processed_status: 'processed'
    });
  }

  return NextResponse.json(updatedWorkflow);
}, { requireAuth: true });
