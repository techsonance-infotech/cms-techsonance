
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing Supabase env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  const { data: employees, error: empError } = await supabase.from('employees').select('count', { count: 'exact' })
  const { data: users, error: userError } = await supabase.from('users').select('count', { count: 'exact' })
  const { data: reports, error: reportError } = await supabase.from('daily_reports').select('count', { count: 'exact' })

  console.log('Employees count:', employees)
  console.log('Users count:', users)
  console.log('Daily Reports count:', reports)
}

checkData()
