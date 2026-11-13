import { promises as fs } from 'fs';
import path from 'path';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { apiSuccess } from '@/server/http/response';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'src/app/api/workspace-settings/settings.json');

const INITIAL_DEFAULT_CONFIG = {
  legalName: '',
  workspaceName: '',
  orgCode: '',
  businessType: 'Private Limited',
  industry: '',
  timezone: 'UTC (GMT+0:00)',
  language: 'English',
  country: '',
  currency: 'USD ($)',
  fiscalYear: 'January to December',

  cinNumber: '',
  msmeNumber: '',
  supportEmail: '',
  supportPhone: '',
  officeHours: '',
  emergencyContact: '',

  defaultProbation: 6,
  noticePeriod: 30,
  empIdPrefix: 'EMP-',
  usernamePattern: 'first.last',
  emailPattern: '',
  leavePolicy: '',
  shiftDefault: '',
  joiningWorkflow: 'Standard Paperless Onboarding',
  confirmationWorkflow: 'Manager Review required',
  autoEmpId: true,
  workingHours: 8,
  weekendRules: 'Saturday & Sunday Off',
  passwordPolicy: 'Minimum 8 characters',
  devicePolicy: '',
  loginRestrictions: '',

  mfaEnforced: false,
  sessionTimeout: 60,
  passwordMinLength: 8,
  ipWhitelist: '',
  allowedDomains: '',

  notifyEmail: true,
  notifySms: false,
  notifyWhatsapp: false,
  notifySlack: false,
  notifyPush: false,
  notifyTeams: false,
  notifyDiscord: false,
  notifyWebhook: false,
  notifyBrowser: false,
  slackWebhookUrl: '',
  teamsWebhookUrl: '',
  discordWebhookUrl: '',
  webhookEndpointUrl: '',
  notificationTemplates: [],
  escalationRules: [],
  reminderRules: [],
  digestEmails: false,
  digestFrequency: 'weekly',

  invoicePrefix: 'INV-',
  invoiceNumberStart: 1,
  quotationPrefix: 'QTN-',
  purchasePrefix: 'PO-',
  creditNotePrefix: 'CN-',
  gstEnabled: false,
  gstRateDefault: 18.00,
  taxConfiguration: [],
  invoiceDecimal: 2,
  invoiceFooter: '',
  invoiceTerms: '',
  defaultPaymentTerms: 'Net 30',
  paymentGateway: '',
  paymentGatewayConfig: {},
  qrCodeEnabled: false,
  qrCodeUrl: '',
  digitalSignatureEnabled: false,
  digitalSignatureUrl: '',
  stampUrl: '',
  signatoryName: '',
  signatoryTitle: '',
  tagline: '',
  bankDetails: {},
  invoiceTemplate: 'modern',
  multiCurrencyEnabled: false,
  supportedCurrencies: [],

  aiModel: 'gemini-1.5-pro',
  aiTemperature: 0.2,
  aiPromptTemplate: '',
  aiAssistantName: 'AI Assistant',

  uploadedDocuments: [],
  costCenters: [],
  grades: [],
  bands: [],
  designations: [],
  jobLevels: [],
  employmentTypes: ['Full-Time', 'Part-Time', 'Contractor', 'Intern'],
  workModes: ['Work From Office', 'Work From Home (Remote)', 'Hybrid'],
  shifts: [],
  teams: []
};

// Initialize settings.json and fetch map
async function getOrCreateAllSettings(): Promise<Record<string, any>> {
  try {
    const fileContent = await fs.readFile(SETTINGS_FILE_PATH, 'utf-8');
    return JSON.parse(fileContent);
  } catch {
    await fs.mkdir(path.dirname(SETTINGS_FILE_PATH), { recursive: true });
    await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify({}, null, 2), 'utf-8');
    return {};
  }
}

