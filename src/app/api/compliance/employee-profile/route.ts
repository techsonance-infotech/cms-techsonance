import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { detectComplianceViolations } from '@/server/compliance/violation-detector';

export const GET = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const url = new URL(request.url);
  const employeeId = url.searchParams.get('employeeId');

  if (!employeeId) throw new BadRequestError('Employee ID is required');

  const supabase = getAdminRouteSupabase();

  // 1. Fetch employee details
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('id, user_id, first_name, last_name, email, department, designation, status, date_of_joining, date_of_birth')
    .eq('tenant_id', tenantId)
    .eq('id', employeeId)
    .single();

  if (empError || !employee) {
    throw new BadRequestError('Employee not found');
  }

  // 2. Fetch employee documents
  const { data: documents } = await supabase
    .from('employee_documents')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('employee_id', employeeId);

  // 3. Fetch employee compliance items
  const { data: items } = await supabase
    .from('compliance_items')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('employee_id', employeeId);

  // 4. Fetch user compliance items (fallback for user_id mapping)
  let userItems: any[] = [];
  if (employee.user_id) {
    const { data } = await supabase
      .from('compliance_items')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', employee.user_id);
    if (data) userItems = data;
  }

  const combinedItems = [...(items || []), ...userItems];
  
  // Deduplicate
  const uniqueItemsMap = new Map<string, any>();
  for (const item of combinedItems) {
    uniqueItemsMap.set(item.id, item);
  }
  const finalItems = Array.from(uniqueItemsMap.values());

  // 5. Run violation detector for tenant, filter to employee
  const orgViolations = await detectComplianceViolations(tenantId);
  const employeeViolations = orgViolations.filter(v => v.employeeId === String(employeeId));

  // 6. Calculate employee compliance score
  let score = 100;
  for (const v of employeeViolations) {
    if (v.status === 'Resolved') continue;
    if (v.severity === 'Critical') score -= 30;
    else if (v.severity === 'High') score -= 20;
    else if (v.severity === 'Medium') score -= 10;
    else score -= 5;
  }
  score = Math.max(0, score);

  return NextResponse.json({
    success: true,
    employee: {
      id: employee.id,
      name: `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Employee',
      email: employee.email,
      department: employee.department,
      designation: employee.designation,
      status: employee.status,
      dateOfJoining: employee.date_of_joining,
      dateOfBirth: employee.date_of_birth
    },
    complianceScore: score,
    documents: documents || [],
    complianceItems: finalItems,
    violations: employeeViolations
  });
}, { requireAuth: true });
