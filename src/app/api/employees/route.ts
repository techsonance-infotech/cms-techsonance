import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, NotFoundError, ConflictError } from '@/server/http/errors';
import { employeeStatusSchema, createEmployeeSchema, updateEmployeeSchema } from '@/server/validation/employees';
import {
  buildLegacyUserIdMap,
  getAdminRouteSupabase,
  normalizeSupabaseEmployeeRecord,
  resolveAuthUserIdFromLegacyUserId,
} from '@/server/supabase/route-helpers';
import { listSupabaseProfilesByAuthIds } from '@/server/supabase/users';

let employeesColumnsCache: string[] | null = null;
async function getEmployeesColumns(supabase: any) {
  if (employeesColumnsCache) return employeesColumnsCache;
  const { data, error } = await supabase.from('employees').select('*').limit(1);
  if (!error && data && data.length > 0) {
    employeesColumnsCache = Object.keys(data[0]);
    return employeesColumnsCache;
  }
  return [
    'id', 'tenant_id', 'user_id', 'employee_id', 'nfc_card_id', 'department',
    'designation', 'date_of_joining', 'date_of_birth', 'skills', 'salary',
    'status', 'created_at', 'updated_at', 'deleted_at', 'employment_type',
    'hourly_rate', 'ctc', 'pf_number', 'uan_number', 'bank_name',
    'bank_account_number', 'ifsc_code', 'manager_id'
  ];
}

