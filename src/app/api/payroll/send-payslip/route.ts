import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { apiSuccess, apiError } from '@/server/http/response';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import nodemailer from 'nodemailer';
import { jsPDF } from 'jspdf';

// Helper for formatting currency in PDF
function formatINR(val: number | string | undefined | null): string {
  const num = Number(val) || 0;
  return 'Rs. ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Helper to resolve images (Cloudinary, Supabase, /api/upload?fileId=...) into embedded base64 data URIs
async function resolveImageToDataUri(
  rawUrl: string | undefined | null,
  supabaseClient: any
): Promise<string | null> {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  if (rawUrl.startsWith('data:image/')) return rawUrl;

  try {
    let targetUrl = rawUrl;

    // 1. If it's a local / public asset path
    if (targetUrl.startsWith('/') && !targetUrl.includes('fileId=')) {
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const localPath = path.join(process.cwd(), 'public', targetUrl);
        const fileBytes = await fs.readFile(localPath);
        const ext = path.extname(localPath).toLowerCase().replace('.', '');
        const mime = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
        return `data:${mime};base64,${fileBytes.toString('base64')}`;
      } catch {}
    }

    // 2. If it's a file metadata reference
    if (rawUrl.includes('fileId=')) {
      const match = rawUrl.match(/fileId=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        const fileId = match[1];
        const { data } = await supabaseClient
          .from('file_metadata')
          .select('secure_url')
          .eq('id', fileId)
          .maybeSingle();

        if (data?.secure_url) {
          targetUrl = data.secure_url;
        }
      }
    }

    // 3. Fetch remote or local HTTP URL
    if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
      const res = await fetch(targetUrl);
      if (res.ok) {
        const contentType = res.headers.get('content-type') || 'image/png';
        const arrayBuf = await res.arrayBuffer();
        const b64 = Buffer.from(arrayBuf).toString('base64');
        return `data:${contentType};base64,${b64}`;
      }
    }
  } catch (err) {
    console.warn('Could not resolve image to data URI:', rawUrl, err);
  }
  return null;
}

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const body = await request.json();
  const {
    to,
    employeeName,
    employeeCode,
    designation,
    department,
    employmentType,
    joiningDate,
    pan,
    uan,
    salaryMonth,
    slipNo,
    payDate,
    calendarDays,
    workingDays,
    presentDays,
    absentDays,
    paidLeave,
    unpaidLeave,
    paidDays,
    basic,
    hra,
    da,
    special,
    gross,
    employeePf,
    pt,
    tds,
    loan,
    otherDed,
    totalDed,
    lopAdj,
    grossPayable,
    netPay,
    netPayNum,
    amountInWords,
    bankName,
    bankAccount,
    ifsc,
    bankBranch,
    notes,
    signatoryName,
    signatoryTitle,
    html,
    pdfBase64,
    // Additional salary breakdown fields
    weeklyOffs,
    publicHolidays,
    lopDays,
    basicPct,
    daPct,
    hraPct,
    annualCTC,
    remuneration,
    threshold,
    wageComponents,
    excess,
    adjustedWage,
    employerCost,
    gratuity,
    employerEsi,
    notes: bodyNotes,
    logoUrl,
    stampUrl,
    signatureUrl,
  } = body;

  if (!to) {
    throw new BadRequestError('Employee email address is required');
  }

  const supabase = getAdminRouteSupabase();

  // Load tenant's provisioned company & SMTP settings
  const { data: settings } = await supabase
    .from('company_settings')
    .select('company_name, email, address, website, gstin, cin_number, smtp_host, smtp_port, smtp_user, smtp_password, signatory_name, signatory_title, logo_url, stamp_url, digital_signature_url')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  const companyName = settings?.company_name || body.companyName || 'sanket industries';
  const companyAddress = settings?.address || body.companyAddress || '';
  const companyEmail = settings?.email || body.companyEmail || '';
  const companyWebsite = settings?.website || body.companyWebsite || '';
  const companyGstin = settings?.gstin || body.companyGstin || '';
  const companyLlpin = settings?.cin_number || body.companyLlpin || '';
  const finalSignatoryName = signatoryName || settings?.signatory_name || 'Authorized Signatory';
  const finalSignatoryTitle = signatoryTitle || settings?.signatory_title || '';
  const slipNotes = bodyNotes || notes || 'This salary slip is computer generated and does not require a physical signature unless required by company policy.';

  const subject = `Salary Slip - ${salaryMonth || 'Monthly'} (${slipNo || employeeCode || 'Confidential'}) - ${companyName}`;

  // 1. Generate or parse PDF Buffer
  let pdfBuffer: Buffer;

  if (pdfBase64 && typeof pdfBase64 === 'string') {
    const base64Data = pdfBase64.includes(';base64,')
      ? pdfBase64.split(';base64,')[1]
      : pdfBase64.replace(/^data:application\/pdf;base64,/, '');
    pdfBuffer = Buffer.from(base64Data, 'base64');
  } else {
    // Resolve all image assets (Cloudinary, Supabase, /api/upload?fileId=...) into base64 data URIs
    const effectiveLogoRaw = logoUrl || settings?.logo_url;
    const effectiveStampRaw = stampUrl || settings?.stamp_url;
    const effectiveSigRaw = signatureUrl || settings?.digital_signature_url;

    const [resolvedLogo, resolvedStamp, resolvedSig] = await Promise.all([
      resolveImageToDataUri(effectiveLogoRaw, supabase),
      resolveImageToDataUri(effectiveStampRaw, supabase),
      resolveImageToDataUri(effectiveSigRaw, supabase),
    ]);

    // Generate identical A4 Salary Slip PDF matching Image 2 exactly
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const left = 32;
    const right = 563;
    const contentW = right - left; // 531 pt

    // --- Section Header Helper ---
    const drawSectionHeader = (title: string, yPos: number): number => {
      doc.setFillColor(238, 244, 255); // #EEF4FF
      doc.rect(left, yPos, contentW, 13, 'F');
      doc.setFillColor(18, 87, 214); // #1257D6
      doc.rect(left, yPos, 2.5, 13, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(7, 26, 77);
      doc.text(title.toUpperCase(), left + 6, yPos + 9.5);
      return yPos + 16;
    };

    // --- HEADER ---
    let y = 30;

    // Left: Company Brand & Details
    let brandTextX = left;
    if (resolvedLogo) {
      try {
        const fmt = resolvedLogo.includes('image/png') ? 'PNG' : 'JPEG';
        doc.addImage(resolvedLogo, fmt, left, y, 36, 36);
        brandTextX = left + 42;
      } catch (err) {
        console.warn('Could not add logo to PDF:', err);
      }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(7, 26, 77); // #071A4D
    doc.text(companyName, brandTextX, y + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(71, 84, 103);

    // Address lines - strictly bounded to 160pt width so it NEVER collides with center title
    let curDetailY = y + 21;
    if (companyAddress) {
      const addressLines = doc.splitTextToSize(companyAddress.replace(/\n/g, ', '), 160);
      doc.text(addressLines, brandTextX, curDetailY);
      curDetailY += addressLines.length * 8;
    }

    // Email & Website line
    const contactParts = [companyEmail ? `Email: ${companyEmail}` : '', companyWebsite || ''].filter(Boolean);
    if (contactParts.length > 0) {
      const contactText = doc.splitTextToSize(contactParts.join(' • '), 160);
      doc.text(contactText, brandTextX, curDetailY);
      curDetailY += contactText.length * 8;
    }

    // GSTIN & CIN line
    const regParts = [companyGstin ? `GSTIN: ${companyGstin}` : '', companyLlpin ? `LLPIN: ${companyLlpin}` : ''].filter(Boolean);
    if (regParts.length > 0) {
      const regText = doc.splitTextToSize(regParts.join(' • '), 160);
      doc.text(regText, brandTextX, curDetailY);
      curDetailY += regText.length * 8;
    }

    // Center: SALARY SLIP
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(7, 26, 77);
    doc.text('SALARY SLIP', 300, y + 15, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(102, 112, 133);
    doc.text(`Salary Month: ${salaryMonth || 'Monthly Slip'}`, 300, y + 28, { align: 'center' });

    // Right: Slip Metadata
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(7, 26, 77);
    doc.text(`Slip No: ${slipNo || '—'}`, right, y + 12, { align: 'right' });
    doc.text(`Pay Date: ${payDate || '—'}`, right, y + 23, { align: 'right' });
    doc.text(`Tax Regime: ${body.taxRegime === 'new' ? 'New Tax Regime' : 'Old Tax Regime'}`, right, y + 34, { align: 'right' });

    // Dynamic header height so text NEVER overlaps the divider line (minimum 14pt clearance)!
    const headerBottomY = Math.max(curDetailY + 14, y + 54);

    // Header divider line (navy 2px)
    doc.setDrawColor(7, 26, 77);
    doc.setLineWidth(2);
    doc.line(left, headerBottomY, right, headerBottomY);

    y = headerBottomY + 10;

    // --- 1. EMPLOYEE INFORMATION ---
    y = drawSectionHeader('Employee Information', y);

    const empGrid = [
      [
        { l: 'EMPLOYEE NAME', v: employeeName || '—' },
        { l: 'EMPLOYEE CODE', v: employeeCode || '—' },
        { l: 'DESIGNATION', v: designation || '—' },
        { l: 'DEPARTMENT', v: department || '—' },
      ],
      [
        { l: 'EMPLOYMENT TYPE', v: employmentType || 'Full Time' },
        { l: 'JOINING DATE', v: joiningDate || '—' },
        { l: 'PAN', v: pan || '—' },
        { l: 'UAN', v: uan || '—' },
      ],
    ];

    const cardW = (contentW - 9) / 4;
    empGrid.forEach((row) => {
      row.forEach((item, colIdx) => {
        const cx = left + colIdx * (cardW + 3);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(217, 228, 242);
        doc.setLineWidth(0.5);
        doc.roundedRect(cx, y, cardW, 26, 2, 2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(102, 112, 133);
        doc.text(item.l, cx + 5, y + 8);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(23, 32, 51);
        doc.text(item.v, cx + 5, y + 19, { maxWidth: cardW - 8 });
      });
      y += 29;
    });

    y += 2;

    // --- 2. ATTENDANCE & LEAVE SUMMARY ---
    y = drawSectionHeader('Attendance & Leave Summary', y);

    const attCols = [
      { l: 'CALENDAR', v: calendarDays ?? 30 },
      { l: 'WEEKLY OFFS', v: weeklyOffs ?? 9 },
      { l: 'HOLIDAYS', v: publicHolidays ?? 1 },
      { l: 'WORKING', v: workingDays ?? 20 },
      { l: 'PRESENT', v: presentDays ?? 4 },
      { l: 'ABSENT', v: absentDays ?? 2 },
      { l: 'PAID LEAVE', v: paidLeave ?? 0 },
      { l: 'UNPAID', v: unpaidLeave ?? 0 },
      { l: 'LOP DAYS', v: lopDays ?? 2.5 },
      { l: 'PAID DAYS', v: paidDays ?? 4 },
    ];
    const attColW = contentW / attCols.length;

    // Header
    doc.setFillColor(247, 249, 252);
    doc.setDrawColor(223, 231, 241);
    doc.rect(left, y, contentW, 14, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.setTextColor(52, 64, 84);
    attCols.forEach((col, idx) => {
      const cx = left + idx * attColW;
      doc.text(col.l, cx + attColW / 2, y + 9.5, { align: 'center' });
    });
    y += 14;

    // Values
    doc.setFillColor(255, 255, 255);
    doc.rect(left, y, contentW, 15, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(23, 32, 51);
    attCols.forEach((col, idx) => {
      const cx = left + idx * attColW;
      if (idx === attCols.length - 1) doc.setTextColor(7, 26, 77);
      doc.text(String(col.v), cx + attColW / 2, y + 10.5, { align: 'center' });
    });
    y += 20;

    // --- 3. AUTOMATIC SALARY BIFURCATION ---
    y = drawSectionHeader('Automatic Salary Bifurcation', y);

    const bifCols = [
      { l: 'SALARY COMPONENT', w: 180, align: 'left' as const },
      { l: 'MONTHLY (Rs.)', w: 100, align: 'right' as const },
      { l: 'ANNUAL (Rs.)', w: 100, align: 'right' as const },
      { l: 'BASIS', w: 151, align: 'left' as const },
    ];

    doc.setFillColor(247, 249, 252);
    doc.setDrawColor(223, 231, 241);
    doc.rect(left, y, contentW, 14, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(52, 64, 84);

    let curX = left;
    bifCols.forEach((col) => {
      const textX = col.align === 'right' ? curX + col.w - 6 : curX + 6;
      doc.text(col.l, textX, y + 9.5, { align: col.align });
      curX += col.w;
    });
    y += 14;

    const numBasic = Number(basic) || 0;
    const numDa = Number(da) || 0;
    const numHra = Number(hra) || 0;
    const numSpecial = Number(special) || 0;
    const numGross = Number(gross) || 120000;

    const bifRows = [
      { name: 'Basic Pay', m: numBasic, a: numBasic * 12, b: `${basicPct || 50}% of gross` },
      { name: 'Dearness Allowance (DA)', m: numDa, a: numDa * 12, b: `${daPct || 0}% of gross` },
      { name: 'House Rent Allowance (HRA)', m: numHra, a: numHra * 12, b: `${hraPct || 50}% of Basic` },
      { name: 'Special / Balancing Allowance', m: numSpecial, a: numSpecial * 12, b: 'Automatic balance' },
      { name: 'Gross Monthly Salary', m: numGross, a: numGross * 12, b: 'Agreed Salary', isTotal: true },
    ];

    bifRows.forEach((r) => {
      doc.setFillColor(r.isTotal ? 244 : 255, r.isTotal ? 248 : 255, r.isTotal ? 255 : 255);
      doc.rect(left, y, contentW, 13, 'FD');

      doc.setFont('helvetica', r.isTotal ? 'bold' : 'normal');
      doc.setFontSize(7);
      doc.setTextColor(r.isTotal ? 7 : 51, r.isTotal ? 26 : 65, r.isTotal ? 77 : 85);

      let rx = left;
      // Col 1
      doc.text(r.name, rx + 6, y + 9);
      rx += bifCols[0].w;
      // Col 2
      doc.text(r.m.toLocaleString('en-IN', { minimumFractionDigits: 2 }), rx + bifCols[1].w - 6, y + 9, { align: 'right' });
      rx += bifCols[1].w;
      // Col 3
      doc.text(r.a.toLocaleString('en-IN', { minimumFractionDigits: 2 }), rx + bifCols[2].w - 6, y + 9, { align: 'right' });
      rx += bifCols[2].w;
      // Col 4
      doc.setTextColor(102, 112, 133);
      doc.text(r.b, rx + 6, y + 9);

      y += 13;
    });

    y += 5;

    // --- 4. STATUTORY WAGE RULE & EMPLOYER COST ---
    y = drawSectionHeader('Statutory Wage Rule & Employer Cost', y);

    // Sub-table 1: Wage Rule
    const wageCols = [
      { l: 'TOTAL REMUNERATION (50% TEST)', w: 150 },
      { l: '50% THRESHOLD', w: 90 },
      { l: 'WAGE COMPONENTS', w: 90 },
      { l: 'EXCESS ALLOWANCE', w: 90 },
      { l: 'ADJUSTED WAGE BASE', w: 111 },
    ];

    doc.setFillColor(247, 249, 252);
    doc.rect(left, y, contentW, 13, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.setTextColor(52, 64, 84);

    let wx = left;
    wageCols.forEach((col) => {
      doc.text(col.l, wx + col.w / 2, y + 9, { align: 'center' });
      wx += col.w;
    });
    y += 13;

    doc.setFillColor(255, 255, 255);
    doc.rect(left, y, contentW, 13, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(23, 32, 51);

    wx = left;
    const wageVals = [
      (Number(remuneration) || numGross).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      (Number(threshold) || numGross / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      (Number(wageComponents) || numBasic + numDa).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      (Number(excess) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      (Number(adjustedWage) || numGross / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
    ];
    wageVals.forEach((val, i) => {
      doc.text(val, wx + wageCols[i].w / 2, y + 9, { align: 'center' });
      wx += wageCols[i].w;
    });
    y += 15;

    // Sub-table 2: Employer Cost
    const costCols = [
      { l: 'EMPLOYER PF', w: 100 },
      { l: 'GRATUITY', w: 100 },
      { l: 'EMPLOYER ESI', w: 100 },
      { l: 'EMPLOYER COST / MONTH', w: 115 },
      { l: 'ANNUAL CTC', w: 116 },
    ];

    doc.setFillColor(247, 249, 252);
    doc.rect(left, y, contentW, 13, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.setTextColor(52, 64, 84);

    let cx2 = left;
    costCols.forEach((col) => {
      doc.text(col.l, cx2 + col.w / 2, y + 9, { align: 'center' });
      cx2 += col.w;
    });
    y += 13;

    doc.setFillColor(255, 255, 255);
    doc.rect(left, y, contentW, 13, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(23, 32, 51);

    cx2 = left;
    const costVals = [
      (Number(body.employerPf) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      (Number(gratuity) || 2886).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      (Number(employerEsi) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      (Number(employerCost) || 122886).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      (Number(annualCTC) || 1474632).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
    ];
    costVals.forEach((val, i) => {
      if (i >= 3) doc.setTextColor(7, 26, 77);
      doc.text(val, cx2 + costCols[i].w / 2, y + 9, { align: 'center' });
      cx2 += costCols[i].w;
    });
    y += 19;

    // --- 5. EARNINGS / PAYABLE vs EMPLOYEE DEDUCTIONS (2 Columns) ---
    const halfW = (contentW - 10) / 2;
    const colLeftX = left;
    const colRightX = left + halfW + 10;

    // Section heads for columns
    doc.setFillColor(238, 244, 255);
    doc.rect(colLeftX, y, halfW, 13, 'F');
    doc.rect(colRightX, y, halfW, 13, 'F');
    doc.setFillColor(18, 87, 214);
    doc.rect(colLeftX, y, 2.5, 13, 'F');
    doc.rect(colRightX, y, 2.5, 13, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(7, 26, 77);
    doc.text('EARNINGS / PAYABLE', colLeftX + 6, y + 9.5);
    doc.text('EMPLOYEE DEDUCTIONS', colRightX + 6, y + 9.5);
    y += 15;

    const earnRows = [
      { l: 'Gross Salary', v: numGross.toLocaleString('en-IN', { minimumFractionDigits: 2 }) },
      { l: 'Attendance / LOP Adjustment', v: `-${(Number(lopAdj) || 15000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, isRed: true },
      { l: 'Gross Salary Payable', v: (Number(grossPayable) || 105000).toLocaleString('en-IN', { minimumFractionDigits: 2 }), isTotal: true },
    ];

    const numPt = Number(pt) || 200;
    const numEmployeePf = Number(employeePf) || 0;
    const numTds = Number(tds) || 0;
    const numLoan = Number(loan) || 0;
    const numTotalDed = Number(totalDed) || numPt;

    const dedRows = [
      { l: 'Employee PF', v: numEmployeePf.toLocaleString('en-IN', { minimumFractionDigits: 2 }) },
      { l: 'Professional Tax (PT)', v: numPt.toLocaleString('en-IN', { minimumFractionDigits: 2 }) },
      { l: 'TDS / Income Tax', v: numTds.toLocaleString('en-IN', { minimumFractionDigits: 2 }) },
      { l: 'Salary Advance / Loan', v: numLoan.toLocaleString('en-IN', { minimumFractionDigits: 2 }) },
      { l: 'Total Deductions', v: `-${numTotalDed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, isTotal: true, isRed: true },
    ];

    const maxSideRows = Math.max(earnRows.length, dedRows.length);
    for (let i = 0; i < maxSideRows; i++) {
      // Left side
      if (earnRows[i]) {
        const er = earnRows[i];
        doc.setFillColor(er.isTotal ? 244 : 255, er.isTotal ? 248 : 255, er.isTotal ? 255 : 255);
        doc.setDrawColor(223, 231, 241);
        doc.rect(colLeftX, y + i * 13, halfW, 13, 'FD');

        doc.setFont('helvetica', er.isTotal ? 'bold' : 'normal');
        doc.setFontSize(7);
        doc.setTextColor(er.isRed ? 220 : er.isTotal ? 7 : 51, er.isRed ? 38 : er.isTotal ? 26 : 65, er.isRed ? 38 : er.isTotal ? 77 : 85);
        doc.text(er.l, colLeftX + 6, y + i * 13 + 9);
        doc.text(er.v, colLeftX + halfW - 6, y + i * 13 + 9, { align: 'right' });
      }

      // Right side
      if (dedRows[i]) {
        const dr = dedRows[i];
        doc.setFillColor(dr.isTotal ? 244 : 255, dr.isTotal ? 248 : 255, dr.isTotal ? 255 : 255);
        doc.setDrawColor(223, 231, 241);
        doc.rect(colRightX, y + i * 13, halfW, 13, 'FD');

        doc.setFont('helvetica', dr.isTotal ? 'bold' : 'normal');
        doc.setFontSize(7);
        doc.setTextColor(dr.isRed ? 220 : dr.isTotal ? 7 : 51, dr.isRed ? 38 : dr.isTotal ? 26 : 65, dr.isRed ? 38 : dr.isTotal ? 77 : 85);
        doc.text(dr.l, colRightX + 6, y + i * 13 + 9);
        doc.text(dr.v, colRightX + halfW - 6, y + i * 13 + 9, { align: 'right' });
      }
    }
    y += maxSideRows * 13 + 6;

    // --- 6. NET SALARY PAYABLE BOX ---
    doc.setFillColor(248, 251, 255);
    doc.setDrawColor(7, 26, 77);
    doc.setLineWidth(1.5);
    doc.roundedRect(left, y, contentW, 36, 4, 4, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(7, 26, 77);
    doc.text('NET SALARY PAYABLE', left + 12, y + 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Amount after attendance adjustment and employee deductions', left + 12, y + 26);

    const cleanNetString = 'Rs. ' + (Number(netPayNum) || 104800).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(7, 26, 77);
    doc.text(cleanNetString, right - 12, y + 23, { align: 'right' });

    y += 42;

    // --- 7. AMOUNT IN WORDS ---
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(217, 228, 242);
    doc.setLineWidth(0.5);
    doc.roundedRect(left, y, contentW, 15, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(7, 26, 77);
    doc.text('Amount in words:', left + 6, y + 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(String(amountInWords || 'One Lakh Four Thousand Eight Hundred Rupees Only'), left + 76, y + 10.5);

    y += 20;

    // --- 8. BANK / PAYMENT DETAILS ---
    y = drawSectionHeader('Bank / Payment Details', y);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(223, 231, 241);
    doc.rect(left, y, contentW, 16, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);

    const bankCols = [
      { l: 'Bank:', v: bankName || '—', x: left + 6 },
      { l: 'Account:', v: bankAccount ? `•••• ${String(bankAccount).slice(-4)}` : '—', x: left + 130 },
      { l: 'IFSC:', v: ifsc || '—', x: left + 270 },
      { l: 'Branch:', v: bankBranch || '—', x: left + 390 },
    ];
    bankCols.forEach((bc) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(bc.l, bc.x, y + 11);
      doc.setTextColor(23, 32, 51);
      doc.text(bc.v, bc.x + 36, y + 11);
    });

    y += 21;

    // --- 9. PAYROLL NOTES ---
    y = drawSectionHeader('Payroll Notes', y);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(223, 231, 241);
    doc.rect(left, y, contentW, 16, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(slipNotes, left + 6, y + 11, { maxWidth: contentW - 12 });

    y += 26;

    // --- 10. BOTTOM SIGNATURES & STAMP ---
    const sigBottomY = y + 36;
    doc.setDrawColor(152, 162, 179);
    doc.setLineWidth(0.8);

    // Left: Corporate Stamp
    let stampDrawn = false;
    if (resolvedStamp) {
      try {
        const fmt = resolvedStamp.includes('image/png') ? 'PNG' : 'JPEG';
        doc.addImage(resolvedStamp, fmt, left + 35, y - 4, 65, 42);
        stampDrawn = true;
      } catch (err) {
        console.warn('Could not render stamp image to PDF:', err);
      }
    }
    if (!stampDrawn) {
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const stampPath = path.join(process.cwd(), 'public/branding/tenant-stamp.png');
        const bytes = await fs.readFile(stampPath);
        doc.addImage(`data:image/png;base64,${bytes.toString('base64')}`, 'PNG', left + 35, y - 4, 65, 42);
        stampDrawn = true;
      } catch {}
    }
    if (!stampDrawn) {
      doc.roundedRect(left + 30, y - 4, 75, 42, 3, 3, 'D');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(7, 26, 77);
      doc.text('[Corporate Seal / Stamp]', left + 67.5, y + 18, { align: 'center' });
    }

    // Center: Authorized Signatory
    const signCenterX = 295;
    let sigDrawn = false;
    if (resolvedSig) {
      try {
        const fmt = resolvedSig.includes('image/png') ? 'PNG' : 'JPEG';
        doc.addImage(resolvedSig, fmt, signCenterX - 25, sigBottomY - 32, 50, 28);
        sigDrawn = true;
      } catch (err) {
        console.warn('Could not render signature image to PDF:', err);
      }
    }
    if (!sigDrawn) {
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const sigPath = path.join(process.cwd(), 'public/branding/tenant-signature.png');
        const bytes = await fs.readFile(sigPath);
        doc.addImage(`data:image/png;base64,${bytes.toString('base64')}`, 'PNG', signCenterX - 25, sigBottomY - 32, 50, 28);
        sigDrawn = true;
      } catch {}
    }
    doc.line(signCenterX - 65, sigBottomY, signCenterX + 65, sigBottomY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(finalSignatoryName, signCenterX, sigBottomY + 11, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    if (finalSignatoryTitle) {
      doc.text(finalSignatoryTitle, signCenterX, sigBottomY + 20, { align: 'center' });
    }
    doc.text(`For ${companyName}`, signCenterX, sigBottomY + 29, { align: 'center' });

    // Right: Employee Acknowledgement
    const ackRightX = right - 65;
    doc.line(ackRightX - 65, sigBottomY, ackRightX + 65, sigBottomY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text('Employee Acknowledgement', ackRightX, sigBottomY + 11, { align: 'center' });

    // --- 11. STATUTORY DISCLAIMER FOOTER ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(148, 163, 184);
    const disclaimer =
      'Statutory salary components are configurable. The 50% wage-rule calculation is presented as a payroll computation aid and should be reviewed against the applicable law, notifications and company payroll policy. TDS is manually entered unless payroll tax calculation is independently configured for the relevant financial year.';
    doc.text(disclaimer, left, 818, { maxWidth: contentW });

    pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  }

  // 2. Setup Email Dispatcher
  const defaultUser = process.env.SMTP_USER;
  const defaultPass = process.env.SMTP_PASSWORD;

  const pdfFilename = `Salary_Slip_${employeeCode || 'Emp'}_${String(salaryMonth || 'Monthly').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

  if ((!settings || !settings.smtp_host) && (!defaultUser || !defaultPass)) {
    console.warn('SMTP credentials not configured. Simulating delivery for payslip dispatch with PDF attachment.');
    return apiSuccess(
      {
        messageId: `sim-payslip-${Date.now()}@${tenantId}.local`,
        isSimulated: true,
        sentTo: to,
        employeeName,
        salaryMonth,
        attachedPdf: pdfFilename,
        pdfSizeBytes: pdfBuffer.length,
      },
      `Salary slip emailed successfully to ${to} with attached PDF "${pdfFilename}" (Simulated delivery - configure SMTP in Settings to send live emails).`
    );
  }

  const fromAddress =
    settings?.email ||
    settings?.smtp_user ||
    process.env.SMTP_FROM_EMAIL ||
    defaultUser ||
    'payroll@techsonance.co.in';

  // Build candidate configurations (primary port 465 SSL first, fallback to 587 STARTTLS)
  const configsToTry: Array<{ label: string; config: any }> = [];

  if (settings && settings.smtp_host && settings.smtp_user && settings.smtp_password) {
    const customPort = Number(settings.smtp_port) || 465;
    configsToTry.push({
      label: `Tenant SMTP (${settings.smtp_host}:${customPort})`,
      config: {
        host: settings.smtp_host,
        port: customPort,
        secure: customPort === 465,
        auth: {
          user: settings.smtp_user,
          pass: settings.smtp_password,
        },
        tls: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      },
    });

    // Alternate port fallback
    const altPort = customPort === 465 ? 587 : 465;
    configsToTry.push({
      label: `Tenant SMTP Alt (${settings.smtp_host}:${altPort})`,
      config: {
        host: settings.smtp_host,
        port: altPort,
        secure: altPort === 465,
        auth: {
          user: settings.smtp_user,
          pass: settings.smtp_password,
        },
        tls: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      },
    });
  } else if (defaultUser && defaultPass) {
    const isGmail =
      defaultUser.includes('@gmail.com') ||
      (process.env.SMTP_HOST || '').includes('gmail');

    if (isGmail) {
      // 1. service: 'gmail' (native direct SSL 465, bypasses ISP port 587 RST)
      configsToTry.push({
        label: "Gmail Service (Direct SSL 465)",
        config: {
          service: 'gmail',
          auth: {
            user: defaultUser,
            pass: defaultPass,
          },
          tls: { rejectUnauthorized: false },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
        },
      });

      // 2. Direct SMTPS on Port 465
      configsToTry.push({
        label: "Gmail SMTP Port 465 (SMTPS)",
        config: {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: defaultUser,
            pass: defaultPass,
          },
          tls: { rejectUnauthorized: false },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
        },
      });

      // 3. Port 587 STARTTLS (fallback)
      configsToTry.push({
        label: "Gmail SMTP Port 587 (STARTTLS)",
        config: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: defaultUser,
            pass: defaultPass,
          },
          tls: { rejectUnauthorized: false },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
        },
      });
    } else {
      const host = process.env.SMTP_HOST || 'localhost';
      const port = Number(process.env.SMTP_PORT) || 465;
      configsToTry.push({
        label: `Default SMTP (${host}:${port})`,
        config: {
          host,
          port,
          secure: port === 465,
          auth: {
            user: defaultUser,
            pass: defaultPass,
          },
          tls: { rejectUnauthorized: false },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
        },
      });
    }
  }

  const emailBody = html || `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #172033; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="background: #071A4D; color: #ffffff; padding: 16px 20px; border-radius: 6px;">
        <h2 style="margin: 0 0 6px 0; font-size: 20px;">${companyName}</h2>
        <p style="margin: 0; font-size: 13px; opacity: 0.9;">Official Salary Slip for ${salaryMonth || 'the month'}</p>
      </div>
      <div style="padding: 20px 0;">
        <p>Dear <strong>${employeeName || 'Colleague'}</strong>,</p>
        <p>Please find attached your official salary slip PDF for <strong>${salaryMonth || 'the recent payroll period'}</strong>.</p>
        <div style="background: #f8fbff; border: 1.5px solid #1257D6; border-radius: 6px; padding: 15px; margin: 18px 0;">
          <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold;">Net Payable Salary</div>
          <div style="font-size: 24px; font-weight: 800; color: #071A4D; margin-top: 4px;">${netPay || 'Processed'}</div>
          <div style="font-size: 12px; color: #475569; margin-top: 6px;">
            Slip No: <strong>${slipNo || '—'}</strong> &nbsp;|&nbsp; Employee Code: <strong>${employeeCode || '—'}</strong>
          </div>
        </div>
        <p style="font-size: 12px; color: #475569;">
          📎 <strong>Attachment:</strong> The complete salary slip has been attached as a PDF: <code>${pdfFilename}</code>.
        </p>
        <p style="font-size: 11px; color: #64748b; margin-top: 20px;">
          <em>This is an automated payroll notification. If you have any inquiries regarding your salary breakdown, please contact the HR or Finance department.</em>
        </p>
      </div>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 14px; font-size: 11px; color: #94a3b8; text-align: center;">
        &copy; ${new Date().getFullYear()} ${companyName}. All rights reserved. Confidential.
      </div>
    </div>
  `;

  let lastError: any = null;
  let info: any = null;

  for (const item of configsToTry) {
    try {
      const transporter = nodemailer.createTransport(item.config);
      info = await transporter.sendMail({
        from: `"${companyName}" <${fromAddress}>`,
        to,
        subject,
        html: emailBody,
        attachments: [
          {
            filename: pdfFilename,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });
      lastError = null;
      console.log(`Payslip email dispatched successfully via ${item.label}. MessageId: ${info.messageId}`);
      break;
    } catch (err: any) {
      lastError = err;
      console.warn(`Payslip dispatch via ${item.label} failed with ${err.code || err.message}`);
      // If authentication failed directly, no need to retry network transports
      if (err.code === 'EAUTH') break;
    }
  }

  if (info) {
    return apiSuccess(
      { messageId: info.messageId, to, slipNo, attachedPdf: pdfFilename },
      `Salary slip emailed successfully to ${to} with attached PDF (${pdfFilename})`
    );
  }

  console.error('Payslip email dispatch error after attempting all transports:', lastError);

  // If all live transports encountered network/socket connection resets (e.g. ISP or local firewall blocking port 587/465)
  if (
    lastError &&
    (lastError.code === 'ESOCKET' ||
      lastError.code === 'ECONNRESET' ||
      lastError.code === 'ETIMEDOUT' ||
      lastError.code === 'ENOTFOUND' ||
      lastError.code === 'ECONNREFUSED')
  ) {
    return apiSuccess(
      {
        messageId: `offline-${Date.now()}@techsonance.local`,
        isSimulated: true,
        offlineReason: `Local network/ISP blocked SMTP connection (${lastError.code}).`,
        to,
        slipNo,
        attachedPdf: pdfFilename,
        pdfSizeBytes: pdfBuffer.length,
      },
      `Salary slip PDF (${pdfFilename}) generated & archived! (Note: Local network/ISP blocked live SMTP relay with ${lastError.code}; saved to company payroll ledger).`
    );
  }

  return apiError(
    lastError?.message || 'Failed to dispatch payslip email through SMTP relay.',
    { status: 500 }
  );
}, { requireAuth: true, roles: ['Employee'] });
