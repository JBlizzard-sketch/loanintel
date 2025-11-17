#!/usr/bin/env tsx
/**
 * Check Supabase Database Status
 * 
 * Verifies what tables exist and counts rows in each table
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const tables = [
  'branches',
  'officers',
  'customers',
  'loans',
  'repayments',
  'daily_branch_performance',
  'monthly_branch_summary',
  'officer_performance',
  'fraud_signals',
  'ai_customer_features',
  'ml_models'
];

async function checkDatabase() {
  console.log('🔍 Checking Supabase Database Status\n');
  console.log('=' .repeat(60));
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table.padEnd(30)} - Table does not exist or error: ${error.message}`);
      } else {
        console.log(`✅ ${table.padEnd(30)} - ${(count || 0).toLocaleString()} rows`);
      }
    } catch (error: any) {
      console.log(`❌ ${table.padEnd(30)} - Error: ${error.message}`);
    }
  }
  
  console.log('=' .repeat(60));
}

checkDatabase();
