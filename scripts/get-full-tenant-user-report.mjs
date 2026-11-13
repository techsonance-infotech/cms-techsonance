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
  const { data: tenants } = await supabase.from('tenants').select('*').order('created_at', { ascending: true });
  const { data: users } = await supabase.from('users').select('*').order('created_at', { ascending: true });
  const { data: employees } = await supabase.from('employees').select('*');
  const { data: authData } = await supabase.auth.admin.listUsers();

  const authUserMap = new Map();
  authData?.users?.forEach(u => {
    authUserMap.set(u.id, u);
    authUserMap.set(u.email?.toLowerCase(), u);
  });

  const empMap = new Map();
  employees?.forEach(e => {
    if (e.user_id) empMap.set(e.user_id, e);
  });

  const report = {
    totalTenants: tenants?.length || 0,
    totalUsers: users?.length || 0,
    tenants: tenants?.map(t => {
      const tenantUsers = users?.filter(u => u.tenant_id === t.id) || [];
      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        status: t.status,
        plan_code: t.plan_code,
        created_at: t.created_at,
        userCount: tenantUsers.length,
        users: tenantUsers.map(u => {
          const authUser = authUserMap.get(u.id) || authUserMap.get(u.email?.toLowerCase());
          const emp = empMap.get(u.id);
          return {
            id: u.id,
            email: u.email,
            name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'N/A',
            db_role: u.role,
            auth_role: authUser?.app_metadata?.role || 'N/A',
            department: emp?.department || 'N/A',
            designation: emp?.designation || 'N/A',
            status: u.is_active ? 'Active' : 'Inactive',
            last_login: u.last_login || authUser?.last_sign_in_at || 'Never'
          };
        })
      };
    })
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch(console.error);
