import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase, getCurrentSupabaseActor } from '@/server/supabase/route-helpers';
import { employeeDocumentSchema } from '@/server/validation/documents';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const searchParams = new URL(request.url).searchParams;
  const employeeId = searchParams.get('employeeId');

  const supabase = getAdminRouteSupabase();
  let query = supabase
    .from('employee_documents')
    .select('*')
    .eq('tenant_id', tenantId);

  if (employeeId) {
    query = query.eq('employee_id', Number(employeeId));
  }

  let docsResult = await query.order('created_at', { ascending: false });
  if (docsResult.error && docsResult.error.message.includes('created_at')) {
    // Fallback to uploaded_at if created_at column is not yet migrated
    docsResult = await query.order('uploaded_at', { ascending: false });
  }
  const { data: docs, error: docsError } = docsResult;
  if (docsError) throw new BadRequestError(docsError.message);

  const { data: cats, error: catsError } = await supabase
    .from('document_categories')
    .select('*')
    .eq('tenant_id', tenantId);
  if (catsError) throw new BadRequestError(catsError.message);

  const combined = (docs || []).map((d: any) => ({
    ...d,
    document_categories: (cats || []).find((c: any) => c.id === d.category_id) || null
  }));

  return NextResponse.json(combined);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Tenant credentials required');

  const actor = await getCurrentSupabaseActor(accessToken);

  const body = await request.json();
  const validated = employeeDocumentSchema.parse(body);

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('employee_documents')
    .insert({
      tenant_id: tenantId,
      employee_id: validated.employeeId,
      category_id: validated.categoryId,
      name: validated.documentName,
      document_name: validated.documentName,
      document_type: 'other',
      uploaded_by: actor.authUserId,
      file_url: validated.fileUrl || '',
      expiry_date: validated.expiryDate || null,
      verification_status: 'pending',
    })
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

export const DELETE = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const searchParams = new URL(request.url).searchParams;
  const id = searchParams.get('id');
  if (!id) throw new BadRequestError('id is required');

  const supabase = getAdminRouteSupabase();
  const { error } = await supabase
    .from('employee_documents')
    .delete()
    .eq('id', Number(id))
    .eq('tenant_id', tenantId);

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json({ success: true });
}, { requireAuth: true });
