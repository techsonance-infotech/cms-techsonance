import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { logger } from '@/server/logging/logger';

export interface AttendancePolicy {
  id: string;
  tenant_id: string;
  name: string;
  is_default: boolean;
  standard_hours: number;
  min_hours_half_day: number;
  min_hours_full_day: number;
  grace_period_late_minutes: number;
  grace_period_early_exit_minutes: number;
  is_flexible: boolean;
  rounding_minutes: number;
  auto_mark_absence: boolean;
  unpaid_break_duration_minutes: number;
  paid_break_duration_minutes: number;
  overtime_eligibility: boolean;
  overtime_min_minutes: number;
  overtime_rate_multiplier: number;
  weekly_off_days: string;
  target_assignment: Record<string, any>;
}

export interface ShiftDefinition {
  id: string;
  shift_code: string;
  name: string;
  shift_type: string;
  start_time: string; // "HH:MM:SS"
  end_time: string; // "HH:MM:SS"
  split_start_time_2?: string;
  split_end_time_2?: string;
  break_duration_minutes: number;
  differential_pay_percentage: number;
}

/**
 * Resolves the applicable attendance policy for a given employee.
 * Checks target assignment mappings, falling back to the default tenant policy.
 */
export async function getPolicyForEmployee(
  supabase: any,
  tenantId: string,
  employeeId: number
): Promise<AttendancePolicy> {
  try {
    // 1. Fetch employee details (department, designation, category, branch, etc.)
    const { data: employee } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .eq('tenant_id', tenantId)
      .single();

    if (!employee) {
      throw new Error(`Employee ${employeeId} not found`);
    }

    // 2. Fetch all policies for the tenant
    const { data: policies } = await supabase
      .from('attendance_policies')
      .select('*')
      .eq('tenant_id', tenantId);

    if (!policies || policies.length === 0) {
      // Return standard default policy parameters if database has no policies yet
      return {
        id: 'default',
        tenant_id: tenantId,
        name: 'Default System Policy',
        is_default: true,
        standard_hours: 9.0,
        min_hours_half_day: 4.0,
        min_hours_full_day: 8.0,
        grace_period_late_minutes: 15,
        grace_period_early_exit_minutes: 15,
        is_flexible: false,
        rounding_minutes: 0,
        auto_mark_absence: true,
        unpaid_break_duration_minutes: 60,
        paid_break_duration_minutes: 0,
        overtime_eligibility: true,
        overtime_min_minutes: 30,
        overtime_rate_multiplier: 1.50,
        weekly_off_days: 'Saturday,Sunday',
        target_assignment: {},
      };
    }

    // 3. Match policies based on target assignments
    // Target assignments are stored in target_assignment JSONB e.g. { "departments": ["HR", "Engineering"], "grades": ["A"] }
    for (const policy of policies) {
      if (policy.is_default) continue;

      const assignment = policy.target_assignment || {};
      let matches = true;

      if (assignment.departments && assignment.departments.length > 0) {
        if (!assignment.departments.includes(employee.department)) {
          matches = false;
        }
      }
      if (assignment.designations && assignment.designations.length > 0) {
        if (!assignment.designations.includes(employee.designation)) {
          matches = false;
        }
      }
      if (assignment.locations && assignment.locations.length > 0) {
        if (!assignment.locations.includes(employee.location)) {
          matches = false;
        }
      }

      if (matches && Object.keys(assignment).length > 0) {
        return policy as AttendancePolicy;
      }
    }

    // 4. Fallback to default policy
    const defaultPolicy = policies.find((p: any) => p.is_default);
    if (defaultPolicy) {
      return defaultPolicy as AttendancePolicy;
    }

    return policies[0] as AttendancePolicy;
  } catch (err: any) {
    logger.error('Failed to resolve attendance policy:', { employeeId, error: err.message });
    throw err;
  }
}

/**
 * Resolves the active shift assignment for an employee on a given date.
 */
