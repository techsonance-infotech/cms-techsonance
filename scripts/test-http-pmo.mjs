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

async function testHttp(email) {
  console.log(`\n=== Testing for ${email} ===`);
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    console.log('User not found in auth.users');
    return;
  }

  // Generate a token or custom session
  // We can sign in with password or generate token via supabase admin
  // Or test signInWithPassword or generate an access token
  const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: user.email
  });
  
  console.log('User id:', user.id, 'app_metadata:', user.app_metadata);

  // Let's test with signInWithOtp or check directly
  // Or test directly with session_token
}

async function main() {
  await testHttp('hisaabkitaab.techsonance@gmail.com');
  await testHttp('connect.techsonance@gmail.com');
  await testHttp('manishkushwaha2525@gmail.com');
}

main().catch(console.error);
