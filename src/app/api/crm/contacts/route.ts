import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const supabase = getAdminRouteSupabase();

  // Query clients to associate contacts
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, company_name')
    .eq('tenant_id', tenantId);

  // Query contacts ordered by created_at descending
  const { data: contacts, error } = await supabase
    .from('client_contacts')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Contacts fetch error:', error);
  }

  const finalContacts = contacts || [];

  // Map client names dynamically
  const clientMap = new Map((clients || []).map((c: any) => [c.id, c.company_name || c.name]));
  const mappedContacts = finalContacts.map((c: any) => ({
    ...c,
    client_name: c.client_id ? (clientMap.get(c.client_id) || '') : ''
  }));

  return NextResponse.json({
    success: true,
    contacts: mappedContacts,
    clients: clients || []
  });
}, { requireAuth: true, roles: ['Manager'] });

export const POST = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const supabase = getAdminRouteSupabase();
  const body = await request.json();

  // Server-side validation
  if (!body.name || !body.name.trim()) {
    return NextResponse.json({ success: false, error: 'Contact name is required.' }, { status: 400 });
  }
  if (body.email && body.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email.trim())) {
      return NextResponse.json({ success: false, error: 'Invalid email address format.' }, { status: 400 });
    }
  }

  const insertPayload = {
    tenant_id: tenantId,
    client_id: body.client_id ? Number(body.client_id) : null,
    name: body.name.trim(),
    designation: body.designation?.trim() || null,
    department: body.department?.trim() || null,
    email: body.email?.trim() || null,
    phone: body.phone?.trim() || null,
    social_linkedin: body.social_linkedin?.trim() || null,
    social_twitter: body.social_twitter?.trim() || null,
    notes: body.notes?.trim() || null,
    is_primary: !!body.is_primary
  };

  const { data, error } = await supabase
    .from('client_contacts')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) {
    console.error('Contact insert failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to create contact. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data
  });
}, { requireAuth: true, roles: ['Manager'] });

export const PUT = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const supabase = getAdminRouteSupabase();
  const body = await request.json();

  if (!body.id) throw new BadRequestError('Missing contact ID');

  // Server-side validation
  if (!body.name || !body.name.trim()) {
    return NextResponse.json({ success: false, error: 'Contact name is required.' }, { status: 400 });
  }
  if (body.email && body.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email.trim())) {
      return NextResponse.json({ success: false, error: 'Invalid email address format.' }, { status: 400 });
    }
  }

  const updatePayload = {
    client_id: body.client_id ? Number(body.client_id) : null,
    name: body.name.trim(),
    designation: body.designation?.trim() || null,
    department: body.department?.trim() || null,
    email: body.email?.trim() || null,
    phone: body.phone?.trim() || null,
    social_linkedin: body.social_linkedin?.trim() || null,
    social_twitter: body.social_twitter?.trim() || null,
    notes: body.notes?.trim() || null,
    is_primary: !!body.is_primary
  };

  const { data, error } = await supabase
    .from('client_contacts')
    .update(updatePayload)
    .eq('id', body.id)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error) {
    console.error('Contact update failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to update contact. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data
  });
}, { requireAuth: true, roles: ['Manager'] });

export const DELETE = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const supabase = getAdminRouteSupabase();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) throw new BadRequestError('Missing contact ID');

  const { error } = await supabase
    .from('client_contacts')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('Contact delete failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete contact.' }, { status: 500 });
  }

  return NextResponse.json({
    success: true
  });
}, { requireAuth: true, roles: ['Manager'] });
