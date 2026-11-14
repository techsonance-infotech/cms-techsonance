import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, ConflictError, NotFoundError } from '@/server/http/errors';
import { apiSuccess } from '@/server/http/response';
import { companySettingsSchema, updateCompanySettingsSchema } from '@/server/validation/settings';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

function normalizeSupabaseCompanySettings(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    companyName: row.company_name,
    logoUrl: row.logo_url ?? null,
    primaryColor: row.primary_color ?? null,
    secondaryColor: row.secondary_color ?? null,
    email: row.email,
    phone: row.phone ?? null,
    address: row.address ?? null,
    website: row.website ?? null,
    smtpHost: row.smtp_host ?? null,
    smtpPort: row.smtp_port ?? null,
    smtpUser: row.smtp_user ?? null,
    smtpPassword: row.smtp_password ?? null,
    gstin: row.gstin ?? null,
    pan: row.pan ?? null,
    registrationCertificateUrl: row.registration_certificate_url ?? null,
    panCardUrl: row.pan_card_url ?? null,
    gstCertificateUrl: row.gst_certificate_url ?? null,
    onboardingCompleted: row.onboarding_completed ?? false,
    updatedAt: row.updated_at ?? null,
    faviconUrl: row.favicon_url ?? null,
    legalName: row.legal_name ?? null,
    workspaceName: row.workspace_name ?? null,
    orgCode: row.org_code ?? null,
    industry: row.industry ?? null,
    businessType: row.business_type ?? null,
    timezone: row.timezone ?? null,
    currency: row.currency ?? null,
    fiscalYear: row.fiscal_year ?? null,
    cinNumber: row.cin_number ?? null,
    msmeNumber: row.msme_number ?? null,
    emergencyContact: row.emergency_contact ?? null,
    supportEmail: row.support_email ?? null,
    supportPhone: row.support_phone ?? null,
    invoicePrefix: row.invoice_prefix ?? null,
    invoiceNumberStart: row.invoice_number_start ?? null,
    quotationPrefix: row.quotation_prefix ?? null,
    purchasePrefix: row.purchase_prefix ?? null,
    creditNotePrefix: row.credit_note_prefix ?? null,
    gstEnabled: row.gst_enabled ?? false,
    gstRateDefault: row.gst_rate_default ?? null,
    taxConfiguration: row.tax_configuration ?? [],
    invoiceDecimal: row.invoice_decimal ?? null,
    invoiceFooter: row.invoice_footer ?? null,
    invoiceTerms: row.invoice_terms ?? null,
    defaultPaymentTerms: row.default_payment_terms ?? null,
    paymentGateway: row.payment_gateway ?? null,
    paymentGatewayConfig: row.payment_gateway_config ?? {},
    qrCodeEnabled: row.qr_code_enabled ?? false,
    qrCodeUrl: row.qr_code_url ?? null,
    digitalSignatureEnabled: row.digital_signature_enabled ?? false,
    digitalSignatureUrl: row.digital_signature_url && row.digital_signature_url !== '/branding/tenant-signature.png' ? (row.digital_signature_url as string) : null,
    stampUrl: row.stamp_url && row.stamp_url !== '/branding/tenant-stamp.png' ? (row.stamp_url as string) : null,
    signatoryName: row.signatory_name ?? null,
    signatoryTitle: row.signatory_title ?? null,
    tagline: row.tagline ?? null,
    bankDetails: row.bank_details ?? null,
    invoiceTemplate: row.invoice_template ?? null,
    multiCurrencyEnabled: row.multi_currency_enabled ?? false,
    supportedCurrencies: row.supported_currencies ?? [],
  };
}

