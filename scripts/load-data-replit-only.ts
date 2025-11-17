#!/usr/bin/env tsx
/**
 * Replit PostgreSQL Data Loader
 * 
 * Loads CSV data from data/seed/ into Replit PostgreSQL only
 * This is a simplified version to get the app working quickly
 */

import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { db as replitDb } from '../server/db';
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
const BATCH_SIZE = 500;

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

async function insertInBatches<T>(
  data: T[],
  replitTable: any,
  tableName: string
): Promise<void> {
  const totalBatches = Math.ceil(data.length / BATCH_SIZE);
  
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    
    process.stdout.write(`\r  ⏳ Inserting ${tableName}: batch ${batchNum}/${totalBatches} (${i + batch.length}/${data.length} records)`);
    
    try {
      await replitDb.insert(replitTable).values(batch);
    } catch (error: any) {
      console.error(`\n❌ Error inserting batch ${batchNum} of ${tableName}:`, error.message);
      throw error;
    }
  }
  
  console.log(`\r  ✅ Inserted ${data.length.toLocaleString()} ${tableName} records                    `);
}

async function clearDatabase(): Promise<void> {
  console.log('\n🗑️  Clearing existing data from Replit PostgreSQL...');
  
  const tables = [
    { replit: aiCustomerFeatures, name: 'AI Customer Features' },
    { replit: fraudSignals, name: 'Fraud Signals' },
    { replit: officerPerformance, name: 'Officer Performance' },
    { replit: monthlyBranchSummary, name: 'Monthly Branch Summary' },
    { replit: dailyBranchPerformance, name: 'Daily Branch Performance' },
    { replit: repayments, name: 'Repayments' },
    { replit: loans, name: 'Loans' },
    { replit: officers, name: 'Officers' },
    { replit: customers, name: 'Customers' },
    { replit: branches, name: 'Branches' },
  ];

  for (const table of tables) {
    try {
      await replitDb.delete(table.replit);
      console.log(`  ✅ Cleared ${table.name}`);
    } catch (error: any) {
      console.log(`  ⚠️  Could not clear ${table.name}: ${error.message}`);
    }
  }
}

function parseNumeric(value: string): number {
  return value === '' ? 0 : parseFloat(value);
}

function parseInt(value: string): number {
  return value === '' ? 0 : Number.parseInt(value);
}

async function loadData(): Promise<void> {
  console.log('🚀 Replit PostgreSQL Data Loader');
  console.log('=' .repeat(60));
  console.log(`📂 Reading from: ${SEED_DIR}`);
  console.log(`🎯 Target database: Replit PostgreSQL`);
  console.log('=' .repeat(60));

  try {
    await clearDatabase();
    
    console.log('\n📥 Loading data from CSVs...\n');

    // 1. Branches
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
    await insertInBatches(branchesFormatted, branches, 'branches');

    // 2. Officers
    console.log('\n📊 Loading officers...');
    const officersData = await readCSV<any>('officers.csv');
    const officersFormatted = officersData.map(o => ({
      officerId: o.officer_id,
      name: o.name,
      branchId: o.branch_id,
      role: o.role,
    }));
    await insertInBatches(officersFormatted, officers, 'officers');

    // 3. Customers
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
    await insertInBatches(customersFormatted, customers, 'customers');

    // 4. Loans
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
    await insertInBatches(loansFormatted, loans, 'loans');

    // 5. Repayments
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
    await insertInBatches(repaymentsFormatted, repayments, 'repayments');

    // 6. Daily Branch Performance
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
    await insertInBatches(dailyPerfFormatted, dailyBranchPerformance, 'daily_branch_performance');

    // 7. Monthly Branch Summary
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
    await insertInBatches(monthlySummaryFormatted, monthlyBranchSummary, 'monthly_branch_summary');

    // 8. Officer Performance
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
    await insertInBatches(officerPerfFormatted, officerPerformance, 'officer_performance');

    // 9. Fraud Signals
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
    await insertInBatches(fraudSignalsFormatted, fraudSignals, 'fraud_signals');

    // 10. AI Customer Features
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
    await insertInBatches(aiCustomerFeaturesFormatted, aiCustomerFeatures, 'ai_customer_features');

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Data loading complete!');
    console.log('✅ All data successfully loaded into Replit PostgreSQL');
    console.log('=' .repeat(60));
    
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error during data loading:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

loadData();
