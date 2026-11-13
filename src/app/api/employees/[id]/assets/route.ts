import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, NotFoundError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { createAssetSchema, updateAssetSchema } from '@/server/validation/elm';
import { normalizeRow, denormalizePayload, buildListResponse, buildSingleResponse } from '@/server/supabase/elm-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const url = new URL(request.url);
  const employeeId = url.pathname.split('/').at(-2); // /api/employees/[id]/assets
  if (!employeeId || isNaN(Number(employeeId))) throw new BadRequestError('Valid employee ID required');

  const limit = Math.min(Number(url.searchParams.get('limit') ?? '50'), 100);
  const offset = Math.max(Number(url.searchParams.get('offset') ?? '0'), 0);
  const status = url.searchParams.get('status');
  const assetType = url.searchParams.get('type');

  const supabase = getAdminRouteSupabase();

  let query = supabase
    .from('employee_assets')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .eq('employee_id', Number(employeeId));

  if (status) query = query.eq('status', status);
  if (assetType) query = query.eq('asset_type', assetType);

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    if (error.message?.includes('schema cache') || error.message?.includes('does not exist') || error.code === 'PGRST205') {
      const { data: employee } = await supabase
        .from('employees')
        .select('skills')
        .eq('id', Number(employeeId))
        .single();
      const skillsObj = typeof employee?.skills === 'object' && employee.skills ? (employee.skills as Record<string, any>) : {};
      const list = Array.isArray(skillsObj.assets_list) ? skillsObj.assets_list : [];
      return NextResponse.json(buildListResponse(list, list.length, 1, limit, 'Assets fetched successfully'));
    }
    throw new Error(error.message);
  }

  const rows = ((data as Record<string, unknown>[] | null) ?? []).map((row) => {
    const norm = normalizeRow(row);
    if (!norm.issuedDate && (norm.issueDate || row.issue_date)) {
      norm.issuedDate = norm.issueDate || row.issue_date;
    }
    return norm;
  });

  return NextResponse.json(buildListResponse(
    rows,
    Number(count ?? 0),
    Math.floor(offset / limit) + 1,
    limit,
    'Assets fetched successfully'
  ));
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  const authUserId = context.auth?.user.id;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const url = new URL(request.url);
  const employeeId = url.pathname.split('/').at(-2);
  if (!employeeId || isNaN(Number(employeeId))) throw new BadRequestError('Valid employee ID required');

  const rawJson = await request.json().catch(() => ({}));
  const payload = createAssetSchema.parse({
    employeeId: Number(employeeId),
    ...rawJson,
  });

  const supabase = getAdminRouteSupabase();

  // Verify employee exists and belongs to tenant
  const { data: employee } = await supabase
    .from('employees')
    .select('id, skills')
    .eq('id', Number(employeeId))
    .eq('tenant_id', tenantId)
    .single();
  if (!employee) throw new NotFoundError('Employee not found');

  const now = new Date().toISOString();
  const effectiveIssueDate = payload.issueDate || payload.issuedDate || now.split('T')[0];

  const insertPayload = {
    ...denormalizePayload(payload as unknown as Record<string, unknown>, ['employeeId', 'issuedDate']),
    issue_date: effectiveIssueDate,
    employee_id: Number(employeeId),
    tenant_id: tenantId,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from('employee_assets')
    .insert(insertPayload)
    .select('*')
    .single();

  let finalAsset: Record<string, unknown>;

  if (error) {
    if (error.message?.includes('schema cache') || error.message?.includes('does not exist') || error.code === 'PGRST205') {
      const existingSkills = typeof employee.skills === 'object' && employee.skills ? (employee.skills as Record<string, any>) : {};
      const existingList = Array.isArray(existingSkills.assets_list) ? existingSkills.assets_list : [];
      const newAsset: Record<string, unknown> = {
        id: Date.now(),
        employeeId: Number(employeeId),
        employee_id: Number(employeeId),
        assetType: payload.assetType,
        asset_type: payload.assetType,
        assetName: payload.assetName,
        asset_name: payload.assetName,
        serialNumber: payload.serialNumber || null,
        serial_number: payload.serialNumber || null,
        brand: payload.brand || null,
        model: payload.model || null,
        specification: payload.specification || null,
        issueDate: effectiveIssueDate,
        issue_date: effectiveIssueDate,
        issuedDate: effectiveIssueDate,
        returnDate: payload.returnDate || null,
        return_date: payload.returnDate || null,
        condition: payload.condition || 'good',
        status: payload.status || 'issued',
        notes: payload.notes || null,
        created_at: now,
        updated_at: now,
      };
      const updatedList = [newAsset, ...existingList];
      await supabase
        .from('employees')
        .update({
          skills: {
            ...existingSkills,
            assets_list: updatedList,
          },
          updated_at: now,
        })
        .eq('id', Number(employeeId));

      finalAsset = newAsset;
    } else {
      throw new Error(error.message);
    }
  } else if (data) {
    finalAsset = {
      ...data,
      issuedDate: (data as any).issue_date || effectiveIssueDate,
      issueDate: (data as any).issue_date || effectiveIssueDate,
    };
  } else {
    throw new Error('Failed to create asset');
  }

  // Log to timeline (non-blocking)
  await supabase.from('employee_timeline').insert({
    tenant_id: tenantId,
    employee_id: Number(employeeId),
    event_type: 'asset_issued',
    event_title: `Asset issued: ${payload.assetName}`,
    event_description: `${payload.assetType} - ${payload.assetName}${payload.serialNumber ? ` (S/N: ${payload.serialNumber})` : ''}`,
    event_data: { assetId: finalAsset.id, assetType: payload.assetType },
    triggered_by: authUserId,
    created_at: now,
  }).then(() => {}).catch(() => {});

  return NextResponse.json(buildSingleResponse(finalAsset, 'Asset created successfully'), { status: 201 });
}, { requireAuth: true, roles: ['Employee'] });

