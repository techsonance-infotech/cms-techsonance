import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, ConflictError, NotFoundError } from '@/server/http/errors';
import { apiSuccess } from '@/server/http/response';
import { companyHolidaySchema, updateCompanyHolidaySchema } from '@/server/validation/settings';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { getSupabaseAdminClient } from '@/server/supabase/admin';

function normalizeSupabaseCompanyHoliday(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    date: row.date,
    reason: row.reason,
    year: Number(row.year),
    createdAt: row.created_at ?? null,
  };
}

export const GET = withApiHandler(async (request, context) => {
  const searchParams = new URL(request.url).searchParams;
  const id = searchParams.get('id');

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');
  const supabase = getAdminRouteSupabase();

  if (id) {
    const holidayId = Number(id);
    if (!Number.isInteger(holidayId) || holidayId <= 0) {
      throw new BadRequestError('Valid company holiday id is required');
    }

    // Attempt to heal the sequence via raw SQL using Admin privileges
    try {
      const admin = getSupabaseAdminClient() as any;
      await admin.rpc('exec_sql', {
        query: `SELECT setval(pg_get_serial_sequence('public.company_holidays', 'id'), COALESCE((SELECT MAX(id) FROM public.company_holidays), 0) + 1, false)`
      });
    } catch {
      // If RPC doesn't exist, the retry may still work if the collision was transient
    }

    const { data: holiday, error } = await supabase
      .from('company_holidays')
      .select('*')
      .eq('id', holidayId)
      .eq('tenant_id', tenantId)
      .single();
    if (error || !holiday) throw new NotFoundError('Company holiday not found');
    return apiSuccess(normalizeSupabaseCompanyHoliday(holiday), 'Company holiday fetched successfully');
  }

  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? '10'), 1), 100);
  const offset = Math.max(Number(searchParams.get('offset') ?? '0'), 0);
  const year = searchParams.get('year');
  let query = supabase
    .from('company_holidays')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId);

  if (year !== null) {
    const parsedYear = Number(year);
    if (!Number.isInteger(parsedYear) || parsedYear < 1000 || parsedYear > 9999) {
      throw new BadRequestError('Year must be a valid 4-digit number');
    }
    query = query.eq('year', parsedYear);
  }

  const { data, count, error } = await query
    .order('date', { ascending: searchParams.get('order') !== 'desc' })
    .range(offset, offset + limit - 1);
  if (error) throw error;

  let rawList = ((data as Record<string, unknown>[] | null) ?? []).map(normalizeSupabaseCompanyHoliday);

  // Also merge any holidays from holiday_master for this tenant
  try {
    const { data: hmData } = await supabase
      .from('holiday_master')
      .select('*')
      .eq('tenant_id', tenantId);

    if (hmData && hmData.length > 0) {
      const existingDates = new Set(rawList.map((h: any) => h.date));
      let pseudoId = (rawList.length > 0 ? Math.max(...rawList.map((h: any) => h.id)) : 0) + 1000;

      for (const hm of hmData) {
        if (!existingDates.has(hm.holiday_date)) {
          const hmYear = parseInt((hm.holiday_date || '').slice(0, 4), 10);
          const filterYear = year !== null ? Number(year) : null;
          if (filterYear === null || filterYear === hmYear) {
            existingDates.add(hm.holiday_date);
            rawList.push({
              id: pseudoId++,
              date: hm.holiday_date,
              reason: hm.title,
              year: hmYear,
              createdAt: hm.created_at ?? null
            });
          }
        }
      }
    }
  } catch (hmErr) {
    console.warn('holiday_master merge notice in company-holidays:', hmErr);
  }

  // Sort by date
  rawList.sort((a: any, b: any) => (a.date || '').localeCompare(b.date || ''));

  return apiSuccess(
    rawList,
    'Company holidays fetched successfully',
    { meta: { page: Math.floor(offset / limit) + 1, limit, total: Math.max(Number(count ?? 0), rawList.length) } }
  );
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const payload = companyHolidaySchema.parse(await request.json());
  const year = payload.year ?? Number(payload.date.slice(0, 4));

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');
  const supabase = getAdminRouteSupabase();

  // Manual ID Generation to bypass broken database sequences
  const { data: maxRecord } = await supabase
    .from('company_holidays')
    .select('id')
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextId = (maxRecord?.id || 0) + 1;

  const { data: existing } = await supabase
    .from('company_holidays')
    .select('id')
    .eq('date', payload.date)
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (existing) {
    throw new ConflictError('A company holiday already exists for that date');
  }

  const { data: created, error } = await supabase.from('company_holidays').insert({
    id: nextId,
    date: payload.date,
    reason: payload.reason.trim(),
    year,
    tenant_id: tenantId,
    created_at: new Date().toISOString(),
  }).select('*').single();
  if (error || !created) throw error ?? new Error('Failed to create company holiday');

  // Also sync to holiday_master
  try {
    const { data: existingHm } = await supabase
      .from('holiday_master')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('holiday_date', payload.date)
      .maybeSingle();

    if (!existingHm) {
      await supabase.from('holiday_master').insert({
        tenant_id: tenantId,
        title: payload.reason.trim(),
        holiday_date: payload.date,
        holiday_type: 'company',
        scope_target: 'Global',
        is_recurring: true,
        is_optional_rh: false,
        impact_level: 'High',
        description: 'Added via Company Holidays register'
      });
    }
  } catch (hmSyncErr) {
    console.warn('Sync to holiday_master notice:', hmSyncErr);
  }

  return apiSuccess(normalizeSupabaseCompanyHoliday(created), 'Company holiday created successfully', { status: 201 });
}, { requireAuth: true, roles: ['Employee'] });

