import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase, resolveActorUuid } from '@/server/supabase/route-helpers';
import { isSchemaCacheError, travelMemoryStore } from '@/server/travel/fallback-store';
import { normalizeAppRole } from '@/server/auth/rbac';

export const GET = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const tenantId = user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const normalizedRole = normalizeAppRole(user.role);
  const rawRole = (user.rawRole || user.role || '').toLowerCase().replace(/[^a-z0-9_]/g, '');

  const isSuperAdminOrAdmin =
    normalizedRole === 'SuperAdmin' ||
    normalizedRole === 'Admin' ||
    ['superadmin', 'super_admin', 'admin', 'hr_manager', 'hr_executive', 'owner', 'tenant_owner', 'accountant', 'finance'].includes(rawRole);

  const canApprove = isSuperAdminOrAdmin || normalizedRole === 'Manager' || ['manager', 'project_manager'].includes(rawRole);

  const supabase = getAdminRouteSupabase();

  try {
    let { data: requests, error } = await supabase
      .from('travel_requests')
      .select('*, employee:employee_id(first_name, last_name, email)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      if (isSchemaCacheError(error)) {
        console.warn('travel_requests table not found in schema cache. Using in-memory fallback store:', error.message);
        return NextResponse.json({
          success: true,
          data: travelMemoryStore.getRequests(tenantId, user),
          canApprove,
          userRole: rawRole || normalizedRole,
          source: 'memory_fallback'
        });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: requests || [],
      canApprove,
      userRole: rawRole || normalizedRole
    });
  } catch (err: any) {
    if (isSchemaCacheError(err)) {
      console.warn('travel_requests table missing from DB. Using in-memory fallback store:', err.message);
      return NextResponse.json({
        success: true,
        data: travelMemoryStore.getRequests(tenantId, user),
        canApprove,
        userRole: rawRole || normalizedRole,
        source: 'memory_fallback'
      });
    }
    throw err;
  }
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const body = await request.json();
  const { destination, purpose, departureDate, returnDate, visaRequired, advanceAmount } = body;

  if (!destination || !purpose || !departureDate || !returnDate) {
    throw new BadRequestError('Missing required travel request parameters');
  }

  const supabase = getAdminRouteSupabase();
  const actorUuid = await resolveActorUuid(context, supabase);

  try {
    if (!actorUuid) throw new BadRequestError('User identity could not be verified');

    const { data, error } = await supabase
      .from('travel_requests')
      .insert({
        tenant_id: tenantId,
        employee_id: actorUuid,
        destination,
        purpose,
        departure_date: departureDate,
        return_date: returnDate,
        status: 'Pending',
        visa_required: !!visaRequired,
        visa_status: visaRequired ? 'Pending' : 'N/A',
        advance_amount: advanceAmount || 0,
        advance_status: advanceAmount > 0 ? 'Requested' : 'N/A'
      })
      .select('*')
      .single();

    if (error) {
      if (isSchemaCacheError(error)) {
        const memoryRecord = {
          id: `tr-${Date.now()}`,
          tenant_id: tenantId,
          employee_id: actorUuid || String(context.auth?.user.id),
          destination,
          purpose,
          departure_date: departureDate,
          return_date: returnDate,
          status: 'Pending',
          visa_required: !!visaRequired,
          visa_status: visaRequired ? 'Pending' : 'N/A',
          advance_amount: advanceAmount || 0,
          advance_status: advanceAmount > 0 ? 'Requested' : 'N/A',
          employee: {
            first_name: context.auth?.user.firstName || 'Current',
            last_name: context.auth?.user.lastName || 'Employee',
            email: context.auth?.user.email || 'employee@company.com'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        travelMemoryStore.addRequest(tenantId, memoryRecord);
        return NextResponse.json({ success: true, data: memoryRecord, source: 'memory_fallback' }, { status: 201 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    if (isSchemaCacheError(err)) {
      const memoryRecord = {
        id: `tr-${Date.now()}`,
        tenant_id: tenantId,
        employee_id: actorUuid || String(context.auth?.user.id),
        destination,
        purpose,
        departure_date: departureDate,
        return_date: returnDate,
        status: 'Pending',
        visa_required: !!visaRequired,
        visa_status: visaRequired ? 'Pending' : 'N/A',
        advance_amount: advanceAmount || 0,
        advance_status: advanceAmount > 0 ? 'Requested' : 'N/A',
        employee: {
          first_name: context.auth?.user.firstName || 'Current',
          last_name: context.auth?.user.lastName || 'Employee',
          email: context.auth?.user.email || 'employee@company.com'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      travelMemoryStore.addRequest(tenantId, memoryRecord);
      return NextResponse.json({ success: true, data: memoryRecord, source: 'memory_fallback' }, { status: 201 });
    }
    throw err;
  }
}, { requireAuth: true });

export const PUT = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const body = await request.json();
  const { requestId, status, visaStatus, advanceStatus } = body;

  if (!requestId) {
    throw new BadRequestError('Missing requestId parameter');
  }

  const supabase = getAdminRouteSupabase();

  let updateFields: any = {
    updated_at: new Date().toISOString()
  };
  if (status) updateFields.status = status;
  if (visaStatus) updateFields.visa_status = visaStatus;
  if (advanceStatus) updateFields.advance_status = advanceStatus;

  try {
    const { data, error } = await supabase
      .from('travel_requests')
      .update(updateFields)
      .eq('id', requestId)
      .eq('tenant_id', tenantId)
      .select('*')
      .single();

    if (error) {
      if (isSchemaCacheError(error)) {
        const updated = travelMemoryStore.updateRequest(tenantId, requestId, updateFields);
        return NextResponse.json({ success: true, data: updated, source: 'memory_fallback' });
      }
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    if (isSchemaCacheError(err)) {
      const updated = travelMemoryStore.updateRequest(tenantId, requestId, updateFields);
      return NextResponse.json({ success: true, data: updated, source: 'memory_fallback' });
    }
    throw err;
  }
}, { requireAuth: true });
