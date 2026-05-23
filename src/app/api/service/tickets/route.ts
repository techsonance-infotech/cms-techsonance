import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { BadRequestError } from '@/server/http/errors';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const supabase = getAdminRouteSupabase();
  const searchParams = new URL(request.url).searchParams;
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');

  let query = supabase
    .from('tickets')
    .select('*, assigned_to(email, first_name, last_name)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }
  if (priority) {
    query = query.eq('priority', priority);
  }

  const { data: tickets, error } = await query;
  if (error) throw error;

  return NextResponse.json({ success: true, tickets });
}, { requireAuth: true, roles: ['SuperAdmin', 'Admin', 'Manager', 'Employee', 'Viewer'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  const userId = context.auth?.user.legacyUserId; // Matches user table foreign keys in public schemas
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const supabase = getAdminRouteSupabase();
  const body = await request.json();
  const { title, description, type, priority, assignedTo } = body;

  if (!title) throw new BadRequestError('Title is a required field');

  // Insert the ticket. Note: the trigger allocate_ticket_number() automatically populates ticket_number
  const { data: ticket, error } = await supabase
    .from('tickets')
    .insert({
      tenant_id: tenantId,
      title,
      description,
      type: type || 'support',
      priority: priority || 'medium',
      status: 'open',
      created_by: userId,
      assigned_to: assignedTo || null,
    })
    .select('*')
    .single();

  if (error) throw error;

  return NextResponse.json({ success: true, ticket }, { status: 201 });
}, { requireAuth: true, roles: ['SuperAdmin', 'Admin', 'Manager', 'Employee'] });