export const GET = withApiHandler(async (_request, context) => {
  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');
  
  const supabase = getAdminRouteSupabase();
  
  // 1. Fetch Company settings table row
  const { data: settings } = await supabase
    .from('company_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .limit(1)
    .maybeSingle();

  // 2. Fetch associated Tenant details table row
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, slug, status, plan_code, created_at')
    .eq('id', tenantId)
    .limit(1)
    .maybeSingle();

  const normalizedSettings = settings ? normalizeSupabaseCompanySettings(settings) : null;

  // 3. Overlay custom fields from workspace settings.json if Supabase company_settings columns are missing
  if (normalizedSettings) {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const settingsFilePath = path.join(process.cwd(), 'src/app/api/workspace-settings/settings.json');
      const raw = await fs.readFile(settingsFilePath, 'utf-8');
      const allWs = JSON.parse(raw);
      const tenantWs = allWs[tenantId];
      if (tenantWs) {
        if (!normalizedSettings.stampUrl && tenantWs.stampUrl && tenantWs.stampUrl !== '/branding/tenant-stamp.png') {
          normalizedSettings.stampUrl = tenantWs.stampUrl;
        }
        if (!normalizedSettings.digitalSignatureUrl && tenantWs.digitalSignatureUrl && tenantWs.digitalSignatureUrl !== '/branding/tenant-signature.png') {
          normalizedSettings.digitalSignatureUrl = tenantWs.digitalSignatureUrl;
        }
        if (!normalizedSettings.signatoryName && tenantWs.signatoryName) normalizedSettings.signatoryName = tenantWs.signatoryName;
        if (!normalizedSettings.signatoryTitle && tenantWs.signatoryTitle) normalizedSettings.signatoryTitle = tenantWs.signatoryTitle;
        if (!normalizedSettings.tagline && tenantWs.tagline) normalizedSettings.tagline = tenantWs.tagline;
        if ((!normalizedSettings.bankDetails || Object.keys(normalizedSettings.bankDetails).length === 0) && tenantWs.bankDetails) {
          normalizedSettings.bankDetails = tenantWs.bankDetails;
        }
        if (!normalizedSettings.logoUrl && tenantWs.logoUrl) normalizedSettings.logoUrl = tenantWs.logoUrl;
      }
    } catch {}
  }
  const tenantDetails = tenant ? {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    status: tenant.status,
    planCode: tenant.plan_code ?? null,
    licenseExpiresAt: null,
    createdAt: tenant.created_at,
  } : null;

  return apiSuccess(
    {
      ...(normalizedSettings ?? {}),
      tenant: tenantDetails,
    },
    settings ? 'Company settings and tenant profile fetched successfully' : 'Tenant loaded but company settings not configured'
  );
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const rawBody = await request.json();
  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');
  const supabase = getAdminRouteSupabase();

  const { data: existing } = await supabase
    .from('company_settings')
    .select('id')
    .eq('tenant_id', tenantId)
    .limit(1)
    .maybeSingle();

  // If company settings already exist for this tenant, route seamlessly to PUT/update logic
  if (existing) {
    const payload = updateCompanySettingsSchema.parse(rawBody);
    return handleCompanySettingsPut(payload, tenantId, supabase, existing);
  }

  // If not existing, parse creation schema with tenant defaults if companyName or email is missing
  let payload: any;
  try {
    payload = companySettingsSchema.parse(rawBody);
  } catch {
    const { data: tenant } = await supabase.from('tenants').select('name').eq('id', tenantId).maybeSingle();
    const defaultedBody = {
      companyName: tenant?.name || 'Company',
      email: context.auth?.user.email || 'company@example.com',
      ...rawBody,
    };
    payload = companySettingsSchema.parse(defaultedBody);
  }

  const now = new Date().toISOString();
  const insertData: Record<string, any> = {
    company_name: payload.companyName.trim(),
    email: payload.email.toLowerCase().trim(),
    logo_url: payload.logoUrl?.trim() || null,
    primary_color: payload.primaryColor?.trim() || null,
    secondary_color: payload.secondaryColor?.trim() || null,
    phone: payload.phone?.trim() || null,
    address: payload.address?.trim() || null,
    website: payload.website?.trim() || null,
    smtp_host: payload.smtpHost?.trim() || null,
    smtp_port: payload.smtpPort ?? null,
    smtp_user: payload.smtpUser?.trim() || null,
    smtp_password: payload.smtpPassword ?? null,
    favicon_url: payload.faviconUrl?.trim() || null,
    legal_name: payload.legalName?.trim() || null,
    workspace_name: payload.workspaceName?.trim() || null,
    org_code: payload.orgCode?.trim() || null,
    industry: payload.industry?.trim() || null,
    business_type: payload.businessType?.trim() || null,
    timezone: payload.timezone?.trim() || null,
    currency: payload.currency?.trim() || null,
    fiscal_year: payload.fiscalYear?.trim() || null,
    cin_number: payload.cinNumber?.trim() || null,
    msme_number: payload.msmeNumber?.trim() || null,
    emergency_contact: payload.emergencyContact?.trim() || null,
    support_email: payload.supportEmail?.trim() || null,
    support_phone: payload.supportPhone?.trim() || null,
    invoice_prefix: payload.invoicePrefix ?? null,
    invoice_number_start: payload.invoiceNumberStart ?? null,
    quotation_prefix: payload.quotationPrefix ?? null,
    purchase_prefix: payload.purchasePrefix ?? null,
    credit_note_prefix: payload.creditNotePrefix ?? null,
    gst_enabled: payload.gstEnabled ?? null,
    gst_rate_default: payload.gstRateDefault ?? null,
    tax_configuration: payload.taxConfiguration ?? null,
    invoice_decimal: payload.invoiceDecimal ?? null,
    invoice_footer: payload.invoiceFooter ?? null,
    invoice_terms: payload.invoiceTerms ?? null,
    default_payment_terms: payload.defaultPaymentTerms ?? null,
    payment_gateway: payload.paymentGateway ?? null,
    payment_gateway_config: payload.paymentGatewayConfig ?? null,
    qr_code_enabled: payload.qrCodeEnabled ?? null,
    qr_code_url: payload.qrCodeUrl ?? null,
    digital_signature_enabled: payload.digitalSignatureEnabled ?? null,
    digital_signature_url: payload.digitalSignatureUrl ?? null,
    stamp_url: payload.stampUrl ?? null,
    signatory_name: payload.signatoryName ?? null,
    signatory_title: payload.signatoryTitle ?? null,
    tagline: payload.tagline ?? null,
    bank_details: payload.bankDetails ?? null,
    invoice_template: payload.invoiceTemplate ?? null,
    multi_currency_enabled: payload.multiCurrencyEnabled ?? null,
    supported_currencies: payload.supportedCurrencies ?? null,
    tenant_id: tenantId,
    updated_at: now,
  };

  const { data: created, error } = await supabase.from('company_settings').insert(insertData).select('*').single();
  
  if (error) {
    const errorMsg = error.message || '';
    const isMissingColumns = error.code === 'PGRST204' || 
                             errorMsg.includes('gst_certificate_url') || 
                             errorMsg.includes('registration_certificate_url') || 
                             errorMsg.includes('pan_card_url') || 
                             errorMsg.includes('gstin') || 
                             errorMsg.includes('pan') ||
                             errorMsg.includes('stamp_url') ||
                             errorMsg.includes('signatory_name') ||
                             errorMsg.includes('signatory_title') ||
                             errorMsg.includes('tagline') ||
                             errorMsg.includes('bank_details') ||
                             errorMsg.includes('favicon_url') ||
                             errorMsg.includes('legal_name') ||
                             errorMsg.includes('workspace_name') ||
                             errorMsg.includes('org_code') ||
                             errorMsg.includes('industry') ||
                             errorMsg.includes('business_type') ||
                             errorMsg.includes('timezone') ||
                             errorMsg.includes('currency') ||
                             errorMsg.includes('fiscal_year') ||
                             errorMsg.includes('cin_number') ||
                             errorMsg.includes('msme_number') ||
                             errorMsg.includes('emergency_contact') ||
                             errorMsg.includes('support_email') ||
                             errorMsg.includes('support_phone') ||
                             errorMsg.includes('invoice_prefix') ||
                             errorMsg.includes('invoice_number_start') ||
                             errorMsg.includes('quotation_prefix') ||
                             errorMsg.includes('purchase_prefix') ||
                             errorMsg.includes('credit_note_prefix') ||
                             errorMsg.includes('gst_enabled') ||
                             errorMsg.includes('gst_rate_default') ||
                             errorMsg.includes('tax_configuration') ||
                             errorMsg.includes('invoice_decimal') ||
                             errorMsg.includes('invoice_footer') ||
                             errorMsg.includes('invoice_terms') ||
                             errorMsg.includes('default_payment_terms') ||
                             errorMsg.includes('payment_gateway') ||
                             errorMsg.includes('payment_gateway_config') ||
                             errorMsg.includes('qr_code_enabled') ||
                             errorMsg.includes('qr_code_url') ||
                             errorMsg.includes('digital_signature_enabled') ||
                             errorMsg.includes('digital_signature_url') ||
                             errorMsg.includes('invoice_template') ||
                             errorMsg.includes('multi_currency_enabled') ||
                             errorMsg.includes('supported_currencies');

    if (isMissingColumns) {
      console.warn('Self-heal: Strip missing columns during POST insert');
      delete insertData.favicon_url;
      delete insertData.legal_name;
      delete insertData.workspace_name;
      delete insertData.org_code;
      delete insertData.industry;
      delete insertData.business_type;
      delete insertData.timezone;
      delete insertData.currency;
      delete insertData.fiscal_year;
      delete insertData.cin_number;
      delete insertData.msme_number;
      delete insertData.emergency_contact;
      delete insertData.support_email;
      delete insertData.support_phone;
      delete insertData.invoice_prefix;
      delete insertData.invoice_number_start;
      delete insertData.quotation_prefix;
      delete insertData.purchase_prefix;
      delete insertData.credit_note_prefix;
      delete insertData.gst_enabled;
      delete insertData.gst_rate_default;
      delete insertData.tax_configuration;
      delete insertData.invoice_decimal;
      delete insertData.invoice_footer;
      delete insertData.invoice_terms;
      delete insertData.default_payment_terms;
      delete insertData.payment_gateway;
      delete insertData.payment_gateway_config;
      delete insertData.qr_code_enabled;
      delete insertData.qr_code_url;
      delete insertData.digital_signature_enabled;
      delete insertData.digital_signature_url;
      delete insertData.stamp_url;
      delete insertData.signatory_name;
      delete insertData.signatory_title;
      delete insertData.tagline;
      delete insertData.bank_details;
      delete insertData.invoice_template;
      delete insertData.multi_currency_enabled;
      delete insertData.supported_currencies;
      delete insertData.msme_number;
      delete insertData.emergency_contact;
      delete insertData.support_email;
      delete insertData.support_phone;

      const retry = await supabase.from('company_settings').insert(insertData).select('*').single();
      if (retry.error || !retry.data) throw retry.error ?? new Error('Failed to create company settings');
      return apiSuccess(normalizeSupabaseCompanySettings(retry.data), 'Company settings created successfully (self-healed schema)', { status: 201 });
    }
    throw error;
  }

  return apiSuccess(normalizeSupabaseCompanySettings(created), 'Company settings created successfully', { status: 201 });
}, { requireAuth: true, roles: ['Admin'] });

