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
    'bank_account_number', 'ifsc_code', 'manager_id', 'gender',
    'marital_status', 'blood_group', 'nationality', 'personal_id_number',
    'probation_period', 'confirmation_date', 'work_location', 'work_shift',
    'notice_period', 'currency', 'branch_name', 'esi_number', 'pan_number',
    'aadhaar_number'
  ];
}

async function getNextLegacyUserId(supabase: any, _tenantId?: string) {
  const { data } = await supabase
    .from('users')
    .select('legacy_user_id')
    .order('legacy_user_id', { ascending: false })
    .limit(1);

  const currentMax = Number((data as { legacy_user_id: number | null }[] | null)?.[0]?.legacy_user_id ?? 0);
  return currentMax + 1;
}

function parseFlexibleDate(val: any): string | null {
  if (!val) return null;
  const s = String(val).trim();
  if (!s) return null;

  // DD-MM-YYYY or DD/MM/YYYY
  const ddmmyyyy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, '0');
    const month = ddmmyyyy[2].padStart(2, '0');
    const year = ddmmyyyy[3];
    return `${year}-${month}-${day}`;
  }

  // YYYY-MM-DD or YYYY/MM/DD
  const yyyymmdd = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (yyyymmdd) {
    const year = yyyymmdd[1];
    const month = yyyymmdd[2].padStart(2, '0');
    const day = yyyymmdd[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return null;
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

  // Loop and process each record individually
  for (let idx = 0; idx < records.length; idx++) {
    const row = records[idx];
    const {
      firstName,
      lastName,
      email,
      phone,
      employeeId,
      department,
      designation,
      dateOfJoining,
      dateOfBirth,
      salary,
      employmentType,
      ctc,
      status,
      skills,
      // Personal Details
      gender,
      bloodGroup,
      maritalStatus,
      nationality,
      personalIdNumber,
      // Work Assignment
      workLocation,
      workShift,
      probationPeriod,
      noticePeriod,
      reportingManager,
      // Banking & Statutory
      bankName,
      bankAccountNumber,
      ifscCode,
      panNumber,
      aadhaarNumber,
      pfNumber,
      uanNumber,
      esiNumber,
      currency,
      // Emergency Contacts
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelationship,
      emergencyContactAddress
    } = row;

    try {
      // 1. Basic validation
      if (!firstName || !lastName || !email || !employeeId || !department || !designation || !dateOfJoining) {
        throw new Error('Missing required fields: firstName, lastName, email, employeeId, department, designation, dateOfJoining');
      }

      const normalizedEmail = email.trim().toLowerCase();
      const sanitizedEmpId = employeeId.toString().trim();
      const parsedDoj = parseFlexibleDate(dateOfJoining);
      const parsedDob = dateOfBirth ? parseFlexibleDate(dateOfBirth) : null;

      if (!parsedDoj) {
        throw new Error(`Invalid Date of Joining: "${dateOfJoining}". Please use YYYY-MM-DD or DD-MM-YYYY.`);
      }

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
        authUserId = crypto.randomUUID();
        const legacyUserId = await getNextLegacyUserId(supabase, tenantId);
        
        // Supabase Admin auth user creation
        const { data: authCreated, error: authError } = await supabase.auth.admin.createUser({
          id: authUserId,
          email: normalizedEmail,
          password: 'Welcome@123',
          email_confirm: true,
          user_metadata: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone ? phone.trim() : undefined,
          },
          app_metadata: {
            tenant_id: tenantId,
            role: 'Employee',
            legacy_user_id: legacyUserId,
          },
        });

        if (authError) {
          // If auth user already registered in Supabase Auth, recover the user ID
          if (authError.message?.toLowerCase().includes('already') || (authError as any).status === 422) {
            const { data: listData } = await supabase.auth.admin.listUsers();
            const matched = listData?.users?.find((u: any) => u.email?.toLowerCase() === normalizedEmail);
            if (matched) {
              authUserId = matched.id;
            } else {
              throw new Error(`Auth account creation failed: ${authError.message}`);
            }
          } else {
            throw new Error(`Auth account creation failed: ${authError.message}`);
          }
        } else if (authCreated?.user?.id) {
          authUserId = authCreated.user.id;
        }

        // Insert into tenant_users with correct Enum 'Employee'
        const { error: tenantUserError } = await supabase.from('tenant_users').upsert({
          tenant_id: tenantId,
          user_id: authUserId,
          email: normalizedEmail,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          role: 'Employee',
          status: 'active',
          created_at: now,
          updated_at: now,
        }, { onConflict: 'tenant_id,user_id' });

        if (tenantUserError) throw new Error(`tenant_users mapping failed: ${tenantUserError.message}`);

        // Insert into users profile with correct Enum 'Employee'
        const { error: userInsertError } = await supabase.from('users').upsert({
          id: authUserId,
          tenant_id: tenantId,
          legacy_user_id: legacyUserId,
          email: normalizedEmail,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone ? phone.trim() : null,
          role: 'Employee',
          is_active: true,
          created_at: now,
          updated_at: now,
        }, { onConflict: 'id' });

        if (userInsertError) throw new Error(`users profile insertion failed: ${userInsertError.message}`);
      }

      // 4. Resolve manager if provided
      let resolvedManagerId: string | null = null;
      if (reportingManager) {
        const mgrKey = String(reportingManager).trim();
        const { data: mgrEmp } = await supabase
          .from('employees')
          .select('user_id')
          .or(`employee_id.eq.${mgrKey}`)
          .eq('tenant_id', tenantId)
          .maybeSingle();

        if (mgrEmp?.user_id) {
          resolvedManagerId = mgrEmp.user_id;
        } else {
          const { data: mgrUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', mgrKey.toLowerCase())
            .eq('tenant_id', tenantId)
            .maybeSingle();
          if (mgrUser?.id) resolvedManagerId = mgrUser.id;
        }
      }

      // 5. Build Employee Payload
      const extraSkillsMetadata: Record<string, any> = {};

      const insertPayload: Record<string, any> = {
        user_id: authUserId,
        employee_id: sanitizedEmpId,
        department: department.trim(),
        designation: designation.trim(),
        date_of_joining: parsedDoj,
        date_of_birth: parsedDob,
        salary: salary ? Number(String(salary).replace(/[^0-9.-]/g, '')) : 0,
        status: status || 'active',
        tenant_id: tenantId,
        created_at: now,
        updated_at: now,
      };

      // Direct column assignments or skills fallback
      const fieldMappings: Record<string, any> = {
        employment_type: employmentType ? String(employmentType).toLowerCase().replace(/[\s-]+/g, '_') : 'full_time',
        ctc: ctc ? Number(String(ctc).replace(/[^0-9.-]/g, '')) : null,
        gender: gender || null,
        blood_group: bloodGroup || null,
        marital_status: maritalStatus || null,
        nationality: nationality || null,
        personal_id_number: personalIdNumber || null,
        work_location: workLocation || null,
        work_shift: workShift || null,
        probation_period: probationPeriod ? parseInt(String(probationPeriod), 10) : null,
        notice_period: noticePeriod ? parseInt(String(noticePeriod), 10) : null,
        manager_id: resolvedManagerId,
        currency: currency || 'INR',
        bank_name: bankName?.trim() || null,
        bank_account_number: bankAccountNumber?.toString().trim() || null,
        ifsc_code: ifscCode?.trim() || null,
        pan_number: panNumber?.trim().toUpperCase() || null,
        aadhaar_number: aadhaarNumber?.toString().trim() || null,
        pf_number: pfNumber?.trim() || null,
        uan_number: uanNumber?.toString().trim() || null,
        esi_number: esiNumber?.toString().trim() || null,
      };

      Object.entries(fieldMappings).forEach(([col, val]) => {
        if (val !== undefined && val !== null) {
          if (columns.includes(col)) {
            insertPayload[col] = val;
          } else {
            extraSkillsMetadata[col] = val;
          }
        }
      });

      insertPayload.skills = {
        skills_list: Array.isArray(skills) ? skills : (typeof skills === 'string' ? skills.split(',').map(s => s.trim()) : []),
        ...extraSkillsMetadata
      };

      const { data: newEmpData, error: empInsertError } = await supabase
        .from('employees')
        .insert(insertPayload)
        .select('id')
        .single();

      if (empInsertError || !newEmpData) {
        throw new Error(`Employee profile insertion failed: ${empInsertError?.message || 'Unknown DB error'}`);
      }

      // 6. Auto-sync Bank Account to employee_bank_accounts
      if (bankName && bankAccountNumber && ifscCode) {
        try {
          await supabase.from('employee_bank_accounts').insert({
            tenant_id: tenantId,
            employee_id: newEmpData.id,
            bank_name: bankName.trim(),
            account_number: bankAccountNumber.toString().trim(),
            account_holder_name: `${firstName.trim()} ${lastName.trim()}`,
            ifsc_code: ifscCode.trim(),
            account_type: 'savings',
            is_primary: true,
          });
        } catch (bErr) {
          console.warn('Auto bank insert info:', bErr);
        }
      }

      // 7. Auto-sync Emergency Contact to employee_emergency_contacts
      if (emergencyContactName && emergencyContactPhone) {
        try {
          await supabase.from('employee_emergency_contacts').insert({
            tenant_id: tenantId,
            employee_id: newEmpData.id,
            name: emergencyContactName.trim(),
            relationship: emergencyContactRelationship?.trim() || 'Emergency Contact',
            phone: emergencyContactPhone.toString().trim(),
            address: emergencyContactAddress?.trim() || null,
          });
        } catch (eErr) {
          console.warn('Auto emergency contact insert info:', eErr);
        }
      }

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
