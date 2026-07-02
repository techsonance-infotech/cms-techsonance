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
    updatedAt: row.updated_at ?? null,
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
  const payload = companySettingsSchema.parse(await request.json());

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
  if (existing) {
    throw new ConflictError('Company settings already exist. Use PUT to update the current record.');
  }

  const now = new Date().toISOString();
  const { data: created, error } = await supabase.from('company_settings').insert({
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
    tenant_id: tenantId,
    updated_at: now,
  }).select('*').single();
  if (error || !created) throw error ?? new Error('Failed to create company settings');
  return apiSuccess(normalizeSupabaseCompanySettings(created), 'Company settings created successfully', { status: 201 });
}, { requireAuth: true, roles: ['Admin'] });

export const PUT = withApiHandler(async (request, context) => {
  const payload = updateCompanySettingsSchema.parse(await request.json());
  if (Object.keys(payload).length === 0) {
    throw new BadRequestError('At least one field is required to update company settings');
  }

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
                               errorMsg.includes('pan');

      if (isMissingColumns) {
        console.warn('Self-heal: Strip missing compliance/document columns during insert');
        delete insertData.gstin;
        delete insertData.pan;
        delete insertData.registration_certificate_url;
        delete insertData.pan_card_url;
        delete insertData.gst_certificate_url;

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
                             errorMsg.includes('pan');

    if (isMissingColumns) {
      console.warn('Self-heal: Strip missing compliance/document columns during update');
      delete updateData.gstin;
      delete updateData.pan;
      delete updateData.registration_certificate_url;
      delete updateData.pan_card_url;
      delete updateData.gst_certificate_url;

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
}, { requireAuth: true, roles: ['Admin'] });
