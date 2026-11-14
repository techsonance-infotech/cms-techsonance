import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { detectComplianceViolations, type ComplianceViolation } from './violation-detector';
import { COMPLIANCE_DOMAINS } from './constants';

export interface DepartmentComplianceScore {
  department: string;
  score: number;
  totalEmployees: number;
  compliantCount: number;
}

export interface EmployeeComplianceScore {
  employeeId: string;
  name: string;
  department: string;
  score: number;
  status: 'Healthy' | 'Needs_Review' | 'Critical_Violations';
  openViolationsCount: number;
}

export interface ComplianceEngineResult {
  violations: ComplianceViolation[];
  employeeScores: EmployeeComplianceScore[];
  departmentScores: DepartmentComplianceScore[];
  globalScore: number;
  upcomingDeadlines: {
    id: string;
    employeeName: string;
    category: string;
    itemName: string;
    dueDate: string;
    daysRemaining: number;
  }[];
}

export async function runComplianceEngineScan(tenantId: string): Promise<ComplianceEngineResult> {
  const supabase = getAdminRouteSupabase();
  const now = new Date();

  // 1. Run violation detector
  const violations = await detectComplianceViolations(tenantId);

  // 2. Fetch active employees & users
  let employees: any[] = [];
  try {
    const { data } = await supabase
      .from('employees')
      .select('id, user_id, first_name, last_name, department, status')
      .eq('tenant_id', tenantId)
      .eq('status', 'active');
    if (data) employees = data;
  } catch (err) {
    console.warn('Compliance Engine: employees query error:', err);
  }

  // 3. Fetch all compliance verification items
  let cItems: any[] = [];
  try {
    const { data } = await supabase
      .from('compliance_items')
      .select('*')
      .eq('tenant_id', tenantId);
    if (data) cItems = data;
  } catch (err) {
    console.warn('Compliance Engine: compliance items query error:', err);
  }

  // Group items & violations by employee ID/User ID
  const employeeScores: EmployeeComplianceScore[] = [];
  const deptEmployeeScores = new Map<string, number[]>();

  for (const emp of employees) {
    const empIdStr = String(emp.id);
    const empName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Employee';
    const dept = emp.department || 'General Operations';

    // Filter violations for this employee
    const empViolations = violations.filter(v => v.employeeId === empIdStr && v.status !== 'Resolved');
    
    // Filter verification items
    const empItems = cItems.filter(ci => String(ci.user_id) === String(emp.user_id) || String(ci.employee_id) === empIdStr);

    // Compute base compliance score (100 base, subtract penalty per unresolved violation)
    let score = 100;
    for (const v of empViolations) {
      if (v.severity === 'Critical') score -= 30;
      else if (v.severity === 'High') score -= 20;
      else if (v.severity === 'Medium') score -= 10;
      else score -= 5;
    }
    score = Math.max(0, score);

    let status: 'Healthy' | 'Needs_Review' | 'Critical_Violations' = 'Healthy';
    if (score < 60) {
      status = 'Critical_Violations';
    } else if (score < 90) {
      status = 'Needs_Review';
    }

    employeeScores.push({
      employeeId: empIdStr,
      name: empName,
      department: dept,
      score,
      status,
      openViolationsCount: empViolations.length
    });

    if (!deptEmployeeScores.has(dept)) {
      deptEmployeeScores.set(dept, []);
    }
    deptEmployeeScores.get(dept)!.push(score);
  }

  // Compute department averages
  const departmentScores: DepartmentComplianceScore[] = [];
  let sumGlobalScore = 0;
  let countGlobalScore = 0;

  for (const [dept, scores] of deptEmployeeScores.entries()) {
    const sum = scores.reduce((a, b) => a + b, 0);
    const score = Math.round(sum / scores.length);
    const compliantCount = scores.filter(s => s >= 90).length;

    departmentScores.push({
      department: dept,
      score,
      totalEmployees: scores.length,
      compliantCount
    });

    sumGlobalScore += sum;
    countGlobalScore += scores.length;
  }

  const globalScore = countGlobalScore > 0 ? Math.round(sumGlobalScore / countGlobalScore) : 100;

  // 4. Compute upcoming deadlines from verification ledger and doc vault
  const upcomingDeadlines: ComplianceEngineResult['upcomingDeadlines'] = [];
  const allExpirySources = [
    ...cItems.map(ci => ({
      id: ci.id,
      userId: ci.user_id,
      category: ci.category,
      itemName: ci.item_name,
      dueDate: ci.due_date,
      status: ci.compliance_status
    })),
    ...violations.map(v => ({
      id: v.id,
      userId: v.employeeId,
      category: v.category,
      itemName: v.title,
      dueDate: v.dueDate,
      status: v.status
    }))
  ];

  const uniqueDeadlineMap = new Map<string, any>();
  const empMap = new Map(employees.map(e => [String(e.id), e]));
  const userMap = new Map(employees.filter(e => e.user_id).map(e => [String(e.user_id), e]));

  for (const item of allExpirySources) {
    if (!item.dueDate || item.status === 'Resolved' || item.status === 'Compliant') continue;

    const dueDateObj = new Date(item.dueDate);
    const timeDiff = dueDateObj.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysRemaining >= 0 && daysRemaining <= 90) {
      const emp = empMap.get(String(item.userId)) || userMap.get(String(item.userId));
      const empName = emp ? `${emp.first_name || ''} ${emp.last_name || ''}`.trim() : 'Employee';

      const key = `${item.category}-${item.dueDate}-${empName}`;
      if (!uniqueDeadlineMap.has(key)) {
        uniqueDeadlineMap.set(key, {
          id: item.id,
          employeeName: empName,
          category: item.category,
          itemName: item.itemName,
          dueDate: item.dueDate.slice(0, 10),
          daysRemaining
        });
      }
    }
  }

  return {
    violations,
    employeeScores: employeeScores.sort((a, b) => a.score - b.score), // prioritize low scores first
    departmentScores: departmentScores.sort((a, b) => a.score - b.score),
    globalScore,
    upcomingDeadlines: Array.from(uniqueDeadlineMap.values()).sort((a, b) => a.daysRemaining - b.daysRemaining)
  };
}
