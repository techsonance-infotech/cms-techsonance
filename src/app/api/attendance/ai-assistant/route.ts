import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase, getCurrentSupabaseActor } from '@/server/supabase/route-helpers';
import { callGroqAiEngine } from '@/server/ai/groq-client';

export const POST = withApiHandler(async (request, context) => {
  const { query, employeeId } = await request.json();
  if (!query || !employeeId) {
    throw new BadRequestError('query and employeeId are required');
  }

  const tenantId = context.auth?.user.tenantId;
  const accessToken = context.auth?.accessToken;
  if (!tenantId || !accessToken) throw new BadRequestError('Authorization and tenant info required');

  const supabase = getAdminRouteSupabase();

  // Fetch contextual employee details
  const { data: employee } = await supabase
    .from('employees')
    .select('*, work_shift')
    .eq('id', employeeId)
    .eq('tenant_id', tenantId)
    .single();

  if (!employee) {
    throw new BadRequestError('Employee profile not found');
  }

  const today = new Date().toISOString().split('T')[0];
  const startOfMonth = `${today.substring(0, 7)}-01`;

  // Fetch attendance records this month
  const { data: records } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('date', startOfMonth)
    .lte('date', today);

  // Fetch active exceptions this month
  const { data: exceptions } = await supabase
    .from('attendance_exceptions')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('date', startOfMonth);

  // Fetch policy parameters
  const { data: policy } = await supabase
    .from('attendance_policies')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .maybeSingle();

  // Construct context object
  const stats = {
    totalPunches: records?.length || 0,
    present: records?.filter((r: any) => r.status === 'present').length || 0,
    late: records?.filter((r: any) => r.status === 'late').length || 0,
    absent: records?.filter((r: any) => r.status === 'absent').length || 0,
    exceptions: exceptions?.length || 0,
  };

  const exceptionsList = exceptions?.map((e: any) => `- Date: ${e.date}, Type: ${e.exception_type}, Resolved: ${e.resolved}`).join('\n') || 'None';
  
  const constructedPrompt = `You are the AI Attendance Assistant. Answer this question based on the context.
Question: "${query}"
Context Ledger:
- Employee ID: ${employeeId}
- Current Date: ${today}
- Standard Hours: ${policy?.standard_hours ?? 9.0} hrs
- Grace Period: ${policy?.grace_period_late_minutes ?? 15} mins
- rounding: ${policy?.rounding_minutes ?? 0} mins
- Overtime Eligible: ${policy?.overtime_eligibility ? 'Yes' : 'No'}
- Roster Summary: Logged Days=${stats.totalPunches}, Present=${stats.present}, Late=${stats.late}, Absent=${stats.absent}
- Exceptions:
${exceptionsList}`;

  try {
    const aiResponse = await callGroqAiEngine({
      prompt: constructedPrompt,
      temperature: 0.1
    });

    return NextResponse.json({
      success: true,
      answer: aiResponse.answer || 'Sorry, I could not generate a response at this time.',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      message: 'AI assistant engine error',
      error: err.message
    }, { status: 500 });
  }
}, { requireAuth: true });
