import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/server/http/errors';
import { getAdminRouteSupabase, resolveTenantId, resolveActorUuid } from '@/server/supabase/route-helpers';

// Catalog of 11 Supported Employee Wellness Operations
export const WELLNESS_SERVICES_CATALOG = [
  { category: 'Health Checkups', name: 'Annual Executive Health Checkup', description: 'Comprehensive diagnostic blood work, ECG, vision screening, and physician consultation.', slaHours: 24, iconName: 'Activity' },
  { category: 'Mental Wellness', name: 'Mindfulness & Meditation Workshops', description: 'Weekly guided stress reduction, breathwork, and mental clarity sessions.', slaHours: 12, iconName: 'Brain' },
  { category: 'Counselling', name: '1-on-1 Confidential Professional Counselling', description: 'Private 45-minute sessions with licensed clinical psychologists and counselors.', slaHours: 12, iconName: 'HeartHandshake' },
  { category: 'EAP Assistance', name: '24/7 Employee Assistance Program (EAP)', description: 'Toll-free 24/7 helpline for personal, legal, financial, and family support.', slaHours: 1, iconName: 'PhoneCall' },
  { category: 'Vaccination Drive', name: 'Onsite Annual Flu & Vaccine Drive', description: 'Free corporate onsite flu shots and preventive health vaccinations.', slaHours: 48, iconName: 'Syringe' },
  { category: 'Wellness Campaigns', name: 'Hydration & Nutrition Wellness Campaign', description: 'Interactive webinars with certified nutritionists and daily hydration trackers.', slaHours: 24, iconName: 'Apple' },
  { category: 'Fitness Challenges', name: '10k Steps Corporate Fitness Challenge', description: 'Gamified team leaderboard step challenges with wellness rewards and badges.', slaHours: 24, iconName: 'Dumbbell' },
  { category: 'Wellness Surveys', name: 'Quarterly Work-Life Pulse Survey', description: 'Anonymous pulse surveys measuring team morale, workload balance, and satisfaction.', slaHours: 24, iconName: 'ClipboardList' },
  { category: 'Burnout Detection', name: 'AI Burnout & Workload Fatigue Monitor', description: 'Predictive workload analytics identifying over-capacity overtime and fatigue risk.', slaHours: 12, iconName: 'Flame' },
  { category: 'Stress Monitoring', name: 'Biometric & Daily Stress Level Tracker', description: 'Self-reported and biometric pulse stress level tracking with coping tips.', slaHours: 12, iconName: 'Smile' },
  { category: 'AI Recommendations', name: 'Personalized AI Ergonomic & Wellness Guide', description: 'Tailored AI micro-break reminders, stretch routines, and work-life balance advice.', slaHours: 1, iconName: 'Sparkles' }
];

