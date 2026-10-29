import { getSupabaseServerClient } from '@/server/supabase/client';
import { getSupabaseAdminClient } from '@/server/supabase/admin';
import {
  getCurrentSupabaseProfile,
  getSupabaseProfileByLegacyUserId,
  listSupabaseProfilesByAuthIds,
} from '@/server/supabase/users';

export function getRouteSupabase(accessToken: string) {
  return getSupabaseServerClient(accessToken) as any;
}

export function getAdminRouteSupabase() {
  return getSupabaseAdminClient() as any;
}

export async function getCurrentSupabaseActor(accessToken: string) {
  return getCurrentSupabaseProfile(accessToken);
}

export async function resolveAuthUserIdFromLegacyUserId(
  accessToken: string,
  legacyUserId: number,
  tenantId?: string
) {
  const profile = await getSupabaseProfileByLegacyUserId(legacyUserId, {
    useAdmin: true,
    tenantId,
  });
  return profile.id;
}

export async function buildLegacyUserIdMap(
  accessToken: string,
  authUserIds: string[],
  tenantId?: string
) {
  const sanitizedAuthUserIds = authUserIds.filter(
    id => typeof id === 'string' && id.trim() !== '' && id !== 'null' && id !== 'undefined'
  );
  if (!sanitizedAuthUserIds.length) {
    return new Map<string, number | null>();
  }
  const profiles = await listSupabaseProfilesByAuthIds(sanitizedAuthUserIds, {
    useAdmin: true,
    tenantId,
  });
  return new Map<string, number | null>(
    Array.from(profiles.entries()).map(([authUserId, profile]) => [
      authUserId,
      profile.legacy_user_id,
    ])
  );
}

export function normalizeSupabaseEmployeeRecord(
  row: Record<string, unknown>,
  legacyUserIdMap: Map<string, number | null>,
  profilesMap?: Map<string, any>
) {
  const authUserId = typeof row.user_id === 'string' ? row.user_id : null;
  const managerAuthId = typeof row.manager_id === 'string' ? row.manager_id : null;

  // Safe parse skills JSONB
  let parsedSkills: any = null;
  if (typeof row.skills === 'string') {
    try {
      parsedSkills = JSON.parse(row.skills);
    } catch {
      parsedSkills = row.skills;
    }
  } else {
    parsedSkills = row.skills;
  }

  const isSkillsObject =
    parsedSkills && typeof parsedSkills === 'object' && !Array.isArray(parsedSkills);
  const skillsList = isSkillsObject
    ? parsedSkills.skills_list || []
    : Array.isArray(parsedSkills)
      ? parsedSkills
      : [];

  // Safe field reading helper (from column or skills jsonb fallback)
  const getField = (columnName: string, camelName: string, defaultValue: any = null) => {
    if (row[columnName] !== undefined && row[columnName] !== null) {
      return row[columnName];
    }
    if (isSkillsObject && parsedSkills[camelName] !== undefined && parsedSkills[camelName] !== null) {
      return parsedSkills[camelName];
    }
    if (isSkillsObject && parsedSkills[columnName] !== undefined && parsedSkills[columnName] !== null) {
      return parsedSkills[columnName];
    }
    return defaultValue;
  };

  const profile = authUserId && profilesMap ? profilesMap.get(authUserId) : null;
  const managerProfile = managerAuthId && profilesMap ? profilesMap.get(managerAuthId) : null;

  // Compute experience from date_of_joining
  let experience: string | null = null;
  if (row.date_of_joining) {
    const joinDate = new Date(row.date_of_joining as string);
    const now = new Date();
    const diffMs = now.getTime() - joinDate.getTime();
    const totalMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    if (years > 0 && months > 0) {
      experience = `${years}y ${months}m`;
    } else if (years > 0) {
      experience = `${years} Year${years > 1 ? 's' : ''}`;
    } else if (months > 0) {
      experience = `${months} Month${months > 1 ? 's' : ''}`;
    } else {
      experience = 'New Joiner';
    }
  }

  // Format employment type to human-readable label
  const rawEmpType = (row.employment_type as string) ?? 'full_time';
  const employmentTypeMap: Record<string, string> = {
    full_time: 'Full Time',
    part_time: 'Part Time',
    contract: 'Contract',
    intern: 'Intern',
    freelance: 'Freelance',
    temporary: 'Temporary',
  };
  const formattedEmploymentType =
    employmentTypeMap[rawEmpType] ??
    rawEmpType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return {
    id: Number(row.id),
    userId: authUserId ? (legacyUserIdMap.get(authUserId) ?? null) : null,
    firstName: profile?.first_name ?? getField('first_name', 'firstName', ''),
    lastName: profile?.last_name ?? getField('last_name', 'lastName', ''),
    email: profile?.email ?? getField('email', 'email', ''),
    avatarUrl: profile?.avatar_url ?? getField('avatar_url', 'avatarUrl', null),
    phone: profile?.phone ?? getField('phone', 'phone', null),
    managerName: managerProfile
      ? `${managerProfile.first_name} ${managerProfile.last_name}`
      : getField('manager_name', 'managerName', null),
    workMode: getField('work_mode', 'workMode', 'Office'),
    employeeId: row.employee_id,
    nfcCardId: row.nfc_card_id ?? null,
    department: row.department,
    designation: row.designation,
    dateOfJoining: row.date_of_joining,
    joiningDate: row.date_of_joining,
    dateOfBirth: row.date_of_birth ?? null,
    salary: row.salary ?? null,
    status: row.status,
    location: getField('work_location', 'workLocation', 'Office'),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? null,

    // Onboarding fields
    employmentType: formattedEmploymentType,
    experience,
    hourlyRate: getField('hourly_rate', 'hourlyRate'),
    ctc: getField('ctc', 'ctc'),
    pfNumber: getField('pf_number', 'pfNumber'),
    uanNumber: getField('uan_number', 'uanNumber'),
    bankName: getField('bank_name', 'bankName'),
    bankAccountNumber: getField('bank_account_number', 'bankAccountNumber'),
    ifscCode: getField('ifsc_code', 'ifscCode'),
    managerId: managerAuthId ? (legacyUserIdMap.get(managerAuthId) ?? null) : null,

    // Personal details
    middleName: profile?.middle_name ?? getField('middle_name', 'middleName'),
    gender:
      profile?.gender ??
      (getField('gender', 'gender') ||
        skillsList.find((s: any) => typeof s === 'string' && s.startsWith('__gender:'))?.split(':')[1] ||
        null),
    maritalStatus: getField('marital_status', 'maritalStatus'),
    bloodGroup: getField('blood_group', 'bloodGroup'),
    nationality: getField('nationality', 'nationality'),
    personalIdNumber:
      getField('personal_id_number', 'personalIdNumber') ||
      getField('aadhaar_number', 'aadhaarNumber') ||
      null,

    // Work details
    probationPeriod: getField('probation_period', 'probationPeriod'),
    confirmationDate: getField('confirmation_date', 'confirmationDate'),
    workLocation: getField('work_location', 'workLocation'),
    workShift: getField('work_shift', 'workShift'),
    noticePeriod: getField('notice_period', 'noticePeriod'),

    // Financials
    currency: getField('currency', 'currency', 'INR'),
    branchName: getField('branch_name', 'branchName'),
    esiNumber: getField('esi_number', 'esiNumber'),
    panNumber: getField('pan_number', 'panNumber'),
    aadhaarNumber: getField('aadhaar_number', 'aadhaarNumber'),

    // Document URLs
    aadhaarCardUrl: getField('aadhaar_card_url', 'aadhaarCardUrl'),
    panCardUrl: getField('pan_card_url', 'panCardUrl'),
    addressProofUrl: getField('address_proof_url', 'addressProofUrl'),
    educationCertificateUrl: getField('education_certificate_url', 'educationCertificateUrl'),
    experienceCertificateUrl: getField('experience_certificate_url', 'experienceCertificateUrl'),
    resumeUrl: getField('resume_url', 'resumeUrl'),

    // System Access
    permissions: getField('permissions', 'permissions') || [],
    officeEmail: profile?.office_email ?? getField('office_email', 'officeEmail'),
    accountExpiryDate:
      profile?.account_expiry_date ?? getField('account_expiry_date', 'accountExpiryDate'),

    // Emergency Contact
    emergencyContactName: getField('emergency_contact_name', 'emergencyContactName'),
    emergencyContactRelationship: getField(
      'emergency_contact_relationship',
      'emergencyContactRelationship'
    ),
    emergencyContactPhone: getField('emergency_contact_phone', 'emergencyContactPhone'),
    emergencyContactAddress: getField('emergency_contact_address', 'emergencyContactAddress'),

    // Additional Info
    languagesKnown: getField('languages_known', 'languagesKnown'),
    linkedinProfile: getField('linkedin_profile', 'linkedinProfile'),
    githubProfile: getField('github_profile', 'githubProfile'),
    previousCompany: getField('previous_company', 'previousCompany'),
    referralSource: getField('referral_source', 'referralSource'),
    notes: getField('notes', 'notes'),

    // Cleaned skills list (excluding __ tags, handling both strings and skill objects)
    skills: skillsList
      .map((s: any) => (typeof s === 'string' ? s : (s?.skillName || s?.skill_name || s?.name || '')))
      .filter((s: any) => typeof s === 'string' && s.length > 0 && !s.startsWith('__')),
  };
}