export const PUT = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const url = new URL(request.url);
  const assetId = Number(url.searchParams.get('assetId'));
  if (!assetId || isNaN(assetId)) throw new BadRequestError('Valid assetId query parameter required');

  const payload = updateAssetSchema.parse(await request.json());
  const supabase = getAdminRouteSupabase();

  const updatePayload = {
    ...denormalizePayload(payload as unknown as Record<string, unknown>),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('employee_assets')
    .update(updatePayload)
    .eq('id', assetId)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error || !data) throw error ? new Error(error.message) : new NotFoundError('Asset not found');

  return NextResponse.json(buildSingleResponse(data as Record<string, unknown>, 'Asset updated successfully'));
}, { requireAuth: true, roles: ['Employee'] });

export const DELETE = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const url = new URL(request.url);
  const employeeId = url.pathname.split('/').at(-2);
  const assetId = Number(url.searchParams.get('assetId') || url.searchParams.get('id'));
  if (!assetId || isNaN(assetId)) throw new BadRequestError('Valid assetId query parameter required');

  const supabase = getAdminRouteSupabase();
  const { error } = await supabase
    .from('employee_assets')
    .delete()
    .eq('id', assetId)
    .eq('tenant_id', tenantId);

  if (error) {
    if (error.message?.includes('schema cache') || error.message?.includes('does not exist') || error.code === 'PGRST205') {
      if (employeeId && !isNaN(Number(employeeId))) {
        const { data: employee } = await supabase
          .from('employees')
          .select('skills')
          .eq('id', Number(employeeId))
          .single();
        const existingSkills = typeof employee?.skills === 'object' && employee?.skills ? (employee.skills as Record<string, any>) : {};
        const existingList = Array.isArray(existingSkills.assets_list) ? existingSkills.assets_list : [];
        const updatedList = existingList.filter((a: any) => Number(a.id) !== assetId);
        await supabase
          .from('employees')
          .update({
            skills: {
              ...existingSkills,
              assets_list: updatedList,
            },
          })
          .eq('id', Number(employeeId));
        return NextResponse.json({ success: true, message: 'Asset deleted successfully' });
      }
    }
    throw new Error(error.message);
  }

  return NextResponse.json({ success: true, message: 'Asset deleted successfully' });
}, { requireAuth: true, roles: ['Employee'] });
