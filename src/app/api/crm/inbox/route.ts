import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

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

  // If empty, insert seed values to prevent empty state in demo
  if (!inquiries || inquiries.length === 0) {
    const seedData = [
      {
        tenant_id: tenantId,
        alias_name: 'Sarah Chen',
        tag: 'WhatsApp',
        status: 'Proposal',
        app_status: 'open',
        is_favourite: true,
        created_by: context.auth!.user.id
      },
      {
        tenant_id: tenantId,
        alias_name: 'Marcus Wright',
        tag: 'Email',
        status: 'Negotiation',
        app_status: 'open',
        is_favourite: false,
        created_by: context.auth!.user.id
      },
      {
        tenant_id: tenantId,
        alias_name: 'Janet Lee',
        tag: 'SMS',
        status: 'Qualified',
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

    return {
      id: inq.id.toString(),
      name: inq.alias_name,
      role: inq.tag === 'WhatsApp' ? 'Client Representative' : 'Lead Procurement',
      company: inq.tag === 'WhatsApp' ? 'BrightSun Group' : 'Strategic Systems',
      channel: inq.tag || 'Email',
      avatar: '',
      lastMessage: lastFeed?.description || 'Awaiting discussion details...',
      time: lastFeed ? new Date(lastFeed.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
      activeDeal: inq.app_status === 'open',
      health: inq.is_favourite ? 95 : 78,
      dealValue: inq.is_favourite ? '₹4,50,000' : '₹1,20,000',
      dealStage: inq.status || 'Qualified',
      dealProgress: inq.status === 'Won' ? 100 : inq.status === 'Proposal' ? 70 : 35,
      activity: [
        { title: 'Inquiry Created', time: new Date(inq.created_at).toLocaleDateString(), type: 'doc' }
      ],
      messages
    };
  });

  return NextResponse.json({ success: true, data: threads });
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
  return NextResponse.json({ success: true, data });
}, { requireAuth: true, roles: ['Employee'] });
