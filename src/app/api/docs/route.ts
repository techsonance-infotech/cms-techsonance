import { withApiHandler } from '@/server/http/handler';

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CMS API Docs & Explorer</title>
  
  <!-- Import gorgeous Outfit and JetBrains Mono Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
  
  <!-- Swagger UI default styles -->
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  
  <style>
    /* Global Styles */
    body {
      font-family: 'Outfit', sans-serif !important;
      background-color: #f8fafc !important;
      color: #0f172a !important;
      margin: 0;
      padding: 0;
      min-height: 100vh;
    }

    /* Premium Dark Navigation Header */
    .dev-portal-header {
      background: #0f172a;
      border-bottom: 1px solid #1e293b;
      padding: 16px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-logo {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 18px;
      color: white;
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
      animation: pulse 3s infinite alternate;
    }

    .brand-name {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: #ffffff;
    }

    .badge {
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.25);
      color: #34d399;
      padding: 4px 10px;
      border-radius: 99px;
      font-size: 11px;
      font-weight: 600;
    }

    /* Core Swagger UI Styling Enhancements */
    .swagger-ui {
      font-family: 'Outfit', sans-serif !important;
      color: #334155 !important;
      padding: 24px 40px !important;
      max-width: 1400px;
      margin: 0 auto;
    }

    .swagger-ui .info {
      margin: 24px 0 32px 0 !important;
      background: #ffffff !important;
      border: 1px solid #e2e8f0 !important;
      padding: 24px !important;
      border-radius: 16px !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02) !important;
    }

    .swagger-ui .info .title {
      color: #0f172a !important;
      font-family: 'Outfit', sans-serif !important;
      font-weight: 800 !important;
      font-size: 32px !important;
      letter-spacing: -0.8px !important;
    }

    .swagger-ui .info p, .swagger-ui .info li, .swagger-ui .info td {
      color: #475569 !important;
      font-size: 14px !important;
      line-height: 1.6 !important;
    }

    .swagger-ui .scheme-container {
      background: #ffffff !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 16px !important;
      padding: 16px 24px !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02) !important;
      margin: 20px 0 !important;
    }

    .swagger-ui select {
      background: #f8fafc !important;
      border: 1px solid #cbd5e1 !important;
      color: #334155 !important;
      border-radius: 8px !important;
      padding: 6px 12px !important;
      outline: none !important;
    }

    .swagger-ui select:focus {
      border-color: #10b981 !important;
    }

    /* Tag Category Headers */
    .swagger-ui .opblock-tag {
      color: #0f172a !important;
      font-family: 'Outfit', sans-serif !important;
      font-weight: 700 !important;
      border-bottom: 1px solid #e2e8f0 !important;
      padding: 12px 8px !important;
      font-size: 18px !important;
      margin: 24px 0 12px 0 !important;
    }

    .swagger-ui .opblock-tag small {
      color: #64748b !important;
      font-size: 12px !important;
      font-weight: 400 !important;
      margin-left: 8px !important;
    }

    /* Operations styling */
    .swagger-ui .opblock {
      border-radius: 12px !important;
      border: 1px solid #e2e8f0 !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02) !important;
      overflow: hidden !important;
      margin-bottom: 10px !important;
    }

    .swagger-ui .opblock-summary-path {
      font-family: 'JetBrains Mono', monospace !important;
      font-weight: 500 !important;
      font-size: 14px !important;
    }

    .swagger-ui .opblock-summary-description {
      color: #475569 !important;
      font-size: 13px !important;
    }

    /* Input Controls */
    .swagger-ui input[type=text], .swagger-ui textarea {
      background: #ffffff !important;
      border: 1px solid #cbd5e1 !important;
      color: #0f172a !important;
      border-radius: 8px !important;
      padding: 8px 12px !important;
      font-family: 'Outfit', sans-serif !important;
      outline: none !important;
      font-size: 13px !important;
    }

    .swagger-ui input[type=text]:focus, .swagger-ui textarea:focus {
      border-color: #10b981 !important;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.15) !important;
    }

    /* Buttons */
    .swagger-ui .btn {
      border-radius: 8px !important;
      font-weight: 600 !important;
      padding: 6px 14px !important;
      font-family: 'Outfit', sans-serif !important;
      transition: all 0.2s ease !important;
    }

    .swagger-ui .btn.execute {
      background-color: #10b981 !important;
      border-color: #10b981 !important;
      color: white !important;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25) !important;
    }

    .swagger-ui .btn.execute:hover {
      background-color: #059669 !important;
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4) !important;
    }

    .swagger-ui .btn.cancel {
      background-color: #ef4444 !important;
      border-color: #ef4444 !important;
      color: white !important;
    }

    .swagger-ui .btn.authorize {
      border-color: #10b981 !important;
      color: #10b981 !important;
    }

    .swagger-ui .btn.authorize:hover {
      background-color: #10b981 !important;
      color: white !important;
    }

    .swagger-ui svg {
      fill: #64748b !important;
    }

    .swagger-ui .parameter__name {
      font-family: 'JetBrains Mono', monospace !important;
      font-weight: 600 !important;
    }

    .swagger-ui .parameter__type {
      font-family: 'JetBrains Mono', monospace !important;
    }

    .swagger-ui .response-col_status {
      font-weight: bold !important;
    }

    /* Beautiful Pulsing Animations */
    @keyframes pulse {
      0% {
        box-shadow: 0 0 12px rgba(16, 185, 129, 0.35);
      }
      100% {
        box-shadow: 0 0 20px rgba(16, 185, 129, 0.6);
      }
    }

    /* Premium Loading Screen */
    .loader-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: calc(100vh - 120px);
      gap: 16px;
      background: #f8fafc;
    }

    .loader {
      border: 3px solid #e2e8f0;
      border-top: 3px solid #10b981;
      border-radius: 50%;
      width: 48px;
      height: 48px;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>

  <!-- Dynamic Glass Header -->
  <div class="dev-portal-header">
    <div class="brand">
      <div class="brand-logo">T</div>
      <div>
        <div class="brand-name">TechSonance CMS</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Developer API Portal</div>
      </div>
    </div>
    <div style="display: flex; gap: 12px; align-items: center;">
      <span class="badge">API v1.0.0</span>
      <span class="badge" style="background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.25); color: #34d399;">Active</span>
    </div>
  </div>

  <!-- Loading Placeholder -->
  <div id="loading" class="loader-container">
    <div class="loader"></div>
    <div style="font-size: 14px; color: #94a3b8; font-weight: 500;">Initializing API documentation explorer...</div>
  </div>

  <!-- Swagger UI Mount Point -->
  <div id="swagger-ui" style="display: none;"></div>

  <!-- Swagger Scripts -->
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  
  <script>
    window.onload = function() {
      // Initialize Swagger UI loading spec dynamically
      const ui = SwaggerUIBundle({
        url: '/api/docs/spec',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "BaseLayout",
        // Force sending session cookies with all try-it-out requests
        requestInterceptor: (req) => {
          req.credentials = 'same-origin';
          return req;
        },
        onComplete: () => {
          // Hide loader and show Swagger UI
          document.getElementById('loading').style.display = 'none';
          document.getElementById('swagger-ui').style.display = 'block';
        }
      });
      window.ui = ui;
    };
  </script>
</body>
</html>`;

export const GET = withApiHandler(async () => {
  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}, {
  requireAuth: process.env.NODE_ENV === 'production',
  roles: process.env.NODE_ENV === 'production' ? ['Admin'] : undefined,
});

