import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, NotFoundError } from '@/server/http/errors';
import { clientStatusSchema, createClientSchema, updateClientSchema } from '@/server/validation/clients';
import {
  buildLegacyUserIdMap,
  getAdminRouteSupabase,
  getCurrentSupabaseActor,
} from '@/server/supabase/route-helpers';

function normalizeSupabaseClientRow(row: Record<string, unknown>, userMap: Map<string, number | null>) {
  const createdBy = typeof row.created_by === 'string' ? userMap.get(row.created_by) ?? null : null;
  
  let onboardingStep = 1;
  let clientNotes = (row.notes as string) ?? null;
  
  // Extended CRM fields defaults
  let website = (row.website as string) ?? null;
  let businessType = (row.business_type as string) ?? null;
  let companySize = (row.company_size as string) ?? null;
  let companyEmail = (row.company_email as string) ?? null;
  let companyPhone = (row.company_phone as string) ?? null;
  let designation = (row.designation as string) ?? null;
  let leadSource = (row.lead_source as string) ?? null;
  let accountOwner = (row.account_owner as string) ?? null;
  let interestedServices = (row.interested_services as string) ?? null;
  let priority = (row.priority as string) ?? null;
  let estimatedBudget = (row.estimated_budget as string) ?? null;
  let expectedStartDate = (row.expected_start_date as string) ?? null;
  let currency = (row.currency as string) ?? null;
  let paymentTerms = (row.payment_terms as string) ?? null;
  let city = (row.city as string) ?? null;
  let state = (row.state as string) ?? null;
  let country = (row.country as string) ?? null;
  let postalCode = (row.postal_code as string) ?? null;
  let logoUrl = (row.logo_url as string) ?? null;

  if (row.onboarding_step !== undefined && row.onboarding_step !== null) {
    onboardingStep = Number(row.onboarding_step);
  }

  if (typeof row.notes === 'string' && row.notes.startsWith('{') && row.notes.endsWith('}')) {
    try {
      const parsed = JSON.parse(row.notes);
      onboardingStep = Number(parsed.onboardingStep ?? onboardingStep);
      clientNotes = parsed.notes ?? null;
      
      // CRM JSON fallback
      website = parsed.website ?? website;
      businessType = parsed.businessType ?? businessType;
      companySize = parsed.companySize ?? companySize;
      companyEmail = parsed.companyEmail ?? companyEmail;
      companyPhone = parsed.companyPhone ?? companyPhone;
      designation = parsed.designation ?? designation;
      leadSource = parsed.leadSource ?? leadSource;
      accountOwner = parsed.accountOwner ?? accountOwner;
      interestedServices = parsed.interestedServices ?? interestedServices;
      priority = parsed.priority ?? priority;
      estimatedBudget = parsed.estimatedBudget ?? estimatedBudget;
      expectedStartDate = parsed.expectedStartDate ?? expectedStartDate;
      currency = parsed.currency ?? currency;
      paymentTerms = parsed.paymentTerms ?? paymentTerms;
      city = parsed.city ?? city;
      state = parsed.state ?? state;
      country = parsed.country ?? country;
      postalCode = parsed.postalCode ?? postalCode;
      logoUrl = parsed.logoUrl ?? logoUrl;
    } catch {
      // Ignored: notes is plain text
    }
  }

  return {
    id: Number(row.id),
    companyName: row.company_name,
    contactPerson: row.contact_person,
    email: row.email,
    phone: row.phone ?? null,
    address: row.address ?? null,
    industry: row.industry ?? null,
    status: row.status,
    createdBy,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    notes: clientNotes,
    onboardingStep,
    website,
    businessType,
    companySize,
    companyEmail,
    companyPhone,
    designation,
    leadSource,
    accountOwner,
    interestedServices,
    priority,
    estimatedBudget,
    expectedStartDate,
    currency,
    paymentTerms,
    city,
    state,
    country,
    postalCode,
    logoUrl,
  };
}

