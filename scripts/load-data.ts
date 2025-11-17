#!/usr/bin/env tsx
/**
 * Dual Database Data Loader
 * 
 * Loads CSV data from data/seed/ into both:
 * 1. Replit PostgreSQL (via Drizzle ORM)
 * 2. Supabase PostgreSQL (via Supabase client)
 * 
 * Usage: 
 *   tsx scripts/load-data.ts          # Normal mode: loads data
 *   tsx scripts/load-data.ts --dry-run # Dry-run mode: validates without inserting
 */

import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { db as replitDb } from '../server/db';
import { createClient } from '@supabase/supabase-js';
import {
  customers,
  branches,
  officers,
  loans,
  repayments,
  dailyBranchPerformance,
  monthlyBranchSummary,
  officerPerformance,
  fraudSignals,
  aiCustomerFeatures
} from '../shared/schema';

const SEED_DIR = path.join(process.cwd(), 'data', 'seed');
const BATCH_SIZE = 500; // Reduced batch size to avoid memory issues with large datasets

// Check for dry-run mode
const DRY_RUN = process.argv.includes('--dry-run');

if (DRY_RUN) {
  console.log('🔍 DRY-RUN MODE ENABLED - No data will be inserted');
  console.log('   This will validate CSV parsing and data structure only\n');
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Read CSV file and parse into array of objects
 */
async function readCSV<T>(filename: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = [];
    const filePath = path.join(SEED_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      reject(new Error(`File not found: ${filePath}`));
      return;
    }

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

/**
 * Insert data in batches (or validate in dry-run mode)
 */
async function insertInBatches<T>(
  data: T[],
  replitTable: any,
  supabaseTable: string,
  tableName: string
): Promise<void> {
  const totalBatches = Math.ceil(data.length / BATCH_SIZE);
  
  if (DRY_RUN) {
    // Dry-run mode: just validate and log
    console.log(`  ✅ Validated ${data.length.toLocaleString()} ${tableName} records (dry-run, not inserted)`);
    if (data.length > 0) {
      console.log(`     Sample record:`, JSON.stringify(data[0]).substring(0, 100) + '...');
    }
    return;
  }
  
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    
    process.stdout.write(`\r  ⏳ Inserting ${tableName}: batch ${batchNum}/${totalBatches} (${i + batch.length}/${data.length} records)`);
    
    try {
      // Insert into Replit PostgreSQL (uses camelCase)
      await replitDb.insert(replitTable).values(batch);
      
      // Insert into Supabase (convert to snake_case)
      const snakeCaseBatch = batch.map(toSnakeCase);
      const { error } = await supabase
        .from(supabaseTable)
        .insert(snakeCaseBatch);
      
      if (error) {
        console.error(`\n❌ Supabase error in ${tableName}:`, error.message);
        throw error;
      }
    } catch (error: any) {
      console.error(`\n❌ Error inserting batch ${batchNum} of ${tableName}:`, error.message);
      throw error;
    }
  }
  
  console.log(`\r  ✅ Inserted ${data.length.toLocaleString()} ${tableName} records into both databases`);
}

/**
 * Clear existing data from both databases (skipped in dry-run mode)
 */
async function clearDatabases(): Promise<void> {
  if (DRY_RUN) {
    console.log('\n🔍 Skipping database clearing (dry-run mode)...');
    return;
  }
  
  console.log('\n🗑️  Clearing existing data...');
  
  const tables = [
    { replit: aiCustomerFeatures, supabase: 'ai_customer_features', name: 'AI Customer Features' },
    { replit: fraudSignals, supabase: 'fraud_signals', name: 'Fraud Signals' },
    { replit: officerPerformance, supabase: 'officer_performance', name: 'Officer Performance' },
    { replit: monthlyBranchSummary, supabase: 'monthly_branch_summary', name: 'Monthly Branch Summary' },
    { replit: dailyBranchPerformance, supabase: 'daily_branch_performance', name: 'Daily Branch Performance' },
    { replit: repayments, supabase: 'repayments', name: 'Repayments' },
    { replit: loans, supabase: 'loans', name: 'Loans' },
    { replit: officers, supabase: 'officers', name: 'Officers' },
    { replit: customers, supabase: 'customers', name: 'Customers' },
    { replit: branches, supabase: 'branches', name: 'Branches' },
  ];

  for (const table of tables) {
    try {
      // Clear Replit PostgreSQL
      await replitDb.delete(table.replit);
      
      // Clear Supabase - use different approaches based on table structure
      // For tables with 'id' column (auto-generated)
      if (['repayments', 'daily_branch_performance', 'monthly_branch_summary', 'officer_performance'].includes(table.supabase)) {
        await supabase.from(table.supabase).delete().neq('id', '');
      } else {
        // For tables with custom primary keys, delete all rows
        const { data } = await supabase.from(table.supabase).select('*').limit(1);
        if (data && data.length > 0) {
          const firstCol = Object.keys(data[0])[0];
          await supabase.from(table.supabase).delete().neq(firstCol, '____NEVER_MATCH____');
        }
      }
      
      console.log(`  ✅ Cleared ${table.name}`);
    } catch (error: any) {
      console.log(`  ⚠️  Could not clear ${table.name}: ${error.message}`);
    }
  }
}

/**
 * Parse numeric values from CSV strings
 */
function parseNumeric(value: string): number {
  return value === '' ? 0 : parseFloat(value);
}

function parseInt(value: string): number {
  return value === '' ? 0 : Number.parseInt(value);
}

/**
 * Convert camelCase to snake_case for Supabase
 */
function toSnakeCase(obj: any): any {
  const result: any = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = obj[key];
  }
  return result;
}

