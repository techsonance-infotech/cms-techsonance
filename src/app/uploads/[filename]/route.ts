import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  const { filename } = await context.params;

  if (filename.startsWith('mock_')) {
    // Determine document title based on filename prefix
    let title = 'Official Corporate Document';
    let docType = 'General Document';
    let detailHtml = '';

    if (filename.includes('gst') || filename.includes('GST')) {
      title = 'Goods and Services Tax Registration Certificate';
      docType = 'GST Certificate (Form GST REG-06)';
      detailHtml = `
        <div class="field"><span class="label">GSTIN:</span> <span class="value font-mono">24AAAAA1111A1Z1</span></div>
        <div class="field"><span class="label">Legal Name:</span> <span class="value">TechSonance Infotech LLP</span></div>
        <div class="field"><span class="label">Trade Name:</span> <span class="value">TechSonance Infotech</span></div>
        <div class="field"><span class="label">Constitution of Business:</span> <span class="value">Limited Liability Partnership</span></div>
        <div class="field"><span class="label">Address of Principal Place:</span> <span class="value">UG-15, Palladium Plaza, VIP Road, Vesu Surat, Gujarat, India - 395007</span></div>
      `;
    } else if (filename.includes('pan') || filename.includes('PAN')) {
      title = 'Permanent Account Number Card';
      docType = 'Income Tax Department (Govt of India)';
      detailHtml = `
        <div class="field"><span class="label">PAN Number:</span> <span class="value font-mono">ABCDE1234F</span></div>
        <div class="field"><span class="label">Name of Holder:</span> <span class="value">TechSonance Infotech LLP</span></div>
        <div class="field"><span class="label">Date of Incorporation:</span> <span class="value">2026-07-24</span></div>
      `;
    } else if (filename.includes('reg') || filename.includes('incorporation')) {
      title = 'Certificate of Incorporation';
      docType = 'Ministry of Corporate Affairs (MCA)';
      detailHtml = `
        <div class="field"><span class="label">Corporate Identity Number (CIN):</span> <span class="value font-mono">U72900MH2026PTC123456</span></div>
        <div class="field"><span class="label">Company Name:</span> <span class="value">TechSonance Infotech LLP</span></div>
        <div class="field"><span class="label">State of Registry:</span> <span class="value">Gujarat, India</span></div>
      `;
    }

    // Try to parse timestamp from filename (e.g., mock_gstCert_1784900629280.pdf)
    let issueDate = '2026-07-24';
    const parts = filename.split('_');
    const lastPart = parts[parts.length - 1]?.replace('.pdf', '');
    if (lastPart && /^\d+$/.test(lastPart)) {
      try {
        issueDate = new Date(Number(lastPart)).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch (e) {
        // Fallback
      }
    }

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Secure Document Viewer - ${filename}</title>
  <style>
    body {
      background-color: #f1f5f9;
      color: #1e293b;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 40px 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .document-container {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
      width: 100%;
      max-width: 800px;
      padding: 48px;
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
    }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 5rem;
      font-weight: 900;
      color: rgba(248, 121, 65, 0.04);
      white-space: nowrap;
      user-select: none;
      pointer-events: none;
    }
    .header {
      border-bottom: 2px solid #f87941;
      padding-bottom: 24px;
      margin-bottom: 32px;
      text-align: center;
    }
    .header h1 {
      font-size: 1.25rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0 0 8px 0;
      color: #0f172a;
    }
    .header h2 {
      font-size: 0.95rem;
      font-weight: 600;
      color: #64748b;
      margin: 0;
      text-transform: uppercase;
    }
    .seal-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 6px 12px;
      border-radius: 9999px;
      margin-top: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .content {
      margin-bottom: 40px;
    }
    .field {
      display: flex;
      border-bottom: 1px dashed #e2e8f0;
      padding: 14px 0;
    }
    .field:last-child {
      border-bottom: none;
    }
    .label {
      width: 35%;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.5px;
    }
    .value {
      width: 65%;
      font-size: 0.85rem;
      font-weight: 600;
      color: #0f172a;
    }
    .font-mono {
      font-family: monospace;
      letter-spacing: 1px;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
      color: #64748b;
    }
    .signature-area {
      text-align: right;
    }
    .signature {
      font-family: cursive;
      font-size: 1.1rem;
      color: #0f172a;
      margin-bottom: 4px;
    }
  </style>
</head>
<body>
  <div class="document-container">
    <div class="watermark">SECURE MOCK</div>
    <div class="header">
      <h1>${title}</h1>
      <h2>${docType}</h2>
      <div class="seal-badge">
        <svg style="width:12px;height:12px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Verified Secure
      </div>
    </div>
    <div class="content">
      ${detailHtml}
      <div class="field"><span class="label">Date of Verification:</span> <span class="value">${issueDate}</span></div>
      <div class="field"><span class="label">Container Seal:</span> <span class="value font-mono">SHA256:d5c2e3a890fe721cb8...</span></div>
    </div>
    <div class="footer">
      <div>
        <span>Antigravity Secure Vault System</span><br/>
        <span>Authorized Tenant: dc98ef2f-c32a-460f-965b-6d6f209721c7</span>
      </div>
      <div class="signature-area">
        <div class="signature">Antigravity Seal</div>
        <span>System Administrator</span>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  return new Response('Not Found', { status: 404 });
}
