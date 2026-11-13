import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase, resolveTenantId } from '@/server/supabase/route-helpers';
import { certificationSchema } from '@/server/validation/training';

export const GET = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const searchParams = new URL(request.url).searchParams;
  const employeeId = searchParams.get('employeeId');

  let query = supabase
    .from('certifications')
    .select('*')
    .eq('tenant_id', tenantId);

  if (employeeId) {
    query = query.eq('employee_id', Number(employeeId));
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data || []);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const body = await request.json();
  const validated = certificationSchema.parse({
    ...body,
    issueDate: body.issueDate || null,
    expiryDate: body.expiryDate || null,
    verificationStatus: body.verificationStatus || 'verified'
  });

  const { data, error } = await supabase
    .from('certifications')
    .insert({
      tenant_id: tenantId,
      employee_id: validated.employeeId,
      name: validated.name,
      issuing_organization: validated.issuingOrganization,
      credential_id: validated.credentialId || null,
      issue_date: validated.issueDate || null,
      expiry_date: validated.expiryDate || null,
      verification_status: validated.verificationStatus || 'verified',
    })
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

export const PUT = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const body = await request.json();
  const { id, verificationStatus } = body;
  if (!id || !verificationStatus) throw new BadRequestError('id and verificationStatus are required');

  const { data, error } = await supabase
    .from('certifications')
    .update({
      verification_status: verificationStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', Number(id))
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

export const DELETE = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const searchParams = new URL(request.url).searchParams;
  const id = searchParams.get('id');
  if (!id) throw new BadRequestError('id is required');

  const { error } = await supabase
    .from('certifications')
    .delete()
    .eq('id', Number(id))
    .eq('tenant_id', tenantId);

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json({ success: true });
}, { requireAuth: true });
