import { jsPDF } from 'jspdf';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/server/http/errors';
import { getCurrentSupabaseActor, getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { listSupabaseProfilesByAuthIds } from '@/server/supabase/users';

export const GET = withApiHandler(async (request, context) => {
  const payrollId = Number(new URL(request.url).searchParams.get('payrollId'));
  if (!Number.isInteger(payrollId) || payrollId <= 0) {
    throw new BadRequestError('Valid payroll id is required');
  }
  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');
  
  const actor = await getCurrentSupabaseActor(accessToken);
  const supabase = getAdminRouteSupabase();
  const { data: payrollRecord } = await supabase
    .from('payroll')
    .select('*')
    .eq('id', payrollId)
    .eq('tenant_id', tenantId)
    .single();
  if (!payrollRecord) throw new NotFoundError('Payroll record not found');

  const [employeeResp, settingsResp] = await Promise.all([
    supabase
      .from('employees')
      .select('*')
      .eq('id', Number(payrollRecord.employee_id))
      .eq('tenant_id', tenantId)
      .maybeSingle(),
    supabase
      .from('business_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .limit(1)
      .maybeSingle(),
  ]);
  let employee = employeeResp?.data;
  const settings = settingsResp?.data;

  // Fallback lookup if employee was not matched by numeric id
  if (!employee && payrollRecord.employee_id) {
    const { data } = await supabase
      .from('employees')
      .select('*')
      .eq('employee_id', String(payrollRecord.employee_id))
      .eq('tenant_id', tenantId)
      .maybeSingle();
    employee = data;
  }

  if (!employee) throw new NotFoundError('Employee not found');

  const isAdminLike = actor.role === 'Admin' || actor.role === 'SuperAdmin' || actor.role === 'Manager';
  const isOwner =
    String(employee.user_id) === String(actor.authUserId) ||
    String(employee.user_id) === String(actor.legacyUserId) ||
    (context.auth?.user && String(employee.user_id) === String(context.auth.user.providerUserId)) ||
    (context.auth?.user && String(employee.user_id) === String(context.auth.user.id));

  if (!isAdminLike && !isOwner) {
    throw new ForbiddenError('You can only view your own payslip');
  }

  let employeeName = employee.name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || employee.employee_id;
  try {
    const profiles = await listSupabaseProfilesByAuthIds([String(employee.user_id)], { accessToken, tenantId, useAdmin: true });
    const employeeProfile = profiles.get(String(employee.user_id));
    if (employeeProfile) {
      employeeName = `${employeeProfile.first_name || ''} ${employeeProfile.last_name || ''}`.trim() || employeeProfile.email || employeeName;
    }
  } catch (err) {
    console.warn('Could not fetch employee profile for payslip:', err);
  }

  if ((!employeeName || employeeName === employee.employee_id) && employee.user_id) {
    try {
      const { data: userRec } = await supabase
        .from('users')
        .select('*')
        .eq('id', employee.user_id)
        .maybeSingle();
      if (userRec) {
        employeeName = `${userRec.first_name || ''} ${userRec.last_name || ''}`.trim() || userRec.email || employeeName;
      }
    } catch {}
  }

  let monthName = String(payrollRecord.month || '');
  try {
    if (payrollRecord.month && String(payrollRecord.month).includes('-')) {
      const parts = String(payrollRecord.month).split('-');
      const yNum = parseInt(parts[0], 10);
      const mNum = parseInt(parts[1], 10);
      monthName = new Date(yNum, mNum - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    } else if (payrollRecord.month) {
      const mNum = parseInt(String(payrollRecord.month), 10);
      if (!isNaN(mNum) && mNum >= 1 && mNum <= 12) {
        monthName = new Date(payrollRecord.year || new Date().getFullYear(), mNum - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
      }
    }
  } catch {}

  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = 595.28;
  const left = 40;
  const right = 555;
  const contentWidth = 515;

  // Header - Company Details & Payslip Badge
  let y = 45;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(15, 23, 42); // slate-900
  pdf.text(String((settings as any)?.business_name || 'Techsonance CMS'), left, y);

  y += 18;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139); // slate-500
  if ((settings as any)?.address) {
    pdf.text(String((settings as any).address), left, y);
    y += 14;
  }
  const contactParts: string[] = [];
  if ((settings as any)?.email) contactParts.push(`Email: ${(settings as any).email}`);
  if ((settings as any)?.contact_number) contactParts.push(`Phone: ${(settings as any).contact_number}`);
  if (contactParts.length > 0) {
    pdf.text(contactParts.join('   |   '), left, y);
    y += 14;
  }

  // Top right Payslip Badge
  pdf.setFillColor(241, 245, 249); // slate-100
  pdf.setDrawColor(203, 213, 225); // slate-300
  pdf.roundedRect(385, 38, 170, 48, 4, 4, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(30, 41, 59); // slate-800
  pdf.text('PAYSLIP', 470, 56, { align: 'center' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105); // slate-600
  pdf.text(monthName || `Year: ${payrollRecord.year || ''}`, 470, 72, { align: 'center' });

  // Divider
  y = Math.max(y + 12, 105);
  pdf.setDrawColor(226, 232, 240); // slate-200
  pdf.setLineWidth(1);
  pdf.line(left, y, right, y);
  y += 14;

  // Employee & Attendance Info Card
  const cardTop = y;
  const cardHeight = 88;
  pdf.setFillColor(248, 250, 252); // slate-50
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(left, cardTop, contentWidth, cardHeight, 4, 4, 'FD');

  // Left Column (Employee Details)
  const drawField = (label: string, val: string, xLabel: number, xVal: number, rowY: number, isBold = false) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text(label, xLabel, rowY);
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    pdf.setFontSize(9.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(val || '-', xVal, rowY);
  };

  drawField('EMPLOYEE NAME:', employeeName, 52, 150, cardTop + 18, true);
  drawField('EMPLOYEE ID:', String((employee as any).employee_id || '-'), 52, 150, cardTop + 36);
  drawField('DESIGNATION:', String((employee as any).designation || '-'), 52, 150, cardTop + 54);
  drawField('DEPARTMENT:', String((employee as any).department || '-'), 52, 150, cardTop + 72);

  // Right Column (Attendance Details)
  drawField('TOTAL DAYS:', String(payrollRecord.total_working_days ?? '-'), 305, 420, cardTop + 18);
  drawField('PRESENT DAYS:', String(payrollRecord.present_days ?? '-'), 305, 420, cardTop + 36);
  drawField('HALF DAYS:', `${payrollRecord.half_days ?? 0} (${Number(payrollRecord.half_days ?? 0) * 0.5} eff.)`, 305, 420, cardTop + 54);
  drawField('LEAVE / ABSENT:', `${payrollRecord.leave_days ?? 0} / ${payrollRecord.absent_days ?? 0}`, 305, 420, cardTop + 72);

  y = cardTop + cardHeight + 20;

  // Earnings & Deductions Tables
  const colW = 250;
  const gap = 15;
  const earnX = left;
  const dedX = left + colW + gap;

  // Table Headers
  pdf.setFillColor(30, 41, 59); // slate-800
  pdf.rect(earnX, y, colW, 24, 'F');
  pdf.rect(dedX, y, colW, 24, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(255, 255, 255);
  pdf.text('EARNINGS', earnX + 10, y + 16);
  pdf.text('AMOUNT (INR)', earnX + colW - 10, y + 16, { align: 'right' });

  pdf.text('DEDUCTIONS', dedX + 10, y + 16);
  pdf.text('AMOUNT (INR)', dedX + colW - 10, y + 16, { align: 'right' });
  y += 24;

  const baseSalary = Number((payrollRecord as any).base_salary ?? 0);
  const calculatedSalary = Number((payrollRecord as any).calculated_salary ?? baseSalary);
  const bonuses = Number((payrollRecord as any).bonuses ?? 0);
  const deductions = Number((payrollRecord as any).deductions ?? 0);
  const netSalary = Number((payrollRecord as any).net_salary ?? (calculatedSalary + bonuses - deductions));

  const earnRows = [
    { label: 'Basic / Base Salary', amount: baseSalary },
    { label: 'Calculated Salary (Attendance)', amount: calculatedSalary },
    { label: 'Bonuses & Incentives', amount: bonuses },
  ];

  const dedRows = [
    { label: 'Standard Deductions', amount: deductions },
    { label: 'Unpaid Leave / Absences', amount: Math.max(0, baseSalary - calculatedSalary) },
    { label: 'Other Regulatory Adjustments', amount: 0 },
  ];

  const rowCount = Math.max(earnRows.length, dedRows.length);
  const rowH = 22;

  for (let i = 0; i < rowCount; i++) {
    const rowY = y + (i * rowH);
    pdf.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252);
    pdf.rect(earnX, rowY, colW, rowH, 'F');
    pdf.rect(dedX, rowY, colW, rowH, 'F');

    pdf.setDrawColor(241, 245, 249);
    pdf.line(earnX, rowY + rowH, earnX + colW, rowY + rowH);
    pdf.line(dedX, rowY + rowH, dedX + colW, rowY + rowH);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(51, 65, 85);

    if (earnRows[i]) {
      pdf.text(earnRows[i].label, earnX + 10, rowY + 15);
      pdf.text(`Rs. ${earnRows[i].amount.toLocaleString()}`, earnX + colW - 10, rowY + 15, { align: 'right' });
    }
    if (dedRows[i]) {
      pdf.text(dedRows[i].label, dedX + 10, rowY + 15);
      pdf.text(`Rs. ${dedRows[i].amount.toLocaleString()}`, dedX + colW - 10, rowY + 15, { align: 'right' });
    }
  }

  y += rowCount * rowH;

  // Total Earnings & Total Deductions bar
  pdf.setFillColor(241, 245, 249);
  pdf.rect(earnX, y, colW, 24, 'F');
  pdf.rect(dedX, y, colW, 24, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(15, 23, 42);
  const totalGross = calculatedSalary + bonuses;
  pdf.text('Total Gross', earnX + 10, y + 16);
  pdf.text(`Rs. ${totalGross.toLocaleString()}`, earnX + colW - 10, y + 16, { align: 'right' });

  pdf.text('Total Deductions', dedX + 10, y + 16);
  pdf.text(`Rs. ${deductions.toLocaleString()}`, dedX + colW - 10, y + 16, { align: 'right' });
  y += 36;

  // Net Salary Highlight Box
  pdf.setFillColor(238, 242, 255); // indigo-50
  pdf.setDrawColor(99, 102, 241); // indigo-500
  pdf.setLineWidth(1.5);
  pdf.roundedRect(left, y, contentWidth, 48, 6, 6, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(67, 56, 202); // indigo-700
  pdf.text('NET SALARY PAYABLE:', left + 18, y + 29);

  pdf.setFontSize(16);
  pdf.setTextColor(30, 27, 75); // indigo-950
  pdf.text(`INR ${netSalary.toLocaleString()}`, right - 18, y + 31, { align: 'right' });
  y += 62;

  // Notes if available
  if ((payrollRecord as any).notes) {
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(left, y, contentWidth, 38, 4, 4, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text('NOTES / REMARKS:', left + 12, y + 15);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(30, 41, 59);
    pdf.text(String((payrollRecord as any).notes), left + 12, y + 28, { maxWidth: 490 });
    y += 50;
  }

  // Footer
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(1);
  pdf.line(left, 770, right, 770);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184); // slate-400
  pdf.text('This is a system generated payslip and does not require an authorized signature.', left, 784);
  pdf.text(`Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`, right, 784, { align: 'right' });

  const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Payslip_${(employee as any).employee_id || 'emp'}_${(payrollRecord as any).month || 'salary'}.pdf"`,
      'Content-Length': String(pdfBuffer.length),
    },
  });
}, { requireAuth: true, roles: ['Employee'] });
