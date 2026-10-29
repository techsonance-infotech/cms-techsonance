import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import crypto from 'crypto';

let employeesColumnsCache: string[] | null = null;
async function getEmployeesColumns(supabase: any) {
  if (employeesColumnsCache) return employeesColumnsCache;
  const { data, error } = await supabase.from('employees').select('*').limit(1);
  if (!error && data && data.length > 0) {
    employeesColumnsCache = Object.keys(data[0]);
    return employeesColumnsCache;
  }
  return [
    'id', 'tenant_id', 'user_id', 'employee_id', 'department',
    'designation', 'date_of_joining', 'date_of_birth', 'skills', 'salary',
    'status', 'created_at', 'updated_at', 'deleted_at', 'employment_type',
    'hourly_rate', 'ctc', 'pf_number', 'uan_number', 'bank_name',
    'bank_account_number', 'ifsc_code', 'manager_id'
  ];
}

async function getNextLegacyUserId(supabase: any, tenantId?: string) {
  const { data } = await supabase
    .from('users')
    .select('legacy_user_id')
    .order('legacy_user_id', { ascending: false })
    .limit(1);

  const currentMax = Number((data as { legacy_user_id: number | null }[] | null)?.[0]?.legacy_user_id ?? 0);
  return currentMax + 1;
}

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant credentials required');

  const body = await request.json();
  const records = Array.isArray(body) ? body : (body.records || []);

  if (records.length === 0) {
    throw new BadRequestError('No employee records provided for import');
  }

  const supabase = getAdminRouteSupabase();
  const columns = await getEmployeesColumns(supabase);
  const now = new Date().toISOString();

  let successCount = 0;
  let failedCount = 0;
  const reports: any[] = [];

  // We loop and insert each one, keeping track of failures individually rather than failing the whole batch
  for (let idx = 0; idx < records.length; idx++) {
    const row = records[idx];
    const {
      firstName,
      lastName,
      email,
      employeeId,
      department,
      designation,
      dateOfJoining,
      dateOfBirth,
      salary,
      employmentType,
      ctc,
      status,
      skills
    } = row;

    try {
      // 1. Basic validation
      if (!firstName || !lastName || !email || !employeeId || !department || !designation || !dateOfJoining) {
        throw new Error('Missing required fields: firstName, lastName, email, employeeId, department, designation, dateOfJoining');
      }

      const normalizedEmail = email.trim().toLowerCase();
      const sanitizedEmpId = employeeId.toString().trim();

      // 2. Duplicate Employee ID check
      const { data: dupEmp } = await supabase
        .from('employees')
        .select('id')
        .eq('employee_id', sanitizedEmpId)
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (dupEmp) {
        throw new Error(`Employee ID "${sanitizedEmpId}" already exists`);
      }

      // 3. User verification / creation
      let authUserId: string;
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', normalizedEmail)
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (existingUser) {
        authUserId = existingUser.id;
      } else {
        // Create new user credentials
        authUserId = crypto.randomUUID();
        const legacyUserId = await getNextLegacyUserId(supabase, tenantId);
        
        // Supabase Admin auth creation
        const { error: authError } = await supabase.auth.admin.createUser({
          id: authUserId,
          email: normalizedEmail,
          password: 'Welcome@123', // Standard default temp password
          email_confirm: true,
          user_metadata: {
            firstName: firstName.trim(),
            lastName: lastName.trim()
          },
          app_metadata: {
            tenant_id: tenantId,
            role: 'Employee',
            legacy_user_id: legacyUserId,
          },
        });

        if (authError) throw new Error(`Auth creation failed: ${authError.message}`);

        // Insert into tenant_users
        const { error: tenantUserError } = await supabase.from('tenant_users').insert({
          tenant_id: tenantId,
          user_id: authUserId,
          email: normalizedEmail,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          role: 'employee',
          status: 'active',
          created_at: now,
          updated_at: now,
        });

        if (tenantUserError) throw new Error(`tenant_users mapping failed: ${tenantUserError.message}`);

        // Insert into users
        const { error: userInsertError } = await supabase.from('users').insert({
          id: authUserId,
          tenant_id: tenantId,
          legacy_user_id: legacyUserId,
          email: normalizedEmail,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          role: 'employee',
          is_active: true,
          created_at: now,
          updated_at: now,
        });

        if (userInsertError) throw new Error(`users profile failed: ${userInsertError.message}`);
      }

      // 4. Map and insert Employee fields
      const insertPayload: Record<string, any> = {
        user_id: authUserId,
        employee_id: sanitizedEmpId,
        department: department.trim(),
        designation: designation.trim(),
        date_of_joining: dateOfJoining,
        date_of_birth: dateOfBirth || null,
        salary: salary ? Number(salary) : 0,
        status: status || 'active',
        tenant_id: tenantId,
        created_at: now,
        updated_at: now,
      };

      if (columns.includes('employment_type')) insertPayload.employment_type = employmentType || 'full_time';
      if (columns.includes('ctc')) insertPayload.ctc = ctc ? Number(ctc) : 0;
      insertPayload.skills = {
        skills_list: Array.isArray(skills) ? skills : []
      };

      const { error: empInsertError } = await supabase.from('employees').insert(insertPayload);
      if (empInsertError) throw new Error(`Employee profile insertion failed: ${empInsertError.message}`);

      successCount++;
      reports.push({
        row: idx + 1,
        employeeId: sanitizedEmpId,
        email: normalizedEmail,
        status: 'success',
        message: 'Imported successfully'
      });

    } catch (err: any) {
      failedCount++;
      reports.push({
        row: idx + 1,
        employeeId: employeeId || 'N/A',
        email: email || 'N/A',
        status: 'failed',
        message: err.message
      });
    }
  }

  return NextResponse.json({
    success: true,
    processed: records.length,
    successCount,
    failedCount,
    reports
  });
}, { requireAuth: true, roles: ['Admin'] });
