-- Kechita Microfinance Group (KMG) - Operational Intelligence Platform
-- Supabase-Compatible Database Schema
-- This schema matches the Drizzle ORM schema in shared/schema.ts
-- Run this SQL in Supabase SQL Editor to create the same database structure

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. CUSTOMERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS customers (
  customer_id VARCHAR(20) PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  gender VARCHAR(1) NOT NULL,
  birth_year INTEGER NOT NULL,
  age INTEGER NOT NULL,
  national_id VARCHAR(20) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  primary_branch VARCHAR(20) NOT NULL,
  region TEXT NOT NULL,
  business_type TEXT NOT NULL,
  monthly_income_band TEXT NOT NULL,
  historical_cycles INTEGER NOT NULL,
  avg_weekly_cash DECIMAL(10, 2) NOT NULL,
  fraud_flag_initial INTEGER NOT NULL DEFAULT 0
);

-- =====================================================
-- 2. BRANCHES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS branches (
  branch_id VARCHAR(20) PRIMARY KEY,
  branch_name TEXT NOT NULL,
  region TEXT NOT NULL,
  urban_rural TEXT NOT NULL,
  staff_count INTEGER NOT NULL,
  avg_target_tier VARCHAR(1) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL
);

-- =====================================================
-- 3. OFFICERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS officers (
  officer_id VARCHAR(20) PRIMARY KEY,
  name TEXT NOT NULL,
  branch_id VARCHAR(20) NOT NULL,
  role TEXT NOT NULL
);

-- =====================================================
-- 4. LOANS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS loans (
  loan_id VARCHAR(20) PRIMARY KEY,
  customer_id VARCHAR(20) NOT NULL,
  branch_id VARCHAR(20) NOT NULL,
  officer_id VARCHAR(20) NOT NULL,
  disbursement_date DATE NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  tenor_weeks INTEGER NOT NULL,
  daily_installment DECIMAL(10, 2) NOT NULL,
  miss_rate REAL NOT NULL,
  rescheduled INTEGER NOT NULL DEFAULT 0,
  default_flag INTEGER NOT NULL DEFAULT 0,
  loan_status TEXT NOT NULL
);

-- =====================================================
-- 5. REPAYMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS repayments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  loan_id VARCHAR(20) NOT NULL,
  customer_id VARCHAR(20) NOT NULL,
  branch_id VARCHAR(20) NOT NULL,
  payment_date DATE NOT NULL,
  amount_paid DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL
);

-- =====================================================
-- 6. DAILY BRANCH PERFORMANCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS daily_branch_performance (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  date DATE NOT NULL,
  branch_id VARCHAR(20) NOT NULL,
  region TEXT NOT NULL,
  recruited_today INTEGER NOT NULL,
  disbursed_amount_ksh DECIMAL(12, 2) NOT NULL,
  daily_dues_ksh DECIMAL(12, 2) NOT NULL,
  collected_ksh DECIMAL(12, 2) NOT NULL,
  missed_calls INTEGER NOT NULL,
  arrears_new_ksh DECIMAL(12, 2) NOT NULL,
  par_percent REAL NOT NULL,
  daily_target_ksh DECIMAL(12, 2) NOT NULL
);

-- =====================================================
-- 7. MONTHLY BRANCH SUMMARY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS monthly_branch_summary (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  branch_id VARCHAR(20) NOT NULL,
  month TEXT NOT NULL,
  recruited_monthly INTEGER NOT NULL,
  disbursed_monthly_ksh DECIMAL(12, 2) NOT NULL,
  dues_monthly_ksh DECIMAL(12, 2) NOT NULL,
  collected_monthly_ksh DECIMAL(12, 2) NOT NULL,
  arrears_monthly_ksh DECIMAL(12, 2) NOT NULL,
  avg_par_percent REAL NOT NULL
);

