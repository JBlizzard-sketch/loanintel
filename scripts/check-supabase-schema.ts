#!/usr/bin/env tsx
/**
 * Check actual Supabase table columns
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('🔍 Checking Supabase Schema\n');
  
  // Check branches table columns by trying to select
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Branches table is accessible');
    console.log('Sample query worked');
  }
  
  // Try inserting a test record to see the actual error
  const testBranch = {
    branch_id: 'TEST001',
    branch_name: 'Test Branch',
    region: 'Test',
    urban_rural: 'Urban',
    staff_count: 10,
    avg_target_tier: 'A',
    latitude: -1.5,
    longitude: 36.5
  };
  
  const { error: insertError } = await supabase
    .from('branches')
    .insert([testBranch]);
  
  if (insertError) {
    console.log('\n❌ Insert error:', insertError);
  } else {
    console.log('\n✅ Test insert successful');
    // Clean up
    await supabase.from('branches').delete().eq('branch_id', 'TEST001');
  }
}

checkSchema();
