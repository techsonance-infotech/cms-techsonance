import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, NotFoundError } from '@/server/http/errors';
import { apiSuccess } from '@/server/http/response';
import { createInquirySchema, updateInquirySchema } from '@/server/validation/crm';
import {
  buildLegacyUserIdMap,
  getCurrentSupabaseActor,
  getAdminRouteSupabase,
} from '@/server/supabase/route-helpers';

function normalizeSupabaseInquiryRow(row: Record<string, any>, userMap: Map<string, number | null>) {
  const createdBy = typeof row.created_by === 'string' ? userMap.get(row.created_by) ?? null : null;

  // Try to parse fallback fields if saved inside internal_notes JSON
  let fallback: Record<string, any> = {};
  if (typeof row.internal_notes === 'string' && row.internal_notes.startsWith('{') && row.internal_notes.endsWith('}')) {
    try {
      fallback = JSON.parse(row.internal_notes);
    } catch (e) {
      // Ignore
    }
  }

  return {
    id: Number(row.id),
    aliasName: row.alias_name,
    tag: row.tag,
    status: row.status,
    dueDate: row.due_date ?? null,
    appStatus: row.app_status ?? null,
    isFavourite: Boolean(row.is_favourite ?? false),
    createdBy,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    companyName: row.company_name ?? fallback.companyName ?? null,
    website: row.website ?? fallback.website ?? null,
    industry: row.industry ?? fallback.industry ?? null,
    companySize: row.company_size ?? fallback.companySize ?? null,
    countryRegion: row.country_region ?? fallback.countryRegion ?? null,
    contactPerson: row.contact_person ?? fallback.contactPerson ?? null,
    designation: row.designation ?? fallback.designation ?? null,
    workEmail: row.work_email ?? fallback.workEmail ?? null,
    phoneNumber: row.phone_number ?? fallback.phoneNumber ?? null,
    alternateEmail: row.alternate_email ?? fallback.alternateEmail ?? null,
    alternatePhone: row.alternate_phone ?? fallback.alternatePhone ?? null,
    techTagRequirement: row.tech_tag_requirement ?? fallback.techTagRequirement ?? null,
    inquirySource: row.inquiry_source ?? fallback.inquirySource ?? null,
    pipelineStage: row.pipeline_stage ?? fallback.pipelineStage ?? null,
    opportunityStatus: row.opportunity_status ?? fallback.opportunityStatus ?? 'Open',
    estimationDueDate: row.estimation_due_date ?? fallback.estimationDueDate ?? null,
    expectedStartDate: row.expected_start_date ?? fallback.expectedStartDate ?? null,
    projectOverviewRequirements: row.project_overview_requirements ?? fallback.projectOverviewRequirements ?? null,
    budgetRange: row.budget_range ?? fallback.budgetRange ?? null,
    estimatedValue: row.estimated_value !== undefined && row.estimated_value !== null ? Number(row.estimated_value) : (fallback.estimatedValue !== undefined && fallback.estimatedValue !== null ? Number(fallback.estimatedValue) : null),
    timeline: row.timeline ?? fallback.timeline ?? null,
    priorityLevel: row.priority_level ?? fallback.priorityLevel ?? 'Medium',
    probability: row.probability ?? fallback.probability ?? null,
    accountOwner: row.account_owner ?? fallback.accountOwner ?? null,
    salesManager: row.sales_manager ?? fallback.salesManager ?? null,
    technicalLead: row.technical_lead ?? fallback.technicalLead ?? null,
    preferredCommunication: row.preferred_communication ?? fallback.preferredCommunication ?? null,
    attachmentUrl: row.attachment_url ?? fallback.attachmentUrl ?? null,
    internalNotes: fallback._internalNotesText ?? row.internal_notes ?? null,
  };
}