export const GET = withApiHandler(async (request, context) => {
  const searchParams = new URL(request.url).searchParams;
  const id = searchParams.get('id');

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');

  const supabase = getAdminRouteSupabase();

  if (id) {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', Number(id))
      .eq('tenant_id', tenantId)
      .single();
    if (error || !data) throw new NotFoundError('Employee not found');
    const sanitizedAuthUserIds = [String(data.user_id), data.manager_id ? String(data.manager_id) : ''].filter(Boolean);
    const profilesMap = await listSupabaseProfilesByAuthIds(sanitizedAuthUserIds, { useAdmin: true, tenantId });
    const userMap = new Map<string, number | null>(
      Array.from(profilesMap.entries()).map(([authUserId, profile]) => [authUserId, profile.legacy_user_id])
    );
    return NextResponse.json(normalizeSupabaseEmployeeRecord(data, userMap, profilesMap));
  }

  const limit = Math.min(Number(searchParams.get('limit') ?? '10'), 100);
  const offset = Math.max(Number(searchParams.get('offset') ?? '0'), 0);
  const search = searchParams.get('search');
  const userId = searchParams.get('userId');
  const department = searchParams.get('department');
  const status = searchParams.get('status');
  const workMode = searchParams.get('workMode');
  const sortField = searchParams.get('sort') ?? 'created_at';
  const ascending = searchParams.get('order') === 'asc';
  
  let query = supabase
    .from('employees')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .is('deleted_at', null);

  if (search) {
    // Search users table for name/email matches (since first_name/last_name are in users table)
    const { data: matchingUsers } = await supabase
      .from('users')
      .select('id')
      .eq('tenant_id', tenantId)
      .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);

    const matchingUserIds = (matchingUsers || []).map((u: { id: string }) => u.id);

    let orParts = `employee_id.ilike.%${search}%,department.ilike.%${search}%,designation.ilike.%${search}%`;
    if (matchingUserIds.length > 0) {
      orParts += `,user_id.in.(${matchingUserIds.map((id: string) => `"${id}"`).join(',')})`;
    }
    query = query.or(orParts);
  }
  if (userId) {
    const parsedUserId = Number(userId);
    if (isNaN(parsedUserId)) {
      throw new BadRequestError('Invalid userId parameter - must be a valid numeric ID');
    }
    const authUserId = await resolveAuthUserIdFromLegacyUserId(accessToken, parsedUserId, tenantId);
    query = query.eq('user_id', authUserId);
  }
  if (department) {
    query = query.ilike('department', `%${department}%`);
  }
  if (workMode) {
    const wm = workMode.toLowerCase();
    if (wm === 'office') {
      query = query.or('skills->>workMode.ilike.office,skills->>workMode.is.null');
    } else {
      query = query.or(`skills->>workMode.ilike.${wm}`);
    }
  }
  if (status) {
    const norm = status.toLowerCase();
    const statusVal = norm === 'notice period' ? 'on_notice' : norm === 'on leave' ? 'on_leave' : norm;
    if (statusVal === 'probation') {
      query = query.eq('status', 'active').gt('confirmation_date', new Date().toISOString());
    } else {
      query = query.eq('status', employeeStatusSchema.parse(statusVal));
    }
  }

  const { data, count, error } = await query
    .order(
      sortField === 'department'
        ? 'department'
        : sortField === 'designation'
          ? 'designation'
          : sortField === 'dateOfJoining'
            ? 'date_of_joining'
            : sortField === 'status'
              ? 'status'
              : 'created_at',
      { ascending }
    )
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);

  const sanitizedAuthUserIds = ((data as Record<string, unknown>[] | null) ?? [])
    .flatMap((row) => [String(row.user_id), row.manager_id ? String(row.manager_id) : ''])
    .filter(Boolean);
  const profilesMap = await listSupabaseProfilesByAuthIds(sanitizedAuthUserIds, { useAdmin: true, tenantId });
  const userMap = new Map<string, number | null>(
    Array.from(profilesMap.entries()).map(([authUserId, profile]) => [authUserId, profile.legacy_user_id])
  );

  return NextResponse.json({
    success: true,
    data: ((data as Record<string, unknown>[] | null) ?? []).map((row) => normalizeSupabaseEmployeeRecord(row, userMap, profilesMap)),
    message: 'Employees fetched successfully',
    errors: null,
    meta: {
      page: Math.floor(offset / limit) + 1,
      limit,
      total: Number(count ?? 0),
    },
  });
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const payload = createEmployeeSchema.parse(await request.json());

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');
  
  const supabase = getAdminRouteSupabase();
  
  const authUserId = await resolveAuthUserIdFromLegacyUserId(accessToken, payload.userId, tenantId);

  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', authUserId)
    .eq('tenant_id', tenantId)
    .single();
    
  if (!existingUser) throw new NotFoundError('User with provided userId does not exist');

  const { data: duplicate } = await supabase
    .from('employees')
    .select('id')
    .eq('employee_id', payload.employeeId.trim())
    .eq('tenant_id', tenantId)
    .maybeSingle();
    
  if (duplicate) throw new ConflictError('Employee with this employeeId already exists');

  let managerAuthId = null;
  if (payload.managerId) {
    managerAuthId = await resolveAuthUserIdFromLegacyUserId(accessToken, payload.managerId, tenantId);
  }

  const columns = await getEmployeesColumns(supabase);
  const now = new Date().toISOString();

  // 1. Base Insert payload with guaranteed columns
  const insertPayload: Record<string, any> = {
    user_id: authUserId,
    employee_id: payload.employeeId.trim(),
    department: payload.department.trim(),
    designation: payload.designation.trim(),
    date_of_joining: payload.dateOfJoining,
    date_of_birth: payload.dateOfBirth ?? null,
    salary: payload.salary ?? null,
    status: payload.status ?? 'active',
    tenant_id: tenantId,
    created_at: now,
    updated_at: now,
  };

  // 2. Add HR extensions (20260418 migration) if columns exist
  if (columns.includes('employment_type')) insertPayload.employment_type = payload.employmentType;
  if (columns.includes('hourly_rate')) insertPayload.hourly_rate = payload.hourlyRate ?? null;
  if (columns.includes('ctc')) insertPayload.ctc = payload.ctc ?? null;
  if (columns.includes('pf_number')) insertPayload.pf_number = payload.pfNumber?.trim() ?? null;
  if (columns.includes('uan_number')) insertPayload.uan_number = payload.uanNumber?.trim() ?? null;
  if (columns.includes('bank_name')) insertPayload.bank_name = payload.bankName?.trim() ?? null;
  if (columns.includes('bank_account_number')) insertPayload.bank_account_number = payload.bankAccountNumber?.trim() ?? null;
  if (columns.includes('ifsc_code')) insertPayload.ifsc_code = payload.ifscCode?.trim() ?? null;
  if (columns.includes('manager_id')) insertPayload.manager_id = managerAuthId;

  // 3. Map new onboarding fields
  const extraFields: Record<string, any> = {};
  const newFieldsMapping: Record<string, string> = {
    maritalStatus: 'marital_status',
    bloodGroup: 'blood_group',
    nationality: 'nationality',
    personalIdNumber: 'personal_id_number',
    probationPeriod: 'probation_period',
    confirmationDate: 'confirmation_date',
    workLocation: 'work_location',
    workShift: 'work_shift',
    noticePeriod: 'notice_period',
    currency: 'currency',
    branchName: 'branch_name',
    esiNumber: 'esi_number',
    panNumber: 'pan_number',
    aadhaarNumber: 'aadhaar_number',
    aadhaarCardUrl: 'aadhaar_card_url',
    panCardUrl: 'pan_card_url',
    addressProofUrl: 'address_proof_url',
    educationCertificateUrl: 'education_certificate_url',
    experienceCertificateUrl: 'experience_certificate_url',
    resumeUrl: 'resume_url',
    permissions: 'permissions',
    emergencyContactName: 'emergency_contact_name',
    emergencyContactRelationship: 'emergency_contact_relationship',
    emergencyContactPhone: 'emergency_contact_phone',
    emergencyContactAddress: 'emergency_contact_address',
    languagesKnown: 'languages_known',
    linkedinProfile: 'linkedin_profile',
    githubProfile: 'github_profile',
    previousCompany: 'previous_company',
    referralSource: 'referral_source',
    notes: 'notes',
    gender: 'gender',
  };

  Object.entries(newFieldsMapping).forEach(([camelKey, dbColumn]) => {
    const value = (payload as any)[camelKey];
    if (value !== undefined) {
      if (columns.includes(dbColumn)) {
        insertPayload[dbColumn] = value;
      } else {
        extraFields[camelKey] = value;
      }
    }
  });

  // Store user-level properties in employees.skills if user table columns do not exist
  ['middleName', 'officeEmail', 'accountExpiryDate'].forEach((field) => {
    const value = (payload as any)[field];
    if (value !== undefined) {
      extraFields[field] = value;
    }
  });

  // Prepare fallback structure inside skills
  insertPayload.skills = {
    skills_list: payload.skills || [],
    ...extraFields,
  };

  const { data, error } = await supabase.from('employees').insert(insertPayload).select('*').single();

  if (error || !data) throw error ? new Error(error.message) : new Error('Failed to create employee');
  const sanitizedAuthUserIds = [authUserId, managerAuthId].filter(Boolean) as string[];
  const profilesMap = await listSupabaseProfilesByAuthIds(sanitizedAuthUserIds, { useAdmin: true, tenantId });
  const userMap = new Map<string, number | null>(
    Array.from(profilesMap.entries()).map(([authUserId, profile]) => [authUserId, profile.legacy_user_id])
  );
  return NextResponse.json(normalizeSupabaseEmployeeRecord(data, userMap, profilesMap), { status: 201 });
}, { requireAuth: true, roles: ['Manager'] });