export async function getShiftForEmployee(
  supabase: any,
  tenantId: string,
  employeeId: number,
  date: string
): Promise<ShiftDefinition> {
  // 1. Check roster assignment
  const { data: roster } = await supabase
    .from('shift_roster_assignments')
    .select(`
      *,
      shift_definitions(*)
    `)
    .eq('employee_table_id', employeeId)
    .eq('roster_date', date)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (roster && roster.shift_definitions) {
    return roster.shift_definitions as ShiftDefinition;
  }

  // 2. Check default shift (e.g., General Shift)
  const { data: defaultShift } = await supabase
    .from('shift_definitions')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('shift_type', 'general')
    .maybeSingle();

  if (defaultShift) {
    return defaultShift as ShiftDefinition;
  }

  // 3. System hard fallback
  return {
    id: 'system_default_shift',
    shift_code: 'GEN',
    name: 'General Shift',
    shift_type: 'general',
    start_time: '09:00:00',
    end_time: '18:00:00',
    break_duration_minutes: 60,
    differential_pay_percentage: 0.00,
  };
}

/**
 * Applies punch rounding based on policy setup.
 */
export function applyRounding(time: Date, roundingMinutes: number): Date {
  if (roundingMinutes <= 0) return time;
  
  const coeff = 1000 * 60 * roundingMinutes;
  return new Date(Math.round(time.getTime() / coeff) * coeff);
}

/**
 * Utility to parse HH:MM:SS string into a Date object on a reference date in IST (UTC+05:30).
 */
export function parseShiftTime(timeStr: string, referenceDate: string): Date {
  return new Date(`${referenceDate}T${timeStr}+05:30`);
}

export interface AttendanceCalculationResult {
  status: string;
  totalHours: number;
  productiveHours: number;
  idleHours: number;
  overtimeMinutes: number;
  isLate: boolean;
  isEarlyExit: boolean;
  exceptions: string[];
}

/**
 * Main calculation engine logic for a single attendance day.
 */