async function getOrCreateTenantSettings(tenantId: string, supabase: any): Promise<Record<string, any>> {
  const allSettings = await getOrCreateAllSettings();
  const jsonSettings = allSettings[tenantId] || {};

  // Fetch live database settings and structure for this tenant
  const [companyRes, tenantRes, costCentersRes, shiftsRes, employeesRes] = await Promise.allSettled([
    supabase.from('company_settings').select('*').eq('tenant_id', tenantId).maybeSingle(),
    supabase.from('tenants').select('name, slug').eq('id', tenantId).maybeSingle(),
    supabase.from('cost_centers').select('code, name').eq('tenant_id', tenantId),
    supabase.from('shift_definitions').select('name').eq('tenant_id', tenantId),
    supabase.from('employees').select('designation, department, work_mode').eq('tenant_id', tenantId)
  ]);

  const company = companyRes.status === 'fulfilled' ? companyRes.value.data : null;
  const tenant = tenantRes.status === 'fulfilled' ? tenantRes.value.data : null;
  const dbCostCenters = costCentersRes.status === 'fulfilled' && costCentersRes.value.data ? costCentersRes.value.data : [];
  const dbShifts = shiftsRes.status === 'fulfilled' && shiftsRes.value.data ? shiftsRes.value.data : [];
  const dbEmployees = employeesRes.status === 'fulfilled' && employeesRes.value.data ? employeesRes.value.data : [];

  const codePrefix = tenant?.name
    ? tenant.name.split(' ').map((w: string) => w[0]).join('').toUpperCase()
    : 'EMP';

  const merged: Record<string, any> = {
    ...INITIAL_DEFAULT_CONFIG,
    ...jsonSettings,
  };

  if (tenant?.name) {
    if (!merged.legalName) merged.legalName = tenant.name;
    if (!merged.orgCode) merged.orgCode = `${codePrefix}-01`;
  }
  if (tenant?.slug) {
    if (!merged.workspaceName) merged.workspaceName = tenant.slug;
  }

  // Populate dynamic structure from live database if not explicitly customized
  if ((!merged.costCenters || merged.costCenters.length === 0) && dbCostCenters.length > 0) {
    merged.costCenters = dbCostCenters.map((c: any) => c.code || c.name);
  }
  if ((!merged.shifts || merged.shifts.length === 0) && dbShifts.length > 0) {
    merged.shifts = dbShifts.map((s: any) => s.name);
  }
  if ((!merged.designations || merged.designations.length === 0) && dbEmployees.length > 0) {
    merged.designations = Array.from(new Set(dbEmployees.map((e: any) => e.designation).filter(Boolean)));
  }
  if ((!merged.workModes || merged.workModes.length === 0) && dbEmployees.length > 0) {
    const modes = Array.from(new Set(dbEmployees.map((e: any) => e.work_mode).filter(Boolean)));
    if (modes.length > 0) merged.workModes = modes;
  }
  if ((!merged.teams || merged.teams.length === 0) && dbEmployees.length > 0) {
    const teams = Array.from(new Set(dbEmployees.map((e: any) => e.department).filter(Boolean)));
    if (teams.length > 0) merged.teams = teams;
  }

  if (company) {
    if (company.legal_name !== undefined && company.legal_name !== null) merged.legalName = company.legal_name;
    if (company.workspace_name !== undefined && company.workspace_name !== null) merged.workspaceName = company.workspace_name;
    if (company.org_code !== undefined && company.org_code !== null) merged.orgCode = company.org_code;
    if (company.industry !== undefined && company.industry !== null) merged.industry = company.industry;
    if (company.business_type !== undefined && company.business_type !== null) merged.businessType = company.business_type;
    if (company.timezone !== undefined && company.timezone !== null) merged.timezone = company.timezone;
    if (company.currency !== undefined && company.currency !== null) merged.currency = company.currency;
    if (company.fiscal_year !== undefined && company.fiscal_year !== null) merged.fiscalYear = company.fiscal_year;
    if (company.cin_number !== undefined && company.cin_number !== null) merged.cinNumber = company.cin_number;
    if (company.msme_number !== undefined && company.msme_number !== null) merged.msmeNumber = company.msme_number;
    if (company.emergency_contact !== undefined && company.emergency_contact !== null) merged.emergencyContact = company.emergency_contact;
    if (company.support_email !== undefined && company.support_email !== null) merged.supportEmail = company.support_email;
    if (company.support_phone !== undefined && company.support_phone !== null) merged.supportPhone = company.support_phone;
    if (company.favicon_url !== undefined && company.favicon_url !== null) merged.faviconUrl = company.favicon_url;

    if (company.default_probation !== undefined && company.default_probation !== null) merged.defaultProbation = Number(company.default_probation);
    if (company.notice_period !== undefined && company.notice_period !== null) merged.noticePeriod = Number(company.notice_period);
    if (company.emp_id_prefix !== undefined && company.emp_id_prefix !== null) merged.empIdPrefix = company.emp_id_prefix;
    if (company.username_pattern !== undefined && company.username_pattern !== null) merged.usernamePattern = company.username_pattern;
    if (company.email_pattern !== undefined && company.email_pattern !== null) merged.emailPattern = company.email_pattern;
    if (company.leave_policy !== undefined && company.leave_policy !== null) merged.leavePolicy = company.leave_policy;
    if (company.shift_default !== undefined && company.shift_default !== null) merged.shiftDefault = company.shift_default;
    if (company.joining_workflow !== undefined && company.joining_workflow !== null) merged.joiningWorkflow = company.joining_workflow;
    if (company.confirmation_workflow !== undefined && company.confirmation_workflow !== null) merged.confirmationWorkflow = company.confirmation_workflow;
    if (company.auto_emp_id !== undefined && company.auto_emp_id !== null) merged.autoEmpId = Boolean(company.auto_emp_id);
    if (company.working_hours !== undefined && company.working_hours !== null) merged.workingHours = Number(company.working_hours);
    if (company.weekend_rules !== undefined && company.weekend_rules !== null) merged.weekendRules = company.weekend_rules;
    if (company.mfa_enforced !== undefined && company.mfa_enforced !== null) merged.mfaEnforced = Boolean(company.mfa_enforced);
    if (company.session_timeout !== undefined && company.session_timeout !== null) merged.sessionTimeout = Number(company.session_timeout);
    if (company.password_min_length !== undefined && company.password_min_length !== null) merged.passwordMinLength = Number(company.password_min_length);
    if (company.ip_whitelist !== undefined && company.ip_whitelist !== null) merged.ipWhitelist = company.ip_whitelist;
    if (company.allowed_domains !== undefined && company.allowed_domains !== null) merged.allowedDomains = company.allowed_domains;
    if (company.password_policy !== undefined && company.password_policy !== null) merged.passwordPolicy = company.password_policy;
    if (company.device_policy !== undefined && company.device_policy !== null) merged.devicePolicy = company.device_policy;
    if (company.login_restrictions !== undefined && company.login_restrictions !== null) merged.loginRestrictions = company.login_restrictions;

    // Notification Center settings
    if (company.notify_push !== undefined && company.notify_push !== null) merged.notifyPush = Boolean(company.notify_push);
    if (company.notify_teams !== undefined && company.notify_teams !== null) merged.notifyTeams = Boolean(company.notify_teams);
    if (company.notify_discord !== undefined && company.notify_discord !== null) merged.notifyDiscord = Boolean(company.notify_discord);
    if (company.notify_webhook !== undefined && company.notify_webhook !== null) merged.notifyWebhook = Boolean(company.notify_webhook);
    if (company.notify_browser !== undefined && company.notify_browser !== null) merged.notifyBrowser = Boolean(company.notify_browser);
    if (company.slack_webhook_url !== undefined && company.slack_webhook_url !== null) merged.slackWebhookUrl = company.slack_webhook_url;
    if (company.teams_webhook_url !== undefined && company.teams_webhook_url !== null) merged.teamsWebhookUrl = company.teams_webhook_url;
    if (company.discord_webhook_url !== undefined && company.discord_webhook_url !== null) merged.discordWebhookUrl = company.discord_webhook_url;
    if (company.webhook_endpoint_url !== undefined && company.webhook_endpoint_url !== null) merged.webhookEndpointUrl = company.webhook_endpoint_url;
    if (company.notification_templates !== undefined && company.notification_templates !== null) merged.notificationTemplates = company.notification_templates;
    if (company.escalation_rules !== undefined && company.escalation_rules !== null) merged.escalationRules = company.escalation_rules;
    if (company.reminder_rules !== undefined && company.reminder_rules !== null) merged.reminderRules = company.reminder_rules;
    if (company.digest_emails !== undefined && company.digest_emails !== null) merged.digestEmails = Boolean(company.digest_emails);
    if (company.digest_frequency !== undefined && company.digest_frequency !== null) merged.digestFrequency = company.digest_frequency;

    // Invoice configurations
    if (company.invoice_prefix !== undefined && company.invoice_prefix !== null) merged.invoicePrefix = company.invoice_prefix;
    if (company.invoice_number_start !== undefined && company.invoice_number_start !== null) merged.invoiceNumberStart = Number(company.invoice_number_start);
    if (company.quotation_prefix !== undefined && company.quotation_prefix !== null) merged.quotationPrefix = company.quotation_prefix;
    if (company.purchase_prefix !== undefined && company.purchase_prefix !== null) merged.purchasePrefix = company.purchase_prefix;
    if (company.credit_note_prefix !== undefined && company.credit_note_prefix !== null) merged.creditNotePrefix = company.credit_note_prefix;
    if (company.gst_enabled !== undefined && company.gst_enabled !== null) merged.gstEnabled = Boolean(company.gst_enabled);
    if (company.gst_rate_default !== undefined && company.gst_rate_default !== null) merged.gstRateDefault = Number(company.gst_rate_default);
    if (company.tax_configuration !== undefined && company.tax_configuration !== null) merged.taxConfiguration = company.tax_configuration;
    if (company.invoice_decimal !== undefined && company.invoice_decimal !== null) merged.invoiceDecimal = Number(company.invoice_decimal);
    if (company.invoice_footer !== undefined && company.invoice_footer !== null) merged.invoiceFooter = company.invoice_footer;
    if (company.invoice_terms !== undefined && company.invoice_terms !== null) merged.invoiceTerms = company.invoice_terms;
    if (company.default_payment_terms !== undefined && company.default_payment_terms !== null) merged.defaultPaymentTerms = company.default_payment_terms;
    if (company.payment_gateway !== undefined && company.payment_gateway !== null) merged.paymentGateway = company.payment_gateway;
    if (company.payment_gateway_config !== undefined && company.payment_gateway_config !== null) merged.paymentGatewayConfig = company.payment_gateway_config;
    if (company.qr_code_enabled !== undefined && company.qr_code_enabled !== null) merged.qrCodeEnabled = Boolean(company.qr_code_enabled);
    if (company.qr_code_url !== undefined && company.qr_code_url !== null) merged.qrCodeUrl = company.qr_code_url;
    if (company.digital_signature_enabled !== undefined && company.digital_signature_enabled !== null) merged.digitalSignatureEnabled = Boolean(company.digital_signature_enabled);
    if (company.digital_signature_url !== undefined && company.digital_signature_url !== null) merged.digitalSignatureUrl = company.digital_signature_url;
    if (company.stamp_url !== undefined && company.stamp_url !== null) merged.stampUrl = company.stamp_url;
    if (company.signatory_name !== undefined && company.signatory_name !== null) merged.signatoryName = company.signatory_name;
    if (company.signatory_title !== undefined && company.signatory_title !== null) merged.signatoryTitle = company.signatory_title;
    if (company.tagline !== undefined && company.tagline !== null) merged.tagline = company.tagline;
    if (company.bank_details !== undefined && company.bank_details !== null) merged.bankDetails = company.bank_details;
    if (company.invoice_template !== undefined && company.invoice_template !== null) merged.invoiceTemplate = company.invoice_template;
    if (company.multi_currency_enabled !== undefined && company.multi_currency_enabled !== null) merged.multiCurrencyEnabled = Boolean(company.multi_currency_enabled);
    if (company.supported_currencies !== undefined && company.supported_currencies !== null) merged.supportedCurrencies = company.supported_currencies;
  }

  return merged;
}

