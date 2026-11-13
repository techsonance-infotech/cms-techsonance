import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase, resolveActorUuid } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const supabase = getAdminRouteSupabase();
  const creatorUuid = await resolveActorUuid(context, supabase);

  let { data: requisitions, error } = await supabase
    .from('job_requisitions')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Insert seed job requisitions if empty
  if (!requisitions || requisitions.length === 0) {
    const seeds = [
      {
        tenant_id: tenantId,
        title: 'Senior Software Engineer (Next.js & Go)',
        department: 'Engineering',
        location: 'Surat (Onsite)',
        employment_type: 'Full-time',
        experience_level: 'Senior',
        status: 'Open',
        salary_range_min: 1200000.00,
        salary_range_max: 1800000.00,
        description: 'We are seeking a senior full-stack developer to construct low-latency Next.js portals and microservices.',
        requirements: '5+ years experience in React/Next.js, Tailwind CSS, PostgreSQL, and Go web services.',
        created_by: creatorUuid
      },
      {
        tenant_id: tenantId,
        title: 'Lead DevOps Engineer (Kubernetes & AWS)',
        department: 'Operations',
        location: 'Remote',
        employment_type: 'Full-time',
        experience_level: 'Executive',
        status: 'Open',
        salary_range_min: 1600000.00,
        salary_range_max: 2400000.00,
        description: 'Construct scalable multi-tenant infrastructure and monitor microservices performance metrics.',
        requirements: 'Docker, Kubernetes, AWS EKS, Terraform, and CI/CD setup.',
        created_by: creatorUuid
      },
      {
        tenant_id: tenantId,
        title: 'UI/UX Designer',
        department: 'Product',
        location: 'Surat (Onsite)',
        employment_type: 'Full-time',
        experience_level: 'Mid',
        status: 'Open',
        salary_range_min: 600000.00,
        salary_range_max: 900000.00,
        description: 'Design premium layouts and responsive components for our HRMS application pages.',
        requirements: 'Figma, prototyping, interaction patterns, design system token workflows.',
        created_by: creatorUuid
      }
    ];

    const { data: inserted, error: insertErr } = await supabase
      .from('job_requisitions')
      .insert(seeds)
      .select('*');

    if (!insertErr && inserted) {
      requisitions = inserted;
    }
  }

  return NextResponse.json({ success: true, data: requisitions });
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const body = await request.json();
  const { title, department, location, employmentType, experienceLevel, status, description, requirements, salaryRangeMin, salaryRangeMax } = body;

  if (!title || !department || !location) {
    throw new BadRequestError('Missing title, department, or location');
  }

  const supabase = getAdminRouteSupabase();
  const creatorUuid = await resolveActorUuid(context, supabase);

  const { data, error } = await supabase
    .from('job_requisitions')
    .insert({
      tenant_id: tenantId,
      title,
      department,
      location,
      employment_type: employmentType || 'Full-time',
      experience_level: experienceLevel || 'Mid',
      status: status || 'Draft',
      description,
      requirements,
      salary_range_min: salaryRangeMin || 0,
      salary_range_max: salaryRangeMax || 0,
      created_by: creatorUuid
    })
    .select('*')
    .single();

  if (error) throw error;
  return NextResponse.json({ success: true, data });
}, { requireAuth: true, roles: ['Employee'] });