export function normalizeSupabaseProjectRecord(
  row: Record<string, unknown>,
  legacyUserIdMap: Map<string, number | null>
) {
  const authUserId = typeof row.created_by === 'string' ? row.created_by : null;

  return {
    id: Number(row.id),
    name: row.name,
    description: row.description ?? null,
    clientId: Number(row.client_id),
    status: row.status,
    priority: row.priority,
    startDate: row.start_date ?? null,
    endDate: row.end_date ?? null,
    budget: row.budget ?? null,
    isActive: Boolean(row.is_active),
    createdBy: authUserId ? (legacyUserIdMap.get(authUserId) ?? null) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? null,
  };
}

export function normalizeSupabaseTaskRecord(
  row: Record<string, unknown>,
  legacyUserIdMap: Map<string, number | null>
) {
  const authUserId = typeof row.assigned_to === 'string' ? row.assigned_to : null;

  return {
    id: Number(row.id),
    projectId: Number(row.project_id),
    milestoneId: row.milestone_id === null ? null : Number(row.milestone_id),
    sprintId: row.sprint_id === null ? null : Number(row.sprint_id),
    title: row.title,
    description: row.description ?? null,
    assignedTo: authUserId ? (legacyUserIdMap.get(authUserId) ?? null) : null,
    status: row.status,
    priority: row.priority,
    storyPoints: row.story_points ?? null,
    dueDate: row.due_date ?? null,
    version: row.version ?? 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? null,
    parentTaskId: row.parent_id === null ? null : Number(row.parent_id),
    estimatedHours: row.estimated_hours === null ? null : Number(row.estimated_hours),
    loggedHours: row.logged_hours === null ? null : Number(row.logged_hours),
    taskType: row.task_type ?? 'task',
    severity: row.severity ?? 'medium',
    checklists: row.checklists ?? [],
    epicId: row.epic_id === null ? null : Number(row.epic_id),
  };
}
