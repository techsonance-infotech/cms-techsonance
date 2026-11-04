import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase, resolveActorUuid } from '@/server/supabase/route-helpers';
import { apiSuccess } from '@/server/http/response';

export const DEMO_THREADS = [
  {
    id: 'demo-1',
    name: 'Sarah Chen',
    role: 'VP of Product',
    company: 'BrightSun Group',
    channel: 'WhatsApp',
    avatar: '',
    lastMessage: "Hi Alex, I've reviewed the proposal. Terms look great, let's connect tomorrow.",
    time: '10:30 AM',
    activeDeal: true,
    health: 95,
    dealValue: '₹4,50,000',
    dealStage: 'Proposal',
    dealProgress: 70,
    activity: [
      { title: 'Inquiry Created', time: 'Yesterday', type: 'doc' },
      { title: 'Proposal Sent', time: 'Today', type: 'mail' }
    ],
    messages: [
      {
        id: 'msg-1',
        sender: 'contact',
        text: 'Hello, we are interested in expanding our SaaS modules and require a custom integration quote.',
        time: 'Yesterday, 04:15 PM'
      },
      {
        id: 'msg-2',
        sender: 'user',
        text: 'Hi Sarah! Happy to assist. I have attached our enterprise architecture overview and draft commercial tier.',
        time: 'Yesterday, 05:00 PM'
      },
      {
        id: 'msg-3',
        sender: 'contact',
        text: "Hi Alex, I've reviewed the proposal. Terms look great, let's connect tomorrow.",
        time: '10:30 AM'
      }
    ]
  },
  {
    id: 'demo-2',
    name: 'Marcus Wright',
    role: 'Procurement Specialist',
    company: 'Strategic Systems Inc',
    channel: 'Email',
    avatar: '',
    lastMessage: "Roadmap details look good. I'll share it with the team.",
    time: '09:15 AM',
    activeDeal: true,
    health: 85,
    dealValue: '₹8,20,000',
    dealStage: 'Negotiation',
    dealProgress: 85,
    activity: [
      { title: 'Initial Contact', time: 'Oct 28', type: 'mail' }
    ],
    messages: [
      {
        id: 'msg-21',
        sender: 'contact',
        text: 'Can you provide the multi-year SLA terms and ISO compliance documentation?',
        time: 'Oct 28, 11:20 AM'
      },
      {
        id: 'msg-22',
        sender: 'user',
        text: 'Certainly Marcus. Sending over the security whitepaper and SLA agreement now.',
        time: 'Oct 29, 02:45 PM'
      },
      {
        id: 'msg-23',
        sender: 'contact',
        text: "Roadmap details look good. I'll share it with the team.",
        time: '09:15 AM'
      }
    ]
  },
  {
    id: 'demo-3',
    name: 'Janet Lee',
    role: 'Tech Lead',
    company: 'Nova Softwares',
    channel: 'SMS',
    avatar: '',
    lastMessage: 'Arrived at the project site. Talk soon.',
    time: 'Yesterday',
    activeDeal: true,
    health: 65,
    dealValue: '₹1,20,000',
    dealStage: 'Qualified',
    dealProgress: 50,
    activity: [
      { title: 'SMS Inbound Lead', time: 'Oct 30', type: 'phone' }
    ],
    messages: [
      {
        id: 'msg-31',
        sender: 'contact',
        text: 'Checking if your portal supports OAuth 2.0 and SAML SSO out of the box?',
        time: 'Oct 30, 09:10 AM'
      },
      {
        id: 'msg-32',
        sender: 'user',
        text: 'Yes Janet, both OAuth 2.0 and SAML SSO are supported natively.',
        time: 'Oct 30, 09:30 AM'
      },
      {
        id: 'msg-33',
        sender: 'contact',
        text: 'Arrived at the project site. Talk soon.',
        time: 'Yesterday, 03:20 PM'
      }
    ]
  }
];

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const supabase = getAdminRouteSupabase();
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const actorUuid = await resolveActorUuid(context, supabase);
  const validActorUuid = (actorUuid && UUID_REGEX.test(actorUuid)) ? actorUuid : null;

  // Fetch inquiries (leads/deals)
  let inquiries: any[] = [];
  try {
    const { data: inqData, error: inqErr } = await supabase
      .from('inquiries')
      .select('*')
      .eq('tenant_id', tenantId);

    if (!inqErr && inqData) inquiries = inqData;
  } catch (err) {
    console.warn('Inquiries query warning:', err);
  }

  // If empty and valid user UUID exists, attempt DB seed
  if (inquiries.length === 0 && validActorUuid) {
    try {
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
          created_by: validActorUuid
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
          created_by: validActorUuid
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
          created_by: validActorUuid
        }
      ];

      const { data: inserted, error: insertErr } = await supabase
        .from('inquiries')
        .insert(seedData)
        .select('*');

      if (!insertErr && inserted && inserted.length > 0) {
        inquiries = inserted;
        
        // Seed initial messages/feeds for these inquiries
        const feedData = [
          {
            tenant_id: tenantId,
            inquiry_id: inserted[0].id,
            commented_by: validActorUuid,
            technology: 'CRM',
            description: "Hi Alex, I've reviewed the proposal. Terms look great, let's connect tomorrow."
          },
          {
            tenant_id: tenantId,
            inquiry_id: inserted[1].id,
            commented_by: validActorUuid,
            technology: 'CRM',
            description: "Roadmap details look good. I'll share it with the team."
          },
          {
            tenant_id: tenantId,
            inquiry_id: inserted[2].id,
            commented_by: validActorUuid,
            technology: 'CRM',
            description: "Arrived at the project site. Talk soon."
          }
        ];

        await supabase.from('inquiry_feeds').insert(feedData);
      }
    } catch (cleanErr) {
      console.warn('Inquiries seed fallback info:', cleanErr);
    }
  }

  // Fetch inquiry feeds for comments
  let feeds: any[] = [];
  try {
    const { data: feedsData } = await supabase
      .from('inquiry_feeds')
      .select('*')
      .eq('tenant_id', tenantId);
    if (feedsData) feeds = feedsData;
  } catch {}

  const feedsMap = new Map<string, any[]>();
  feeds.forEach((f: any) => {
    if (f.inquiry_id) {
      const key = f.inquiry_id.toString();
      if (!feedsMap.has(key)) feedsMap.set(key, []);
      feedsMap.get(key)!.push(f);
    }
  });

  let threads = (inquiries || []).map((inq: any) => {
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

  // Graceful fallback to rich interactive demo threads if database has 0 records
  if (threads.length === 0) {
    threads = DEMO_THREADS;
  }

  return apiSuccess(threads);
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const { inquiryId, text } = await request.json();
  if (!inquiryId || !text) throw new BadRequestError('inquiryId and text are required');

  const supabase = getAdminRouteSupabase();
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const actorUuid = await resolveActorUuid(context, supabase);
  const validActorUuid = (actorUuid && UUID_REGEX.test(actorUuid)) ? actorUuid : null;

  let insertedFeed: any = null;
  const numInqId = Number(inquiryId);
  if (!isNaN(numInqId) && validActorUuid) {
    try {
      const { data, error } = await supabase
        .from('inquiry_feeds')
        .insert({
          tenant_id: tenantId,
          inquiry_id: numInqId,
          commented_by: validActorUuid,
          description: text,
          technology: 'CRM'
        })
        .select('*')
        .single();

      if (!error && data) insertedFeed = data;
    } catch (err) {
      console.warn('inquiry_feeds insert err:', err);
    }
  }

  return apiSuccess(insertedFeed || {
    id: `msg-${Date.now()}`,
    tenant_id: tenantId,
    inquiry_id: inquiryId,
    description: text,
    created_at: new Date().toISOString()
  });
}, { requireAuth: true, roles: ['Employee'] });