export async function calculateAttendance(
  supabase: any,
  tenantId: string,
  employeeId: number,
  date: string,
  timeInStr: string | null,
  timeOutStr: string | null,
  punchesMetadata: any = null
): Promise<AttendanceCalculationResult> {
  const exceptions: string[] = [];
  const policy = await getPolicyForEmployee(supabase, tenantId, employeeId);
  const shift = await getShiftForEmployee(supabase, tenantId, employeeId, date);

  // If no punches recorded
  if (!timeInStr) {
    // Check if it's a Weekly Off
    const dayOfWeek = new Date(`${date}T12:00:00+05:30`).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' });
    const isWeeklyOff = policy.weekly_off_days.split(',').map(d => d.trim().toLowerCase()).includes(dayOfWeek.toLowerCase());

    if (isWeeklyOff) {
      return {
        status: 'weekly_off',
        totalHours: 0,
        productiveHours: 0,
        idleHours: 0,
        overtimeMinutes: 0,
        isLate: false,
        isEarlyExit: false,
        exceptions: [],
      };
    }

    // Check if it's a Company Holiday
    const { data: holiday } = await supabase
      .from('company_holidays')
      .select('*')
      .eq('date', date)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (holiday) {
      return {
        status: 'holiday',
        totalHours: 0,
        productiveHours: 0,
        idleHours: 0,
        overtimeMinutes: 0,
        isLate: false,
        isEarlyExit: false,
        exceptions: [],
      };
    }

    // Check if employee is on Approved Leave
    const { data: leave } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('status', 'approved')
      .lte('start_date', date)
      .gte('end_date', date)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (leave) {
      return {
        status: leave.leave_period === 'half_day' ? 'half_day' : 'leave',
        totalHours: 0,
        productiveHours: 0,
        idleHours: 0,
        overtimeMinutes: 0,
        isLate: false,
        isEarlyExit: false,
        exceptions: [],
      };
    }

    // Otherwise mark as Absent (if policy auto-absence is active)
    return {
      status: policy.auto_mark_absence ? 'absent' : 'missing_punch',
      totalHours: 0,
      productiveHours: 0,
      idleHours: 0,
      overtimeMinutes: 0,
      isLate: false,
      isEarlyExit: false,
      exceptions: policy.auto_mark_absence ? [] : ['missing_punch'],
    };
  }

  // Process Punch Times
  let rawTimeIn = new Date(timeInStr);
  let rawTimeOut = timeOutStr ? new Date(timeOutStr) : null;

  // Apply rounding rules
  const roundedTimeIn = applyRounding(rawTimeIn, policy.rounding_minutes);
  const roundedTimeOut = rawTimeOut ? applyRounding(rawTimeOut, policy.rounding_minutes) : null;

  // Resolve shift boundary targets
  const shiftStart = parseShiftTime(shift.start_time, date);
  const shiftEnd = parseShiftTime(shift.end_time, date);

  // Late Arrival Check
  let isLate = false;
  if (!policy.is_flexible) {
    const lateThreshold = new Date(shiftStart.getTime() + policy.grace_period_late_minutes * 60000);
    if (roundedTimeIn > lateThreshold) {
      isLate = true;
      exceptions.push('late_arrival');
    }
  }

  // Early Departure Check
  let isEarlyExit = false;
  if (roundedTimeOut && !policy.is_flexible) {
    const earlyThreshold = new Date(shiftEnd.getTime() - policy.grace_period_early_exit_minutes * 60000);
    if (roundedTimeOut < earlyThreshold) {
      isEarlyExit = true;
      exceptions.push('early_departure');
    }
  }

  // Calculate work durations (multiple punches vs single punch)
  let totalMinutes = 0;
  if (punchesMetadata && punchesMetadata.punches && punchesMetadata.punches.length >= 2) {
    // Process multiple break interval reconciliation
    const punches = punchesMetadata.punches.sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime());
    let currentIn: Date | null = null;
    
    for (const p of punches) {
      if (p.type === 'in') {
        currentIn = new Date(p.time);
      } else if (p.type === 'out' && currentIn) {
        totalMinutes += (new Date(p.time).getTime() - currentIn.getTime()) / 60000;
        currentIn = null;
      }
    }
  } else {
    // Default single interval calculation
    if (roundedTimeOut) {
      totalMinutes = (roundedTimeOut.getTime() - roundedTimeIn.getTime()) / 60000;
    } else {
      exceptions.push('missing_punch');
    }
  }

  const totalHours = Number((totalMinutes / 60).toFixed(2));
  
  // Break deduction rules
  const breakDeduction = policy.unpaid_break_duration_minutes;
  let productiveMinutes = Math.max(0, totalMinutes - breakDeduction);
  let idleHours = Number((breakDeduction / 60).toFixed(2));
  const productiveHours = Number((productiveMinutes / 60).toFixed(2));

  // Determine Attendance Status
  let status = 'present';
  if (!roundedTimeOut) {
    status = 'missing_punch';
  } else if (productiveHours < policy.min_hours_half_day) {
    status = 'absent';
    exceptions.push('insufficient_hours');
  } else if (productiveHours < policy.min_hours_full_day) {
    status = 'half_day';
    exceptions.push('insufficient_hours');
  } else if (isLate) {
    status = 'late';
  }

  // Overtime calculation
  let overtimeMinutes = 0;
  if (policy.overtime_eligibility && roundedTimeOut) {
    const stdHoursInMinutes = policy.standard_hours * 60;
    if (productiveMinutes > stdHoursInMinutes) {
      const excess = productiveMinutes - stdHoursInMinutes;
      if (excess >= policy.overtime_min_minutes) {
        overtimeMinutes = Math.round(excess);
      }
    }
  }

  return {
    status,
    totalHours,
    productiveHours,
    idleHours,
    overtimeMinutes,
    isLate,
    isEarlyExit,
    exceptions,
  };
}
