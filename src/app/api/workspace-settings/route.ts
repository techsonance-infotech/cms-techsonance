import { promises as fs } from 'fs';
import path from 'path';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { apiSuccess } from '@/server/http/response';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'src/app/api/workspace-settings/settings.json');

const INITIAL_DEFAULT_CONFIG = {
  legalName: 'TechSonance Infotech Private Limited',
  workspaceName: 'techsonance-main',
  orgCode: 'TS-IND-01',
  businessType: 'Private Limited',
  industry: 'Software Development & IT Consultancy',
  timezone: 'Asia/Kolkata (GMT+5:30)',
  language: 'English (India)',
  country: 'India',
  currency: 'INR (₹)',
  fiscalYear: 'April to March',

  cinNumber: 'L72200DL2026PLC123456',
  msmeNumber: 'UDYAM-DL-01-0012345',
  supportEmail: 'support@techsonance.com',
  supportPhone: '+91 98765 43211',
  officeHours: '09:00 AM - 06:00 PM',
  emergencyContact: 'HR Helpline: +91 98765 43219',

  defaultProbation: 6,
  noticePeriod: 90,
  empIdPrefix: 'TS-',
  usernamePattern: 'first.last',
  emailPattern: 'username@techsonance.com',
  leavePolicy: 'Standard Privilege Leaves (24 days)',
  shiftDefault: 'General Engineering Shift (09:30 AM - 06:30 PM)',

  mfaEnforced: true,
  sessionTimeout: 60,
  passwordMinLength: 8,
  ipWhitelist: '192.168.1.1/32, 103.241.12.0/24',
  allowedDomains: 'techsonance.com, techsonanceinfotech.com',

  notifyEmail: true,
  notifySms: false,
  notifyWhatsapp: true,
  notifySlack: true,

  invoicePrefix: 'TS-INV-',
  invoiceDecimal: 2,

  aiModel: 'gemini-1.5-pro',
  aiTemperature: 0.2,
  aiPromptTemplate: 'Act as a secure enterprise coding assistant. Follow strict compliance protocols...',
  aiAssistantName: 'Antigravity Workspace Engine',

  uploadedDocuments: [
    { name: 'GST Certificate.pdf', size: '2.4 MB', type: 'Tax Identification', fileUrl: '', expiry: 'Permanent' },
    { name: 'Incorporation Deed.pdf', size: '15.2 MB', type: 'Legal Registries', fileUrl: '', expiry: 'Permanent' }
  ]
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

  // Fetch database settings
  const { data: company } = await supabase
    .from('company_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, slug')
    .eq('id', tenantId)
    .maybeSingle();

  const codePrefix = tenant?.name
    ? tenant.name.split(' ').map((w: string) => w[0]).join('').toUpperCase()
    : 'TS';

  const merged = {
    ...INITIAL_DEFAULT_CONFIG,
    ...jsonSettings,
  };

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
  }

  // Ensure fallback defaults if empty
  if (!merged.workspaceName && tenant?.slug) merged.workspaceName = tenant.slug;
  if (!merged.legalName && company?.company_name) merged.legalName = company.company_name;
  if (!merged.orgCode) merged.orgCode = `${codePrefix}-IND-01`;
  if (!merged.supportEmail && company?.email) merged.supportEmail = company.email;
  if (!merged.supportPhone && company?.phone) merged.supportPhone = company.phone;

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
    'employmentTypes', 'workModes', 'shifts', 'teams'
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
  const dbFields = {
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
  };

  const filteredDbFields: Record<string, any> = {};
  for (const [k, v] of Object.entries(dbFields)) {
    if (v !== undefined) {
      filteredDbFields[k] = v;
    }
  }

  if (Object.keys(filteredDbFields).length > 0) {
    const { data: existingCompany } = await supabase
      .from('company_settings')
      .select('id')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (existingCompany) {
      const { error: updateErr } = await supabase
        .from('company_settings')
        .update(filteredDbFields)
        .eq('tenant_id', tenantId);
      if (updateErr) {
        console.error('Failed to sync workspace fields to company_settings table:', updateErr);
      }
    } else {
      const { error: insertErr } = await supabase
        .from('company_settings')
        .insert({
          ...filteredDbFields,
          company_name: sanitized.legalName || 'My Company',
          email: sanitized.supportEmail || 'support@company.com',
          tenant_id: tenantId,
        });
      if (insertErr) {
        console.error('Failed to insert initial company_settings during workspace-settings sync:', insertErr);
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
  for (const key of dbFieldKeys) {
    delete jsonOnlySettings[key];
  }

  allSettings[tenantId] = jsonOnlySettings;
  await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(allSettings, null, 2), 'utf-8');

  return apiSuccess(merged, 'Workspace settings updated and written to disk successfully');
}, { requireAuth: true, roles: ['Admin'] });
