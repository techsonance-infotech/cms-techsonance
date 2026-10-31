import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
function getEnvVar(key) {
  const match = envContent.match(new RegExp(`^${key}\\s*=\\s*["']?(.*?)["']?$`, 'm'));
  return match ? match[1].trim() : process.env[key];
}

const supabaseUrl = getEnvVar('SUPABASE_URL') || getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseServiceKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function run() {
  console.log('========================================================================');
  console.log('🏢 HR OPERATIONS & SUB-TABS: LIVE DATABASE CONNECTIVITY AUDIT');
  console.log('========================================================================\n');

  // STEP 1: Tenant Validation
  const { data: tenants, error: tErr } = await supabase.from('tenants').select('id, name').limit(1);
  if (tErr || !tenants?.length) {
    console.error('❌ Failed to retrieve tenant:', tErr?.message);
    process.exit(1);
  }
  const tenantId = tenants[0].id;
  const tenantName = tenants[0].name;
  console.log(`✅ Tenant Connected: "${tenantName}" (${tenantId})\n`);

  const results = [];

  // PAGE 1: /dashboard/hr-operations (Command Center & Overview Tab)
  console.log('--- Checking /dashboard/hr-operations (Command Center & Overview Tab) ---');
  const empRes = await supabase.from('employees').select('id, status', { count: 'exact' }).eq('tenant_id', tenantId).eq('status', 'active');
  results.push({ page: 'HR Operations Overview', tab: 'KPI: Active Headcount', status: !empRes.error ? 'CONNECTED' : 'FAILED', count: empRes.count || 0, error: empRes.error?.message });

  const todayStr = new Date().toISOString().split('T')[0];
  const attRes = await supabase.from('attendance_records').select('employee_id', { count: 'exact' }).eq('tenant_id', tenantId).eq('date', todayStr);
  results.push({ page: 'HR Operations Overview', tab: 'KPI: Present Today', status: !attRes.error ? 'CONNECTED' : 'FAILED', count: attRes.count || 0, error: attRes.error?.message });

  // PAGE 1, TAB 2: Leave & Time Off Approval Queue
  console.log('--- Checking Leave & Time Off Approval Queue Tab ---');
  const leavesRes = await supabase
    .from('leave_requests')
    .select('*, employees(id, user_id, users!employees_user_id_fkey(first_name, last_name, email))')
    .eq('tenant_id', tenantId);
  results.push({ page: 'HR Operations Approvals', tab: 'Leave Approval Queue', status: !leavesRes.error ? 'CONNECTED' : 'FAILED', count: leavesRes.data?.length || 0, error: leavesRes.error?.message });

  // PAGE 1, TAB 3: HR Helpdesk & Grievance Tickets
  console.log('--- Checking Service Desk / Helpdesk Tab ---');
  const hrTicketsRes = await supabase.from('hr_service_tickets').select('*').eq('tenant_id', tenantId);
  results.push({ page: 'HR Operations Helpdesk', tab: 'HR Service Desk Tickets', status: !hrTicketsRes.error ? 'CONNECTED' : 'FAILED', count: hrTicketsRes.data?.length || 0, error: hrTicketsRes.error?.message });

  const clientTicketsRes = await supabase.from('tickets').select('*').eq('tenant_id', tenantId);
  results.push({ page: 'HR Operations Helpdesk', tab: 'Helpdesk Tickets', status: !clientTicketsRes.error ? 'CONNECTED' : 'FAILED', count: clientTicketsRes.data?.length || 0, error: clientTicketsRes.error?.message });

  // PAGE 1, TAB 4: Corporate Hardware & Asset Registry
  console.log('--- Checking Corporate Assets Tab ---');
  const assetsRes = await supabase.from('assets').select('*, asset_categories(*)').eq('tenant_id', tenantId);
  results.push({ page: 'HR Operations Assets', tab: 'Hardware & Asset Registry', status: !assetsRes.error ? 'CONNECTED' : 'FAILED', count: assetsRes.data?.length || 0, error: assetsRes.error?.message });

  // PAGE 1: Wellness Health Score
  const wellnessRes = await supabase.from('wellness_appointments').select('*').eq('tenant_id', tenantId);
  results.push({ page: 'HR Operations Wellness', tab: 'Wellness Score & Appointments', status: !wellnessRes.error ? 'CONNECTED' : 'FAILED', count: wellnessRes.data?.length || 0, error: wellnessRes.error?.message });

  // PAGE 2: /dashboard/hr-operations/analytics (Workforce BI & HR Operations Analytics)
  console.log('\n--- Checking /dashboard/hr-operations/analytics (Workforce BI Analytics) ---');
  const usersRes = await supabase.from('users').select('id, first_name, last_name, role, email, created_at').eq('tenant_id', tenantId);
  results.push({ page: 'HR Operations Analytics', tab: 'Demographics & User Roles', status: !usersRes.error ? 'CONNECTED' : 'FAILED', count: usersRes.data?.length || 0, error: usersRes.error?.message });

  const reimbRes = await supabase.from('reimbursements').select('amount').eq('tenant_id', tenantId);
  results.push({ page: 'HR Operations Analytics', tab: 'Expense & Claims Trends', status: !reimbRes.error ? 'CONNECTED' : 'FAILED', count: reimbRes.data?.length || 0, error: reimbRes.error?.message });

  const reqRes = await supabase.from('employee_requests').select('status').eq('tenant_id', tenantId);
  results.push({ page: 'HR Operations Analytics', tab: 'Employee Requests Volume', status: !reqRes.error ? 'CONNECTED' : 'FAILED', count: reqRes.data?.length || 0, error: reqRes.error?.message });

  const clientsRes = await supabase.from('clients').select('id, company_name').eq('tenant_id', tenantId);
  results.push({ page: 'HR Operations Analytics', tab: 'Top Enterprise Clients', status: !clientsRes.error ? 'CONNECTED' : 'FAILED', count: clientsRes.data?.length || 0, error: clientsRes.error?.message });

  const projectsRes = await supabase.from('projects').select('id, name, status').eq('tenant_id', tenantId);
  results.push({ page: 'HR Operations Analytics', tab: 'Project Margins & SLA', status: !projectsRes.error ? 'CONNECTED' : 'FAILED', count: projectsRes.data?.length || 0, error: projectsRes.error?.message });

  console.log('\n========================================================================');
  console.log('📊 AUDIT SUMMARY TABLE');
  console.log('========================================================================');
  console.table(results);

  const failedCount = results.filter(r => r.status === 'FAILED').length;
  if (failedCount === 0) {
    console.log('\n✨ ALL HR OPERATIONS PAGES & TABS ARE 100% CONNECTED TO LIVE DB!');
  } else {
    console.error(`\n❌ ${failedCount} query checks failed.`);
    process.exit(1);
  }
}

run();
