import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/server/auth/session';
import { getRouteSupabase } from '@/server/supabase/route-helpers';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl: string | null;
  phone: string | null;
  tenantId?: string | null;
  employeeRecordId?: number | null;
  employeeId?: string | null;
  department?: string | null;
  designation?: string | null;
  dateOfJoining?: string | null;
  dateOfBirth?: string | null;
  skills?: unknown;
  salary?: number | null;
  status?: string | null;
  employmentType?: string | null;
  hourlyRate?: number | null;
  ctc?: number | null;
  pfNumber?: string | null;
  uanNumber?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  ifscCode?: string | null;
  managerId?: string | null;
  maritalStatus?: string | null;
  bloodGroup?: string | null;
  nationality?: string | null;
  panNumber?: string | null;
  aadhaarNumber?: string | null;
  emergencyContactName?: string | null;
  emergencyContactRelationship?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactAddress?: string | null;
  gender?: string | null;
}

export async function getCurrentUser(request: NextRequest): Promise<User | null> {
  try {
    const auth = await authenticateRequest(request, { required: false });
    if (!auth) return null;

    const supabase = getRouteSupabase(auth.accessToken);
    const providerUserId = auth.user.providerUserId ?? null;
    let employee: Record<string, any> | null = null;

    if (providerUserId) {
      const { data } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', providerUserId)
        .is('deleted_at', null)
        .maybeSingle();
      employee = data;
    }

    return {
      id: auth.user.id,
      email: auth.user.email,
      firstName: auth.user.firstName,
      lastName: auth.user.lastName,
      role: auth.user.role,
      avatarUrl: auth.user.avatarUrl,
      phone: auth.user.phone,
      tenantId: auth.user.tenantId ?? null,
      employeeRecordId: employee ? Number(employee.id) : null,
      employeeId: employee?.employee_id ?? null,
      department: employee?.department ?? null,
      designation: employee?.designation ?? null,
      dateOfJoining: employee?.date_of_joining ?? null,
      dateOfBirth: employee?.date_of_birth ?? null,
      skills: employee?.skills ?? null,
      salary: employee?.salary === null || employee?.salary === undefined ? null : Number(employee.salary),
      status: employee?.status ?? null,
      employmentType: employee?.employment_type ?? null,
      hourlyRate: employee?.hourly_rate === null || employee?.hourly_rate === undefined ? null : Number(employee.hourly_rate),
      ctc: employee?.ctc === null || employee?.ctc === undefined ? null : Number(employee.ctc),
      pfNumber: employee?.pf_number ?? null,
      uanNumber: employee?.uan_number ?? null,
      bankName: employee?.bank_name ?? null,
      bankAccountNumber: employee?.bank_account_number ?? null,
      ifscCode: employee?.ifsc_code ?? null,
      managerId: employee?.manager_id ?? null,
      maritalStatus: employee?.marital_status ?? null,
      bloodGroup: employee?.blood_group ?? null,
      nationality: employee?.nationality ?? null,
      panNumber: employee?.pan_number ?? null,
      aadhaarNumber: employee?.aadhaar_number ?? null,
      emergencyContactName: employee?.emergency_contact_name ?? null,
      emergencyContactRelationship: employee?.emergency_contact_relationship ?? null,
      emergencyContactPhone: employee?.emergency_contact_phone ?? null,
      emergencyContactAddress: employee?.emergency_contact_address ?? null,
      gender: employee?.gender ?? null,
    };
  } catch {
    return null;
  }
}

export async function getServerUser(): Promise<User | null> {
  return null;
}
