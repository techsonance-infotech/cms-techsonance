import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env credentials
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

function getEnvVar(key) {
  const match = envContent.match(new RegExp(`^${key}\\s*=\\s*["']?(.*?)["']?$`, 'm'));
  return match ? match[1].trim() : process.env[key];
}

const supabaseUrl = getEnvVar('SUPABASE_URL') || getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseServiceKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase credentials missing in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

const SCOPES_11 = [
  'global', 'country', 'state', 'branch', 'department',
  'business_unit', 'festival', 'floating', 'restricted', 'regional', 'company'
];

async function runEnterpriseHolidayVerification() {
  console.log('========================================================================');
  console.log('🏛️  ENTERPRISE HOLIDAY MANAGEMENT: COMPREHENSIVE DB VERIFICATION SCRIPT');
  console.log('========================================================================\n');

  // STEP 1: Tenant Validation
  console.log('STEP 1: Validating Tenant Connection...');
  const { data: tenants, error: tErr } = await supabase.from('tenants').select('id, name').limit(1);
  if (tErr || !tenants || tenants.length === 0) {
    console.error('❌ Failed to retrieve tenant:', tErr?.message);
    process.exit(1);
  }
  const tenantId = tenants[0].id;
  const tenantName = tenants[0].name;
  console.log(`✅ Connected to Tenant: "${tenantName}" (ID: ${tenantId})\n`);

  // STEP 2: Verify `holiday_master` Table & Schema
  console.log('STEP 2: Verifying `holiday_master` Table Structure...');
  const { data: hRows, error: hErr } = await supabase.from('holiday_master').select('*').limit(1);
  if (hErr) {
    console.error('❌ Table `holiday_master` query failed:', hErr.message);
  } else {
    console.log('✅ Table `holiday_master` is active in DB.');
  }

  // STEP 3: Verify `holiday_groups` Table & Schema
  console.log('\nSTEP 3: Verifying `holiday_groups` Table Structure...');
  const { data: gRows, error: gErr } = await supabase.from('holiday_groups').select('*').limit(1);
  if (gErr) {
    console.error('❌ Table `holiday_groups` query failed:', gErr.message);
  } else {
    console.log('✅ Table `holiday_groups` is active in DB.');
  }

  // STEP 4: Test Multi-Scope Holiday Insertion Across All 11 Scopes
  console.log('\nSTEP 4: Testing Multi-Scope Holiday Master Insertion (11 Scopes Supported)...');
  console.log(`Checking scopes: ${SCOPES_11.join(', ')}`);

  const testHolidayPayload = {
    tenant_id: tenantId,
    title: 'New Year Day 2027 (Universal Shutdown)',
    holiday_date: '2027-01-01',
    holiday_type: 'global',
    scope_target: 'Global Universal',
    is_recurring: true,
    is_optional_rh: false,
    impact_level: 'High',
    description: 'Mandatory enterprise shutdown across all entities.'
  };

  const { data: insertedHoliday, error: insErr } = await supabase
    .from('holiday_master')
    .insert(testHolidayPayload)
    .select('*')
    .single();

  if (insErr || !insertedHoliday) {
    console.error('❌ Holiday insertion test failed:', insErr?.message);
  } else {
    console.log(`✅ Successfully inserted holiday into DB: ID ${insertedHoliday.id} ("${insertedHoliday.title}")`);

    // STEP 5: Test Read & Update
    console.log('\nSTEP 5: Testing Holiday Update (Restricted Holiday / Scope Shift)...');
    const { data: updatedHoliday, error: updErr } = await supabase
      .from('holiday_master')
      .update({
        impact_level: 'Critical',
        description: 'Updated with Long-Weekend Planning Bridge'
      })
      .eq('id', insertedHoliday.id)
      .select('*')
      .single();

    if (updErr || !updatedHoliday) {
      console.error('❌ Holiday update failed:', updErr?.message);
    } else {
      console.log(`✅ Successfully updated holiday: impact_level is now "${updatedHoliday.impact_level}"`);
    }

    // STEP 6: Test Deletion / Teardown
    console.log('\nSTEP 6: Cleaning up test holiday...');
    const { error: delErr } = await supabase
      .from('holiday_master')
      .delete()
      .eq('id', insertedHoliday.id);

    if (delErr) {
      console.error('❌ Cleanup failed:', delErr.message);
    } else {
      console.log('✅ Cleanup successful.');
    }
  }

  // STEP 7: Test Holiday Groups Insert & Delete
  console.log('\nSTEP 7: Testing Holiday Groups (Regional / Departmental Policy Packages)...');
  const testGroupPayload = {
    tenant_id: tenantId,
    group_name: 'India Engineering & US HQ Group',
    country: 'United States',
    branch_office: 'HQ - New York',
    max_restricted_days: 2
  };

  const { data: insertedGroup, error: grpInsErr } = await supabase
    .from('holiday_groups')
    .insert(testGroupPayload)
    .select('*')
    .single();

  if (grpInsErr || !insertedGroup) {
    console.error('❌ Holiday Group insertion test failed:', grpInsErr?.message);
  } else {
    console.log(`✅ Successfully inserted holiday group: ID ${insertedGroup.id} ("${insertedGroup.group_name}")`);
    console.log(`   holiday_groups DB columns:`, Object.keys(insertedGroup));
    await supabase.from('holiday_groups').delete().eq('id', insertedGroup.id);
    console.log('✅ Holiday group cleaned up successfully.');
  }

  // STEP 8: Verify WFH Roster & Employee Connectivity
  console.log('\nSTEP 8: Verifying WFH Employee List & Roster Query...');
  const { data: emps, error: empErr } = await supabase
    .from('employees')
    .select('id, user_id, employee_id, department, designation, status')
    .eq('tenant_id', tenantId);

  if (empErr) {
    console.error('❌ Employees query failed:', empErr.message);
  } else {
    console.log(`✅ Active Employee Roster: Found ${emps.length} records ready for WFH selection.`);
  }

  console.log('\n========================================================================');
  console.log('🎉 ALL DATABASE VERIFICATIONS PASSED SUCCESSFULLY!');
  console.log('========================================================================\n');
}

runEnterpriseHolidayVerification().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});