export const GET = withApiHandler(async (request, context) => {
  const searchParams = new URL(request.url).searchParams;
  const id = searchParams.get('id');

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');
  const supabase = getAdminRouteSupabase();

  if (id) {
    const inquiryId = Number(id);
    if (!Number.isInteger(inquiryId) || inquiryId <= 0) {
      throw new BadRequestError('Valid inquiry id is required');
    }
    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .eq('id', inquiryId)
      .eq('tenant_id', tenantId)
      .single();
    if (error || !data) throw new NotFoundError('Inquiry not found');
    const userMap = await buildLegacyUserIdMap(accessToken, [String(data.created_by)].filter(Boolean), tenantId);
    return apiSuccess(normalizeSupabaseInquiryRow(data, userMap), 'Inquiry fetched successfully');
  }

  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? '10'), 1), 100);
  const offset = Math.max(Number(searchParams.get('offset') ?? '0'), 0);
  const search = searchParams.get('search');
  const tag = searchParams.get('tag');
  const status = searchParams.get('status');
  const appStatus = searchParams.get('appStatus');
  const isFavourite = searchParams.get('isFavourite');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  let query = supabase
    .from('inquiries')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId);

  if (search) query = query.ilike('alias_name', `%${search}%`);
  if (tag) query = query.eq('tag', tag);
  if (status) query = query.eq('status', status);
  if (appStatus) query = query.eq('app_status', appStatus);
  if (isFavourite !== null) query = query.eq('is_favourite', isFavourite === 'true' || isFavourite === '1');
  if (startDate) query = query.gte('created_at', startDate);
  if (endDate) query = query.lte('created_at', endDate);

  const { data, count, error } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  if (error) throw error;
  const rows = (data as Record<string, unknown>[] | null) ?? [];
  const userMap = await buildLegacyUserIdMap(accessToken, rows.map((row) => String(row.created_by)).filter(Boolean), tenantId);
  return apiSuccess(rows.map((row) => normalizeSupabaseInquiryRow(row, userMap)), 'Inquiries fetched successfully', {
    meta: { page: Math.floor(offset / limit) + 1, limit, total: Number(count ?? 0) },
  });
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const payload = createInquirySchema.parse(await request.json());

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');
  const actor = await getCurrentSupabaseActor(accessToken);
  const supabase = getAdminRouteSupabase();
  const now = new Date().toISOString();

  const insertData: Record<string, any> = {
    alias_name: payload.aliasName,
    tag: payload.tag,
    status: payload.status,
    due_date: payload.dueDate || null,
    app_status: payload.appStatus || 'open',
    is_favourite: payload.isFavourite || false,
    created_by: actor.authUserId,
    tenant_id: tenantId,
    created_at: now,
    updated_at: now,
    company_name: payload.companyName || null,
    website: payload.website || null,
    industry: payload.industry || null,
    company_size: payload.companySize || null,
    country_region: payload.countryRegion || null,
    contact_person: payload.contactPerson || null,
    designation: payload.designation || null,
    work_email: payload.workEmail || null,
    phone_number: payload.phoneNumber || null,
    alternate_email: payload.alternateEmail || null,
    alternate_phone: payload.alternatePhone || null,
    tech_tag_requirement: payload.techTagRequirement || null,
    inquiry_source: payload.inquirySource || null,
    pipeline_stage: payload.pipelineStage || null,
    opportunity_status: payload.opportunityStatus || 'Open',
    estimation_due_date: payload.estimationDueDate || null,
    expected_start_date: payload.expectedStartDate || null,
    project_overview_requirements: payload.projectOverviewRequirements || null,
    budget_range: payload.budgetRange || null,
    estimated_value: payload.estimatedValue !== undefined && payload.estimatedValue !== null ? Number(payload.estimatedValue) : null,
    timeline: payload.timeline || null,
    priority_level: payload.priorityLevel || 'Medium',
    probability: payload.probability || null,
    account_owner: payload.accountOwner || null,
    sales_manager: payload.salesManager || null,
    technical_lead: payload.technicalLead || null,
    preferred_communication: payload.preferredCommunication || null,
    attachment_url: payload.attachmentUrl || null,
    internal_notes: payload.internalNotes || null,
  };

  let result = await supabase.from('inquiries').insert(insertData).select('*').single();
  
  if (result.error) {
    // Fail-safe fallback: If database schema is not updated, serialize extended columns in internal_notes JSON
    const fallbackNotes = JSON.stringify({
      companyName: payload.companyName,
      website: payload.website,
      industry: payload.industry,
      companySize: payload.companySize,
      countryRegion: payload.countryRegion,
      contactPerson: payload.contactPerson,
      designation: payload.designation,
      workEmail: payload.workEmail,
      phoneNumber: payload.phoneNumber,
      alternateEmail: payload.alternateEmail,
      alternatePhone: payload.alternatePhone,
      techTagRequirement: payload.techTagRequirement,
      inquirySource: payload.inquirySource,
      pipelineStage: payload.pipelineStage,
      opportunityStatus: payload.opportunityStatus,
      estimationDueDate: payload.estimationDueDate,
      expectedStartDate: payload.expectedStartDate,
      projectOverviewRequirements: payload.projectOverviewRequirements,
      budgetRange: payload.budgetRange,
      estimatedValue: payload.estimatedValue,
      timeline: payload.timeline,
      priorityLevel: payload.priorityLevel,
      probability: payload.probability,
      accountOwner: payload.accountOwner,
      salesManager: payload.salesManager,
      technicalLead: payload.technicalLead,
      preferredCommunication: payload.preferredCommunication,
      attachmentUrl: payload.attachmentUrl,
      _internalNotesText: payload.internalNotes,
    });

    const safeInsertData = {
      alias_name: payload.aliasName,
      tag: payload.tag,
      status: payload.status,
      due_date: payload.dueDate || null,
      app_status: payload.appStatus || 'open',
      is_favourite: payload.isFavourite || false,
      created_by: actor.authUserId,
      tenant_id: tenantId,
      created_at: now,
      updated_at: now,
      internal_notes: fallbackNotes,
    };
    result = await supabase.from('inquiries').insert(safeInsertData).select('*').single();
  }

  if (result.error || !result.data) throw result.error ?? new Error('Failed to create inquiry');
  const userMap = await buildLegacyUserIdMap(accessToken, [actor.authUserId], tenantId);
  return apiSuccess(normalizeSupabaseInquiryRow(result.data, userMap), 'Inquiry created successfully', { status: 201 });
}, { requireAuth: true, roles: ['Employee'] });

