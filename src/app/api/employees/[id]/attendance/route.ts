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

    // Fetch attendance records from attendance_records table
    const { data: rows, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('employee_id', employeeIdValue)
      .eq('tenant_id', tenantId)
      .order('date', { ascending: false });

    if (error) {
      if (error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
        console.warn('attendance_records table missing in schema cache, returning empty list');
        return NextResponse.json([]);
      }
      throw new Error(error.message);
    }

    const attendanceRecords = (rows || []).map((row: any) => ({
      id: Number(row.id),
      employeeId: Number(row.employee_id),
      date: row.date,
      timeIn: row.time_in,
      timeOut: row.time_out,
      duration: row.duration ?? null,
      status: row.status,
      checkInMethod: row.check_in_method,
      location: row.location,
      createdAt: row.created_at,
    }));

    return NextResponse.json(attendanceRecords);
  } catch (err: any) {
    console.error('Error fetching employee attendance:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