async function handleCompanySettingsPut(payload: any, tenantId: string, supabase: any, existingRow?: any) {
  // If workspaceName (slug) is updated, sync it with the tenants table slug
  if (payload.workspaceName !== undefined && payload.workspaceName !== null && payload.workspaceName.trim()) {
    const slug = payload.workspaceName.trim();
    const { error: tenantUpdateError } = await supabase
      .from('tenants')
      .update({ slug })
      .eq('id', tenantId);
    
    if (tenantUpdateError) {
      console.error('Failed to update tenant slug:', tenantUpdateError);
    }
  }

  // Also sync branding and signatory fields to workspace settings.json
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const settingsFilePath = path.join(process.cwd(), 'src/app/api/workspace-settings/settings.json');
    const raw = await fs.readFile(settingsFilePath, 'utf-8');
    const allWs = JSON.parse(raw);
    allWs[tenantId] = allWs[tenantId] || {};
    if (payload.stampUrl !== undefined) allWs[tenantId].stampUrl = payload.stampUrl;
    if (payload.digitalSignatureUrl !== undefined) allWs[tenantId].digitalSignatureUrl = payload.digitalSignatureUrl;
    if (payload.digitalSignatureEnabled !== undefined) allWs[tenantId].digitalSignatureEnabled = payload.digitalSignatureEnabled;
    if (payload.signatoryName !== undefined) allWs[tenantId].signatoryName = payload.signatoryName;
    if (payload.signatoryTitle !== undefined) allWs[tenantId].signatoryTitle = payload.signatoryTitle;
    if (payload.tagline !== undefined) allWs[tenantId].tagline = payload.tagline;
    if (payload.bankDetails !== undefined) allWs[tenantId].bankDetails = payload.bankDetails;
    if (payload.logoUrl !== undefined) allWs[tenantId].logoUrl = payload.logoUrl;
    await fs.writeFile(settingsFilePath, JSON.stringify(allWs, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to sync to settings.json during company-settings update:', err);
  }

  const existing = existingRow !== undefined
    ? existingRow
    : (await supabase
        .from('company_settings')
        .select('id')
        .eq('tenant_id', tenantId)
        .limit(1)
        .maybeSingle()).data;

  if (!existing) {
    // Dynamic Upsert Fallback: Insert a new row if settings don't exist yet
    const insertData: Record<string, any> = {
      company_name: payload.companyName?.trim() || '',
      email: payload.email?.toLowerCase().trim() || '',
      logo_url: payload.logoUrl?.trim() || null,
      primary_color: payload.primaryColor?.trim() || null,
      secondary_color: payload.secondaryColor?.trim() || null,
      phone: payload.phone?.trim() || null,
      address: payload.address?.trim() || null,
      website: payload.website?.trim() || null,
      smtp_host: payload.smtpHost?.trim() || null,
      smtp_port: payload.smtpPort ?? null,
      smtp_user: payload.smtpUser?.trim() || null,
      smtp_password: payload.smtpPassword ?? null,
      gstin: payload.gstin?.trim() || null,
      pan: payload.pan?.trim() || null,
      registration_certificate_url: payload.registrationCertificateUrl?.trim() || null,
      pan_card_url: payload.panCardUrl?.trim() || null,
      gst_certificate_url: payload.gstCertificateUrl?.trim() || null,
      onboarding_completed: payload.onboardingCompleted ?? false,
      favicon_url: payload.faviconUrl?.trim() || null,
      legal_name: payload.legalName?.trim() || null,
      workspace_name: payload.workspaceName?.trim() || null,
      org_code: payload.orgCode?.trim() || null,
      industry: payload.industry?.trim() || null,
      business_type: payload.businessType?.trim() || null,
      timezone: payload.timezone?.trim() || null,
      currency: payload.currency?.trim() || null,
      fiscal_year: payload.fiscalYear?.trim() || null,
      cin_number: payload.cinNumber?.trim() || null,
      msme_number: payload.msmeNumber?.trim() || null,
      emergency_contact: payload.emergencyContact?.trim() || null,
      support_email: payload.supportEmail?.trim() || null,
      support_phone: payload.supportPhone?.trim() || null,
      invoice_prefix: payload.invoicePrefix ?? null,
      invoice_number_start: payload.invoiceNumberStart ?? null,
      quotation_prefix: payload.quotationPrefix ?? null,
      purchase_prefix: payload.purchasePrefix ?? null,
      credit_note_prefix: payload.creditNotePrefix ?? null,
      gst_enabled: payload.gstEnabled ?? null,
      gst_rate_default: payload.gstRateDefault ?? null,
      tax_configuration: payload.taxConfiguration ?? null,
      invoice_decimal: payload.invoiceDecimal ?? null,
      invoice_footer: payload.invoiceFooter ?? null,
      invoice_terms: payload.invoiceTerms ?? null,
      default_payment_terms: payload.defaultPaymentTerms ?? null,
      payment_gateway: payload.paymentGateway ?? null,
      payment_gateway_config: payload.paymentGatewayConfig ?? null,
      qr_code_enabled: payload.qrCodeEnabled ?? null,
      qr_code_url: payload.qrCodeUrl ?? null,
      digital_signature_enabled: payload.digitalSignatureEnabled ?? null,
      digital_signature_url: payload.digitalSignatureUrl ?? null,
      stamp_url: payload.stampUrl ?? null,
      signatory_name: payload.signatoryName ?? null,
      signatory_title: payload.signatoryTitle ?? null,
      tagline: payload.tagline ?? null,
      bank_details: payload.bankDetails ?? null,
      invoice_template: payload.invoiceTemplate ?? null,
      multi_currency_enabled: payload.multiCurrencyEnabled ?? null,
      supported_currencies: payload.supportedCurrencies ?? null,
      tenant_id: tenantId,
      updated_at: new Date().toISOString(),
    };

    const { data: created, error } = await supabase.from('company_settings').insert(insertData).select('*').single();

    if (error) {
      const errorMsg = error.message || '';
      const isMissingColumns = error.code === 'PGRST204' || 
                               errorMsg.includes('gst_certificate_url') || 
                               errorMsg.includes('registration_certificate_url') || 
                               errorMsg.includes('pan_card_url') || 
                               errorMsg.includes('gstin') || 
                               errorMsg.includes('pan') ||
                               errorMsg.includes('stamp_url') ||
                               errorMsg.includes('signatory_name') ||
                               errorMsg.includes('signatory_title') ||
                               errorMsg.includes('tagline') ||
                               errorMsg.includes('bank_details') ||
                               errorMsg.includes('favicon_url') ||
                               errorMsg.includes('legal_name') ||
                               errorMsg.includes('workspace_name') ||
                               errorMsg.includes('org_code') ||
                               errorMsg.includes('industry') ||
                               errorMsg.includes('business_type') ||
                               errorMsg.includes('timezone') ||
                               errorMsg.includes('currency') ||
                               errorMsg.includes('fiscal_year') ||
                               errorMsg.includes('cin_number') ||
                               errorMsg.includes('msme_number') ||
                               errorMsg.includes('emergency_contact') ||
                               errorMsg.includes('support_email') ||
                               errorMsg.includes('support_phone') ||
                               errorMsg.includes('invoice_prefix') ||
                               errorMsg.includes('invoice_number_start') ||
                               errorMsg.includes('quotation_prefix') ||
                               errorMsg.includes('purchase_prefix') ||
                               errorMsg.includes('credit_note_prefix') ||
                               errorMsg.includes('gst_enabled') ||
                               errorMsg.includes('gst_rate_default') ||
                               errorMsg.includes('tax_configuration') ||
                               errorMsg.includes('invoice_decimal') ||
                               errorMsg.includes('invoice_footer') ||
                               errorMsg.includes('invoice_terms') ||
                               errorMsg.includes('default_payment_terms') ||
                               errorMsg.includes('payment_gateway') ||
                               errorMsg.includes('payment_gateway_config') ||
                               errorMsg.includes('qr_code_enabled') ||
                               errorMsg.includes('qr_code_url') ||
                               errorMsg.includes('digital_signature_enabled') ||
                               errorMsg.includes('digital_signature_url') ||
                               errorMsg.includes('invoice_template') ||
                               errorMsg.includes('multi_currency_enabled') ||
                               errorMsg.includes('supported_currencies');

      if (isMissingColumns) {
        console.warn('Self-heal: Strip missing compliance/document columns during insert');
        delete insertData.gstin;
        delete insertData.pan;
        delete insertData.registration_certificate_url;
        delete insertData.pan_card_url;
        delete insertData.gst_certificate_url;
        delete insertData.favicon_url;
        delete insertData.legal_name;
        delete insertData.workspace_name;
        delete insertData.org_code;
        delete insertData.industry;
        delete insertData.business_type;
        delete insertData.timezone;
        delete insertData.currency;
        delete insertData.fiscal_year;
        delete insertData.cin_number;
        delete insertData.msme_number;
        delete insertData.emergency_contact;
        delete insertData.support_email;
        delete insertData.support_phone;
        delete insertData.invoice_prefix;
        delete insertData.invoice_number_start;
        delete insertData.quotation_prefix;
        delete insertData.purchase_prefix;
        delete insertData.credit_note_prefix;
        delete insertData.gst_enabled;
        delete insertData.gst_rate_default;
        delete insertData.tax_configuration;
        delete insertData.invoice_decimal;
        delete insertData.invoice_footer;
        delete insertData.invoice_terms;
        delete insertData.default_payment_terms;
        delete insertData.payment_gateway;
        delete insertData.payment_gateway_config;
        delete insertData.qr_code_enabled;
        delete insertData.qr_code_url;
        delete insertData.digital_signature_enabled;
        delete insertData.digital_signature_url;
        delete insertData.stamp_url;
        delete insertData.signatory_name;
        delete insertData.signatory_title;
        delete insertData.tagline;
        delete insertData.bank_details;
        delete insertData.invoice_template;
        delete insertData.multi_currency_enabled;
        delete insertData.supported_currencies;

        const retry = await supabase.from('company_settings').insert(insertData).select('*').single();
        if (retry.error || !retry.data) throw retry.error ?? new Error('Failed to create company settings');
        return apiSuccess(normalizeSupabaseCompanySettings(retry.data), 'Company settings created successfully (self-healed schema)');
      }
      throw error;
    }

    if (!created) throw new Error('Failed to create company settings');
    return apiSuccess(normalizeSupabaseCompanySettings(created), 'Company settings created successfully');
  }

  const updateData: Record<string, any> = {
    ...(payload.companyName !== undefined ? { company_name: payload.companyName.trim() } : {}),
    ...(payload.email !== undefined ? { email: payload.email?.toLowerCase().trim() || null } : {}),
    ...(payload.logoUrl !== undefined ? { logo_url: payload.logoUrl?.trim() || null } : {}),
    ...(payload.primaryColor !== undefined ? { primary_color: payload.primaryColor?.trim() || null } : {}),
    ...(payload.secondaryColor !== undefined ? { secondary_color: payload.secondaryColor?.trim() || null } : {}),
    ...(payload.phone !== undefined ? { phone: payload.phone?.trim() || null } : {}),
    ...(payload.address !== undefined ? { address: payload.address?.trim() || null } : {}),
    ...(payload.website !== undefined ? { website: payload.website?.trim() || null } : {}),
    ...(payload.smtpHost !== undefined ? { smtp_host: payload.smtpHost?.trim() || null } : {}),
    ...(payload.smtpPort !== undefined ? { smtp_port: payload.smtpPort ?? null } : {}),
    ...(payload.smtpUser !== undefined ? { smtp_user: payload.smtpUser?.trim() || null } : {}),
    ...(payload.smtpPassword !== undefined ? { smtp_password: payload.smtpPassword ?? null } : {}),
    ...(payload.gstin !== undefined ? { gstin: payload.gstin?.trim() || null } : {}),
    ...(payload.pan !== undefined ? { pan: payload.pan?.trim() || null } : {}),
    ...(payload.registrationCertificateUrl !== undefined ? { registration_certificate_url: payload.registrationCertificateUrl?.trim() || null } : {}),
    ...(payload.panCardUrl !== undefined ? { pan_card_url: payload.panCardUrl?.trim() || null } : {}),
    ...(payload.gstCertificateUrl !== undefined ? { gst_certificate_url: payload.gstCertificateUrl?.trim() || null } : {}),
    ...(payload.onboardingCompleted !== undefined ? { onboarding_completed: payload.onboardingCompleted } : {}),
    ...(payload.faviconUrl !== undefined ? { favicon_url: payload.faviconUrl?.trim() || null } : {}),
    ...(payload.legalName !== undefined ? { legal_name: payload.legalName?.trim() || null } : {}),
    ...(payload.workspaceName !== undefined ? { workspace_name: payload.workspaceName?.trim() || null } : {}),
    ...(payload.orgCode !== undefined ? { org_code: payload.orgCode?.trim() || null } : {}),
    ...(payload.industry !== undefined ? { industry: payload.industry?.trim() || null } : {}),
    ...(payload.businessType !== undefined ? { business_type: payload.businessType?.trim() || null } : {}),
    ...(payload.timezone !== undefined ? { timezone: payload.timezone?.trim() || null } : {}),
    ...(payload.currency !== undefined ? { currency: payload.currency?.trim() || null } : {}),
    ...(payload.fiscalYear !== undefined ? { fiscal_year: payload.fiscalYear?.trim() || null } : {}),
    ...(payload.cinNumber !== undefined ? { cin_number: payload.cinNumber?.trim() || null } : {}),
    ...(payload.msmeNumber !== undefined ? { msme_number: payload.msmeNumber?.trim() || null } : {}),
    ...(payload.emergencyContact !== undefined ? { emergency_contact: payload.emergencyContact?.trim() || null } : {}),
    ...(payload.supportEmail !== undefined ? { support_email: payload.supportEmail?.trim() || null } : {}),
    ...(payload.supportPhone !== undefined ? { support_phone: payload.supportPhone?.trim() || null } : {}),
    ...(payload.invoicePrefix !== undefined ? { invoice_prefix: payload.invoicePrefix } : {}),
    ...(payload.invoiceNumberStart !== undefined ? { invoice_number_start: payload.invoiceNumberStart } : {}),
    ...(payload.quotationPrefix !== undefined ? { quotation_prefix: payload.quotationPrefix } : {}),
    ...(payload.purchasePrefix !== undefined ? { purchase_prefix: payload.purchasePrefix } : {}),
    ...(payload.creditNotePrefix !== undefined ? { credit_note_prefix: payload.creditNotePrefix } : {}),
    ...(payload.gstEnabled !== undefined ? { gst_enabled: payload.gstEnabled } : {}),
    ...(payload.gstRateDefault !== undefined ? { gst_rate_default: payload.gstRateDefault } : {}),
    ...(payload.taxConfiguration !== undefined ? { tax_configuration: payload.taxConfiguration } : {}),
    ...(payload.invoiceDecimal !== undefined ? { invoice_decimal: payload.invoiceDecimal } : {}),
    ...(payload.invoiceFooter !== undefined ? { invoice_footer: payload.invoiceFooter } : {}),
    ...(payload.invoiceTerms !== undefined ? { invoice_terms: payload.invoiceTerms } : {}),
    ...(payload.defaultPaymentTerms !== undefined ? { default_payment_terms: payload.defaultPaymentTerms } : {}),
    ...(payload.paymentGateway !== undefined ? { payment_gateway: payload.paymentGateway } : {}),
    ...(payload.paymentGatewayConfig !== undefined ? { payment_gateway_config: payload.paymentGatewayConfig } : {}),
    ...(payload.qrCodeEnabled !== undefined ? { qr_code_enabled: payload.qrCodeEnabled } : {}),
    ...(payload.qrCodeUrl !== undefined ? { qr_code_url: payload.qrCodeUrl } : {}),
    ...(payload.digitalSignatureEnabled !== undefined ? { digital_signature_enabled: payload.digitalSignatureEnabled } : {}),
    ...(payload.digitalSignatureUrl !== undefined ? { digital_signature_url: payload.digitalSignatureUrl } : {}),
    ...(payload.stampUrl !== undefined ? { stamp_url: payload.stampUrl } : {}),
    ...(payload.signatoryName !== undefined ? { signatory_name: payload.signatoryName } : {}),
    ...(payload.signatoryTitle !== undefined ? { signatory_title: payload.signatoryTitle } : {}),
    ...(payload.tagline !== undefined ? { tagline: payload.tagline } : {}),
    ...(payload.bankDetails !== undefined ? { bank_details: payload.bankDetails } : {}),
    ...(payload.invoiceTemplate !== undefined ? { invoice_template: payload.invoiceTemplate } : {}),
    ...(payload.multiCurrencyEnabled !== undefined ? { multi_currency_enabled: payload.multiCurrencyEnabled } : {}),
    ...(payload.supportedCurrencies !== undefined ? { supported_currencies: payload.supportedCurrencies } : {}),
    updated_at: new Date().toISOString(),
  };

  const { data: updated, error } = await supabase
    .from('company_settings')
    .update(updateData)
    .eq('id', existing.id)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error) {
    const errorMsg = error.message || '';
    const isMissingColumns = error.code === 'PGRST204' || 
                             errorMsg.includes('gst_certificate_url') || 
                             errorMsg.includes('registration_certificate_url') || 
                             errorMsg.includes('pan_card_url') || 
                             errorMsg.includes('gstin') || 
                             errorMsg.includes('pan') ||
                             errorMsg.includes('stamp_url') ||
                             errorMsg.includes('signatory_name') ||
                             errorMsg.includes('signatory_title') ||
                             errorMsg.includes('tagline') ||
                             errorMsg.includes('bank_details') ||
                             errorMsg.includes('favicon_url') ||
                             errorMsg.includes('legal_name') ||
                             errorMsg.includes('workspace_name') ||
                             errorMsg.includes('org_code') ||
                             errorMsg.includes('industry') ||
                             errorMsg.includes('business_type') ||
                             errorMsg.includes('timezone') ||
                             errorMsg.includes('currency') ||
                             errorMsg.includes('fiscal_year') ||
                             errorMsg.includes('cin_number') ||
                             errorMsg.includes('msme_number') ||
                             errorMsg.includes('emergency_contact') ||
                             errorMsg.includes('support_email') ||
                             errorMsg.includes('support_phone') ||
                             errorMsg.includes('invoice_prefix') ||
                             errorMsg.includes('invoice_number_start') ||
                             errorMsg.includes('quotation_prefix') ||
                             errorMsg.includes('purchase_prefix') ||
                             errorMsg.includes('credit_note_prefix') ||
                             errorMsg.includes('gst_enabled') ||
                             errorMsg.includes('gst_rate_default') ||
                             errorMsg.includes('tax_configuration') ||
                             errorMsg.includes('invoice_decimal') ||
                             errorMsg.includes('invoice_footer') ||
                             errorMsg.includes('invoice_terms') ||
                             errorMsg.includes('default_payment_terms') ||
                             errorMsg.includes('payment_gateway') ||
                             errorMsg.includes('payment_gateway_config') ||
                             errorMsg.includes('qr_code_enabled') ||
                             errorMsg.includes('qr_code_url') ||
                             errorMsg.includes('digital_signature_enabled') ||
                             errorMsg.includes('digital_signature_url') ||
                             errorMsg.includes('invoice_template') ||
                             errorMsg.includes('multi_currency_enabled') ||
                             errorMsg.includes('supported_currencies');

    if (isMissingColumns) {
      console.warn('Self-heal: Strip missing compliance/document columns during update');
      delete updateData.gstin;
      delete updateData.pan;
      delete updateData.registration_certificate_url;
      delete updateData.pan_card_url;
      delete updateData.gst_certificate_url;
      delete updateData.favicon_url;
      delete updateData.legal_name;
      delete updateData.workspace_name;
      delete updateData.org_code;
      delete updateData.industry;
      delete updateData.business_type;
      delete updateData.timezone;
      delete updateData.currency;
      delete updateData.fiscal_year;
      delete updateData.cin_number;
      delete updateData.msme_number;
      delete updateData.emergency_contact;
      delete updateData.support_email;
      delete updateData.support_phone;
      delete updateData.invoice_prefix;
      delete updateData.invoice_number_start;
      delete updateData.quotation_prefix;
      delete updateData.purchase_prefix;
      delete updateData.credit_note_prefix;
      delete updateData.gst_enabled;
      delete updateData.gst_rate_default;
      delete updateData.tax_configuration;
      delete updateData.invoice_decimal;
      delete updateData.invoice_footer;
      delete updateData.invoice_terms;
      delete updateData.default_payment_terms;
      delete updateData.payment_gateway;
      delete updateData.payment_gateway_config;
      delete updateData.qr_code_enabled;
      delete updateData.qr_code_url;
      delete updateData.digital_signature_enabled;
      delete updateData.digital_signature_url;
      delete updateData.stamp_url;
      delete updateData.signatory_name;
      delete updateData.signatory_title;
      delete updateData.tagline;
      delete updateData.bank_details;
      delete updateData.invoice_template;
      delete updateData.multi_currency_enabled;
      delete updateData.supported_currencies;

      const retry = await supabase
        .from('company_settings')
        .update(updateData)
        .eq('id', existing.id)
        .eq('tenant_id', tenantId)
        .select('*')
        .single();
      
      if (retry.error || !retry.data) throw retry.error ?? new Error('Failed to update company settings');
      return apiSuccess(normalizeSupabaseCompanySettings(retry.data), 'Company settings updated successfully (self-healed schema)');
    }
    throw error;
  }

  if (!updated) throw new Error('Failed to update company settings');
  return apiSuccess(normalizeSupabaseCompanySettings(updated), 'Company settings updated successfully');
}

export const PUT = withApiHandler(async (request, context) => {
  const payload = updateCompanySettingsSchema.parse(await request.json());
  if (Object.keys(payload).length === 0) {
    throw new BadRequestError('At least one field is required to update company settings');
  }

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');
  const supabase = getAdminRouteSupabase();
  return handleCompanySettingsPut(payload, tenantId, supabase);
}, { requireAuth: true, roles: ['Admin'] });