export const GET = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant information required');

  const user = context.auth!.user;
  const currentActorId = await resolveActorUuid(context, supabase);

  // 1. Fetch Users in Tenant
  let usersList: any[] = [];
  try {
    const { data } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role')
      .eq('tenant_id', tenantId);
    if (data) usersList = data;
  } catch (err) {
    console.warn('Users fetch query info:', err);
  }

  // 2. Fetch Employees in Tenant
  let employees: any[] = [];
  try {
    const { data } = await supabase
      .from('employees')
      .select('id, user_id, department, designation')
      .eq('tenant_id', tenantId);
    if (data) employees = data;
  } catch (err) {
    console.warn('Employees fetch query info:', err);
  }

  const empMap = new Map(employees.map((e: any) => [e.user_id, e]));
  const userMap = new Map(usersList.map((u: any) => [u.id, u]));

  // Current user resolution
  const matchedUser = currentActorId ? userMap.get(currentActorId) : null;
  const matchedEmp = currentActorId ? empMap.get(currentActorId) : null;

  const rawRole = matchedUser?.role || user.role || 'employee';
  const userRole = (rawRole || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const canApprove = ['admin', 'hr_manager', 'project_manager'].includes(userRole);

  const currentUserProfile = {
    id: currentActorId || user.id,
    name: matchedUser
      ? `${matchedUser.first_name || ''} ${matchedUser.last_name || ''}`.trim() || matchedUser.email
      : (user.name || user.email || 'Employee'),
    email: matchedUser?.email || user.email || '',
    role: rawRole,
    department: matchedEmp?.department || 'Engineering',
    designation: matchedEmp?.designation || (rawRole ? rawRole.toUpperCase() : 'Staff Member')
  };

  // Build Employee Roster
  const fullRoster = usersList.map((u: any) => {
    const emp = empMap.get(u.id);
    return {
      id: u.id,
      name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || 'Employee',
      email: u.email || '',
      department: emp?.department || 'General Operations',
      designation: emp?.designation || (u.role ? u.role.toUpperCase() : 'Staff Member')
    };
  });

  // For non-admin, roster only exposes the current employee
  const employeeRoster = canApprove
    ? fullRoster
    : fullRoster.filter(r => r.id === currentActorId);

  // 3. Fetch Wellness Programs from DB
  let dbPrograms: any[] = [];
  try {
    const { data } = await supabase
      .from('wellness_programs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('schedule_date', { ascending: true });
    if (data) dbPrograms = data;
  } catch (err) {
    console.warn('Wellness programs DB query info:', err);
  }

  // Fetch active program appointments count to sync enrolledCount accurately
  const { data: apptCounts } = await supabase
    .from('wellness_appointments')
    .select('program_id')
    .eq('tenant_id', tenantId)
    .not('program_id', 'is', null)
    .neq('status', 'Cancelled');

  const countMap = new Map<string, number>();
  (apptCounts || []).forEach((a: any) => {
    if (a.program_id) {
      countMap.set(a.program_id, (countMap.get(a.program_id) || 0) + 1);
    }
  });

  const programs = dbPrograms.map((p: any) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    description: p.description,
    location: p.location,
    capacity: p.capacity,
    enrolledCount: countMap.get(p.id) ?? p.enrolled_count ?? 0,
    status: p.status,
    scheduleDate: p.schedule_date,
    createdAt: p.created_at
  }));

  // 4. Fetch Appointments from DB `wellness_appointments`
  let dbAppointments: any[] = [];
  try {
    let query = supabase
      .from('wellness_appointments')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('appointment_date', { ascending: false });

    // RBAC: If regular employee, filter to appointments for themselves
    if (!canApprove && currentActorId) {
      query = query.eq('user_id', currentActorId);
    }

    const { data } = await query;
    if (data) dbAppointments = data;
  } catch (err) {
    console.warn('Wellness appointments DB query info:', err);
  }

  const progMap = new Map(dbPrograms.map((p: any) => [p.id, p]));

  const appointments = dbAppointments.map((a: any) => {
    const targetUser = userMap.get(a.user_id);
    const linkedProg = a.program_id ? progMap.get(a.program_id) : null;
    const empName = targetUser
      ? `${targetUser.first_name || ''} ${targetUser.last_name || ''}`.trim() || targetUser.email
      : 'Employee';

    return {
      id: a.id,
      userId: a.user_id,
      programId: a.program_id,
      programTitle: linkedProg?.title || null,
      employeeName: empName,
      employeeEmail: targetUser?.email || '',
      category: a.category,
      appointmentDate: a.appointment_date,
      doctorCounselorName: a.doctor_counselor_name || 'Pending Admin Assignment',
      notes: a.notes || '',
      status: a.status || 'Scheduled',
      burnoutRiskScore: a.burnout_risk_score || 'Low',
      stressIndex: a.stress_index || 20,
      createdAt: a.created_at
    };
  });

  // 5. Fetch Pulse Surveys from DB to compute real metrics
  let dbSurveys: any[] = [];
  try {
    const { data } = await supabase
      .from('wellness_surveys')
      .select('work_stress_level, work_life_balance_rating, sleep_quality_rating')
      .eq('tenant_id', tenantId);
    if (data) dbSurveys = data;
  } catch (err) {
    console.warn('Surveys DB query info:', err);
  }

  // Calculate Real Dynamic Summary Stats from DB records
  const totalBooked = appointments.length;
  const completedCount = appointments.filter(a => a.status === 'Completed').length;
  const scheduledCount = appointments.filter(a => a.status === 'Scheduled').length;
  const lowRiskCount = appointments.filter(a => a.burnoutRiskScore === 'Low').length;
  const highRiskCount = appointments.filter(a => a.burnoutRiskScore === 'High' || a.burnoutRiskScore === 'Severe').length;

  let avgStressPct = 0;
  let avgStressZone = 'No Surveys Yet';
  if (dbSurveys.length > 0) {
    const sumStress = dbSurveys.reduce((acc, s) => acc + (s.work_stress_level || 2), 0);
    avgStressPct = Math.round((sumStress / dbSurveys.length) * 18);
    avgStressZone = avgStressPct < 35 ? 'Low Stress Zone' : avgStressPct < 65 ? 'Moderate Zone' : 'High Fatigue Zone';
  }

  const healthScore = dbSurveys.length > 0
    ? Math.max(70, Math.min(99, 100 - Math.round(avgStressPct * 0.4)))
    : (appointments.length > 0 ? 95 : 100);

  return NextResponse.json({
    success: true,
    userRole,
    canApprove,
    currentUserId: currentActorId || user.id,
    currentUserProfile,
    employeeRoster,
    catalog: WELLNESS_SERVICES_CATALOG,
    programs,
    summaryStats: {
      totalBooked,
      completedCount,
      scheduledCount,
      lowRiskCount,
      highRiskCount,
      avgStressIndex: dbSurveys.length > 0 ? `${avgStressPct}% (${avgStressZone})` : '0% (No Surveys Yet)',
      burnoutHealthIndex: `${healthScore}% Optimal`,
      activeProgramsCount: programs.filter(p => p.status === 'Active').length,
      eapHotlineActive: '24/7 Toll Free Active'
    },
    appointments
  });
}, { requireAuth: true });

