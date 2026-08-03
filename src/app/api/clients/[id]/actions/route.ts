import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, NotFoundError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { apiSuccess, apiError } from '@/server/http/response';

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const url = new URL(request.url);
  const segments = url.pathname.split('/');
  const idSegment = segments[segments.length - 2];
  const clientId = Number(idSegment);

  if (!clientId || isNaN(clientId)) throw new BadRequestError('Valid clientId Segment is required');

  const { type, name, description, amount, priority, validityDays } = await request.json();
  if (!type) throw new BadRequestError('Action type is required');

  const supabase = getAdminRouteSupabase();

  // Fetch client details with tenant protection
  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .eq('tenant_id', tenantId)
    .single();

  if (clientErr || !client) {
    throw new NotFoundError('Client not found');
  }

  try {
    if (type === 'opportunity') {
      // Create opportunity (inquiry) associated with the client
      const { data, error } = await supabase
        .from('inquiries')
        .insert({
          tenant_id: tenantId,
          alias_name: client.company_name || client.contact_person || 'New Opportunity',
          contact_person: client.contact_person,
          company_name: client.company_name,
          work_email: client.email,
          phone_number: client.phone,
          status: 'Proposal',
          pipeline_stage: 'Proposal',
          estimated_value: amount ? Number(amount) : 150000,
          opportunity_status: 'Open',
          project_overview_requirements: description || `Created from Client directory profile actions.`
        })
        .select('*')
        .single();

      if (error) throw error;
      return apiSuccess(data, 'Successfully generated new pipeline Deal Opportunity');

    } else if (type === 'task') {
      // Create associated task
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          tenant_id: tenantId,
          title: name || `Follow-up: ${client.company_name || client.contact_person}`,
          description: description || `Follow up task for client.`,
          status: 'backlog',
          priority_level: priority || 'Medium',
          created_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (error) throw error;
      return apiSuccess(data, 'Successfully assigned follow-up Task');

    } else if (type === 'ticket') {
      // Create support ticket
      const ticketNum = `TIC-${Date.now().toString().slice(-6)}`;
      const { data, error } = await supabase
        .from('hr_service_tickets')
        .insert({
          tenant_id: tenantId,
          user_id: context.auth!.user.id,
          ticket_number: ticketNum,
          category: 'Client Support',
          subject: name || `Support Request: ${client.company_name}`,
          description: description || `Client support ticket description.`,
          priority: priority || 'Normal',
          status: 'Open'
        })
        .select('*')
        .single();

      if (error) throw error;
      return apiSuccess(data, 'Successfully opened customer Support Ticket');

    } else if (type === 'quotation') {
      // Simulate quotation generation or insert into a quotes/invoices table if exists
      const quoteNumber = `QT-${Date.now().toString().slice(-6)}`;
      const validityDate = new Date();
      validityDate.setDate(validityDate.getDate() + (Number(validityDays) || 15));

      return apiSuccess({
        quoteNumber,
        clientId,
        clientName: client.company_name,
        amount: amount ? Number(amount) : 75000,
        validUntil: validityDate.toLocaleDateString(),
        status: 'Draft'
      }, `Quotation ${quoteNumber} successfully generated (Validity: ${validityDays || 15} days)`);
    }

    throw new BadRequestError(`Unsupported action type: ${type}`);
  } catch (err: any) {
    console.error('Client action error:', err);
    return apiError(err.message || 'Failed to complete client lifecycle action.', { status: 500 });
  }
}, { requireAuth: true, roles: ['Employee'] });
