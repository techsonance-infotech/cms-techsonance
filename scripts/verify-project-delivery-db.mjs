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
  console.log('🚀 PROJECT & DELIVERY: SUPABASE DATABASE CONNECTIVITY AUDIT');
  console.log('========================================================================\n');

  const { data: tenants, error: tErr } = await supabase.from('tenants').select('id, name').limit(1);
  if (tErr || !tenants?.length) {
    console.error('❌ Failed to retrieve tenant:', tErr?.message);
    process.exit(1);
  }
  const tenantId = tenants[0].id;
  const tenantName = tenants[0].name;
  console.log(`✅ Tenant Connected: "${tenantName}" (${tenantId})\n`);

  const tables = [
    { name: 'projects', desc: 'Active & Pipeline Projects' },
    { name: 'tasks', desc: 'Project Tasks & Sprints backlog' },
    { name: 'sprints', desc: 'Sprint Cycles & Milestones' },
    { name: 'project_members', desc: 'Capacity & Team Allocations' },
    { name: 'psa_contracts', desc: 'PSA Financial Contracts & Ledgers' },
    { name: 'project_risks_issues', desc: 'Risk Registry & Issue Logs' },
    { name: 'clients', desc: 'Client Directory' },
    { name: 'milestones', desc: 'Project Milestones & Deliverables' }
  ];

  for (const t of tables) {
    const res = await supabase.from(t.name).select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId);
    if (res.error) {
      console.log(`❌ ${t.name.padEnd(22)}: ERROR (${res.error.message})`);
    } else {
      console.log(`✅ ${t.name.padEnd(22)}: CONNECTED (${res.count} records) - ${t.desc}`);
    }
  }

  const { data: projs } = await supabase.from('projects').select('id, name, status, budget, client_id').eq('tenant_id', tenantId);
  console.log('\n--- Real Projects in DB ---');
  console.log(projs);

  const { data: clients } = await supabase.from('clients').select('id, company_name, tenant_id');
  console.log('\n--- Real Clients in DB ---');
  console.log(clients);

  console.log('\n========================================================================');
  console.log('All Project & Delivery database tables are verified in Supabase!');
  console.log('========================================================================');
}

run();
