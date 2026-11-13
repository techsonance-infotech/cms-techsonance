import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 1. Read .env file to extract Supabase credentials
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

console.log('🔗 Connecting to Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function runVerification() {
  console.log('\n======================================================');
  console.log('🛡️  POLICY CONFIGURATION CENTER: DATABASE VERIFICATION');
  console.log('======================================================\n');

  // Step 1: Verify Tenants Table and retrieve tenant ID
  console.log('Step 1: Checking tenants table...');
  const { data: tenants, error: tenantErr } = await supabase
    .from('tenants')
    .select('id, name')
    .limit(5);

  if (tenantErr) {
    console.error('❌ Failed to query tenants:', tenantErr.message);
    process.exit(1);
  }

  if (!tenants || tenants.length === 0) {
    console.error('❌ No tenants found in database');
    process.exit(1);
  }

  const tenant = tenants[0];
  console.log(`✅ Connected! Active Tenant: "${tenant.name}" (${tenant.id})`);

  // Step 2: Check attendance_policies table existence & schema
  console.log('\nStep 2: Checking attendance_policies table structure and existing records...');
  const { data: existingPolicies, error: policyErr } = await supabase
    .from('attendance_policies')
    .select('*')
    .eq('tenant_id', tenant.id);

  if (policyErr) {
    console.error('❌ Table attendance_policies error:', policyErr.message);
    process.exit(1);
  }

  console.log(`✅ attendance_policies table exists! Found ${existingPolicies.length} policy record(s) for this tenant.`);
  if (existingPolicies.length > 0) {
    existingPolicies.forEach((p, idx) => {
      console.log(`   [${idx + 1}] ID: ${p.id} | Name: "${p.name}" | Default: ${p.is_default} | Std Hours: ${p.standard_hours}h | Grace: ${p.grace_period_late_minutes}m`);
    });
  } else {
    console.log('   ℹ️  No policy records exist yet for this tenant.');
  }

  // Step 3: Test INSERT - Create new Policy
  console.log('\nStep 3: Testing Policy Creation (INSERT)...');
  const testPolicyName = `Verified Enterprise Policy - ${Date.now()}`;
  const testPayload = {
    tenant_id: tenant.id,
    name: testPolicyName,
    is_default: existingPolicies.length === 0,
    standard_hours: 9.0,
    min_hours_half_day: 4.0,
    min_hours_full_day: 8.0,
    grace_period_late_minutes: 20,
    grace_period_early_exit_minutes: 15,
    is_flexible: true,
    rounding_minutes: 15,
    auto_mark_absence: true,
    unpaid_break_duration_minutes: 60,
    paid_break_duration_minutes: 15,
    overtime_eligibility: true,
    overtime_min_minutes: 30,
    overtime_rate_multiplier: 1.5,
    weekly_off_days: 'Saturday,Sunday',
    target_assignment: {
      branches: 'Headquarters, Remote Branch',
      departments: 'Engineering, Product, Operations',
      grades: 'L1, L2, L3',
      allowedDevices: ['web', 'mobile'],
      punchPairing: 'first_last',
      autoClockoutHours: '12',
      duplicateBufferSeconds: '60',
      maxLateWarnings: '3',
      versions: [
        {
          version: 1,
          effectiveDate: new Date().toISOString().split('T')[0],
          changeSummary: 'Initial policy baseline test'
        }
      ]
    }
  };

  const { data: insertedPolicy, error: insertErr } = await supabase
    .from('attendance_policies')
    .insert(testPayload)
    .select('*')
    .single();

  if (insertErr || !insertedPolicy) {
    console.error('❌ INSERT operation failed:', insertErr?.message);
    process.exit(1);
  }

  console.log('✅ INSERT succeeded!');
  console.log(`   Created Policy ID: ${insertedPolicy.id}`);
  console.log(`   Name: "${insertedPolicy.name}"`);
  console.log(`   Standard Hours: ${insertedPolicy.standard_hours}`);
  console.log(`   Grace Period Late: ${insertedPolicy.grace_period_late_minutes} min`);
  console.log(`   Is Flexible: ${insertedPolicy.is_flexible}`);
  console.log(`   Target Branches: "${insertedPolicy.target_assignment?.branches}"`);

  // Step 4: Test SELECT - Retrieve Policy by ID
  console.log('\nStep 4: Testing Policy Query by ID (SELECT)...');
  const { data: fetchedPolicy, error: fetchErr } = await supabase
    .from('attendance_policies')
    .select('*')
    .eq('id', insertedPolicy.id)
    .single();

  if (fetchErr || !fetchedPolicy) {
    console.error('❌ SELECT by ID failed:', fetchErr?.message);
    process.exit(1);
  }

  console.log('✅ SELECT verified!');
  console.log(`   Retrieved Name: "${fetchedPolicy.name}"`);
  console.log(`   Round Minutes: ${fetchedPolicy.rounding_minutes}`);
  console.log(`   Created At: ${fetchedPolicy.created_at}`);

  // Step 5: Test UPDATE - Modify Policy configuration
  console.log('\nStep 5: Testing Policy Update (UPDATE)...');
  const updatedVersions = [
    ...(fetchedPolicy.target_assignment?.versions || []),
    {
      version: 2,
      effectiveDate: new Date().toISOString().split('T')[0],
      changeSummary: 'Updated grace period and standard hours'
    }
  ];

  const { data: updatedPolicy, error: updateErr } = await supabase
    .from('attendance_policies')
    .update({
      name: `${testPolicyName} (Updated)`,
      standard_hours: 8.5,
      grace_period_late_minutes: 25,
      target_assignment: {
        ...fetchedPolicy.target_assignment,
        versions: updatedVersions
      },
      updated_at: new Date().toISOString()
    })
    .eq('id', insertedPolicy.id)
    .select('*')
    .single();

  if (updateErr || !updatedPolicy) {
    console.error('❌ UPDATE operation failed:', updateErr?.message);
    process.exit(1);
  }

  console.log('✅ UPDATE succeeded!');
  console.log(`   Updated Name: "${updatedPolicy.name}"`);
  console.log(`   Updated Standard Hours: ${updatedPolicy.standard_hours}`);
  console.log(`   Updated Grace Period Late: ${updatedPolicy.grace_period_late_minutes} min`);
  console.log(`   Version History Count: ${updatedPolicy.target_assignment?.versions?.length}`);

  // Step 6: Test DELETE (or retention if default)
  console.log('\nStep 6: Testing Policy Cleanup (DELETE)...');
  // If this was the only policy, create a permanent default first
  if (existingPolicies.length === 0) {
    console.log('   Creating permanent default company policy before deleting test policy...');
    await supabase.from('attendance_policies').insert({
      tenant_id: tenant.id,
      name: 'Standard Corporate Attendance Policy',
      is_default: true,
      standard_hours: 9.0,
      min_hours_half_day: 4.0,
      min_hours_full_day: 8.0,
      grace_period_late_minutes: 15,
      grace_period_early_exit_minutes: 15,
      is_flexible: false,
      rounding_minutes: 0,
      auto_mark_absence: true,
      unpaid_break_duration_minutes: 60,
      paid_break_duration_minutes: 0,
      overtime_eligibility: true,
      overtime_min_minutes: 30,
      overtime_rate_multiplier: 1.5,
      weekly_off_days: 'Saturday,Sunday',
      target_assignment: {
        branches: 'All Branches',
        departments: 'All Departments',
        allowedDevices: ['web', 'mobile'],
        punchPairing: 'first_last',
        autoClockoutHours: '12',
        duplicateBufferSeconds: '60',
        maxLateWarnings: '3',
        versions: [
          {
            version: 1,
            effectiveDate: new Date().toISOString().split('T')[0],
            changeSummary: 'Default corporate baseline policy'
          }
        ]
      }
    });

    // Make test policy non-default so it can be safely deleted
    await supabase.from('attendance_policies').update({ is_default: false }).eq('id', insertedPolicy.id);
  }

  const { error: deleteErr } = await supabase
    .from('attendance_policies')
    .delete()
    .eq('id', insertedPolicy.id);

  if (deleteErr) {
    console.error('❌ DELETE operation failed:', deleteErr.message);
    process.exit(1);
  }

  console.log('✅ DELETE succeeded! Temporary verification policy cleaned up.');

  // Final check: List policies in DB
  const { data: finalPolicies } = await supabase
    .from('attendance_policies')
    .select('*')
    .eq('tenant_id', tenant.id);

  console.log(`\n======================================================`);
  console.log(`🎉 VERIFICATION COMPLETE: ALL POLICY OPERATIONS CONNECTED TO LIVE DB!`);
  console.log(`   Active Policies in DB: ${finalPolicies?.length || 0}`);
  finalPolicies?.forEach((p, idx) => {
    console.log(`   [${idx + 1}] ID: ${p.id} | "${p.name}" (Default: ${p.is_default})`);
  });
  console.log(`======================================================\n`);
}

runVerification().catch(err => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
