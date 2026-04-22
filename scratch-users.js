const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("Missing config", !!supabaseUrl, !!supabaseKey);
  process.exit(1);
}

const admin = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await admin
    .from('users')
    .select('*')
    .eq('legacy_user_id', 4);

  console.log("Error:", error);
  console.log("Data length:", data?.length);
  if (data?.length) {
    console.log("Data:", data[0]);
  }
}
test();
