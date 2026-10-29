import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const dynamic = 'force-dynamic';

export const GET = withApiHandler(async (request, context) => {
  try {
    const tenantId = context.auth?.user.tenantId;
    if (!tenantId) throw new BadRequestError('Tenant info required');

    const supabase = getAdminRouteSupabase();

    // Fetch all employees for this tenant (efficient for <500 employees; paginate in future)
    const { data: employees, error } = await supabase
      .from('employees')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    if (error) throw new BadRequestError(error.message);


    const searchParams = new URL(request.url).searchParams;
    const dateRangeParam = searchParams.get('dateRange') || 'Last 30 Days';
    const filtersParam = searchParams.get('filters') || '';

    const allEmployeesRaw = (employees as Record<string, any>[] | null) ?? [];

    // Helper to extract fields from row or fallback skills JSONB column
    const getField = (row: any, columnName: string, camelName: string, defaultValue: any = null) => {
      if (row[columnName] !== undefined && row[columnName] !== null) {
        return row[columnName];
      }
      let parsedSkills: any = null;
      if (typeof row.skills === 'string') {
        try {
          parsedSkills = JSON.parse(row.skills);
        } catch {}
      } else {
        parsedSkills = row.skills;
      }
      if (parsedSkills && typeof parsedSkills === 'object' && !Array.isArray(parsedSkills) && parsedSkills[camelName] !== undefined) {
        return parsedSkills[camelName];
      }
      return defaultValue;
    };

    const normalizedEmployees = allEmployeesRaw.map(row => {
      const workMode = getField(row, 'work_mode', 'workMode', 'office');
      const salaryVal = row.salary ? Number(row.salary) : Number(getField(row, 'ctc', 'ctc', 0));
      const genderVal = getField(row, 'gender', 'gender');
      const dateOfJoining = row.date_of_joining || getField(row, 'date_of_joining', 'dateOfJoining');
      const dateOfBirth = row.date_of_birth || getField(row, 'date_of_birth', 'dateOfBirth');
      const confirmationDate = getField(row, 'confirmation_date', 'confirmationDate');
      const exitDate = row.exit_date || getField(row, 'exit_date', 'exitDate');
      const workLocation = row.work_location || getField(row, 'work_location', 'workLocation', 'Office');
      
      return {
        ...row,
        work_mode: typeof workMode === 'string' ? workMode.toLowerCase() : 'office',
        salary: salaryVal,
        gender: genderVal,
        date_of_joining: dateOfJoining,
        date_of_birth: dateOfBirth,
        confirmation_date: confirmationDate,
        exit_date: exitDate,
        work_location: workLocation
      };
    });

    let allEmployees = [...normalizedEmployees];
    if (filtersParam) {
      const filters = filtersParam.split(',');
      if (filters.includes('hq')) {
        allEmployees = allEmployees.filter(e => e.work_location === 'HQ' || (e.office as string)?.toLowerCase() === 'hq');
      }
      if (filters.includes('remote')) {
        allEmployees = allEmployees.filter(e => e.work_mode === 'remote');
      }
      if (filters.includes('on-leave')) {
        allEmployees = allEmployees.filter(e => e.status === 'on_leave');
      }
    }

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Apply dateRange filtering boundaries to metrics
    let rangeStartDate = new Date(0);
    if (dateRangeParam === 'Last 7 Days') {
      rangeStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (dateRangeParam === 'Last 30 Days') {
      rangeStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (dateRangeParam === 'This Month') {
      rangeStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (dateRangeParam === 'This Quarter') {
      const q = Math.floor(now.getMonth() / 3);
      rangeStartDate = new Date(now.getFullYear(), q * 3, 1);
    } else if (dateRangeParam === 'This Year') {
      rangeStartDate = new Date(now.getFullYear(), 0, 1);
    }

    // Filter employees to only those joined on or before target date range or active within period
    if (dateRangeParam !== 'All Time') {
      allEmployees = allEmployees.filter(e => {
        if (!e.date_of_joining) return true;
        const doj = new Date(e.date_of_joining as string);
        return doj <= now;
      });
    }

  // Status counts
  const total = allEmployees.length;
  const active = allEmployees.filter(e => e.status === 'active').length;
  const onLeave = allEmployees.filter(e => e.status === 'on_leave').length;
  const inactive = allEmployees.filter(e => e.status === 'resigned' || e.status === 'terminated' || e.status === 'inactive').length;
  const onNotice = allEmployees.filter(e => e.status === 'on_notice').length;
  const probation = allEmployees.filter(e => {
    const confirmDate = e.confirmation_date ? new Date(e.confirmation_date as string) : null;
    return e.status === 'active' && confirmDate && confirmDate > now;
  }).length;

  // Employment type counts
  const contract = allEmployees.filter(e => e.employment_type === 'contract').length;
  const intern = allEmployees.filter(e => e.employment_type === 'intern').length;

  // Work mode counts
  const remote = allEmployees.filter(e => e.work_mode === 'remote').length;
  const hybrid = allEmployees.filter(e => e.work_mode === 'hybrid').length;
  const wfo = allEmployees.filter(e => !e.work_mode || e.work_mode === 'office').length;

  // Unique counts
  const departments = new Set(allEmployees.map(e => e.department).filter(Boolean)).size;
  const locations = new Set(allEmployees.map(e => e.work_location).filter(Boolean)).size;

  // Gender breakdown
  const male = allEmployees.filter(e => (e.gender as string)?.toLowerCase() === 'male').length;
  const female = allEmployees.filter(e => (e.gender as string)?.toLowerCase() === 'female').length;
  const otherGender = allEmployees.filter(e => {
    const g = (e.gender as string)?.toLowerCase();
    return g && g !== 'male' && g !== 'female';
  }).length;

  // Averages
  const employeesWithDob = allEmployees.filter(e => e.date_of_birth);
  const avgAge = employeesWithDob.length > 0
    ? Math.round(employeesWithDob.reduce((sum, e) => {
        const dob = new Date(e.date_of_birth as string);
        const age = (now.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        return sum + age;
      }, 0) / employeesWithDob.length * 10) / 10
    : null;

  const employeesWithJoin = allEmployees.filter(e => e.date_of_joining);
  const avgExperience = employeesWithJoin.length > 0
    ? Math.round(employeesWithJoin.reduce((sum, e) => {
        const joined = new Date(e.date_of_joining as string);
        const exp = (now.getTime() - joined.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        return sum + exp;
      }, 0) / employeesWithJoin.length * 10) / 10
    : null;

  const employeesWithSalary = allEmployees.filter(e => typeof e.salary === 'number' && e.salary > 0);
  const avgSalary = employeesWithSalary.length > 0
    ? Math.round(employeesWithSalary.reduce((sum, e) => sum + (e.salary as number), 0) / employeesWithSalary.length)
    : null;

  // This month joiners / resignations
  const newJoiners = allEmployees.filter(e => {
    if (!e.date_of_joining) return false;
    const d = new Date(e.date_of_joining as string);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  const resignedThisMonth = allEmployees.filter(e => {
    if (!e.exit_date) return false;
    const d = new Date(e.exit_date as string);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  // Upcoming birthdays (next 7 days)
  const upcomingBirthdays = allEmployees.filter(e => {
    if (!e.date_of_birth) return false;
    const dob = new Date(e.date_of_birth as string);
    const thisYearBday = new Date(thisYear, dob.getMonth(), dob.getDate());
    return thisYearBday >= now && thisYearBday <= weekFromNow;
  }).length;

  // Work anniversaries (this week)
  const workAnniversaries = allEmployees.filter(e => {
    if (!e.date_of_joining) return false;
    const doj = new Date(e.date_of_joining as string);
    if (doj.getFullYear() === thisYear) return false; // Not an anniversary in first year
    const thisYearAnni = new Date(thisYear, doj.getMonth(), doj.getDate());
    return thisYearAnni >= now && thisYearAnni <= weekFromNow;
  }).length;

  // Department breakdown for chart
  const deptBreakdown: Record<string, number> = {};
  allEmployees.forEach(e => {
    const dept = (e.department as string) || 'Unassigned';
    deptBreakdown[dept] = (deptBreakdown[dept] || 0) + 1;
  });

  // Status breakdown for chart
  const statusBreakdown: Record<string, number> = {};
  allEmployees.forEach(e => {
    const s = (e.status as string) || 'unknown';
    statusBreakdown[s] = (statusBreakdown[s] || 0) + 1;
  });

  // Experience distribution buckets
  const experienceBuckets = {
    '0-2 years': 0,
    '2-5 years': 0,
    '5-8 years': 0,
    '8+ years': 0
  };
  allEmployees.forEach(e => {
    if (!e.date_of_joining) return;
    const joined = new Date(e.date_of_joining as string);
    const exp = (now.getTime() - joined.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (exp < 2) {
      experienceBuckets['0-2 years']++;
    } else if (exp < 5) {
      experienceBuckets['2-5 years']++;
    } else if (exp < 8) {
      experienceBuckets['5-8 years']++;
    } else {
      experienceBuckets['8+ years']++;
    }
  });

  // Attrition Rate: exited / (total + exited) * 100
  const exitedCount = allEmployees.filter(e => e.status === 'resigned' || e.status === 'terminated' || e.exit_date).length;
  const attritionRate = total > 0 ? Number(((exitedCount / (total + exitedCount)) * 100).toFixed(1)) : 0.0;

  // Salary distribution buckets
  const salaryDistribution = [
    { name: '< 5L', value: allEmployees.filter(e => {
        const val = Number(e.ctc || e.salary || 0);
        return val > 0 && val < 500000;
      }).length },
    { name: '5L - 10L', value: allEmployees.filter(e => {
        const val = Number(e.ctc || e.salary || 0);
        return val >= 500000 && val < 1000000;
      }).length },
    { name: '10L - 15L', value: allEmployees.filter(e => {
        const val = Number(e.ctc || e.salary || 0);
        return val >= 1000000 && val < 1500000;
      }).length },
    { name: '15L+', value: allEmployees.filter(e => {
        const val = Number(e.ctc || e.salary || 0);
        return val >= 1500000;
      }).length }
  ];

  // Headcount Growth Trend (last 6 months)
  const headcountGrowth: { name: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const targetDate = new Date(thisYear, thisMonth - i, 1);
    const mLabel = targetDate.toLocaleString('default', { month: 'short' });
    const countAtMonth = allEmployees.filter(e => {
      if (!e.date_of_joining) return false;
      const doj = new Date(e.date_of_joining as string);
      const exited = e.exit_date ? new Date(e.exit_date as string) : null;
      const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
      return doj <= monthEnd && (!exited || exited > monthEnd);
    }).length;
    headcountGrowth.push({ name: `${mLabel}`, value: countAtMonth });
  }

  let pendingReviews = 0;
  let pendingDocuments = 0;
  let assetRecovery = 0;
  let missingAttendance = 0;

  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const [reviewsRes, docsRes, assetsRes, attendanceRecordsRes, legacyAttendanceRes] = await Promise.all([
      supabase.from('performance_reviews').select('employee_id').eq('tenant_id', tenantId),
      supabase.from('employee_documents').select('employee_id').eq('tenant_id', tenantId),
      supabase.from('employee_assets').select('employee_id').eq('tenant_id', tenantId).eq('status', 'issued'),
      supabase.from('attendance_records').select('employee_id').eq('tenant_id', tenantId).eq('date', todayStr),
      supabase.from('attendance').select('employee_id').eq('tenant_id', tenantId).eq('date', todayStr)
    ]);

    const reviewedIds = new Set((reviewsRes.data || []).map((r: any) => Number(r.employee_id)));
    pendingReviews = allEmployees.filter(e => e.status === 'active' && !reviewedIds.has(Number(e.id))).length;

    const docCounts: Record<number, number> = {};
    (docsRes.data || []).forEach((d: any) => {
      const empId = Number(d.employee_id);
      docCounts[empId] = (docCounts[empId] || 0) + 1;
    });
    pendingDocuments = allEmployees.filter(e => e.status === 'active' && (docCounts[Number(e.id)] || 0) < 3).length;

    const issuedAssetEmpIds = new Set((assetsRes.data || []).map((a: any) => Number(a.employee_id)));
    assetRecovery = allEmployees.filter(e => (e.status === 'on_notice' || e.status === 'resigned' || e.status === 'terminated' || e.status === 'inactive') && issuedAssetEmpIds.has(Number(e.id))).length;

    const checkedInEmpIds = new Set([
      ...(attendanceRecordsRes.data || []).map((a: any) => Number(a.employee_id)),
      ...(legacyAttendanceRes.data || []).map((a: any) => Number(a.employee_id)),
    ]);
    missingAttendance = allEmployees.filter(e => e.status === 'active' && !checkedInEmpIds.has(Number(e.id))).length;
  } catch (dbErr) {
    console.error('Error fetching dashboard auxiliary metrics:', dbErr);
  }

  // Call Groq / Gemini AI for real dynamic insights!
  let dynamicInsights: string[] = [];
  const groqApiKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY;

  const aiPrompt = `Analyze the following HR/Workforce Metrics for our company and generate exactly 4 short, actionable, bulleted HR recommendations or insights.
Identify any risks (such as attrition risk, missing compliance/documentation, outstanding performance reviews, or high remote headcount) or positive trends.
Format each bullet point to start with a category label in bold (e.g. "**Attrition Risk**: ...", "**Compliance Action**: ...", "**Staffing Balance**: ...") and keep it under 30 words per bullet point.
Do not output any introductory or concluding text. Return exactly 4 separate bullet points.

Metrics:
- Total Headcount: ${total} staff (${active} active, ${onLeave} on leave, ${onNotice} on notice, ${probation} on probation)
- Work Modes: ${remote} remote, ${hybrid} hybrid, ${wfo} in office
- Locations count: ${locations} locations
- Attrition Rate: ${attritionRate}%
- Missing Documents (KYC): ${pendingDocuments} profiles
- Pending Performance Reviews: ${pendingReviews} reviews
- Assets Pending Return: ${assetRecovery} assets
- Missing Attendance Today: ${missingAttendance} profiles
- New Joiners this month: ${newJoiners}
- Resignations this month: ${resignedThisMonth}`;

  if (groqApiKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqApiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are an expert HR analyst. Provide actionable, concise bullet points.' },
            { role: 'user', content: aiPrompt }
          ],
          temperature: 0.3,
          max_tokens: 300
        })
      });
      if (res.ok) {
        const json = await res.json();
        const content = json.choices?.[0]?.message?.content;
        if (content) {
          dynamicInsights = content
            .split('\n')
            .map((line: string) => line.replace(/^-\s*/, '').replace(/^\*\s*/, '').trim())
            .filter((line: string) => line.length > 5)
            .slice(0, 4);
        }
      }
    } catch (err) {
      console.error('Groq workforce insights query failed:', err);
    }
  }

  if (dynamicInsights.length === 0 && geminiKey) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: aiPrompt
            }]
          }]
        })
      });
      if (res.ok) {
        const json = await res.json();
        const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (content) {
          dynamicInsights = content
            .split('\n')
            .map((line: string) => line.replace(/^-\s*/, '').replace(/^\*\s*/, '').trim())
            .filter((line: string) => line.length > 5)
            .slice(0, 4);
        }
      }
    } catch (err) {
      console.error('Gemini workforce insights query failed:', err);
    }
  }

  // Fallback if APIs are offline or not configured
  if (dynamicInsights.length === 0) {
    dynamicInsights = [
      `Attrition Trend: The attrition rate is currently at **${attritionRate}%**. Suggest initiating exit interviews to identify triggers.`,
      `Document Gap: **${pendingDocuments}** active profiles are missing KYC or employment contracts. Action is required.`,
      `Performance Backlog: **${pendingReviews}** review cycles are overdue. Prioritize review completions.`,
      `Asset Recovery: **${assetRecovery}** notice-period/resigned staff still hold company-issued assets.`
    ];
  }

  const aiInsights = dynamicInsights;

    return NextResponse.json({
      success: true,
      data: {
        // Headcount
        total, active, inactive, onLeave, onNotice, probation, contract, intern,
        // Work mode
        remote, hybrid, wfo,
        // Demographics
        departments, locations, male, female, otherGender,
        // Averages
        avgAge, avgExperience, avgSalary,
        // Activity
        newJoiners, resignedThisMonth,
        upcomingBirthdays, workAnniversaries,
        // Breakdowns (for charts)
        deptBreakdown,
        statusBreakdown,
        experienceBuckets,
        // New variables
        attritionRate,
        salaryDistribution,
        headcountGrowth,
        pendingReviews,
        pendingDocuments,
        assetRecovery,
        missingAttendance,
        aiInsights,
      },
      message: 'Workforce stats fetched successfully',
    });
  } catch (err: any) {
    console.error('Workforce stats API error:', err);
    throw err;
  }
}, { requireAuth: true, roles: ['Employee'] });