-- =====================================================
-- 8. OFFICER PERFORMANCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS officer_performance (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  officer_id VARCHAR(20) NOT NULL,
  branch_id VARCHAR(20) NOT NULL,
  month TEXT NOT NULL,
  loans_handled INTEGER NOT NULL,
  approvals INTEGER NOT NULL,
  arrears_recovered_ksh DECIMAL(12, 2) NOT NULL,
  fraud_hits INTEGER NOT NULL DEFAULT 0
);

-- =====================================================
-- 9. FRAUD SIGNALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS fraud_signals (
  customer_id VARCHAR(20) PRIMARY KEY,
  national_id_mismatch INTEGER NOT NULL DEFAULT 0,
  shared_phone_number INTEGER NOT NULL DEFAULT 0,
  distance_anomaly INTEGER NOT NULL DEFAULT 0,
  suspicious_repayment_pattern INTEGER NOT NULL DEFAULT 0,
  synthetic_customer_score REAL NOT NULL
);

-- =====================================================
-- 10. AI CUSTOMER FEATURES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_customer_features (
  customer_id VARCHAR(20) PRIMARY KEY,
  primary_branch VARCHAR(20) NOT NULL,
  avg_weekly_cash DECIMAL(10, 2) NOT NULL,
  historical_cycles INTEGER NOT NULL,
  risk_score_0_100 REAL NOT NULL,
  default_prob REAL NOT NULL,
  churn_prob REAL NOT NULL,
  recommended_limit_ksh DECIMAL(12, 2) NOT NULL
);

-- =====================================================
-- 11. ML MODELS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ml_models (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  model_name TEXT NOT NULL,
  version TEXT NOT NULL,
  trained_at TIMESTAMP NOT NULL DEFAULT NOW(),
  accuracy REAL,
  precision REAL,
  recall REAL,
  f1_score REAL,
  model_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
);

-- =====================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =====================================================

