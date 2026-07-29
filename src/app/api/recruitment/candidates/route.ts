import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const supabase = getAdminRouteSupabase();

  let { data: candidates, error } = await supabase
    .from('candidate_profiles')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Insert seed candidate profiles if empty
  if (!candidates || candidates.length === 0) {
    const seeds = [
      {
        tenant_id: tenantId,
        first_name: 'Amit',
        last_name: 'Patel',
        email: 'amit.patel@gmail.com',
        phone: '+91 99876 54321',
        resume_url: 'https://example.com/resumes/amit_patel.pdf',
        skills: ['React', 'Next.js', 'Tailwind CSS', 'TypeScript'],
        source: 'LinkedIn',
        talent_pool: 'Engineering',
        screening_score: 88,
        ai_recommendation: 'Highly skilled frontend candidate. Extensive experience building SaaS layouts, strong UI sense, matches Next.js specifications.',
        status: 'Interviewing'
      },
      {
        tenant_id: tenantId,
        first_name: 'Priyanka',
        last_name: 'Shah',
        email: 'priyanka.shah@yahoo.com',
        phone: '+91 91234 56789',
        resume_url: 'https://example.com/resumes/priyanka_shah.pdf',
        skills: ['Docker', 'AWS EKS', 'Kubernetes', 'Terraform'],
        source: 'Referral',
        talent_pool: 'Engineering',
        screening_score: 92,
        ai_recommendation: 'Exceptional DevOps engineer with prior experience scaling high-volume pipelines and multi-tenant nodes.',
        status: 'Offered'
      },
      {
        tenant_id: tenantId,
        first_name: 'Vijay',
        last_name: 'Mehta',
        email: 'vijay.mehta@outlook.com',
        phone: '+91 98989 89898',
        resume_url: 'https://example.com/resumes/vijay_mehta.pdf',
        skills: ['Figma', 'UI Design', 'Wireframing', 'Prototyping'],
        source: 'Career Portal',
        talent_pool: 'Product',
        screening_score: 74,
        ai_recommendation: 'Solid designer with detailed portfolio. Focuses on accessibility guidelines and consistent layouts.',
        status: 'Screening'
      }
    ];

    const { data: inserted, error: insertErr } = await supabase
      .from('candidate_profiles')
      .insert(seeds)
      .select('*');

    if (!insertErr && inserted) {
      candidates = inserted;
    }
  }

  return NextResponse.json({ success: true, data: candidates });
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const body = await request.json();
  const { firstName, lastName, email, phone, resumeUrl, skills, source, talentPool, screeningScore, aiRecommendation, status } = body;

  if (!firstName || !lastName || !email) {
    throw new BadRequestError('Missing firstName, lastName, or email');
  }

  const supabase = getAdminRouteSupabase();

  const { data, error } = await supabase
    .from('candidate_profiles')
    .insert({
      tenant_id: tenantId,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      resume_url: resumeUrl,
      skills: skills || [],
      source: source || 'Career Portal',
      talent_pool: talentPool || 'Engineering',
      screening_score: screeningScore || 0,
      ai_recommendation: aiRecommendation,
      status: status || 'Applied'
    })
    .select('*')
    .single();

  if (error) throw error;
  return NextResponse.json({ success: true, data });
}, { requireAuth: true, roles: ['Employee'] });
