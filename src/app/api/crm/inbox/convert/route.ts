import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase, resolveActorUuid } from '@/server/supabase/route-helpers';
import { apiSuccess, apiError } from '@/server/http/response';

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const { inquiryId, type, name, description, estimatedValue, priority } = await request.json();
  if (!inquiryId || !type) throw new BadRequestError('inquiryId and type are required');

  const supabase = getAdminRouteSupabase();
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const actorUuid = await resolveActorUuid(context, supabase);
  const validActorUuid = (actorUuid && UUID_REGEX.test(actorUuid)) ? actorUuid : null;

  const parsedInqId = Number(inquiryId);
  if (isNaN(parsedInqId)) {
    throw new BadRequestError('Invalid inquiry ID');
  }

  const { data: inquiry, error: fetchErr } = await supabase
    .from('inquiries')
    .select('*')
    .eq('id', parsedInqId)
    .eq('tenant_id', tenantId)
    .single();

  if (fetchErr || !inquiry) {
    throw new BadRequestError('Inquiry not found');
  }

  const cleanName = name || inquiry.alias_name || 'Converted Lead';
  const cleanDesc = description || inquiry.project_overview_requirements || `Converted from inquiry ID: ${inquiryId}`;

  try {
    if (type === 'opportunity') {
      // 1. Convert to CRM Opportunity with tenant protection
      const { data, error } = await supabase
        .from('inquiries')
        .update({
          status: 'Proposal',
          pipeline_stage: 'Proposal',
          estimated_value: estimatedValue ? Number(estimatedValue) : (inquiry.estimated_value || 150000),
          opportunity_status: 'Open',
          internal_notes: `Converted to active opportunity. ${inquiry.internal_notes || ''}`
        })
        .eq('id', parsedInqId)
        .eq('tenant_id', tenantId)
        .select('*')
        .single();

      if (error) throw error;
      return apiSuccess(data, 'Successfully converted inquiry to active Opportunity');

    } else if (type === 'client') {
      // 2. Convert to Client record
      const { data, error } = await supabase
        .from('clients')
        .insert({
          tenant_id: tenantId,
          company_name: inquiry.company_name || cleanName,
          contact_person: inquiry.contact_person || cleanName,
          email: inquiry.work_email || `${cleanName.toLowerCase().replace(/\s/g, '')}@example.com`,
          phone: inquiry.phone_number || '',
          industry: inquiry.industry || 'Technology',
          status: 'onboarding',
          notes: cleanDesc
        })
        .select('*')
        .single();

      if (error) throw error;
      return apiSuccess(data, 'Successfully converted conversation to Client directory profile');

    } else if (type === 'project') {
      // 3. Convert to Project
      const { data, error } = await supabase
        .from('projects')
        .insert({
          tenant_id: tenantId,
          name: `${cleanName} - Onboarding Delivery`,
          description: cleanDesc,
          status: 'planning',
          budget: estimatedValue ? Number(estimatedValue) : (inquiry.estimated_value || 150000),
          created_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (error) throw error;
      return apiSuccess(data, 'Successfully converted conversation to active Project board');

    } else if (type === 'task') {
      // 4. Convert to Task
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          tenant_id: tenantId,
          title: `Follow up: ${cleanName}`,
          description: cleanDesc,
          status: 'backlog',
          priority_level: priority || 'Medium',
          created_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (error) throw error;
      return apiSuccess(data, 'Successfully converted conversation to follow-up Task');

    } else if (type === 'ticket') {
      // 5. Convert to Support Ticket
      const ticketNum = `TIC-${Date.now().toString().slice(-6)}`;
      const { data, error } = await supabase
        .from('hr_service_tickets')
        .insert({
          tenant_id: tenantId,
          user_id: validActorUuid,
          ticket_number: ticketNum,
          category: 'Client Support',
          subject: `Support request: ${cleanName}`,
          description: cleanDesc,
          priority: priority || 'Normal',
          status: 'Open'
        })
        .select('*')
        .single();

      if (error) throw error;
      return apiSuccess(data, 'Successfully converted conversation to support service Ticket');
    }

    throw new BadRequestError(`Unsupported conversion target type: ${type}`);
  } catch (err: any) {
    console.error('Inbox convert error:', err);
    return apiError(err.message || 'Failed to complete conversation conversion.', { status: 500 });
  }
}, { requireAuth: true, roles: ['Employee'] });