-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_customers_branch ON customers(primary_branch);
CREATE INDEX IF NOT EXISTS idx_customers_region ON customers(region);
CREATE INDEX IF NOT EXISTS idx_customers_national_id ON customers(national_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- Branch indexes
CREATE INDEX IF NOT EXISTS idx_branches_region ON branches(region);

-- Loan indexes
CREATE INDEX IF NOT EXISTS idx_loans_customer ON loans(customer_id);
CREATE INDEX IF NOT EXISTS idx_loans_branch ON loans(branch_id);
CREATE INDEX IF NOT EXISTS idx_loans_officer ON loans(officer_id);
CREATE INDEX IF NOT EXISTS idx_loans_disbursement_date ON loans(disbursement_date);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(loan_status);

-- Repayment indexes
CREATE INDEX IF NOT EXISTS idx_repayments_loan ON repayments(loan_id);
CREATE INDEX IF NOT EXISTS idx_repayments_customer ON repayments(customer_id);
CREATE INDEX IF NOT EXISTS idx_repayments_date ON repayments(payment_date);

-- Daily performance indexes
CREATE INDEX IF NOT EXISTS idx_daily_perf_branch ON daily_branch_performance(branch_id);
CREATE INDEX IF NOT EXISTS idx_daily_perf_date ON daily_branch_performance(date);
CREATE INDEX IF NOT EXISTS idx_daily_perf_region ON daily_branch_performance(region);

-- Monthly summary indexes
CREATE INDEX IF NOT EXISTS idx_monthly_summary_branch ON monthly_branch_summary(branch_id);
CREATE INDEX IF NOT EXISTS idx_monthly_summary_month ON monthly_branch_summary(month);

-- Officer performance indexes
CREATE INDEX IF NOT EXISTS idx_officer_perf_officer ON officer_performance(officer_id);
CREATE INDEX IF NOT EXISTS idx_officer_perf_branch ON officer_performance(branch_id);

-- =====================================================
-- FOREIGN KEY CONSTRAINTS (OPTIONAL - for referential integrity)
-- =====================================================
-- Uncomment these if you want enforced foreign key relationships

-- ALTER TABLE customers ADD CONSTRAINT fk_customers_branch 
--   FOREIGN KEY (primary_branch) REFERENCES branches(branch_id);

-- ALTER TABLE officers ADD CONSTRAINT fk_officers_branch 
--   FOREIGN KEY (branch_id) REFERENCES branches(branch_id);

-- ALTER TABLE loans ADD CONSTRAINT fk_loans_customer 
--   FOREIGN KEY (customer_id) REFERENCES customers(customer_id);

-- ALTER TABLE loans ADD CONSTRAINT fk_loans_branch 
--   FOREIGN KEY (branch_id) REFERENCES branches(branch_id);

-- ALTER TABLE loans ADD CONSTRAINT fk_loans_officer 
--   FOREIGN KEY (officer_id) REFERENCES officers(officer_id);

-- ALTER TABLE repayments ADD CONSTRAINT fk_repayments_loan 
--   FOREIGN KEY (loan_id) REFERENCES loans(loan_id);

-- ALTER TABLE repayments ADD CONSTRAINT fk_repayments_customer 
--   FOREIGN KEY (customer_id) REFERENCES customers(customer_id);

-- ALTER TABLE repayments ADD CONSTRAINT fk_repayments_branch 
--   FOREIGN KEY (branch_id) REFERENCES branches(branch_id);

-- ALTER TABLE fraud_signals ADD CONSTRAINT fk_fraud_signals_customer 
--   FOREIGN KEY (customer_id) REFERENCES customers(customer_id);

-- ALTER TABLE ai_customer_features ADD CONSTRAINT fk_ai_features_customer 
--   FOREIGN KEY (customer_id) REFERENCES customers(customer_id);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these queries to verify your schema was created correctly:

-- List all tables
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' ORDER BY table_name;

-- Count records in each table
-- SELECT 
--   'customers' as table_name, COUNT(*) as record_count FROM customers
-- UNION ALL SELECT 'branches', COUNT(*) FROM branches
-- UNION ALL SELECT 'officers', COUNT(*) FROM officers
-- UNION ALL SELECT 'loans', COUNT(*) FROM loans
-- UNION ALL SELECT 'repayments', COUNT(*) FROM repayments
-- UNION ALL SELECT 'daily_branch_performance', COUNT(*) FROM daily_branch_performance
-- UNION ALL SELECT 'monthly_branch_summary', COUNT(*) FROM monthly_branch_summary
-- UNION ALL SELECT 'officer_performance', COUNT(*) FROM officer_performance
-- UNION ALL SELECT 'fraud_signals', COUNT(*) FROM fraud_signals
-- UNION ALL SELECT 'ai_customer_features', COUNT(*) FROM ai_customer_features
-- UNION ALL SELECT 'ml_models', COUNT(*) FROM ml_models;

-- =====================================================
-- NOTES FOR SUPABASE USERS
-- =====================================================
-- 1. This schema is fully compatible with Supabase PostgreSQL
-- 2. All UUID generation uses gen_random_uuid() which is supported by Supabase
-- 3. The schema matches exactly with the Drizzle ORM schema in shared/schema.ts
-- 4. To use Row Level Security (RLS), you'll need to enable it per table and add policies
-- 5. For real-time subscriptions, enable them in Supabase dashboard for specific tables
-- 6. Foreign key constraints are commented out but can be enabled for referential integrity
-- 7. Indexes are created for optimal query performance on common lookups

-- =====================================================
-- SCHEMA COMPATIBILITY CHECKLIST
-- =====================================================
-- ✓ All table names match (lowercase with underscores)
-- ✓ All column names match (lowercase with underscores)  
-- ✓ All data types match (VARCHAR, TEXT, INTEGER, DECIMAL, REAL, DATE, TIMESTAMP)
-- ✓ All primary keys match (using same ID strategy)
-- ✓ All default values match (using SQL standard syntax)
-- ✓ All NOT NULL constraints match
-- ✓ Performance indexes added for common queries
-- ✓ UUID generation compatible with both Drizzle and Supabase
-- ✓ Phone column added to customers table for contact information
