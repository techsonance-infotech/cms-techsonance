import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, NotFoundError } from '@/server/http/errors';
import { getAdminRouteSupabase, resolveTenantId } from '@/server/supabase/route-helpers';
import { listSupabaseProfilesByAuthIds } from '@/server/supabase/users';
import {
  buildDraftDisplayName,
  computeEmployeeDraftCompletion,
  employeeDraftPayloadSchema,
  sanitizeDraftFormData,
} from '@/shared/validation/employee';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isMissingTableError(error: any): boolean {
  if (!error) return false;
  const code = String(error.code ?? '');
  const msg = String(error.message ?? '').toLowerCase();
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    (msg.includes('employee_drafts') && (msg.includes('does not exist') || msg.includes('schema cache')))
  );
}

function getActorAuthUserId(context: any): string | null {
  const candidate = context.auth?.user?.providerUserId || context.auth?.user?.id;
  if (typeof candidate === 'string' && UUID_REGEX.test(candidate)) {
    return candidate;
  }
  return null;
}

function normalizeDraftRow(
  row: Record<string, any>,
  profilesMap?: Map<string, any>
) {
  const creator = row.created_by && profilesMap ? profilesMap.get(String(row.created_by)) : null;
  const updater = row.updated_by && profilesMap ? profilesMap.get(String(row.updated_by)) : null;
  const rawFormData =
    row.form_data && typeof row.form_data === 'object' && !Array.isArray(row.form_data)
      ? sanitizeDraftFormData(row.form_data)
      : {};

  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    displayName: row.display_name || buildDraftDisplayName(rawFormData),
    email: row.email ?? (typeof rawFormData.email === 'string' ? rawFormData.email : null),
    department: row.department ?? (typeof rawFormData.department === 'string' ? rawFormData.department : null),
    designation: row.designation ?? (typeof rawFormData.designation === 'string' ? rawFormData.designation : null),
    employeeIdPreview:
      row.employee_id_preview ??
      (typeof rawFormData.employeeId === 'string' ? rawFormData.employeeId : null),
    currentStep: row.current_step || 'personal',
    completionPercent:
      typeof row.completion_percent === 'number'
        ? row.completion_percent
        : computeEmployeeDraftCompletion(rawFormData),
    formData: rawFormData,
    status: row.status || 'draft',
    createdBy: row.created_by ?? null,
    createdByName: creator ? `${creator.first_name} ${creator.last_name}`.trim() : null,
    updatedBy: row.updated_by ?? null,
    updatedByName: updater ? `${updater.first_name} ${updater.last_name}`.trim() : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const GET = withApiHandler(
  async (request, context) => {
    const searchParams = new URL(request.url).searchParams;
    const id = searchParams.get('id');

    const supabase = getAdminRouteSupabase();
    let tenantId = context.auth?.user?.tenantId;
    if (!tenantId) {
      tenantId = await resolveTenantId(context, supabase);
    }
    if (!tenantId) {
      throw new BadRequestError('Authorization and tenant info required');
    }

    if (id) {
      if (!UUID_REGEX.test(id)) {
        throw new BadRequestError('Valid draft id is required');
      }

      const { data, error } = await supabase
        .from('employee_drafts')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error) {
        if (isMissingTableError(error)) {
          throw new BadRequestError(
            'Employee drafts table is not initialized. Please run migration 20261118_employee_drafts.sql.'
          );
        }
        throw error;
      }

      if (!data) {
        throw new NotFoundError('Employee draft not found');
      }

      const authorIds = [data.created_by, data.updated_by].filter(Boolean).map(String);
      const profilesMap = await listSupabaseProfilesByAuthIds(authorIds, {
        useAdmin: true,
        tenantId,
      });

      return NextResponse.json({
        success: true,
        data: normalizeDraftRow(data, profilesMap),
      });
    }

    const limit = Math.min(Number(searchParams.get('limit') ?? '50'), 100);
    const { data, error } = await supabase
      .from('employee_drafts')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'draft')
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      if (isMissingTableError(error)) {
        return NextResponse.json({
          success: true,
          data: [],
          meta: { total: 0, migrationRequired: true },
          message: 'Employee drafts migration not applied yet.',
        });
      }
      throw error;
    }

    const rows = (data as Record<string, any>[] | null) ?? [];
    const authorIds = Array.from(
      new Set(
        rows
          .flatMap((row) => [row.created_by, row.updated_by])
          .filter(Boolean)
          .map(String)
      )
    );
    const profilesMap = await listSupabaseProfilesByAuthIds(authorIds, {
      useAdmin: true,
      tenantId,
    });

    const normalized = rows.map((row) => normalizeDraftRow(row, profilesMap));

    return NextResponse.json({
      success: true,
      data: normalized,
      meta: { total: normalized.length, migrationRequired: false },
    });
  },
  { requireAuth: true, roles: ['Manager'] }
);