// POST handler: Book a Wellness Checkup, Counselling, or Vaccination Slot / Enroll in Program
export const POST = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant information required');

  const currentActorId = await resolveActorUuid(context, supabase);
  const user = context.auth!.user;
  const userRole = (user.role || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const canApprove = ['admin', 'hr_manager', 'project_manager'].includes(userRole);

  const payload = await request.json();
  let {
    userId,
    programId,
    category = 'Health Checkups',
    appointmentDate,
    doctorCounselorName,
    notes = '',
    stressIndex = 20,
    burnoutRiskScore = 'Low'
  } = payload;

  // If regular employee or not specified, force userId to the authenticated user's id
  if (!canApprove || !userId) {
    userId = currentActorId || user.id;
    doctorCounselorName = 'Pending Admin Assignment';
  } else {
    doctorCounselorName = (doctorCounselorName || '').trim() || 'Pending Admin Assignment';
  }

  if (!appointmentDate) {
    appointmentDate = new Date().toISOString();
  }

  // If linked to a program, verify program exists and check for duplicate registrations
  if (programId) {
    // 1. Duplicate check: ensure this user is not already registered for this program
    const { data: existingReg } = await supabase
      .from('wellness_appointments')
      .select('id, status')
      .eq('tenant_id', tenantId)
      .eq('program_id', programId)
      .eq('user_id', userId)
      .neq('status', 'Cancelled')
      .maybeSingle();

    if (existingReg) {
      return NextResponse.json({
        success: false,
        error: 'You are already registered for this program.',
        alreadyRegistered: true
      }, { status: 409 });
    }

    // 2. Program validity and capacity check
    const { data: prog } = await supabase
      .from('wellness_programs')
      .select('id, enrolled_count, capacity, title, category, status')
      .eq('id', programId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (!prog) {
      throw new NotFoundError('Wellness program not found');
    }

    if (prog.status !== 'Active') {
      throw new BadRequestError('This wellness program is currently not accepting registrations.');
    }

    if (prog.capacity && (prog.enrolled_count || 0) >= prog.capacity) {
      throw new BadRequestError('This wellness program has reached full capacity.');
    }

    if (prog.category) category = prog.category;
  }

  const { data, error } = await supabase
    .from('wellness_appointments')
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      program_id: programId || null,
      category,
      appointment_date: new Date(appointmentDate).toISOString(),
      doctor_counselor_name: doctorCounselorName.trim(),
      notes: notes.trim(),
      status: 'Scheduled',
      burnout_risk_score: burnoutRiskScore,
      stress_index: stressIndex
    })
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);

  // If linked to a program, accurately recalculate enrolled_count from DB unique participants
  if (programId) {
    const { count: actualCount } = await supabase
      .from('wellness_appointments')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('program_id', programId)
      .neq('status', 'Cancelled');

    await supabase
      .from('wellness_programs')
      .update({ enrolled_count: actualCount || 1 })
      .eq('id', programId)
      .eq('tenant_id', tenantId);
  }

  return NextResponse.json({
    success: true,
    message: `Wellness booking (${category}) scheduled successfully!`,
    data,
    timestamp: new Date().toISOString()
  }, { status: 201 });
}, { requireAuth: true });

