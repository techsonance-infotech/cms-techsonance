import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/session';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export async function GET(request: NextRequest, context: any) {
  try {
    const auth = await authenticateRequest(request, { required: true });
    const { id } = await context.params;
    const employeeIdValue = Number(id);
    if (!Number.isInteger(employeeIdValue) || employeeIdValue <= 0) {
      throw new BadRequestError('Valid employee id is required');
    }
    const tenantId = auth?.user.tenantId;
    if (!tenantId) {
      throw new BadRequestError('Tenant info required');
    }
    
    const supabase = getAdminRouteSupabase();

    // Fetch leave requests
    const { data: rows, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('employee_id', employeeIdValue)
      .eq('tenant_id', tenantId)
      .order('start_date', { ascending: false });

    if (error) {
      if (error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
        console.warn('leave_requests table missing in schema cache, returning empty list');
        return NextResponse.json([]);
      }
      throw new Error(error.message);
    }

    const leaves = (rows || []).map((row: any) => ({
      id: Number(row.id),
      employeeId: Number(row.employee_id),
      leaveType: row.leave_type,
      startDate: row.start_date,
      endDate: row.end_date,
      reason: row.reason,
      status: row.status,
      leavePeriod: row.leave_period,
      actualDays: row.actual_days,
      createdAt: row.created_at,
    }));

    return NextResponse.json(leaves);
  } catch (err: any) {
    console.error('Error fetching employee leaves:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
