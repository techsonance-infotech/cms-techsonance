import { getSupabaseAdminClient } from '../src/server/supabase/admin.js';

async function addGenderColumn() {
  const admin = getSupabaseAdminClient();
  console.log("Adding gender column to employees table...");
  
  const { error } = await admin.rpc('exec_sql', {
    query: "ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other'));"
  });
  
  if (error) {
    console.error("Failed to add column:", error.message);
  } else {
    console.log("Column added successfully or already exists.");
  }
}

addGenderColumn();