/**
 * Main data loading function
 */
async function loadData(): Promise<void> {
  console.log('🚀 Dual Database Data Loader');
  console.log('=' .repeat(60));
  console.log(`📂 Reading from: ${SEED_DIR}`);
  console.log(`🎯 Target databases: Replit PostgreSQL + Supabase`);
  console.log('=' .repeat(60));

  try {
    // Clear existing data
    await clearDatabases();
    
    console.log('\n📥 Loading data from CSVs...\n');

    // 1. Load Branches
    console.log('📊 Loading branches...');
    const branchesData = await readCSV<any>('branches.csv');
    const branchesFormatted = branchesData.map(b => ({
      branchId: b.branch_id,
      branchName: b.branch_name,
      region: b.region,
      urbanRural: b.urban_rural,
      staffCount: parseInt(b.staff_count),
      avgTargetTier: b.avg_target_tier,
      latitude: parseNumeric(b.latitude).toString(),
      longitude: parseNumeric(b.longitude).toString(),
    }));
    await insertInBatches(branchesFormatted, branches, 'branches', 'branches');

    // 2. Load Officers
    console.log('\n📊 Loading officers...');
    const officersData = await readCSV<any>('officers.csv');
    const officersFormatted = officersData.map(o => ({
      officerId: o.officer_id,
      name: o.name,
      branchId: o.branch_id,
      role: o.role,
    }));
    await insertInBatches(officersFormatted, officers, 'officers', 'officers');

    // 3. Load Customers
    console.log('\n📊 Loading customers...');
    const customersData = await readCSV<any>('customers.csv');
    const customersFormatted = customersData.map(c => ({
      customerId: c.customer_id,
      firstName: c.first_name,
      lastName: c.last_name,
      gender: c.gender,
      birthYear: parseInt(c.birth_year),
      age: parseInt(c.age),
      nationalId: c.national_id,
      phone: c.phone,
      primaryBranch: c.primary_branch,
      region: c.region,
      businessType: c.business_type,
      monthlyIncomeBand: c.monthly_income_band,
      historicalCycles: parseInt(c.historical_cycles),
      avgWeeklyCash: parseNumeric(c.avg_weekly_cash).toString(),
      fraudFlagInitial: parseInt(c.fraud_flag_initial),
    }));
    await insertInBatches(customersFormatted, customers, 'customers', 'customers');

    // 4. Load Loans
    console.log('\n📊 Loading loans...');
    const loansData = await readCSV<any>('loans.csv');
    const loansFormatted = loansData.map(l => ({
      loanId: l.loan_id,
      customerId: l.customer_id,
      branchId: l.branch_id,
      officerId: l.officer_id,
      disbursementDate: l.disbursement_date,
      dueDate: l.due_date,
      amount: parseNumeric(l.amount).toString(),
      tenorWeeks: parseInt(l.tenor_weeks),
      dailyInstallment: parseNumeric(l.daily_installment).toString(),
      missRate: parseNumeric(l.miss_rate),
      rescheduled: parseInt(l.rescheduled),
      defaultFlag: parseInt(l.default_flag),
      loanStatus: l.loan_status,
    }));
    await insertInBatches(loansFormatted, loans, 'loans', 'loans');

    // 5. Load Repayments (large dataset, may take time)
    console.log('\n📊 Loading repayments...');
    const repaymentsData = await readCSV<any>('repayments.csv');
    const repaymentsFormatted = repaymentsData.map(r => ({
      loanId: r.loan_id,
      customerId: r.customer_id,
      branchId: r.branch_id,
      paymentDate: r.payment_date,
      amountPaid: parseNumeric(r.amount_paid).toString(),
      status: r.status,
    }));
    await insertInBatches(repaymentsFormatted, repayments, 'repayments', 'repayments');

    // 6. Load Daily Branch Performance
    console.log('\n📊 Loading daily branch performance...');
    const dailyPerfData = await readCSV<any>('daily_branch_performance.csv');
    const dailyPerfFormatted = dailyPerfData.map(d => ({
      date: d.date,
      branchId: d.branch_id,
      region: d.region,
      recruitedToday: parseInt(d.recruited_today),
      disbursedAmountKsh: parseNumeric(d.disbursed_amount_ksh).toString(),
      dailyDuesKsh: parseNumeric(d.daily_dues_ksh).toString(),
      collectedKsh: parseNumeric(d.collected_ksh).toString(),
      missedCalls: parseInt(d.missed_calls),
      arrearsNewKsh: parseNumeric(d.arrears_new_ksh).toString(),
      parPercent: parseNumeric(d.par_percent),
      dailyTargetKsh: parseNumeric(d.daily_target_ksh).toString(),
    }));
    await insertInBatches(dailyPerfFormatted, dailyBranchPerformance, 'daily_branch_performance', 'daily_branch_performance');

    // 7. Load Monthly Branch Summary
    console.log('\n📊 Loading monthly branch summary...');
    const monthlySummaryData = await readCSV<any>('monthly_branch_summary.csv');
    const monthlySummaryFormatted = monthlySummaryData.map(m => ({
      branchId: m.branch_id,
      month: m.month,
      recruitedMonthly: parseInt(m.recruited_monthly),
      disbursedMonthlyKsh: parseNumeric(m.disbursed_monthly_ksh).toString(),
      duesMonthlyKsh: parseNumeric(m.dues_monthly_ksh).toString(),
      collectedMonthlyKsh: parseNumeric(m.collected_monthly_ksh).toString(),
      arrearsMonthlyKsh: parseNumeric(m.arrears_monthly_ksh).toString(),
      avgParPercent: parseNumeric(m.avg_par_percent),
    }));
    await insertInBatches(monthlySummaryFormatted, monthlyBranchSummary, 'monthly_branch_summary', 'monthly_branch_summary');

    // 8. Load Officer Performance
    console.log('\n📊 Loading officer performance...');
    const officerPerfData = await readCSV<any>('officer_performance.csv');
    const officerPerfFormatted = officerPerfData.map(o => ({
      officerId: o.officer_id,
      branchId: o.branch_id,
      month: o.month,
      loansHandled: parseInt(o.loans_handled),
      approvals: parseInt(o.approvals),
      arrearsRecoveredKsh: parseNumeric(o.arrears_recovered_ksh).toString(),
      fraudHits: parseInt(o.fraud_hits),
    }));
    await insertInBatches(officerPerfFormatted, officerPerformance, 'officer_performance', 'officer_performance');

    // 9. Load Fraud Signals
    console.log('\n📊 Loading fraud signals...');
    const fraudSignalsData = await readCSV<any>('fraud_signals.csv');
    const fraudSignalsFormatted = fraudSignalsData.map(f => ({
      customerId: f.customer_id,
      nationalIdMismatch: parseInt(f.national_id_mismatch),
      sharedPhoneNumber: parseInt(f.shared_phone_number),
      distanceAnomaly: parseInt(f.distance_anomaly),
      suspiciousRepaymentPattern: parseInt(f.suspicious_repayment_pattern),
      syntheticCustomerScore: parseNumeric(f.synthetic_customer_score),
    }));
    await insertInBatches(fraudSignalsFormatted, fraudSignals, 'fraud_signals', 'fraud_signals');

    // 10. Load AI Customer Features
    console.log('\n📊 Loading AI customer features...');
    const aiCustomerFeaturesData = await readCSV<any>('ai_customer_features.csv');
    const aiCustomerFeaturesFormatted = aiCustomerFeaturesData.map(a => ({
      customerId: a.customer_id,
      primaryBranch: a.primary_branch,
      avgWeeklyCash: parseNumeric(a.avg_weekly_cash).toString(),
      historicalCycles: parseInt(a.historical_cycles),
      riskScore0100: parseNumeric(a.risk_score_0_100),
      defaultProb: parseNumeric(a.default_prob),
      churnProb: parseNumeric(a.churn_prob),
      recommendedLimitKsh: parseNumeric(a.recommended_limit_ksh).toString(),
    }));
    await insertInBatches(aiCustomerFeaturesFormatted, aiCustomerFeatures, 'ai_customer_features', 'ai_customer_features');

    console.log('\n' + '='.repeat(60));
    if (DRY_RUN) {
      console.log('🎉 Dry-run validation complete!');
      console.log('✅ All CSV files parsed successfully');
      console.log('💡 Run without --dry-run flag to load data into databases');
    } else {
      console.log('🎉 Data loading complete!');
      console.log('✅ All data successfully loaded into both databases');
    }
    console.log('='.repeat(60));
    
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error during data loading:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the loader
loadData();