export const PUT = withApiHandler(async (request, context) => {
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('Valid employee id is required');

  const payload = updateEmployeeSchema.parse(await request.json());

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');
  
  const supabase = getAdminRouteSupabase();
  
  const { data: existingEmployee } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();
    
  if (!existingEmployee) throw new NotFoundError('Employee not found');

  if (payload.employeeId && payload.employeeId.trim() !== existingEmployee.employee_id) {
    const { data: duplicate } = await supabase
      .from('employees')
      .select('id')
      .eq('employee_id', payload.employeeId.trim())
      .eq('tenant_id', tenantId)
      .maybeSingle();
      
    if (duplicate) throw new ConflictError('Employee with this employeeId already exists');
  }

  let managerAuthId = undefined;
  if ('managerId' in payload) {
    managerAuthId = payload.managerId ? await resolveAuthUserIdFromLegacyUserId(accessToken, payload.managerId, tenantId) : null;
  }

  const columns = await getEmployeesColumns(supabase);
  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.employeeId !== undefined) updates.employee_id = payload.employeeId.trim();
  if (payload.department !== undefined) updates.department = payload.department.trim();
  if (payload.designation !== undefined) updates.designation = payload.designation.trim();
  if (payload.dateOfJoining !== undefined) updates.date_of_joining = payload.dateOfJoining;
  if (payload.dateOfBirth !== undefined) updates.date_of_birth = payload.dateOfBirth ?? null;
  if (payload.status !== undefined) updates.status = payload.status;
  if (payload.salary !== undefined) updates.salary = payload.salary ?? null;

  if ('employmentType' in payload && payload.employmentType !== undefined && columns.includes('employment_type')) {
    updates.employment_type = payload.employmentType;
  }
  if ('hourlyRate' in payload && payload.hourlyRate !== undefined && columns.includes('hourly_rate')) {
    updates.hourly_rate = payload.hourlyRate ?? null;
  }
  if ('ctc' in payload && payload.ctc !== undefined && columns.includes('ctc')) {
    updates.ctc = payload.ctc ?? null;
  }
  if ('pfNumber' in payload && payload.pfNumber !== undefined && columns.includes('pf_number')) {
    updates.pf_number = payload.pfNumber?.trim() ?? null;
  }
  if ('uanNumber' in payload && payload.uanNumber !== undefined && columns.includes('uan_number')) {
    updates.uan_number = payload.uanNumber?.trim() ?? null;
  }
  if ('bankName' in payload && payload.bankName !== undefined && columns.includes('bank_name')) {
    updates.bank_name = payload.bankName?.trim() ?? null;
  }
  if ('bankAccountNumber' in payload && payload.bankAccountNumber !== undefined && columns.includes('bank_account_number')) {
    updates.bank_account_number = payload.bankAccountNumber?.trim() ?? null;
  }
  if ('ifscCode' in payload && payload.ifscCode !== undefined && columns.includes('ifsc_code')) {
    updates.ifsc_code = payload.ifscCode?.trim() ?? null;
  }
  if ('managerId' in payload && columns.includes('manager_id')) {
    updates.manager_id = managerAuthId;
  }

  // Parse existing skills
  let existingSkillsObj: any = {};
  if (typeof existingEmployee.skills === 'string') {
    try {
      existingSkillsObj = JSON.parse(existingEmployee.skills);
    } catch {}
  } else if (existingEmployee.skills && typeof existingEmployee.skills === 'object') {
    existingSkillsObj = existingEmployee.skills;
  }

  const extraFields: Record<string, any> = {
    ...(existingSkillsObj && typeof existingSkillsObj === 'object' && !Array.isArray(existingSkillsObj) ? existingSkillsObj : {}),
  };

  const newFieldsMapping: Record<string, string> = {
    maritalStatus: 'marital_status',
    bloodGroup: 'blood_group',
    nationality: 'nationality',
    personalIdNumber: 'personal_id_number',
    probationPeriod: 'probation_period',
    confirmationDate: 'confirmation_date',
    workLocation: 'work_location',
    workShift: 'work_shift',
    noticePeriod: 'notice_period',
    currency: 'currency',
    branchName: 'branch_name',
    esiNumber: 'esi_number',
    panNumber: 'pan_number',
    aadhaarNumber: 'aadhaar_number',
    aadhaarCardUrl: 'aadhaar_card_url',
    panCardUrl: 'pan_card_url',
    addressProofUrl: 'address_proof_url',
    educationCertificateUrl: 'education_certificate_url',
    experienceCertificateUrl: 'experience_certificate_url',
    resumeUrl: 'resume_url',
    permissions: 'permissions',
    emergencyContactName: 'emergency_contact_name',
    emergencyContactRelationship: 'emergency_contact_relationship',
    emergencyContactPhone: 'emergency_contact_phone',
    emergencyContactAddress: 'emergency_contact_address',
    languagesKnown: 'languages_known',
    linkedinProfile: 'linkedin_profile',
    githubProfile: 'github_profile',
    previousCompany: 'previous_company',
    referralSource: 'referral_source',
    notes: 'notes',
    gender: 'gender',
  };

  Object.entries(newFieldsMapping).forEach(([camelKey, dbColumn]) => {
    const value = (payload as any)[camelKey];
    if (value !== undefined) {
      if (columns.includes(dbColumn)) {
        updates[dbColumn] = value;
        delete extraFields[camelKey];
      } else {
        extraFields[camelKey] = value;
      }
    }
  });

  ['middleName', 'officeEmail', 'accountExpiryDate'].forEach((field) => {
    const value = (payload as any)[field];
    if (value !== undefined) {
      extraFields[field] = value;
    }
  });

  const skillsArray = payload.skills !== undefined ? (payload.skills || []) : null;
  if (skillsArray !== null) {
    extraFields.skills_list = skillsArray;
  } else if (!extraFields.skills_list) {
    extraFields.skills_list = Array.isArray(existingSkillsObj) ? existingSkillsObj : (existingSkillsObj?.skills_list || []);
  }

  updates.skills = extraFields;

  const { data, error } = await supabase.from('employees').update(updates)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error || !data) throw error ? new Error(error.message) : new Error('Failed to update employee');
  const sanitizedAuthUserIds = [String(data.user_id), data.manager_id ? String(data.manager_id) : ''].filter(Boolean);
  const profilesMap = await listSupabaseProfilesByAuthIds(sanitizedAuthUserIds, { useAdmin: true, tenantId });
  const userMap = new Map<string, number | null>(
    Array.from(profilesMap.entries()).map(([authUserId, profile]) => [authUserId, profile.legacy_user_id])
  );
  return NextResponse.json(normalizeSupabaseEmployeeRecord(data, userMap, profilesMap));
}, { requireAuth: true, roles: ['Manager'] });

export const DELETE = withApiHandler(async (request, context) => {
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('Valid employee id is required');

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');
  
  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase.from('employees').update({
    status: 'resigned',
    deleted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  .eq('id', id)
  .eq('tenant_id', tenantId)
  .select('*')
  .single();

  if (error || !data) throw new NotFoundError('Employee not found');

  await supabase.from('users').update({
    is_active: false,
    updated_at: new Date().toISOString(),
  }).eq('id', data.user_id).eq('tenant_id', tenantId);

  const sanitizedAuthUserIds = [String(data.user_id)].filter(Boolean);
  const profilesMap = await listSupabaseProfilesByAuthIds(sanitizedAuthUserIds, { useAdmin: true, tenantId });
  const userMap = new Map<string, number | null>(
    Array.from(profilesMap.entries()).map(([authUserId, profile]) => [authUserId, profile.legacy_user_id])
  );
  return NextResponse.json({
    message: 'Employee resigned and account deactivated successfully',
    employee: normalizeSupabaseEmployeeRecord(data, userMap, profilesMap),
  });
}, { requireAuth: true, roles: ['Manager'] });