// PATCH handler: Update Appointment Status, Notes, Doctor, or Burnout Scores
export const PATCH = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant information required');

  const currentActorId = await resolveActorUuid(context, supabase);
  const user = context.auth!.user;
  const userRole = (user.role || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const canApprove = ['admin', 'hr_manager', 'project_manager'].includes(userRole);

  const payload = await request.json();
  const { id, status, doctorCounselorName, notes, burnoutRiskScore, stressIndex, appointmentDate } = payload;

  if (!id) throw new BadRequestError('Appointment ID is required');

  // Verify ownership or admin permission
  const { data: existing, error: fetchErr } = await supabase
    .from('wellness_appointments')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (fetchErr || !existing) throw new NotFoundError('Wellness appointment not found');

  if (!canApprove && existing.user_id !== currentActorId) {
    throw new ForbiddenError('You can only update your own wellness appointments');
  }

  const updates: Record<string, any> = {};
  if (status !== undefined) updates.status = status;
  if (doctorCounselorName !== undefined) updates.doctor_counselor_name = doctorCounselorName.trim();
  if (notes !== undefined) updates.notes = notes.trim();
  if (burnoutRiskScore !== undefined && canApprove) updates.burnout_risk_score = burnoutRiskScore;
  if (stressIndex !== undefined && canApprove) updates.stress_index = Number(stressIndex);
  if (appointmentDate !== undefined) updates.appointment_date = new Date(appointmentDate).toISOString();

  const { data, error } = await supabase
    .from('wellness_appointments')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);

  // If status changed and linked to a program, accurately recalculate enrolled_count
  if (existing.program_id && updates.status !== undefined) {
    const { count: actualCount } = await supabase
      .from('wellness_appointments')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('program_id', existing.program_id)
      .neq('status', 'Cancelled');

    await supabase
      .from('wellness_programs')
      .update({ enrolled_count: actualCount || 0 })
      .eq('id', existing.program_id)
      .eq('tenant_id', tenantId);
  }

  return NextResponse.json({
    success: true,
    message: 'Wellness appointment updated successfully',
    data
  });
}, { requireAuth: true });

// DELETE handler: Cancel and Delete Wellness Appointment
export const DELETE = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant information required');

  const currentActorId = await resolveActorUuid(context, supabase);
  const user = context.auth!.user;
  const userRole = (user.role || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const canApprove = ['admin', 'hr_manager', 'project_manager'].includes(userRole);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) throw new BadRequestError('Appointment ID is required');

  const { data: existing, error: fetchErr } = await supabase
    .from('wellness_appointments')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (fetchErr || !existing) throw new NotFoundError('Wellness appointment not found');

  if (!canApprove && existing.user_id !== currentActorId) {
    throw new ForbiddenError('You can only cancel your own wellness appointments');
  }

  const { error } = await supabase
    .from('wellness_appointments')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId);

  if (error) throw new BadRequestError(error.message);

  // If linked to a program, accurately recalculate enrolled_count from active participants
  if (existing.program_id) {
    const { count: actualCount } = await supabase
      .from('wellness_appointments')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('program_id', existing.program_id)
      .neq('status', 'Cancelled');

    await supabase
      .from('wellness_programs')
      .update({ enrolled_count: actualCount || 0 })
      .eq('id', existing.program_id)
      .eq('tenant_id', tenantId);
  }

  return NextResponse.json({
    success: true,
    message: 'Wellness appointment cancelled successfully'
  });
}, { requireAuth: true });