/** Check for duplicate company name, email or phone in the same tenant. Returns a conflict message or null. */
async function checkDuplicates(
  supabase: ReturnType<typeof getAdminRouteSupabase>,
  tenantId: string,
  email: string,
  phone: string | null | undefined,
  companyName: string,
  excludeId?: number
): Promise<string | null> {
  // Check Company Name uniqueness (case-insensitive)
  let nameQuery = supabase
    .from('clients')
    .select('id')
    .eq('tenant_id', tenantId)
    .ilike('company_name', companyName.trim());
  if (excludeId) nameQuery = nameQuery.neq('id', excludeId);
  const { data: nameConflict } = await nameQuery.limit(1);
  if (nameConflict && nameConflict.length > 0) {
    return 'A client with this company name already exists.';
  }

  // Check email uniqueness (case-insensitive)
  let emailQuery = supabase
    .from('clients')
    .select('id')
    .eq('tenant_id', tenantId)
    .ilike('email', email);
  if (excludeId) emailQuery = emailQuery.neq('id', excludeId);
  const { data: emailConflict } = await emailQuery.limit(1);
  if (emailConflict && emailConflict.length > 0) {
    return 'A client with this email address already exists.';
  }

  // Check phone uniqueness (only if phone is provided)
  if (phone && phone.trim()) {
    let phoneQuery = supabase
      .from('clients')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('phone', phone.trim());
    if (excludeId) phoneQuery = phoneQuery.neq('id', excludeId);
    const { data: phoneConflict } = await phoneQuery.limit(1);
    if (phoneConflict && phoneConflict.length > 0) {
      return 'A client with this phone number already exists.';
    }
  }

  return null;
}

export const GET = withApiHandler(async (request, context) => {
  const searchParams = new URL(request.url).searchParams;
  const id = searchParams.get('id');

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');
  
  const supabase = getAdminRouteSupabase();

  if (id) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', Number(id))
      .eq('tenant_id', tenantId)
      .single();
      
    if (error || !data) throw new NotFoundError('Client not found');
    const userMap = await buildLegacyUserIdMap(accessToken, [String(data.created_by)], tenantId);
    return NextResponse.json(normalizeSupabaseClientRow(data, userMap));
  }

  const limit = Math.min(Number(searchParams.get('limit') ?? '10'), 100);
  const offset = Math.max(Number(searchParams.get('offset') ?? '0'), 0);
  const search = searchParams.get('search');
  const status = searchParams.get('status');
  const industry = searchParams.get('industry');
  
  let query = supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId);

  if (search) {
    query = query.or(`company_name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%`);
  }
  if (status) query = query.eq('status', clientStatusSchema.parse(status));
  if (industry) query = query.eq('industry', industry);

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);

  const userMap = await buildLegacyUserIdMap(
    accessToken,
    ((data as Record<string, unknown>[] | null) ?? []).map((row) => String(row.created_by)).filter(Boolean),
    tenantId
  );

  return NextResponse.json({
    success: true,
    data: ((data as Record<string, unknown>[] | null) ?? []).map((row) => normalizeSupabaseClientRow(row, userMap)),
    message: 'Clients fetched successfully',
    errors: null,
    meta: {
      page: Math.floor(offset / limit) + 1,
      limit,
      total: Number(count ?? 0),
    },
  });
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const payload = createClientSchema.parse(await request.json());

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');
  
  const supabase = getAdminRouteSupabase();

  // Pre-insert uniqueness check — avoids raw Postgres PK/unique constraint crashes
  const conflict = await checkDuplicates(
    supabase,
    tenantId,
    payload.email.toLowerCase().trim(),
    payload.phone,
    payload.companyName
  );
  if (conflict) throw new BadRequestError(conflict);

  const actor = await getCurrentSupabaseActor(accessToken);
  const now = new Date().toISOString();
  
  const insertPayload: Record<string, any> = {
    company_name: payload.companyName.trim(),
    contact_person: payload.contactPerson.trim(),
    email: payload.email.toLowerCase().trim(),
    phone: payload.phone.trim(),
    address: payload.address?.trim() || null,
    industry: payload.industry.trim(),
    notes: payload.notes?.trim() || null,
    status: payload.status ?? 'active',
    tenant_id: tenantId,
    created_by: actor.authUserId,
    created_at: now,
    updated_at: now,
    onboarding_step: payload.onboardingStep ?? 1,
    website: payload.website?.trim() || null,
    business_type: payload.businessType?.trim() || null,
    company_size: payload.companySize?.trim() || null,
    company_email: payload.companyEmail?.trim() || null,
    company_phone: payload.companyPhone?.trim() || null,
    designation: payload.designation?.trim() || null,
    lead_source: payload.leadSource?.trim() || null,
    account_owner: payload.accountOwner?.trim() || null,
    interested_services: payload.interestedServices?.trim() || null,
    priority: payload.priority?.trim() || null,
    estimated_budget: payload.estimatedBudget?.trim() || null,
    expected_start_date: payload.expectedStartDate?.trim() || null,
    currency: payload.currency?.trim() || null,
    payment_terms: payload.paymentTerms?.trim() || null,
    city: payload.city?.trim() || null,
    state: payload.state?.trim() || null,
    country: payload.country?.trim() || null,
    postal_code: payload.postalCode?.trim() || null,
    logo_url: payload.logoUrl?.trim() || null,
  };

  let { data, error } = await supabase.from('clients').insert(insertPayload).select('*').single();

  if (error && (error.code === '42703' || error.message?.includes('onboarding_step') || error.message?.includes('website') || error.message?.includes('business_type'))) {
    // Fallback: DB migration not applied yet, save as JSON wrapper inside notes text field
    const jsonNotes = JSON.stringify({
      notes: payload.notes?.trim() || null,
      onboardingStep: payload.onboardingStep ?? 1,
      website: payload.website?.trim() || null,
      businessType: payload.businessType?.trim() || null,
      companySize: payload.companySize?.trim() || null,
      companyEmail: payload.companyEmail?.trim() || null,
      companyPhone: payload.companyPhone?.trim() || null,
      designation: payload.designation?.trim() || null,
      leadSource: payload.leadSource?.trim() || null,
      accountOwner: payload.accountOwner?.trim() || null,
      interestedServices: payload.interestedServices?.trim() || null,
      priority: payload.priority?.trim() || null,
      estimatedBudget: payload.estimatedBudget?.trim() || null,
      expectedStartDate: payload.expectedStartDate?.trim() || null,
      currency: payload.currency?.trim() || null,
      paymentTerms: payload.paymentTerms?.trim() || null,
      city: payload.city?.trim() || null,
      state: payload.state?.trim() || null,
      country: payload.country?.trim() || null,
      postalCode: payload.postalCode?.trim() || null,
      logoUrl: payload.logoUrl?.trim() || null,
    });

    const fallbackPayload: Record<string, any> = {
      company_name: payload.companyName.trim(),
      contact_person: payload.contactPerson.trim(),
      email: payload.email.toLowerCase().trim(),
      phone: payload.phone.trim(),
      address: payload.address?.trim() || null,
      industry: payload.industry.trim(),
      notes: jsonNotes,
      status: payload.status ?? 'active',
      tenant_id: tenantId,
      created_by: actor.authUserId,
      created_at: now,
      updated_at: now,
    };

    const fallbackResult = await supabase.from('clients').insert(fallbackPayload).select('*').single();
    data = fallbackResult.data;
    error = fallbackResult.error;
  }

  if (error) {
    if (error.code === '23505') {
      if (error.message.includes('email')) throw new BadRequestError('A client with this email address already exists.');
      if (error.message.includes('phone')) throw new BadRequestError('A client with this phone number already exists.');
      throw new BadRequestError('A client with these details already exists.');
    }
    throw new Error(error.message);
  }
  if (!data) throw new Error('Failed to create client');

  // Handle uploaded files linking
  if (payload.uploadedFileIds && payload.uploadedFileIds.length > 0) {
    await supabase
      .from('file_metadata')
      .update({ entity_id: String(data.id) })
      .in('id', payload.uploadedFileIds)
      .eq('tenant_id', tenantId);
  }

  const userMap = await buildLegacyUserIdMap(accessToken, [actor.authUserId], tenantId);
  return NextResponse.json(normalizeSupabaseClientRow(data, userMap), { status: 201 });
}, { requireAuth: true, roles: ['Manager'] });

