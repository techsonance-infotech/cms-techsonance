import { getSupabaseAdminClient } from './src/server/supabase/admin.js';

async function inspectTable() {
  const admin = getSupabaseAdminClient();
  const tableName = 'company_holidays';
  
  console.log(`Inspecting table: ${tableName}`);
  
  // 1. Check Max ID
  const { data: maxIdData, error: maxIdError } = await admin
    .from(tableName)
    .select('id')
    .order('id', { ascending: false })
    .limit(1);
    
  if (maxIdError) {
    console.error("Error fetching max ID:", maxIdError);
  } else {
    console.log("Max ID:", maxIdData[0]?.id || "None");
  }
  
  // 2. Check Sequence Name and Current Value via exec_sql
  const { data: seqData, error: seqError } = await admin.rpc('exec_sql', {
    query: `
      SELECT 
        pg_get_serial_sequence('public.${tableName}', 'id') as seq_name,
        last_value,
        is_called
      FROM pg_sequences
      WHERE schemaname = 'public' AND sequencename = substring(pg_get_serial_sequence('public.${tableName}', 'id') from '[^.]+$')
    `
  });
  
  if (seqError) {
    console.error("RPC Error:", seqError);
  } else {
    console.log("Sequence Data:", seqData);
  }
  
  // 3. Try a manual setval if we have a sequence name
  if (seqData && seqData[0]?.seq_name) {
    const seqName = seqData[0].seq_name;
    const { data: setvalData, error: setvalError } = await admin.rpc('exec_sql', {
      query: `SELECT setval('${seqName}', COALESCE((SELECT MAX(id) FROM public.${tableName}), 0) + 1, false)`
    });
    
    if (setvalError) {
      console.error("Setval Error:", setvalError);
    } else {
      console.log("Setval Success:", setvalData);
    }
  }
}

inspectTable();
