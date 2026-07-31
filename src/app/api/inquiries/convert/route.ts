import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, NotFoundError } from '@/server/http/errors';
import { apiSuccess } from '@/server/http/response';
import { getCurrentSupabaseActor, getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const POST = withApiHandler(async (request, context) => {
  const inquiryId = Number(new URL(request.url).searchParams.get('inquiryId'));
  if (!Number.isInteger(inquiryId) || inquiryId <= 0) {
    throw new BadRequestError('Valid inquiryId parameter is required');
  }

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');
  
  const actor = await getCurrentSupabaseActor(accessToken);
  const supabase = getAdminRouteSupabase();

  // Retrieve inquiry
  const { data: inquiry, error: getErr } = await supabase
    .from('inquiries')
    .select('*')
    .eq('id', inquiryId)
    .eq('tenant_id', tenantId)
    .single();

  if (getErr || !inquiry) throw new NotFoundError('Inquiry not found');

  // Try parsing fallback JSON fields if saved inside internal_notes
  let fallback: Record<string, any> = {};
  if (typeof inquiry.internal_notes === 'string' && inquiry.internal_notes.startsWith('{') && inquiry.internal_notes.endsWith('}')) {
    try {
      fallback = JSON.parse(inquiry.internal_notes);
    } catch (e) {}
  }

  const companyName = inquiry.company_name || fallback.companyName || inquiry.alias_name;
  const contactPerson = inquiry.contact_person || fallback.contactPerson || 'Unassigned Contact';
  const workEmail = inquiry.work_email || fallback.workEmail || 'unassigned@email.com';
  const phoneNumber = inquiry.phone_number || fallback.phoneNumber || null;
  const address = inquiry.address || fallback.address || null;
  const industry = inquiry.industry || fallback.industry || null;
  const website = inquiry.website || fallback.website || null;
  const companySize = inquiry.company_size || fallback.companySize || null;
  const designation = inquiry.designation || fallback.designation || null;
  const leadSource = inquiry.inquiry_source || fallback.inquirySource || null;
  const accountOwner = inquiry.account_owner || fallback.accountOwner || null;
  const interestedServices = inquiry.tech_tag_requirement || fallback.techTagRequirement || null;
  const priority = inquiry.priority_level || fallback.priorityLevel || 'Medium';
  const estimatedBudget = inquiry.estimated_value !== null ? String(inquiry.estimated_value) : (fallback.estimatedValue !== null ? String(fallback.estimatedValue) : null);
  const expectedStartDate = inquiry.expected_start_date || fallback.expectedStartDate || null;
  
  // Format Address block: City, State, Country combo
  const city = inquiry.city || fallback.city || null;
  const state = inquiry.state || fallback.state || null;
  const country = inquiry.country || fallback.country || null;
  const postalCode = inquiry.postalCode || fallback.postalCode || null;

  const now = new Date().toISOString();

  // Insert client into CRM clients registry
  const clientPayload: Record<string, any> = {
    tenant_id: tenantId,
    company_name: companyName,
    contact_person: contactPerson,
    email: workEmail,
    phone: phoneNumber,
    address: address,
    industry: industry,
    status: 'active',
    notes: inquiry.project_overview_requirements || fallback.projectOverviewRequirements || 'Converted from inquiry opportunity.',
    website: website,
    company_size: companySize,
    company_email: workEmail,
    company_phone: phoneNumber,
    designation: designation,
    lead_source: leadSource,
    account_owner: accountOwner,
    interested_services: interestedServices,
    priority: priority,
    estimated_budget: estimatedBudget,
    expected_start_date: expectedStartDate,
    currency: 'INR',
    payment_terms: 'Net 30',
    onboarding_step: 1,
    city: city,
    state: state,
    country: country,
    postal_code: postalCode,
    created_at: now,
    updated_at: now,
  };

  let clientResult = await supabase.from('clients').insert(clientPayload).select('*').single();
  
  if (clientResult.error) {
    // Fail-safe fallback if clients columns are not fully migrated
    const fallbackClientNotes = JSON.stringify({
      website: website,
      companySize: companySize,
      companyEmail: workEmail,
      companyPhone: phoneNumber,
      designation: designation,
      leadSource: leadSource,
      accountOwner: accountOwner,
      interestedServices: interestedServices,
      priority: priority,
      estimatedBudget: estimatedBudget,
      expectedStartDate: expectedStartDate,
      currency: 'INR',
      paymentTerms: 'Net 30',
      onboardingStep: 1,
      city: city,
      state: state,
      country: country,
      postalCode: postalCode,
      _notesText: clientPayload.notes,
    });

    const safeClientPayload = {
      tenant_id: tenantId,
      company_name: companyName,
      contact_person: contactPerson,
      email: workEmail,
      phone: phoneNumber,
      address: address,
      industry: industry,
      status: 'active',
      notes: fallbackClientNotes,
      created_at: now,
      updated_at: now,
    };
    
    clientResult = await supabase.from('clients').insert(safeClientPayload).select('*').single();
  }

  if (clientResult.error || !clientResult.data) {
    throw clientResult.error ?? new Error('Failed to create client record from conversion');
  }

  const clientData = clientResult.data;

  // Link any attachments from inquiry file metadata
  if (inquiry.attachment_url) {
    await supabase.from('file_metadata').insert({
      tenant_id: tenantId,
      module_name: 'clients',
      entity_type: 'contract',
      entity_id: String(clientData.id),
      file_name: 'Inquiry Attachment Opportunity',
      secure_url: inquiry.attachment_url,
      mime_type: 'application/octet-stream',
      size_bytes: 0,
      created_by: actor.authUserId,
      uploaded_at: now,
    });
  }

  // Update original inquiry status to hired/close
  await supabase
    .from('inquiries')
    .update({
      status: 'hired',
      app_status: 'close',
      updated_at: now,
    })
    .eq('id', inquiryId)
    .eq('tenant_id', tenantId);

  return apiSuccess({ clientId: Number(clientData.id) }, 'Opportunity converted to active Client successfully');
}, { requireAuth: true, roles: ['Employee'] });
