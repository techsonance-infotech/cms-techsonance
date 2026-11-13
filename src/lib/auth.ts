import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/server/auth/session';
import { getRouteSupabase } from '@/server/supabase/route-helpers';
import { getSupabaseAdminClient } from '@/server/supabase/admin';

export interface User {
  id: number;
  providerUserId?: string | null;
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

    const adminDb = getSupabaseAdminClient();
    const providerUserId = auth.user.providerUserId ?? null;
    let employee: Record<string, any> | null = null;

    if (providerUserId) {
      const { data } = await adminDb
        .from('employees')
        .select('*')
        .eq('user_id', providerUserId)
        .is('deleted_at', null)
        .maybeSingle();
      employee = data;

      // Auto-provision an employee profile if missing for this active authenticated user
      if (!employee && auth.user.tenantId) {
        try {
          const { data: newEmp } = await adminDb
            .from('employees')
            .insert({
              tenant_id: auth.user.tenantId,
              user_id: providerUserId,
              employee_id: `EMP-${Math.floor(Math.random() * 9000 + 1000)}`,
              department: 'General',
              designation: auth.user.role || 'Staff Member',
              date_of_joining: new Date().toISOString().split('T')[0],
              status: 'active'
            })
            .select()
            .single();
          if (newEmp) employee = newEmp;
        } catch (provisionErr) {
          console.warn('Auto-provision employee record note:', provisionErr);
        }
      }
    }

    // Parse fallback skills JSONB object if columns are missing
    let skillsObj: Record<string, any> = {};
    if (employee?.skills) {
      if (typeof employee.skills === 'string') {
        try {
          skillsObj = JSON.parse(employee.skills);
        } catch {}
      } else if (typeof employee.skills === 'object') {
        skillsObj = employee.skills;
      }
    }

    const getField = (columnVal: any, camelKey: string, dbKey: string) => {
      if (columnVal !== null && columnVal !== undefined) return columnVal;
      if (skillsObj[camelKey] !== undefined) return skillsObj[camelKey];
      if (skillsObj[dbKey] !== undefined) return skillsObj[dbKey];
      return null;
    };

    const rawEmpType = getField(employee?.employment_type, 'employmentType', 'employment_type');
    const formattedEmploymentType = rawEmpType 
      ? String(rawEmpType).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : null;

    return {
      id: auth.user.id,
      providerUserId: auth.user.providerUserId ?? null,
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
      employmentType: formattedEmploymentType,
      hourlyRate: getField(employee?.hourly_rate, 'hourlyRate', 'hourly_rate') === null ? null : Number(getField(employee?.hourly_rate, 'hourlyRate', 'hourly_rate')),
      ctc: getField(employee?.ctc, 'ctc', 'ctc') === null ? null : Number(getField(employee?.ctc, 'ctc', 'ctc')),
      pfNumber: getField(employee?.pf_number, 'pfNumber', 'pf_number'),
      uanNumber: getField(employee?.uan_number, 'uanNumber', 'uan_number'),
      bankName: getField(employee?.bank_name, 'bankName', 'bank_name'),
      bankAccountNumber: getField(employee?.bank_account_number, 'bankAccountNumber', 'bank_account_number'),
      ifscCode: getField(employee?.ifsc_code, 'ifscCode', 'ifsc_code'),
      managerId: getField(employee?.manager_id, 'managerId', 'manager_id'),
      maritalStatus: getField(employee?.marital_status, 'maritalStatus', 'marital_status'),
      bloodGroup: getField(employee?.blood_group, 'bloodGroup', 'blood_group'),
      nationality: getField(employee?.nationality, 'nationality', 'nationality'),
      panNumber: getField(employee?.pan_number, 'panNumber', 'pan_number'),
      aadhaarNumber: getField(employee?.aadhaar_number, 'aadhaarNumber', 'aadhaar_number'),
      emergencyContactName: getField(employee?.emergency_contact_name, 'emergencyContactName', 'emergency_contact_name'),
      emergencyContactRelationship: getField(employee?.emergency_contact_relationship, 'emergencyContactRelationship', 'emergency_contact_relationship'),
      emergencyContactPhone: getField(employee?.emergency_contact_phone, 'emergencyContactPhone', 'emergency_contact_phone'),
      emergencyContactAddress: getField(employee?.emergency_contact_address, 'emergencyContactAddress', 'emergency_contact_address'),
      gender: getField(employee?.gender, 'gender', 'gender'),
    };
  } catch {
    return null;
  }
}

export async function getServerUser(): Promise<User | null> {
  return null;
}
