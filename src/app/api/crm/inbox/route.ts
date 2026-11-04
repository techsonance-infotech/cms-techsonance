import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase, resolveActorUuid } from '@/server/supabase/route-helpers';
import { apiSuccess } from '@/server/http/response';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const supabase = getAdminRouteSupabase();

  // Purge any previously auto-seeded mock leads (Sarah Chen, Marcus Wright, Janet Lee)
  const SEED_ALIASES = ['Sarah Chen', 'Marcus Wright', 'Janet Lee'];
  try {
    const { data: seedInqs } = await supabase
      .from('inquiries')
      .select('id')
      .eq('tenant_id', tenantId)
      .in('alias_name', SEED_ALIASES);

    if (seedInqs && seedInqs.length > 0) {
      const seedIds = seedInqs.map((s: any) => s.id);
      await supabase.from('inquiry_feeds').delete().in('inquiry_id', seedIds);
      await supabase.from('inquiries').delete().in('id', seedIds);
    }
  } catch (cleanErr) {
    console.warn('Seed cleanup info:', cleanErr);
  }

  // Fetch real inquiries (leads/deals) for tenant from database
  let inquiries: any[] = [];
  try {
    const { data: inqData, error: inqErr } = await supabase
      .from('inquiries')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (!inqErr && inqData) inquiries = inqData;
  } catch (err) {
    console.warn('Inquiries query warning:', err);
  }

  // Fetch inquiry feeds for comments
  let feeds: any[] = [];
  try {
    const { data: feedsData } = await supabase
      .from('inquiry_feeds')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true });
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

  const threads = inquiries.map((inq: any) => {
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
