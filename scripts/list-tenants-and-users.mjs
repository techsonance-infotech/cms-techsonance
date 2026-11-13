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

async function main() {
  const { data: tenants, error: tErr } = await supabase
    .from('tenants')
    .select('id, name, domain, created_at');

  const { data: users, error: uErr } = await supabase
    .from('users')
    .select('id, auth_user_id, email, first_name, last_name, role, department, designation, tenant_id, status, is_active');

  const { data: authData } = await supabase.auth.admin.listUsers();

  console.log(`\n================== SUMMARY ==================`);
  console.log(`TOTAL TENANTS IN DB: ${tenants?.length || 0}`);
  tenants?.forEach((t, i) => {
    const userCount = users?.filter(u => u.tenant_id === t.id).length || 0;
    console.log(`[Tenant ${i + 1}] ID: ${t.id} | Name: "${t.name}" | Domain: ${t.domain || 'N/A'} | Users Count: ${userCount}`);
  });

  console.log(`\nTOTAL USERS IN 'public.users' TABLE: ${users?.length || 0}`);
  console.log(`TOTAL USERS IN 'auth.users' (Supabase Auth): ${authData?.users?.length || 0}`);

  console.log(`\n================== USERS BY TENANT ==================`);
  for (const t of tenants || []) {
    console.log(`\n--- Tenant: "${t.name}" (${t.id}) ---`);
    const tenantUsers = users?.filter(u => u.tenant_id === t.id) || [];
    if (tenantUsers.length === 0) {
      console.log('  (No users mapped to this tenant)');
    } else {
      tenantUsers.forEach((u, idx) => {
        console.log(`  ${idx + 1}. ${u.first_name || ''} ${u.last_name || ''} | Email: ${u.email} | Role: ${u.role} | Dept: ${u.department || 'N/A'} | Title: ${u.designation || 'N/A'} | Status: ${u.status || (u.is_active ? 'Active' : 'Inactive')} | ID: ${u.id}`);
      });
    }
  }

  // Check if any users have no tenant_id or orphaned
  const unassigned = users?.filter(u => !u.tenant_id || !tenants?.some(t => t.id === u.tenant_id)) || [];
  if (unassigned.length > 0) {
    console.log(`\n--- Unassigned / Other Tenant Users (${unassigned.length}) ---`);
    unassigned.forEach((u, idx) => {
      console.log(`  ${idx + 1}. ${u.first_name || ''} ${u.last_name || ''} | Email: ${u.email} | Role: ${u.role} | TenantID: ${u.tenant_id}`);
    });
  }

  // Check dynamic roles table
  const { data: roles } = await supabase.from('roles').select('id, name, role_key, tenant_id');
  if (roles && roles.length > 0) {
    console.log(`\n================== DYNAMIC ROLES CONFIGURED (${roles.length}) ==================`);
    const rolesByTenant = {};
    roles.forEach(r => {
      rolesByTenant[r.tenant_id] = (rolesByTenant[r.tenant_id] || 0) + 1;
    });
    console.log('Roles per tenant breakdown:', rolesByTenant);
  }
}

main().catch(console.error);
