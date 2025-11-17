-- ================================================================
-- Reset Supabase Schema (Drop and Recreate All Tables)
-- This will clear the PostgREST cache and ensure clean schema
-- ================================================================

-- Drop all tables (in reverse dependency order)
DROP TABLE IF EXISTS "ml_models" CASCADE;
DROP TABLE IF EXISTS "ai_customer_features" CASCADE;
DROP TABLE IF EXISTS "fraud_signals" CASCADE;
DROP TABLE IF EXISTS "officer_performance" CASCADE;
DROP TABLE IF EXISTS "monthly_branch_summary" CASCADE;
DROP TABLE IF EXISTS "daily_branch_performance" CASCADE;
DROP TABLE IF EXISTS "repayments" CASCADE;
DROP TABLE IF EXISTS "loans" CASCADE;
DROP TABLE IF EXISTS "officers" CASCADE;
DROP TABLE IF EXISTS "customers" CASCADE;
DROP TABLE IF EXISTS "branches" CASCADE;

-- Recreate all tables with proper schema

-- Branches table
CREATE TABLE "branches" (
  "branch_id" varchar(20) PRIMARY KEY NOT NULL,
  "branch_name" text NOT NULL,
  "region" text NOT NULL,
  "urban_rural" text NOT NULL,
  "staff_count" integer NOT NULL,
  "avg_target_tier" varchar(1) NOT NULL,
  "latitude" numeric(10, 8) NOT NULL,
  "longitude" numeric(11, 8) NOT NULL
);

-- Officers table
CREATE TABLE "officers" (
  "officer_id" varchar(20) PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "branch_id" varchar(20) NOT NULL,
  "role" text NOT NULL
);

-- Customers table
CREATE TABLE "customers" (
  "customer_id" varchar(20) PRIMARY KEY NOT NULL,
  "first_name" text NOT NULL,
  "last_name" text NOT NULL,
  "gender" varchar(1) NOT NULL,
  "birth_year" integer NOT NULL,
  "age" integer NOT NULL,
  "national_id" varchar(20) NOT NULL,
  "phone" varchar(15) NOT NULL,
  "primary_branch" varchar(20) NOT NULL,
  "region" text NOT NULL,
  "business_type" text NOT NULL,
  "monthly_income_band" text NOT NULL,
  "historical_cycles" integer NOT NULL,
  "avg_weekly_cash" numeric(10, 2) NOT NULL,
  "fraud_flag_initial" integer DEFAULT 0 NOT NULL
);

-- Loans table
CREATE TABLE "loans" (
  "loan_id" varchar(20) PRIMARY KEY NOT NULL,
  "customer_id" varchar(20) NOT NULL,
  "branch_id" varchar(20) NOT NULL,
  "officer_id" varchar(20) NOT NULL,
  "disbursement_date" date NOT NULL,
  "due_date" date NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "tenor_weeks" integer NOT NULL,
  "daily_installment" numeric(10, 2) NOT NULL,
  "miss_rate" real NOT NULL,
  "rescheduled" integer DEFAULT 0 NOT NULL,
  "default_flag" integer DEFAULT 0 NOT NULL,
  "loan_status" text NOT NULL
);

-- Repayments table
CREATE TABLE "repayments" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "loan_id" varchar(20) NOT NULL,
  "customer_id" varchar(20) NOT NULL,
  "branch_id" varchar(20) NOT NULL,
  "payment_date" date NOT NULL,
  "amount_paid" numeric(10, 2) NOT NULL,
  "status" text NOT NULL
);

-- Daily branch performance table
CREATE TABLE "daily_branch_performance" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "date" date NOT NULL,
  "branch_id" varchar(20) NOT NULL,
  "region" text NOT NULL,
  "recruited_today" integer NOT NULL,
  "disbursed_amount_ksh" numeric(12, 2) NOT NULL,
  "daily_dues_ksh" numeric(12, 2) NOT NULL,
  "collected_ksh" numeric(12, 2) NOT NULL,
  "missed_calls" integer NOT NULL,
  "arrears_new_ksh" numeric(12, 2) NOT NULL,
  "par_percent" real NOT NULL,
  "daily_target_ksh" numeric(12, 2) NOT NULL
);

-- Monthly branch summary table
CREATE TABLE "monthly_branch_summary" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "branch_id" varchar(20) NOT NULL,
  "month" text NOT NULL,
  "recruited_monthly" integer NOT NULL,
  "disbursed_monthly_ksh" numeric(12, 2) NOT NULL,
  "dues_monthly_ksh" numeric(12, 2) NOT NULL,
  "collected_monthly_ksh" numeric(12, 2) NOT NULL,
  "arrears_monthly_ksh" numeric(12, 2) NOT NULL,
  "avg_par_percent" real NOT NULL
);

-- Officer performance table
CREATE TABLE "officer_performance" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "officer_id" varchar(20) NOT NULL,
  "branch_id" varchar(20) NOT NULL,
  "month" text NOT NULL,
  "loans_handled" integer NOT NULL,
  "approvals" integer NOT NULL,
  "arrears_recovered_ksh" numeric(12, 2) NOT NULL,
  "fraud_hits" integer DEFAULT 0 NOT NULL
);

-- Fraud signals table
CREATE TABLE "fraud_signals" (
  "customer_id" varchar(20) PRIMARY KEY NOT NULL,
  "national_id_mismatch" integer DEFAULT 0 NOT NULL,
  "shared_phone_number" integer DEFAULT 0 NOT NULL,
  "distance_anomaly" integer DEFAULT 0 NOT NULL,
  "suspicious_repayment_pattern" integer DEFAULT 0 NOT NULL,
  "synthetic_customer_score" real NOT NULL
);

-- AI customer features table
CREATE TABLE "ai_customer_features" (
  "customer_id" varchar(20) PRIMARY KEY NOT NULL,
  "primary_branch" varchar(20) NOT NULL,
  "avg_weekly_cash" numeric(10, 2) NOT NULL,
  "historical_cycles" integer NOT NULL,
  "risk_score_0_100" real NOT NULL,
  "default_prob" real NOT NULL,
  "churn_prob" real NOT NULL,
  "recommended_limit_ksh" numeric(12, 2) NOT NULL
);

-- ML Models tracking table
CREATE TABLE "ml_models" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "model_name" text NOT NULL,
  "version" text NOT NULL,
  "trained_at" timestamp DEFAULT now() NOT NULL,
  "accuracy" real,
  "precision" real,
  "recall" real,
  "f1_score" real,
  "model_path" text NOT NULL,
  "status" text DEFAULT 'active' NOT NULL
);

-- Enable Row Level Security (RLS) for all tables if needed
-- ALTER TABLE "branches" ENABLE ROW LEVEL SECURITY;
-- (Add similar for other tables if you want RLS)

-- ================================================================
-- Schema reset complete!
-- The PostgREST cache should now be refreshed
-- ================================================================
