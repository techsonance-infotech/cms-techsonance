import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { isSchemaCacheError, travelMemoryStore } from '@/server/travel/fallback-store';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const { searchParams } = new URL(request.url);
  const requestId = searchParams.get('requestId');

  if (!requestId) {
    throw new BadRequestError('Missing requestId parameter');
  }

  const supabase = getAdminRouteSupabase();

  try {
    let { data: expenses, error } = await supabase
      .from('travel_expenses')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('travel_request_id', requestId);

    if (error) {
      if (isSchemaCacheError(error)) {
        console.warn('travel_expenses table not in schema cache. Using fallback store:', error.message);
        return NextResponse.json({
          success: true,
          data: travelMemoryStore.getExpenses(tenantId, requestId),
          source: 'memory_fallback'
        });
      }
      throw error;
    }

    if (!expenses || expenses.length === 0) {
      return NextResponse.json({
        success: true,
        data: travelMemoryStore.getExpenses(tenantId, requestId)
      });
    }

    return NextResponse.json({ success: true, data: expenses });
  } catch (err: any) {
    if (isSchemaCacheError(err)) {
      return NextResponse.json({
        success: true,
        data: travelMemoryStore.getExpenses(tenantId, requestId),
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
  const { travelRequestId, description, amount, receiptUrl } = body;

  if (!travelRequestId || !description || !amount) {
    throw new BadRequestError('Missing required travel expense parameters');
  }

  const supabase = getAdminRouteSupabase();

  try {
    const { data, error } = await supabase
      .from('travel_expenses')
      .insert({
        tenant_id: tenantId,
        travel_request_id: travelRequestId,
        description,
        amount,
        receipt_url: receiptUrl || '',
        status: 'Pending'
      })
      .select('*')
      .single();

    if (error) {
      if (isSchemaCacheError(error)) {
        const memoryRecord = {
          id: `te-${Date.now()}`,
          tenant_id: tenantId,
          travel_request_id: travelRequestId,
          description,
          amount: parseFloat(amount) || 0,
          receipt_url: receiptUrl || '',
          status: 'Pending',
          created_at: new Date().toISOString()
        };
        travelMemoryStore.addExpense(tenantId, memoryRecord);
        return NextResponse.json({ success: true, data: memoryRecord, source: 'memory_fallback' }, { status: 201 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    if (isSchemaCacheError(err)) {
      const memoryRecord = {
        id: `te-${Date.now()}`,
        tenant_id: tenantId,
        travel_request_id: travelRequestId,
        description,
        amount: parseFloat(amount) || 0,
        receipt_url: receiptUrl || '',
        status: 'Pending',
        created_at: new Date().toISOString()
      };
      travelMemoryStore.addExpense(tenantId, memoryRecord);
      return NextResponse.json({ success: true, data: memoryRecord, source: 'memory_fallback' }, { status: 201 });
    }
    throw err;
  }
}, { requireAuth: true });
