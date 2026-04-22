import { getSupabaseAdminClient } from './src/server/supabase/admin.js';

async function testRpc() {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin.rpc('exec_sql', {
    query: "SELECT 1"
  });
  
  if (error) {
    console.error("RPC Error:", error);
  } else {
    console.log("RPC Success:", data);
  }
}

testRpc();