export const PUT = withApiHandler(async (request, context) => {
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('Valid client id is required');

  const payload = updateClientSchema.parse(await request.json());

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');
  
  const supabase = getAdminRouteSupabase();
  const { data: existing } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();
    
  if (!existing) throw new NotFoundError('Client not found');

  // Pre-update uniqueness check (exclude current record)
  const emailToCheck = payload.email ? payload.email.toLowerCase().trim() : null;
  const phoneToCheck = payload.phone ?? null;
  const nameToCheck = payload.companyName ?? null;
  if (emailToCheck || phoneToCheck || nameToCheck) {
    const conflict = await checkDuplicates(
      supabase,
      tenantId,
      emailToCheck ?? String(existing.email),
      phoneToCheck,
      nameToCheck ?? String(existing.company_name),
      id
    );
    if (conflict) throw new BadRequestError(conflict);
  }

  const updatePayload: Record<string, any> = {
    ...(payload.companyName !== undefined ? { company_name: payload.companyName.trim() } : {}),
    ...(payload.contactPerson !== undefined ? { contact_person: payload.contactPerson.trim() } : {}),
    ...(payload.email !== undefined ? { email: payload.email.toLowerCase().trim() } : {}),
    ...(payload.phone !== undefined ? { phone: payload.phone.trim() } : {}),
    ...(payload.address !== undefined ? { address: payload.address?.trim() || null } : {}),
    ...(payload.industry !== undefined ? { industry: payload.industry.trim() } : {}),
    ...(payload.notes !== undefined ? { notes: payload.notes?.trim() || null } : {}),
    ...(payload.status !== undefined ? { status: payload.status } : {}),
    ...(payload.onboardingStep !== undefined ? { onboarding_step: payload.onboardingStep } : {}),
    ...(payload.website !== undefined ? { website: payload.website?.trim() || null } : {}),
    ...(payload.businessType !== undefined ? { business_type: payload.businessType?.trim() || null } : {}),
    ...(payload.companySize !== undefined ? { company_size: payload.companySize?.trim() || null } : {}),
    ...(payload.companyEmail !== undefined ? { company_email: payload.companyEmail?.trim() || null } : {}),
    ...(payload.companyPhone !== undefined ? { company_phone: payload.companyPhone?.trim() || null } : {}),
    ...(payload.designation !== undefined ? { designation: payload.designation?.trim() || null } : {}),
    ...(payload.leadSource !== undefined ? { lead_source: payload.leadSource?.trim() || null } : {}),
    ...(payload.accountOwner !== undefined ? { account_owner: payload.accountOwner?.trim() || null } : {}),
    ...(payload.interestedServices !== undefined ? { interested_services: payload.interestedServices?.trim() || null } : {}),
    ...(payload.priority !== undefined ? { priority: payload.priority?.trim() || null } : {}),
    ...(payload.estimatedBudget !== undefined ? { estimated_budget: payload.estimatedBudget?.trim() || null } : {}),
    ...(payload.expectedStartDate !== undefined ? { expected_start_date: payload.expectedStartDate?.trim() || null } : {}),
    ...(payload.currency !== undefined ? { currency: payload.currency?.trim() || null } : {}),
    ...(payload.paymentTerms !== undefined ? { payment_terms: payload.paymentTerms?.trim() || null } : {}),
    ...(payload.city !== undefined ? { city: payload.city?.trim() || null } : {}),
    ...(payload.state !== undefined ? { state: payload.state?.trim() || null } : {}),
    ...(payload.country !== undefined ? { country: payload.country?.trim() || null } : {}),
    ...(payload.postalCode !== undefined ? { postal_code: payload.postalCode?.trim() || null } : {}),
    ...(payload.logoUrl !== undefined ? { logo_url: payload.logoUrl?.trim() || null } : {}),
    updated_at: new Date().toISOString(),
  };

  let { data, error } = await supabase.from('clients').update(updatePayload)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error && (error.code === '42703' || error.message?.includes('onboarding_step') || error.message?.includes('website') || error.message?.includes('business_type'))) {
    // Fallback: column doesn't exist yet, save in notes JSON
    let currentValues: Record<string, any> = {};
    if (typeof existing.notes === 'string' && existing.notes.startsWith('{') && existing.notes.endsWith('}')) {
      try {
        currentValues = JSON.parse(existing.notes);
      } catch {}
    }

    const mergedNotesText = payload.notes !== undefined ? payload.notes : (currentValues.notes ?? existing.notes);
    const mergedOnboardingStep = payload.onboardingStep !== undefined ? payload.onboardingStep : (currentValues.onboardingStep ?? existing.onboarding_step ?? 1);
    const mergedWebsite = payload.website !== undefined ? payload.website : (currentValues.website ?? existing.website);
    const mergedBusinessType = payload.businessType !== undefined ? payload.businessType : (currentValues.businessType ?? existing.business_type);
    const mergedCompanySize = payload.companySize !== undefined ? payload.companySize : (currentValues.companySize ?? existing.company_size);
    const mergedCompanyEmail = payload.companyEmail !== undefined ? payload.companyEmail : (currentValues.companyEmail ?? existing.company_email);
    const mergedCompanyPhone = payload.companyPhone !== undefined ? payload.companyPhone : (currentValues.companyPhone ?? existing.company_phone);
    const mergedDesignation = payload.designation !== undefined ? payload.designation : (currentValues.designation ?? existing.designation);
    const mergedLeadSource = payload.leadSource !== undefined ? payload.leadSource : (currentValues.leadSource ?? existing.lead_source);
    const mergedAccountOwner = payload.accountOwner !== undefined ? payload.accountOwner : (currentValues.accountOwner ?? existing.account_owner);
    const mergedInterestedServices = payload.interestedServices !== undefined ? payload.interestedServices : (currentValues.interestedServices ?? existing.interested_services);
    const mergedPriority = payload.priority !== undefined ? payload.priority : (currentValues.priority ?? existing.priority);
    const mergedEstimatedBudget = payload.estimatedBudget !== undefined ? payload.estimatedBudget : (currentValues.estimatedBudget ?? existing.estimated_budget);
    const mergedExpectedStartDate = payload.expectedStartDate !== undefined ? payload.expectedStartDate : (currentValues.expectedStartDate ?? existing.expected_start_date);
    const mergedCurrency = payload.currency !== undefined ? payload.currency : (currentValues.currency ?? existing.currency);
    const mergedPaymentTerms = payload.paymentTerms !== undefined ? payload.paymentTerms : (currentValues.paymentTerms ?? existing.payment_terms);
    const mergedCity = payload.city !== undefined ? payload.city : (currentValues.city ?? existing.city);
    const mergedState = payload.state !== undefined ? payload.state : (currentValues.state ?? existing.state);
    const mergedCountry = payload.country !== undefined ? payload.country : (currentValues.country ?? existing.country);
    const mergedPostalCode = payload.postalCode !== undefined ? payload.postalCode : (currentValues.postalCode ?? existing.postal_code);
    const mergedLogoUrl = payload.logoUrl !== undefined ? payload.logoUrl : (currentValues.logoUrl ?? existing.logo_url);

    const jsonNotes = JSON.stringify({
      notes: mergedNotesText,
      onboardingStep: mergedOnboardingStep,
      website: mergedWebsite,
      businessType: mergedBusinessType,
      companySize: mergedCompanySize,
      companyEmail: mergedCompanyEmail,
      companyPhone: mergedCompanyPhone,
      designation: mergedDesignation,
      leadSource: mergedLeadSource,
      accountOwner: mergedAccountOwner,
      interestedServices: mergedInterestedServices,
      priority: mergedPriority,
      estimatedBudget: mergedEstimatedBudget,
      expectedStartDate: mergedExpectedStartDate,
      currency: mergedCurrency,
      paymentTerms: mergedPaymentTerms,
      city: mergedCity,
      state: mergedState,
      country: mergedCountry,
      postalCode: mergedPostalCode,
      logoUrl: mergedLogoUrl,
    });

    const fallbackPayload: Record<string, any> = {
      company_name: payload.companyName !== undefined ? payload.companyName.trim() : existing.company_name,
      contact_person: payload.contactPerson !== undefined ? payload.contactPerson.trim() : existing.contact_person,
      email: payload.email !== undefined ? payload.email.toLowerCase().trim() : existing.email,
      phone: payload.phone !== undefined ? payload.phone.trim() : existing.phone,
      address: payload.address !== undefined ? (payload.address?.trim() || null) : existing.address,
      industry: payload.industry !== undefined ? payload.industry.trim() : existing.industry,
      status: payload.status !== undefined ? payload.status : existing.status,
      notes: jsonNotes,
      updated_at: new Date().toISOString(),
    };

    const fallbackResult = await supabase.from('clients').update(fallbackPayload)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('*')
      .single();
    data = fallbackResult.data;
    error = fallbackResult.error;
  }

  if (error) {
    if (error.code === '23505') {
      if (error.message.includes('email')) throw new BadRequestError('A client with this email address already exists.');
      if (error.message.includes('phone')) throw new BadRequestError('A client with this phone number already exists.');
      throw new BadRequestError('A client with these details already exists.');
    }
    throw new Error(error.message);
  }
  if (!data) throw new Error('Failed to update client');

  // Handle uploaded files linking if updated
  if (payload.uploadedFileIds && payload.uploadedFileIds.length > 0) {
    await supabase
      .from('file_metadata')
      .update({ entity_id: String(data.id) })
      .in('id', payload.uploadedFileIds)
      .eq('tenant_id', tenantId);
  }

  const userMap = await buildLegacyUserIdMap(accessToken, [String(data.created_by)]);
  return NextResponse.json(normalizeSupabaseClientRow(data, userMap));
}, { requireAuth: true, roles: ['Manager'] });

export const DELETE = withApiHandler(async (request, context) => {
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('Valid client id is required');

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');
  
  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();
  if (error || !data) throw new NotFoundError('Client not found');
  const userMap = await buildLegacyUserIdMap(accessToken, [String(data.created_by)]);
  return NextResponse.json({ message: 'Client deleted successfully', client: normalizeSupabaseClientRow(data, userMap) });
}, { requireAuth: true, roles: ['Manager'] });