export const PUT = withApiHandler(async (request, context) => {
  const inquiryId = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(inquiryId) || inquiryId <= 0) {
    throw new BadRequestError('Valid inquiry id is required');
  }

  const payload = updateInquirySchema.parse(await request.json());
  if (Object.keys(payload).length === 0) {
    throw new BadRequestError('At least one field is required to update an inquiry');
  }

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');
  const supabase = getAdminRouteSupabase();
  const { data: existing } = await supabase.from('inquiries').select('*').eq('id', inquiryId).eq('tenant_id', tenantId).single();
  if (!existing) throw new NotFoundError('Inquiry not found');

  const updateData: Record<string, any> = {
    ...(payload.aliasName !== undefined ? { alias_name: payload.aliasName } : {}),
    ...(payload.tag !== undefined ? { tag: payload.tag } : {}),
    ...(payload.status !== undefined ? { status: payload.status } : {}),
    ...(payload.dueDate !== undefined ? { due_date: payload.dueDate } : {}),
    ...(payload.appStatus !== undefined ? { app_status: payload.appStatus } : {}),
    ...(payload.isFavourite !== undefined ? { is_favourite: payload.isFavourite } : {}),
    ...(payload.companyName !== undefined ? { company_name: payload.companyName } : {}),
    ...(payload.website !== undefined ? { website: payload.website } : {}),
    ...(payload.industry !== undefined ? { industry: payload.industry } : {}),
    ...(payload.companySize !== undefined ? { company_size: payload.companySize } : {}),
    ...(payload.countryRegion !== undefined ? { country_region: payload.countryRegion } : {}),
    ...(payload.contactPerson !== undefined ? { contact_person: payload.contactPerson } : {}),
    ...(payload.designation !== undefined ? { designation: payload.designation } : {}),
    ...(payload.workEmail !== undefined ? { work_email: payload.workEmail } : {}),
    ...(payload.phoneNumber !== undefined ? { phone_number: payload.phoneNumber } : {}),
    ...(payload.alternateEmail !== undefined ? { alternate_email: payload.alternateEmail } : {}),
    ...(payload.alternatePhone !== undefined ? { alternate_phone: payload.alternatePhone } : {}),
    ...(payload.techTagRequirement !== undefined ? { tech_tag_requirement: payload.techTagRequirement } : {}),
    ...(payload.inquirySource !== undefined ? { inquiry_source: payload.inquirySource } : {}),
    ...(payload.pipelineStage !== undefined ? { pipeline_stage: payload.pipelineStage } : {}),
    ...(payload.opportunityStatus !== undefined ? { opportunity_status: payload.opportunityStatus } : {}),
    ...(payload.estimationDueDate !== undefined ? { estimation_due_date: payload.estimationDueDate } : {}),
    ...(payload.expectedStartDate !== undefined ? { expected_start_date: payload.expectedStartDate } : {}),
    ...(payload.projectOverviewRequirements !== undefined ? { project_overview_requirements: payload.projectOverviewRequirements } : {}),
    ...(payload.budgetRange !== undefined ? { budget_range: payload.budgetRange } : {}),
    ...(payload.estimatedValue !== undefined ? { estimated_value: payload.estimatedValue !== null ? Number(payload.estimatedValue) : null } : {}),
    ...(payload.timeline !== undefined ? { timeline: payload.timeline } : {}),
    ...(payload.priorityLevel !== undefined ? { priority_level: payload.priorityLevel } : {}),
    ...(payload.probability !== undefined ? { probability: payload.probability } : {}),
    ...(payload.accountOwner !== undefined ? { account_owner: payload.accountOwner } : {}),
    ...(payload.salesManager !== undefined ? { sales_manager: payload.salesManager } : {}),
    ...(payload.technicalLead !== undefined ? { technical_lead: payload.technicalLead } : {}),
    ...(payload.preferredCommunication !== undefined ? { preferred_communication: payload.preferredCommunication } : {}),
    ...(payload.attachmentUrl !== undefined ? { attachment_url: payload.attachmentUrl } : {}),
    ...(payload.internalNotes !== undefined ? { internal_notes: payload.internalNotes } : {}),
    updated_at: new Date().toISOString(),
  };

  let result = await supabase.from('inquiries').update(updateData).eq('id', inquiryId).eq('tenant_id', tenantId).select('*').single();
  
  if (result.error) {
    // Safe fallback if database columns do not exist
    let existingFallback: Record<string, any> = {};
    if (existing.internal_notes && existing.internal_notes.startsWith('{') && existing.internal_notes.endsWith('}')) {
      try {
        existingFallback = JSON.parse(existing.internal_notes);
      } catch (e) {}
    }

    const mergedNotes = JSON.stringify({
      companyName: payload.companyName !== undefined ? payload.companyName : existingFallback.companyName,
      website: payload.website !== undefined ? payload.website : existingFallback.website,
      industry: payload.industry !== undefined ? payload.industry : existingFallback.industry,
      companySize: payload.companySize !== undefined ? payload.companySize : existingFallback.companySize,
      countryRegion: payload.countryRegion !== undefined ? payload.countryRegion : existingFallback.countryRegion,
      contactPerson: payload.contactPerson !== undefined ? payload.contactPerson : existingFallback.contactPerson,
      designation: payload.designation !== undefined ? payload.designation : existingFallback.designation,
      workEmail: payload.workEmail !== undefined ? payload.workEmail : existingFallback.workEmail,
      phoneNumber: payload.phoneNumber !== undefined ? payload.phoneNumber : existingFallback.phoneNumber,
      alternateEmail: payload.alternateEmail !== undefined ? payload.alternateEmail : existingFallback.alternateEmail,
      alternatePhone: payload.alternatePhone !== undefined ? payload.alternatePhone : existingFallback.alternatePhone,
      techTagRequirement: payload.techTagRequirement !== undefined ? payload.techTagRequirement : existingFallback.techTagRequirement,
      inquirySource: payload.inquirySource !== undefined ? payload.inquirySource : existingFallback.inquirySource,
      pipelineStage: payload.pipelineStage !== undefined ? payload.pipelineStage : existingFallback.pipelineStage,
      opportunityStatus: payload.opportunityStatus !== undefined ? payload.opportunityStatus : existingFallback.opportunityStatus,
      estimationDueDate: payload.estimationDueDate !== undefined ? payload.estimationDueDate : existingFallback.estimationDueDate,
      expectedStartDate: payload.expectedStartDate !== undefined ? payload.expectedStartDate : existingFallback.expectedStartDate,
      projectOverviewRequirements: payload.projectOverviewRequirements !== undefined ? payload.projectOverviewRequirements : existingFallback.projectOverviewRequirements,
      budgetRange: payload.budgetRange !== undefined ? payload.budgetRange : existingFallback.budgetRange,
      estimatedValue: payload.estimatedValue !== undefined ? payload.estimatedValue : existingFallback.estimatedValue,
      timeline: payload.timeline !== undefined ? payload.timeline : existingFallback.timeline,
      priorityLevel: payload.priorityLevel !== undefined ? payload.priorityLevel : existingFallback.priorityLevel,
      probability: payload.probability !== undefined ? payload.probability : existingFallback.probability,
      accountOwner: payload.accountOwner !== undefined ? payload.accountOwner : existingFallback.accountOwner,
      salesManager: payload.salesManager !== undefined ? payload.salesManager : existingFallback.salesManager,
      technicalLead: payload.technicalLead !== undefined ? payload.technicalLead : existingFallback.technicalLead,
      preferredCommunication: payload.preferredCommunication !== undefined ? payload.preferredCommunication : existingFallback.preferredCommunication,
      attachmentUrl: payload.attachmentUrl !== undefined ? payload.attachmentUrl : existingFallback.attachmentUrl,
      _internalNotesText: payload.internalNotes !== undefined ? payload.internalNotes : existingFallback._internalNotesText,
    });

    const safeUpdateData = {
      ...(payload.aliasName !== undefined ? { alias_name: payload.aliasName } : {}),
      ...(payload.tag !== undefined ? { tag: payload.tag } : {}),
      ...(payload.status !== undefined ? { status: payload.status } : {}),
      ...(payload.dueDate !== undefined ? { due_date: payload.dueDate } : {}),
      ...(payload.appStatus !== undefined ? { app_status: payload.appStatus } : {}),
      ...(payload.isFavourite !== undefined ? { is_favourite: payload.isFavourite } : {}),
      internal_notes: mergedNotes,
      updated_at: new Date().toISOString(),
    };

    result = await supabase.from('inquiries').update(safeUpdateData).eq('id', inquiryId).eq('tenant_id', tenantId).select('*').single();
  }

  if (result.error || !result.data) throw result.error ?? new Error('Failed to update inquiry');
  const userMap = await buildLegacyUserIdMap(accessToken, [String(result.data.created_by)].filter(Boolean), tenantId);
  return apiSuccess(normalizeSupabaseInquiryRow(result.data, userMap), 'Inquiry updated successfully');
}, { requireAuth: true, roles: ['Employee'] });

export const DELETE = withApiHandler(async (request, context) => {
  const inquiryId = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(inquiryId) || inquiryId <= 0) {
    throw new BadRequestError('Valid inquiry id is required');
  }

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');
  const supabase = getAdminRouteSupabase();
  const { data: existing } = await supabase
    .from('inquiries')
    .select('*')
    .eq('id', inquiryId)
    .eq('tenant_id', tenantId)
    .single();
  if (!existing) throw new NotFoundError('Inquiry not found');
  const { data, error } = await supabase.from('inquiries').update({
    app_status: 'close',
    updated_at: new Date().toISOString(),
  })
  .eq('id', inquiryId)
  .eq('tenant_id', tenantId)
  .select('*')
  .single();
  if (error || !data) throw error ?? new Error('Failed to close inquiry');
  const userMap = await buildLegacyUserIdMap(accessToken, [String(data.created_by)].filter(Boolean), tenantId);
  return apiSuccess(normalizeSupabaseInquiryRow(data, userMap), 'Inquiry closed successfully');
}, { requireAuth: true, roles: ['Employee'] });
