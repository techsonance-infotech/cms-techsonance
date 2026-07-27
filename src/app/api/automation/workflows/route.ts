import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, NotFoundError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const supabase = getAdminRouteSupabase();

  const { data: workflows, error } = await supabase
    .from('automation_workflows')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching workflows:', error);
    throw error;
  }

  return NextResponse.json({
    success: true,
    data: workflows || [],
    message: 'Workflows fetched successfully',
  });
}, { requireAuth: true, roles: ['Admin'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const payload = await request.json();
  if (!payload.name || !payload.trigger_event) {
    throw new BadRequestError('Name and trigger_event are required');
  }

  const supabase = getAdminRouteSupabase();

  const { data: created, error } = await supabase
    .from('automation_workflows')
    .insert({
      tenant_id: tenantId,
      name: String(payload.name).trim().replace(/<[^>]*>/g, ''),
      trigger_event: String(payload.trigger_event).trim(),
      conditions: Array.isArray(payload.conditions) ? payload.conditions : [],
      actions: Array.isArray(payload.actions) ? payload.actions : [],
      is_active: payload.is_active !== undefined ? Boolean(payload.is_active) : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error || !created) {
    console.error('Error creating workflow:', error);
    throw error ?? new Error('Failed to create workflow');
  }

  return NextResponse.json({
    success: true,
    data: created,
    message: 'Workflow created successfully',
  }, { status: 201 });
}, { requireAuth: true, roles: ['Admin'] });

export const PUT = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const id = new URL(request.url).searchParams.get('id');
  if (!id) throw new BadRequestError('Workflow id query param is required');

  const payload = await request.json();
  const supabase = getAdminRouteSupabase();

  // Verify ownership
  const { data: existing, error: findError } = await supabase
    .from('automation_workflows')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (findError || !existing) {
    throw new NotFoundError('Workflow not found');
  }

  const updateFields: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.name !== undefined) {
    updateFields.name = String(payload.name).trim().replace(/<[^>]*>/g, '');
  }
  if (payload.trigger_event !== undefined) {
    updateFields.trigger_event = String(payload.trigger_event).trim();
  }
  if (payload.conditions !== undefined) {
    updateFields.conditions = Array.isArray(payload.conditions) ? payload.conditions : [];
  }
  if (payload.actions !== undefined) {
    updateFields.actions = Array.isArray(payload.actions) ? payload.actions : [];
  }
  if (payload.is_active !== undefined) {
    updateFields.is_active = Boolean(payload.is_active);
  }

  const { data: updated, error: updateError } = await supabase
    .from('automation_workflows')
    .update(updateFields)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (updateError || !updated) {
    console.error('Error updating workflow:', updateError);
    throw updateError ?? new Error('Failed to update workflow');
  }

  return NextResponse.json({
    success: true,
    data: updated,
    message: 'Workflow updated successfully',
  });
}, { requireAuth: true, roles: ['Admin'] });

export const DELETE = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const id = new URL(request.url).searchParams.get('id');
  if (!id) throw new BadRequestError('Workflow id query param is required');

  const supabase = getAdminRouteSupabase();

  // Verify ownership
  const { data: existing, error: findError } = await supabase
    .from('automation_workflows')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (findError || !existing) {
    throw new NotFoundError('Workflow not found');
  }

  const { error: deleteError } = await supabase
    .from('automation_workflows')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId);

  if (deleteError) {
    console.error('Error deleting workflow:', deleteError);
    throw deleteError;
  }

  return NextResponse.json({
    success: true,
    message: 'Workflow deleted successfully',
  });
}, { requireAuth: true, roles: ['Admin'] });