export const POST = withApiHandler(
  async (request, context) => {
    const payload = employeeDraftPayloadSchema.parse(await request.json());

    const supabase = getAdminRouteSupabase();
    let tenantId = context.auth?.user?.tenantId;
    if (!tenantId) {
      tenantId = await resolveTenantId(context, supabase);
    }
    if (!tenantId) {
      throw new BadRequestError('Authorization and tenant info required');
    }

    const actorAuthUserId = getActorAuthUserId(context);
    const sanitizedFormData = sanitizeDraftFormData(payload.formData);
    const now = new Date().toISOString();

    const summaryFields = {
      display_name: buildDraftDisplayName(sanitizedFormData),
      email: typeof sanitizedFormData.email === 'string' && sanitizedFormData.email.trim()
        ? sanitizedFormData.email.trim().toLowerCase()
        : null,
      department: typeof sanitizedFormData.department === 'string' && sanitizedFormData.department.trim()
        ? sanitizedFormData.department.trim()
        : null,
      designation: typeof sanitizedFormData.designation === 'string' && sanitizedFormData.designation.trim()
        ? sanitizedFormData.designation.trim()
        : null,
      employee_id_preview: typeof sanitizedFormData.employeeId === 'string' && sanitizedFormData.employeeId.trim()
        ? sanitizedFormData.employeeId.trim()
        : null,
      current_step: payload.currentStep,
      completion_percent: computeEmployeeDraftCompletion(sanitizedFormData),
      form_data: sanitizedFormData,
      status: 'draft',
      updated_by: actorAuthUserId,
      updated_at: now,
    };

    // Upsert if a draft ID was supplied
    if (payload.id) {
      const { data: updated, error: updateError } = await supabase
        .from('employee_drafts')
        .update(summaryFields)
        .eq('id', payload.id)
        .eq('tenant_id', tenantId)
        .select('*')
        .maybeSingle();

      if (updateError) {
        if (isMissingTableError(updateError)) {
          throw new BadRequestError(
            'Employee drafts table is not initialized. Please run migration 20261118_employee_drafts.sql.'
          );
        }
        throw updateError;
      }

      if (updated) {
        return NextResponse.json({
          success: true,
          data: normalizeDraftRow(updated),
          message: 'Employee draft updated',
        });
      }
    }

    const { data, error } = await supabase
      .from('employee_drafts')
      .insert({
        tenant_id: tenantId,
        created_by: actorAuthUserId,
        created_at: now,
        ...summaryFields,
      })
      .select('*')
      .single();

    if (error || !data) {
      if (isMissingTableError(error)) {
        throw new BadRequestError(
          'Employee drafts table is not initialized. Please run migration 20261118_employee_drafts.sql.'
        );
      }
      throw error ?? new Error('Failed to create employee draft');
    }

    return NextResponse.json(
      {
        success: true,
        data: normalizeDraftRow(data),
        message: 'Employee draft saved',
      },
      { status: 201 }
    );
  },
  { requireAuth: true, roles: ['Manager'] }
);

export const PUT = withApiHandler(
  async (request, context) => {
    const searchParams = new URL(request.url).searchParams;
    const id = searchParams.get('id');
    if (!id || !UUID_REGEX.test(id)) {
      throw new BadRequestError('Valid draft id is required');
    }

    const payload = employeeDraftPayloadSchema.parse(await request.json());

    const supabase = getAdminRouteSupabase();
    let tenantId = context.auth?.user?.tenantId;
    if (!tenantId) {
      tenantId = await resolveTenantId(context, supabase);
    }
    if (!tenantId) {
      throw new BadRequestError('Authorization and tenant info required');
    }

    const actorAuthUserId = getActorAuthUserId(context);
    const sanitizedFormData = sanitizeDraftFormData(payload.formData);
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('employee_drafts')
      .update({
        display_name: buildDraftDisplayName(sanitizedFormData),
        email: typeof sanitizedFormData.email === 'string' && sanitizedFormData.email.trim()
          ? sanitizedFormData.email.trim().toLowerCase()
          : null,
        department: typeof sanitizedFormData.department === 'string' && sanitizedFormData.department.trim()
          ? sanitizedFormData.department.trim()
          : null,
        designation: typeof sanitizedFormData.designation === 'string' && sanitizedFormData.designation.trim()
          ? sanitizedFormData.designation.trim()
          : null,
        employee_id_preview: typeof sanitizedFormData.employeeId === 'string' && sanitizedFormData.employeeId.trim()
          ? sanitizedFormData.employeeId.trim()
          : null,
        current_step: payload.currentStep,
        completion_percent: computeEmployeeDraftCompletion(sanitizedFormData),
        form_data: sanitizedFormData,
        updated_by: actorAuthUserId,
        updated_at: now,
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('*')
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error)) {
        throw new BadRequestError(
          'Employee drafts table is not initialized. Please run migration 20261118_employee_drafts.sql.'
        );
      }
      throw error;
    }

    if (!data) {
      throw new NotFoundError('Employee draft not found');
    }

    return NextResponse.json({
      success: true,
      data: normalizeDraftRow(data),
      message: 'Employee draft updated',
    });
  },
  { requireAuth: true, roles: ['Manager'] }
);

export const DELETE = withApiHandler(
  async (request, context) => {
    const searchParams = new URL(request.url).searchParams;
    const id = searchParams.get('id');
    if (!id || !UUID_REGEX.test(id)) {
      throw new BadRequestError('Valid draft id is required');
    }

    const supabase = getAdminRouteSupabase();
    let tenantId = context.auth?.user?.tenantId;
    if (!tenantId) {
      tenantId = await resolveTenantId(context, supabase);
    }
    if (!tenantId) {
      throw new BadRequestError('Authorization and tenant info required');
    }

    const { error } = await supabase
      .from('employee_drafts')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      if (isMissingTableError(error)) {
        return NextResponse.json({ success: true, message: 'Draft cleared' });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Employee draft deleted successfully',
    });
  },
  { requireAuth: true, roles: ['Manager'] }
);

