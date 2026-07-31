import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { apiSuccess } from '@/server/http/response';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const supabase = getAdminRouteSupabase();

  // Fetch inquiries (leads/deals)
  let { data: inquiries, error: inqErr } = await supabase
    .from('inquiries')
    .select('*')
    .eq('tenant_id', tenantId);

  if (inqErr) throw inqErr;

  // If empty, insert seed values with full enterprise CRM columns to prevent empty state in demo
  if (!inquiries || inquiries.length === 0) {
    const seedData = [
      {
        tenant_id: tenantId,
        alias_name: 'Sarah Chen',
        contact_person: 'Sarah Chen',
        designation: 'VP of Product',
        company_name: 'BrightSun Group',
        inquiry_source: 'WhatsApp',
        tag: 'WhatsApp',
        status: 'Proposal',
        pipeline_stage: 'Proposal',
        estimated_value: 450000,
        priority_level: 'High',
        app_status: 'open',
        is_favourite: true,
        created_by: context.auth!.user.id
      },
      {
        tenant_id: tenantId,
        alias_name: 'Marcus Wright',
        contact_person: 'Marcus Wright',
        designation: 'Procurement Specialist',
        company_name: 'Strategic Systems Inc',
        inquiry_source: 'Email',
        tag: 'Email',
        status: 'Negotiation',
        pipeline_stage: 'Negotiation',
        estimated_value: 820000,
        priority_level: 'Medium',
        app_status: 'open',
        is_favourite: false,
        created_by: context.auth!.user.id
      },
      {
        tenant_id: tenantId,
        alias_name: 'Janet Lee',
        contact_person: 'Janet Lee',
        designation: 'Tech Lead',
        company_name: 'Nova Softwares',
        inquiry_source: 'SMS',
        tag: 'SMS',
        status: 'Qualified',
        pipeline_stage: 'Qualified',
        estimated_value: 120000,
        priority_level: 'Low',
        app_status: 'open',
        is_favourite: false,
        created_by: context.auth!.user.id
      }
    ];

    const { data: inserted, error: insertErr } = await supabase
      .from('inquiries')
      .insert(seedData)
      .select('*');

    if (!insertErr && inserted) {
      inquiries = inserted;
      
      // Seed initial messages/feeds for these inquiries
      const feedData = [
        {
          tenant_id: tenantId,
          inquiry_id: inserted[0].id,
          commented_by: context.auth!.user.id,
          technology: 'CRM',
          description: "Hi Alex, I've reviewed the proposal. Terms look great, let's connect tomorrow."
        },
        {
          tenant_id: tenantId,
          inquiry_id: inserted[1].id,
          commented_by: context.auth!.user.id,
          technology: 'CRM',
          description: "Roadmap details look good. I'll share it with the team."
        },
        {
          tenant_id: tenantId,
          inquiry_id: inserted[2].id,
          commented_by: context.auth!.user.id,
          technology: 'CRM',
          description: "Arrived at the project site. Talk soon."
        }
      ];

      await supabase.from('inquiry_feeds').insert(feedData);
    }
  }

  // Fetch inquiry feeds for comments
  const { data: feeds } = await supabase
    .from('inquiry_feeds')
    .select('*')
    .eq('tenant_id', tenantId);

  const feedsMap = new Map<string, any[]>();
  (feeds || []).forEach((f: any) => {
    const key = f.inquiry_id.toString();
    if (!feedsMap.has(key)) feedsMap.set(key, []);
    feedsMap.get(key)!.push(f);
  });

  const threads = (inquiries || []).map((inq: any) => {
    const inqFeeds = feedsMap.get(inq.id.toString()) || [];
    const lastFeed = inqFeeds[inqFeeds.length - 1];

    const messages = inqFeeds.map((f: any, idx: number) => ({
      id: f.id.toString(),
      sender: idx % 2 === 0 ? 'contact' : 'user',
      text: f.description,
      time: new Date(f.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    // If no messages exist yet, place a default draft comment placeholder
    if (messages.length === 0) {
      messages.push({
        id: `default-${inq.id}`,
        sender: 'contact',
        text: `Inquiry registered for ${inq.alias_name}. Awaiting first follow-up.`,
        time: 'Just now'
      });
    }

    const stage = inq.status || inq.pipeline_stage || 'Lead';
    let progress = 35;
    if (stage === 'Won' || stage === 'hired') progress = 100;
    else if (stage === 'Negotiation') progress = 85;
    else if (stage === 'Proposal') progress = 70;
    else if (stage === 'Qualified') progress = 50;

    let healthScore = 75;
    if (inq.priority_level === 'High' || inq.is_favourite) healthScore = 95;
    else if (inq.priority_level === 'Low') healthScore = 55;

    return {
      id: inq.id.toString(),
      name: inq.alias_name || inq.contact_person || 'Client Representative',
      role: inq.designation || 'Representative',
      company: inq.company_name || 'Organization',
      channel: inq.inquiry_source || inq.tag || 'Email',
      avatar: '',
      lastMessage: lastFeed?.description || 'Awaiting discussion details...',
      time: lastFeed ? new Date(lastFeed.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
      activeDeal: inq.app_status === 'open' || ['lead', 'qualified', 'proposal', 'negotiation', 'follow_up'].includes(String(inq.status).toLowerCase()),
      health: healthScore,
      dealValue: inq.estimated_value ? `₹${Number(inq.estimated_value).toLocaleString()}` : '₹1,50,000',
      dealStage: stage,
      dealProgress: progress,
      activity: [
        { title: 'Inquiry Created', time: new Date(inq.created_at).toLocaleDateString(), type: 'doc' }
      ],
      messages
    };
  });

  return apiSuccess(threads);
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const { inquiryId, text } = await request.json();
  if (!inquiryId || !text) throw new BadRequestError('inquiryId and text are required');

  const supabase = getAdminRouteSupabase();

  const { data, error } = await supabase
    .from('inquiry_feeds')
    .insert({
      tenant_id: tenantId,
      inquiry_id: parseInt(inquiryId),
      commented_by: context.auth!.user.id,
      description: text,
      technology: 'CRM'
    })
    .select('*')
    .single();

  if (error) throw error;
  return apiSuccess(data);
}, { requireAuth: true, roles: ['Employee'] });
