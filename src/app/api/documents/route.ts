import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, NotFoundError } from '@/server/http/errors';
import { getAdminRouteSupabase, getCurrentSupabaseActor, resolveTenantId } from '@/server/supabase/route-helpers';
import { employeeDocumentSchema } from '@/server/validation/documents';

export const GET = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const searchParams = new URL(request.url).searchParams;
  let employeeId = searchParams.get('employeeId');

  const user = context.auth?.user;
  const userRole = (user?.role || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const isAdminOrManager = ['admin', 'super_admin', 'superadmin', 'owner', 'ceo', 'cto', 'business_owner', 'hr_manager', 'project_manager'].includes(userRole);

  // If not admin, scope strictly to the employee's own records
  if (!isAdminOrManager) {
    const actor = context.auth?.accessToken ? await getCurrentSupabaseActor(context.auth.accessToken) : null;
    const userIdentifier = actor?.authUserId || user?.providerUserId || user?.id;

    const { data: selfEmp } = await supabase
      .from('employees')
      .select('id')
      .or(`user_id.eq.${userIdentifier},id.eq.${typeof userIdentifier === 'number' ? userIdentifier : 0}`)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (selfEmp) {
      employeeId = String(selfEmp.id);
    } else if (typeof user?.id === 'number') {
      employeeId = String(user.id);
    }
  }

  let query = supabase
    .from('employee_documents')
    .select('*')
    .eq('tenant_id', tenantId);

  if (employeeId) {
    query = query.eq('employee_id', Number(employeeId));
  }

  let docsResult = await query.order('created_at', { ascending: false });
  if (docsResult.error && docsResult.error.message.includes('created_at')) {
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
    document_name: d.document_name || d.name || 'Untitled Document',
    document_categories: (cats || []).find((c: any) => c.id === d.category_id) || (d.document_type ? { name: d.document_type.replace(/_/g, ' ') } : { name: 'Identity Proof' })
  }));

  return NextResponse.json(combined);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  const accessToken = context.auth?.accessToken;
  if (!tenantId) throw new BadRequestError('Tenant credentials required');

  let actorAuthUserId: string | null = null;
  if (accessToken) {
    try {
      const actor = await getCurrentSupabaseActor(accessToken);
      actorAuthUserId = actor.authUserId;
    } catch {
      // safe fallback
    }
  }

  const body = await request.json();
  const user = context.auth?.user;
  const userRole = (user?.role || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const isAdminOrManager = ['admin', 'super_admin', 'superadmin', 'owner', 'ceo', 'cto', 'business_owner', 'hr_manager', 'project_manager'].includes(userRole);

  // If employee self-uploading and employeeId is missing, resolve it
  let targetEmployeeId = body.employeeId ? Number(body.employeeId) : null;
  if (!isAdminOrManager || !targetEmployeeId) {
    const userIdentifier = actorAuthUserId || user?.providerUserId || user?.id;
    const { data: selfEmp } = await supabase
      .from('employees')
      .select('id')
      .or(`user_id.eq.${userIdentifier},id.eq.${typeof userIdentifier === 'number' ? userIdentifier : 0}`)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (selfEmp) {
      targetEmployeeId = selfEmp.id;
    } else if (typeof user?.id === 'number') {
      targetEmployeeId = user.id;
    }
  }

  if (!targetEmployeeId) {
    throw new BadRequestError('Target employee could not be resolved');
  }

  const validated = employeeDocumentSchema.parse({
    ...body,
    employeeId: targetEmployeeId
  });

  const { data, error } = await supabase
    .from('employee_documents')
    .insert({
      tenant_id: tenantId,
      employee_id: validated.employeeId,
      category_id: validated.categoryId,
      name: validated.documentName,
      document_name: validated.documentName,
      document_type: 'other',
      uploaded_by: actorAuthUserId || String(user?.id || ''),
      file_url: validated.fileUrl || '',
      expiry_date: validated.expiryDate || null,
      verification_status: 'pending',
      version: 1,
    })
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

// PUT: Re-upload / Update existing document (e.g., after HR rejection)
export const PUT = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const body = await request.json();
  const { id, fileUrl, documentName, categoryId } = body;
  if (!id || !fileUrl) throw new BadRequestError('Document id and fileUrl are required');

  const { data: existing, error: findError } = await supabase
    .from('employee_documents')
    .select('*')
    .eq('id', Number(id))
    .eq('tenant_id', tenantId)
    .single();

  if (findError || !existing) throw new NotFoundError('Document record not found');

  const newVersion = (existing.version || 1) + 1;

  // Reset status to 'pending' and clear rejection reason so HR can review the new file
  const { data: updated, error: updateError } = await supabase
    .from('employee_documents')
    .update({
      file_url: fileUrl,
      document_name: documentName || existing.document_name,
      name: documentName || existing.name,
      category_id: categoryId || existing.category_id,
      verification_status: 'pending',
      rejection_reason: null,
      verified_by: null,
      verified_at: null,
      version: newVersion,
      created_at: new Date().toISOString()
    })
    .eq('id', Number(id))
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (updateError) throw new BadRequestError(updateError.message);

  // Track version history in document_versions table if exists
  try {
    await supabase.from('document_versions').insert({
      tenant_id: tenantId,
      document_id: Number(id),
      version: newVersion,
      file_url: fileUrl,
      change_summary: 'Re-uploaded document submitted for review'
    });
  } catch (vErr) {
    console.warn('document_versions note:', vErr);
  }

  return NextResponse.json({
    success: true,
    data: updated,
    message: 'Document re-uploaded successfully and submitted for review.'
  });
}, { requireAuth: true });

export const DELETE = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const searchParams = new URL(request.url).searchParams;
  const id = searchParams.get('id');
  if (!id) throw new BadRequestError('id is required');

  const { error } = await supabase
    .from('employee_documents')
    .delete()
    .eq('id', Number(id))
    .eq('tenant_id', tenantId);

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json({ success: true });
}, { requireAuth: true });