export const GET = withApiHandler(async (_request, context) => {
  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization credentials required');

  const supabase = getAdminRouteSupabase();
  const settings = await getOrCreateTenantSettings(tenantId, supabase);
  return apiSuccess(settings, 'Workspace settings fetched successfully');
}, { requireAuth: true, roles: ['Employee'] });

export const PUT = withApiHandler(async (request, context) => {
  const payload = await request.json();
  if (!payload || Object.keys(payload).length === 0) {
    throw new BadRequestError('Settings payload cannot be empty');
  }

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization credentials required');

  const supabase = getAdminRouteSupabase();

  // Input Sanitization
  const sanitized: Record<string, any> = {};
  const allowedKeys = [
    'legalName', 'workspaceName', 'orgCode', 'businessType', 'industry', 
    'timezone', 'language', 'country', 'currency', 'fiscalYear', 
    'cinNumber', 'msmeNumber', 'supportEmail', 'supportPhone', 'officeHours', 
    'emergencyContact', 'defaultProbation', 'noticePeriod', 'empIdPrefix', 
    'usernamePattern', 'emailPattern', 'leavePolicy', 'shiftDefault', 
    'joiningWorkflow', 'confirmationWorkflow', 'autoEmpId', 'workingHours', 'weekendRules',
    'passwordPolicy', 'devicePolicy', 'loginRestrictions',
    'mfaEnforced', 'sessionTimeout', 'passwordMinLength', 'ipWhitelist', 
    'allowedDomains', 'notifyEmail', 'notifySms', 'notifyWhatsapp', 
    'notifySlack', 'invoicePrefix', 'invoiceDecimal', 'aiModel', 
    'aiTemperature', 'aiPromptTemplate', 'aiAssistantName', 'uploadedDocuments',
    'faviconUrl',
    'themeMode', 'accentColor', 'secondaryColor', 'sidebarStyle', 'navigationStyle',
    'dashboardLayout', 'widgetConfig', 'cardDensity', 'compactMode', 'logoUrl',
    'loginScreenStyle', 'registerScreenStyle', 'emailTemplateStyle',
    'pdfBrandingStyle', 'invoiceBrandingStyle', 'primaryFont', 'borderRadius',
    'animationsEnabled',
    'costCenters', 'grades', 'bands', 'designations', 'jobLevels',
    'employmentTypes', 'workModes', 'shifts', 'teams',
    'notifyPush', 'notifyTeams', 'notifyDiscord', 'notifyWebhook', 'notifyBrowser',
    'slackWebhookUrl', 'teamsWebhookUrl', 'discordWebhookUrl', 'webhookEndpointUrl',
    'notificationTemplates', 'escalationRules', 'reminderRules', 'digestEmails', 'digestFrequency',
    'invoicePrefix', 'invoiceNumberStart', 'quotationPrefix', 'purchasePrefix', 'creditNotePrefix',
    'gstEnabled', 'gstRateDefault', 'taxConfiguration', 'invoiceDecimal', 'invoiceFooter',
    'invoiceTerms', 'defaultPaymentTerms', 'paymentGateway', 'paymentGatewayConfig',
    'qrCodeEnabled', 'qrCodeUrl', 'digitalSignatureEnabled', 'digitalSignatureUrl',
    'invoiceTemplate', 'multiCurrencyEnabled', 'supportedCurrencies'
  ];
  for (const key of allowedKeys) {
    if (payload[key] !== undefined) {
      const val = payload[key];
      if (key === 'uploadedDocuments' && Array.isArray(val)) {
        sanitized[key] = val.map((doc: any) => ({
          name: String(doc.name).replace(/<[^>]*>/g, '').trim(),
          size: String(doc.size).replace(/<[^>]*>/g, '').trim(),
          type: String(doc.type).replace(/<[^>]*>/g, '').trim(),
          fileUrl: String(doc.fileUrl).replace(/<[^>]*>/g, '').trim(),
          expiry: String(doc.expiry).replace(/<[^>]*>/g, '').trim()
        }));
      } else if (['notificationTemplates', 'escalationRules', 'reminderRules'].includes(key)) {
        sanitized[key] = Array.isArray(val) ? val : [];
      } else if (Array.isArray(val)) {
        sanitized[key] = val.map((item: any) => String(item).replace(/<[^>]*>/g, '').trim());
      } else if (typeof val === 'string') {
        sanitized[key] = val.replace(/<[^>]*>/g, '').trim();
      } else if (typeof val === 'number') {
        sanitized[key] = val;
      } else if (typeof val === 'boolean') {
        sanitized[key] = val;
      }
    }
  }

  // 1. Sync fields with company_settings database table
  const dbFields: Record<string, any> = {
    legal_name: sanitized.legalName,
    workspace_name: sanitized.workspaceName,
    org_code: sanitized.orgCode,
    industry: sanitized.industry,
    business_type: sanitized.businessType,
    timezone: sanitized.timezone,
    currency: sanitized.currency,
    fiscal_year: sanitized.fiscalYear,
    cin_number: sanitized.cinNumber,
    msme_number: sanitized.msmeNumber,
    emergency_contact: sanitized.emergencyContact,
    support_email: sanitized.supportEmail,
    support_phone: sanitized.supportPhone,
    favicon_url: sanitized.faviconUrl,

    // Workforce Defaults
    default_probation: sanitized.defaultProbation,
    notice_period: sanitized.noticePeriod,
    emp_id_prefix: sanitized.empIdPrefix,
    username_pattern: sanitized.usernamePattern,
    email_pattern: sanitized.emailPattern,
    leave_policy: sanitized.leavePolicy,
    shift_default: sanitized.shiftDefault,
    joining_workflow: sanitized.joiningWorkflow,
    confirmation_workflow: sanitized.confirmationWorkflow,
    auto_emp_id: sanitized.autoEmpId,
    working_hours: sanitized.workingHours,
    weekend_rules: sanitized.weekendRules,

    // Security Policies
    mfa_enforced: sanitized.mfaEnforced,
    session_timeout: sanitized.sessionTimeout,
    password_min_length: sanitized.passwordMinLength,
    ip_whitelist: sanitized.ipWhitelist,
    allowed_domains: sanitized.allowedDomains,
    password_policy: sanitized.passwordPolicy,
    device_policy: sanitized.devicePolicy,
    login_restrictions: sanitized.loginRestrictions,

    // Notification Center settings
    notify_push: sanitized.notifyPush,
    notify_teams: sanitized.notifyTeams,
    notify_discord: sanitized.notifyDiscord,
    notify_webhook: sanitized.notifyWebhook,
    notify_browser: sanitized.notifyBrowser,
    slack_webhook_url: sanitized.slackWebhookUrl,
    teams_webhook_url: sanitized.teamsWebhookUrl,
    discord_webhook_url: sanitized.discordWebhookUrl,
    webhook_endpoint_url: sanitized.webhookEndpointUrl,
    notification_templates: sanitized.notificationTemplates,
    escalation_rules: sanitized.escalationRules,
    reminder_rules: sanitized.reminderRules,
    digest_emails: sanitized.digestEmails,
    digest_frequency: sanitized.digestFrequency,

    // Invoice columns mapping
    invoice_prefix: sanitized.invoicePrefix,
    invoice_number_start: sanitized.invoiceNumberStart,
    quotation_prefix: sanitized.quotationPrefix,
    purchase_prefix: sanitized.purchasePrefix,
    credit_note_prefix: sanitized.creditNotePrefix,
    gst_enabled: sanitized.gstEnabled,
    gst_rate_default: sanitized.gstRateDefault,
    tax_configuration: sanitized.taxConfiguration,
    invoice_decimal: sanitized.invoiceDecimal,
    invoice_footer: sanitized.invoiceFooter,
    invoice_terms: sanitized.invoiceTerms,
    default_payment_terms: sanitized.defaultPaymentTerms,
    payment_gateway: sanitized.paymentGateway,
    payment_gateway_config: sanitized.paymentGatewayConfig,
    qr_code_enabled: sanitized.qrCodeEnabled,
    qr_code_url: sanitized.qrCodeUrl,
    digital_signature_enabled: sanitized.digitalSignatureEnabled,
    digital_signature_url: sanitized.digitalSignatureUrl,
    invoice_template: sanitized.invoiceTemplate,
    multi_currency_enabled: sanitized.multiCurrencyEnabled,
    supported_currencies: sanitized.supportedCurrencies
  };

  const filteredDbFields: Record<string, any> = {};
  for (const [k, v] of Object.entries(dbFields)) {
    if (v !== undefined) {
      filteredDbFields[k] = v;
    }
  }

  let dbWriteSucceededWithDefaults = true;

  if (Object.keys(filteredDbFields).length > 0) {
    const { data: existingCompany } = await supabase
      .from('company_settings')
      .select('id')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    const doDbWrite = async (payload: Record<string, any>) => {
      if (existingCompany) {
        return supabase
          .from('company_settings')
          .update(payload)
          .eq('tenant_id', tenantId);
      } else {
        return supabase
          .from('company_settings')
          .insert({
            ...payload,
            company_name: sanitized.legalName || 'My Company',
            email: sanitized.supportEmail || 'support@company.com',
            tenant_id: tenantId,
          });
      }
    };

    let { error: dbErr } = await doDbWrite(filteredDbFields);

    if (dbErr) {
      console.warn('DB sync warning: trying schema fallback without defaults columns:', dbErr.message);
      dbWriteSucceededWithDefaults = false;
      const coreDbFields: Record<string, any> = {};
      const coreKeys = [
        'legal_name', 'workspace_name', 'org_code', 'industry', 'business_type', 
        'timezone', 'currency', 'fiscal_year', 'cin_number', 'msme_number', 
        'emergency_contact', 'support_email', 'support_phone', 'favicon_url'
      ];
      for (const k of coreKeys) {
        if (filteredDbFields[k] !== undefined) {
          coreDbFields[k] = filteredDbFields[k];
        }
      }
      const retryResult = await doDbWrite(coreDbFields);
      if (retryResult.error) {
        console.error('Failed database write for core settings:', retryResult.error);
      }
    }
  }

  // 2. Sync workspaceName (slug) with tenants table
  if (sanitized.workspaceName !== undefined && sanitized.workspaceName.trim()) {
    const slug = sanitized.workspaceName.trim();
    const { error: tenantUpdateError } = await supabase
      .from('tenants')
      .update({ slug })
      .eq('id', tenantId);
    
    if (tenantUpdateError) {
      console.error('Failed to update tenant slug during workspace-settings sync:', tenantUpdateError);
    }
  }

  // Read existing, merge changes, and save
  const allSettings = await getOrCreateAllSettings();
  const currentTenantSettings = await getOrCreateTenantSettings(tenantId, supabase);
  const merged = { ...currentTenantSettings, ...sanitized };

  // Remove DB fields from JSON before writing to settings.json
  const jsonOnlySettings = { ...merged };
  const dbFieldKeys = [
    'legalName', 'workspaceName', 'orgCode', 'industry', 'businessType', 
    'timezone', 'currency', 'fiscalYear', 'cinNumber', 'msmeNumber', 
    'emergencyContact', 'supportEmail', 'supportPhone', 'faviconUrl'
  ];

  if (dbWriteSucceededWithDefaults) {
    dbFieldKeys.push(
      'defaultProbation', 'noticePeriod', 'empIdPrefix', 'usernamePattern', 'emailPattern',
      'leavePolicy', 'shiftDefault', 'joiningWorkflow', 'confirmationWorkflow', 'autoEmpId',
      'workingHours', 'weekendRules', 'mfaEnforced', 'sessionTimeout', 'passwordMinLength',
      'ipWhitelist', 'allowedDomains', 'passwordPolicy', 'devicePolicy', 'loginRestrictions',
      'notifyPush', 'notifyTeams', 'notifyDiscord', 'notifyWebhook', 'notifyBrowser',
      'slackWebhookUrl', 'teamsWebhookUrl', 'discordWebhookUrl', 'webhookEndpointUrl',
      'notificationTemplates', 'escalationRules', 'reminderRules', 'digestEmails', 'digestFrequency',
      'invoicePrefix', 'invoiceNumberStart', 'quotationPrefix', 'purchasePrefix', 'creditNotePrefix',
      'gstEnabled', 'gstRateDefault', 'taxConfiguration', 'invoiceDecimal', 'invoiceFooter',
      'invoiceTerms', 'defaultPaymentTerms', 'paymentGateway', 'paymentGatewayConfig',
      'qrCodeEnabled', 'qrCodeUrl', 'digitalSignatureEnabled', 'digitalSignatureUrl',
      'invoiceTemplate', 'multiCurrencyEnabled', 'supportedCurrencies'
    );
  }

  for (const key of dbFieldKeys) {
    delete jsonOnlySettings[key];
  }

  allSettings[tenantId] = jsonOnlySettings;
  await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(allSettings, null, 2), 'utf-8');

  return apiSuccess(merged, 'Workspace settings updated successfully');
}, { requireAuth: true, roles: ['Admin'] });
