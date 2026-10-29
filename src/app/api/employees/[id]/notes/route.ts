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

  if (error) {
    if (error.message?.includes('schema cache') || error.message?.includes('does not exist') || error.code === 'PGRST205') {
      const { data: employee } = await supabase
        .from('employees')
        .select('skills')
        .eq('id', Number(employeeId))
        .single();
      const skillsObj = typeof employee?.skills === 'object' && employee.skills ? (employee.skills as Record<string, any>) : {};
      const list = Array.isArray(skillsObj.notes_list) ? skillsObj.notes_list : [];
      return NextResponse.json(buildListResponse(list, list.length, 1, limit, 'Notes fetched successfully'));
    }
    throw new Error(error.message);
  }

  return NextResponse.json(buildListResponse(
    (data as Record<string, unknown>[] | null) ?? [],
    Number(count ?? 0),
    Math.floor(offset / limit) + 1,
    limit,
    'Notes fetched successfully'
  ));
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  const authUserId = context.auth?.user.id;
  if (!tenantId) throw new BadRequestError('Auth required');

  const url = new URL(request.url);
  const employeeId = url.pathname.split('/').at(-2);
  if (!employeeId || isNaN(Number(employeeId))) throw new BadRequestError('Valid employee ID required');

  const rawJson = await request.json().catch(() => ({}));
  const payload = createNoteSchema.parse({
    employeeId: Number(employeeId),
    ...rawJson,
  });
  const supabase = getAdminRouteSupabase();

  const { data: employee } = await supabase
    .from('employees')
    .select('id, skills')
    .eq('id', Number(employeeId))
    .eq('tenant_id', tenantId)
    .single();
  if (!employee) throw new NotFoundError('Employee not found');

  const now = new Date().toISOString();
  const insertPayload = {
    ...denormalizePayload(payload as unknown as Record<string, unknown>, ['employeeId', 'isPrivate']),
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

  let finalNote: Record<string, unknown>;

  if (error) {
    if (error.message?.includes('schema cache') || error.message?.includes('does not exist') || error.code === 'PGRST205') {
      const existingSkills = typeof employee.skills === 'object' && employee.skills ? (employee.skills as Record<string, any>) : {};
      const existingList = Array.isArray(existingSkills.notes_list) ? existingSkills.notes_list : [];
      const newNote: Record<string, unknown> = {
        id: Date.now(),
        employeeId: Number(employeeId),
        employee_id: Number(employeeId),
        title: payload.title || null,
        content: payload.content,
        noteType: payload.noteType,
        note_type: payload.noteType,
        visibility: payload.visibility,
        created_by: authUserId,
        created_at: now,
        updated_at: now,
      };
      const updatedList = [newNote, ...existingList];
      await supabase
        .from('employees')
        .update({
          skills: {
            ...existingSkills,
            notes_list: updatedList,
          },
          updated_at: now,
        })
        .eq('id', Number(employeeId));

      finalNote = newNote;
    } else {
      throw new Error(error.message);
    }
  } else if (data) {
    finalNote = data as Record<string, unknown>;
  } else {
    throw new Error('Failed to create note');
  }

  // Timeline (non-blocking)
  await supabase.from('employee_timeline').insert({
    tenant_id: tenantId,
    employee_id: Number(employeeId),
    event_type: 'note_added',
    event_title: `Note added: ${payload.title || 'Confidential Note'}`,
    event_description: payload.noteType,
    event_data: { noteId: finalNote.id },
    triggered_by: authUserId,
    created_at: now,
  }).then(() => {}).catch(() => {});

  return NextResponse.json(buildSingleResponse(finalNote, 'Note created successfully'), { status: 201 });
}, { requireAuth: true, roles: ['Employee'] });

export const PUT = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const url = new URL(request.url);
  const noteId = Number(url.searchParams.get('noteId') || url.searchParams.get('id'));
  if (!noteId || isNaN(noteId)) throw new BadRequestError('Valid noteId required');

  const payload = updateNoteSchema.parse(await request.json());
  const supabase = getAdminRouteSupabase();

  const updatePayload = {
    ...denormalizePayload(payload as unknown as Record<string, unknown>),
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

  return NextResponse.json(buildSingleResponse(data as Record<string, unknown>, 'Note updated'));
}, { requireAuth: true, roles: ['Employee'] });

export const DELETE = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const url = new URL(request.url);
  const employeeId = url.pathname.split('/').at(-2);
  const noteId = Number(url.searchParams.get('noteId') || url.searchParams.get('id'));
  if (!noteId || isNaN(noteId)) throw new BadRequestError('Valid noteId required');

  const supabase = getAdminRouteSupabase();
  const { error } = await supabase
    .from('employee_notes')
    .delete()
    .eq('id', noteId)
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
        const existingList = Array.isArray(existingSkills.notes_list) ? existingSkills.notes_list : [];
        const updatedList = existingList.filter((n: any) => Number(n.id) !== noteId);
        await supabase
          .from('employees')
          .update({
            skills: {
              ...existingSkills,
              notes_list: updatedList,
            },
          })
          .eq('id', Number(employeeId));
        return NextResponse.json({ success: true, message: 'Note deleted successfully' });
      }
    }
    throw new Error(error.message);
  }

  return NextResponse.json({ success: true, message: 'Note deleted successfully' });
}, { requireAuth: true, roles: ['Employee'] });