export const PUT = withApiHandler(async (request, context) => {
  const holidayId = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(holidayId) || holidayId <= 0) {
    throw new BadRequestError('Valid company holiday id is required');
  }

  const payload = updateCompanyHolidaySchema.parse(await request.json());
  if (Object.keys(payload).length === 0) {
    throw new BadRequestError('At least one field is required to update a company holiday');
  }

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');
  const supabase = getAdminRouteSupabase();
  const { data: existing } = await supabase
    .from('company_holidays')
    .select('*')
    .eq('id', holidayId)
    .eq('tenant_id', tenantId)
    .single();
  if (!existing) {
    throw new NotFoundError('Company holiday not found');
  }

  const nextDate = payload.date ?? String(existing.date);
  const { data: duplicate } = await supabase
    .from('company_holidays')
    .select('id')
    .eq('date', nextDate)
    .eq('tenant_id', tenantId)
    .single();
  if (duplicate && Number(duplicate.id) !== holidayId) {
    throw new ConflictError('A company holiday already exists for that date');
  }

  const { data: updated, error } = await supabase.from('company_holidays').update({
    ...(payload.date !== undefined ? { date: payload.date } : {}),
    ...(payload.reason !== undefined ? { reason: payload.reason.trim() } : {}),
    ...(payload.reason !== undefined ? { reason: payload.reason.trim() } : {}),
    year: payload.year ?? Number(nextDate.slice(0, 4)),
  })
  .eq('id', holidayId)
  .eq('tenant_id', tenantId)
  .select('*')
  .single();
  if (error || !updated) throw error ?? new Error('Failed to update company holiday');
  return apiSuccess(normalizeSupabaseCompanyHoliday(updated), 'Company holiday updated successfully');
}, { requireAuth: true, roles: ['Admin'] });

export const DELETE = withApiHandler(async (request, context) => {
  const holidayId = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(holidayId) || holidayId <= 0) {
    throw new BadRequestError('Valid company holiday id is required');
  }

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');
  const supabase = getAdminRouteSupabase();
  const { data: existing } = await supabase
    .from('company_holidays')
    .select('id')
    .eq('id', holidayId)
    .eq('tenant_id', tenantId)
    .single();
  if (!existing) {
    throw new NotFoundError('Company holiday not found');
  }

  const { data: deleted, error } = await supabase
    .from('company_holidays')
    .delete()
    .eq('id', holidayId)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();
  if (error || !deleted) throw error ?? new Error('Failed to delete company holiday');
  return apiSuccess(normalizeSupabaseCompanyHoliday(deleted), 'Company holiday deleted successfully');
}, { requireAuth: true, roles: ['Admin'] });
