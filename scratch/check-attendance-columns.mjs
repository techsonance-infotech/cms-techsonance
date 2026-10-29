import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const url = `${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`;

try {
  const res = await fetch(url);
  if (!res.ok) {
    console.error("HTTP error:", res.status);
    process.exit(1);
  }
  const json = await res.json();
  const definition = json.definitions?.attendance_requests;
  if (!definition) {
    console.error("Definition for attendance_requests not found in OpenAPI spec");
  } else {
    console.log("Columns of attendance_requests:");
    console.log(Object.keys(definition.properties || {}));
  }
} catch (err) {
  console.error("Fetch failed:", err);
}
