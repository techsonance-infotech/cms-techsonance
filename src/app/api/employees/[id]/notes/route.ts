import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, NotFoundError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { createNoteSchema, updateNoteSchema } from '@/server/validation/elm';
import { denormalizePayload, buildListResponse, buildSingleResponse } from '@/server/supabase/elm-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const url = new URL(request.url);
  const employeeId = url.pathname.split('/').at(-2);
  if (!employeeId || isNaN(Number(employeeId))) throw new BadRequestError('Valid employee ID required');

  const limit = Math.min(Number(url.searchParams.get('limit') ?? '50'), 100);
  const offset = Math.max(Number(url.searchParams.get('offset') ?? '0'), 0);
  const noteType = url.searchParams.get('noteType');

  const supabase = getAdminRouteSupabase();

  let query = supabase
    .from('employee_notes')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .eq('employee_id', Number(employeeId));

  if (noteType) query = query.eq('note_type', noteType);

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);

  return NextResponse.json(buildListResponse(
    (data as Record<string, unknown>[] | null) ?? [],
    Number(count ?? 0),
    Math.floor(offset / limit) + 1,
    limit,
    'Notes fetched successfully'
  ));
}, { requireAuth: true, roles: ['Manager'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  const authUserId = context.auth?.user.id;
  if (!tenantId || !authUserId) throw new BadRequestError('Auth required');

  const url = new URL(request.url);
  const employeeId = url.pathname.split('/').at(-2);
  if (!employeeId || isNaN(Number(employeeId))) throw new BadRequestError('Valid employee ID required');

  const payload = createNoteSchema.parse(await request.json());
  const supabase = getAdminRouteSupabase();

  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('id', Number(employeeId))
    .eq('tenant_id', tenantId)
    .single();
  if (!employee) throw new NotFoundError('Employee not found');

  const now = new Date().toISOString();
  const insertPayload = {
    ...denormalizePayload(payload as unknown as Record<string, unknown>, ['employeeId']),
    employee_id: Number(employeeId),
    tenant_id: tenantId,
    created_by: authUserId,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from('employee_notes')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error || !data) throw error ? new Error(error.message) : new Error('Failed to create note');

  // Timeline event
  await supabase.from('employee_timeline').insert({
    tenant_id: tenantId,
    employee_id: Number(employeeId),
    event_type: 'note_added',
    event_title: `Note added: ${payload.noteType}`,
    event_description: payload.title || payload.content.substring(0, 100),
    event_data: { noteId: data.id, noteType: payload.noteType },
    triggered_by: authUserId,
    created_at: now,
  }).then(() => {}).catch(() => {});

  return NextResponse.json(buildSingleResponse(data as Record<string, unknown>, 'Note created successfully'), { status: 201 });
}, { requireAuth: true, roles: ['Manager'] });

export const PUT = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  const authUserId = context.auth?.user.id;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const url = new URL(request.url);
  const noteId = Number(url.searchParams.get('noteId'));
  if (!noteId || isNaN(noteId)) throw new BadRequestError('Valid noteId required');

  const payload = updateNoteSchema.parse(await request.json());
  const supabase = getAdminRouteSupabase();

  const updatePayload = {
    ...denormalizePayload(payload as unknown as Record<string, unknown>),
    updated_by: authUserId,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('employee_notes')
    .update(updatePayload)
    .eq('id', noteId)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error || !data) throw error ? new Error(error.message) : new NotFoundError('Note not found');

  return NextResponse.json(buildSingleResponse(data as Record<string, unknown>, 'Note updated successfully'));
}, { requireAuth: true, roles: ['Manager'] });

export const DELETE = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const url = new URL(request.url);
  const noteId = Number(url.searchParams.get('noteId'));
  if (!noteId || isNaN(noteId)) throw new BadRequestError('Valid noteId required');

  const supabase = getAdminRouteSupabase();
  const { error } = await supabase
    .from('employee_notes')
    .delete()
    .eq('id', noteId)
    .eq('tenant_id', tenantId);

  if (error) throw new Error(error.message);

  return NextResponse.json({ success: true, message: 'Note deleted successfully' });
}, { requireAuth: true, roles: ['Manager'] });
