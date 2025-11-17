import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, date, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Customers table
export const customers = pgTable("customers", {
  customerId: varchar("customer_id", { length: 20 }).primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  gender: varchar("gender", { length: 1 }).notNull(),
  birthYear: integer("birth_year").notNull(),
  age: integer("age").notNull(),
  nationalId: varchar("national_id", { length: 20 }).notNull(),
  phone: varchar("phone", { length: 15 }).notNull(),
  primaryBranch: varchar("primary_branch", { length: 20 }).notNull(),
  region: text("region").notNull(),
  businessType: text("business_type").notNull(),
  monthlyIncomeBand: text("monthly_income_band").notNull(),
  historicalCycles: integer("historical_cycles").notNull(),
  avgWeeklyCash: decimal("avg_weekly_cash", { precision: 10, scale: 2 }).notNull(),
  fraudFlagInitial: integer("fraud_flag_initial").notNull().default(0),
});

// Branches table
export const branches = pgTable("branches", {
  branchId: varchar("branch_id", { length: 20 }).primaryKey(),
  branchName: text("branch_name").notNull(),
  region: text("region").notNull(),
  urbanRural: text("urban_rural").notNull(),
  staffCount: integer("staff_count").notNull(),
  avgTargetTier: varchar("avg_target_tier", { length: 1 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
});

// Officers table
export const officers = pgTable("officers", {
  officerId: varchar("officer_id", { length: 20 }).primaryKey(),
  name: text("name").notNull(),
  branchId: varchar("branch_id", { length: 20 }).notNull(),
  role: text("role").notNull(),
});

// Loans table
export const loans = pgTable("loans", {
  loanId: varchar("loan_id", { length: 20 }).primaryKey(),
  customerId: varchar("customer_id", { length: 20 }).notNull(),
  branchId: varchar("branch_id", { length: 20 }).notNull(),
  officerId: varchar("officer_id", { length: 20 }).notNull(),
  disbursementDate: date("disbursement_date").notNull(),
  dueDate: date("due_date").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  tenorWeeks: integer("tenor_weeks").notNull(),
  dailyInstallment: decimal("daily_installment", { precision: 10, scale: 2 }).notNull(),
  missRate: real("miss_rate").notNull(),
  rescheduled: integer("rescheduled").notNull().default(0),
  defaultFlag: integer("default_flag").notNull().default(0),
  loanStatus: text("loan_status").notNull(),
});

// Repayments table
export const repayments = pgTable("repayments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  loanId: varchar("loan_id", { length: 20 }).notNull(),
  customerId: varchar("customer_id", { length: 20 }).notNull(),
  branchId: varchar("branch_id", { length: 20 }).notNull(),
  paymentDate: date("payment_date").notNull(),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(),
});

// Daily branch performance table
export const dailyBranchPerformance = pgTable("daily_branch_performance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull(),
  branchId: varchar("branch_id", { length: 20 }).notNull(),
  region: text("region").notNull(),
  recruitedToday: integer("recruited_today").notNull(),
  disbursedAmountKsh: decimal("disbursed_amount_ksh", { precision: 12, scale: 2 }).notNull(),
  dailyDuesKsh: decimal("daily_dues_ksh", { precision: 12, scale: 2 }).notNull(),
  collectedKsh: decimal("collected_ksh", { precision: 12, scale: 2 }).notNull(),
  missedCalls: integer("missed_calls").notNull(),
  arrearsNewKsh: decimal("arrears_new_ksh", { precision: 12, scale: 2 }).notNull(),
  parPercent: real("par_percent").notNull(),
  dailyTargetKsh: decimal("daily_target_ksh", { precision: 12, scale: 2 }).notNull(),
});

// Monthly branch summary table
export const monthlyBranchSummary = pgTable("monthly_branch_summary", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  branchId: varchar("branch_id", { length: 20 }).notNull(),
  month: text("month").notNull(),
  recruitedMonthly: integer("recruited_monthly").notNull(),
  disbursedMonthlyKsh: decimal("disbursed_monthly_ksh", { precision: 12, scale: 2 }).notNull(),
  duesMonthlyKsh: decimal("dues_monthly_ksh", { precision: 12, scale: 2 }).notNull(),
  collectedMonthlyKsh: decimal("collected_monthly_ksh", { precision: 12, scale: 2 }).notNull(),
  arrearsMonthlyKsh: decimal("arrears_monthly_ksh", { precision: 12, scale: 2 }).notNull(),
  avgParPercent: real("avg_par_percent").notNull(),
});

// Officer performance table
export const officerPerformance = pgTable("officer_performance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  officerId: varchar("officer_id", { length: 20 }).notNull(),
  branchId: varchar("branch_id", { length: 20 }).notNull(),
  month: text("month").notNull(),
  loansHandled: integer("loans_handled").notNull(),
  approvals: integer("approvals").notNull(),
  arrearsRecoveredKsh: decimal("arrears_recovered_ksh", { precision: 12, scale: 2 }).notNull(),
  fraudHits: integer("fraud_hits").notNull().default(0),
});

// Fraud signals table
export const fraudSignals = pgTable("fraud_signals", {
  customerId: varchar("customer_id", { length: 20 }).primaryKey(),
  nationalIdMismatch: integer("national_id_mismatch").notNull().default(0),
  sharedPhoneNumber: integer("shared_phone_number").notNull().default(0),
  distanceAnomaly: integer("distance_anomaly").notNull().default(0),
  suspiciousRepaymentPattern: integer("suspicious_repayment_pattern").notNull().default(0),
  syntheticCustomerScore: real("synthetic_customer_score").notNull(),
});

// AI customer features table
export const aiCustomerFeatures = pgTable("ai_customer_features", {
  customerId: varchar("customer_id", { length: 20 }).primaryKey(),
  primaryBranch: varchar("primary_branch", { length: 20 }).notNull(),
  avgWeeklyCash: decimal("avg_weekly_cash", { precision: 10, scale: 2 }).notNull(),
  historicalCycles: integer("historical_cycles").notNull(),
  riskScore0100: real("risk_score_0_100").notNull(),
  defaultProb: real("default_prob").notNull(),
  churnProb: real("churn_prob").notNull(),
  recommendedLimitKsh: decimal("recommended_limit_ksh", { precision: 12, scale: 2 }).notNull(),
});

// ML Model tracking table
export const mlModels = pgTable("ml_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  modelName: text("model_name").notNull(),
  version: text("version").notNull(),
  trainedAt: timestamp("trained_at").notNull().defaultNow(),
  accuracy: real("accuracy"),
  precision: real("precision"),
  recall: real("recall"),
  f1Score: real("f1_score"),
  modelPath: text("model_path").notNull(),
  status: text("status").notNull().default('active'),
});

// Relations
export const customersRelations = relations(customers, ({ one, many }) => ({
  branch: one(branches, {
    fields: [customers.primaryBranch],
    references: [branches.branchId],
  }),
  loans: many(loans),
  repayments: many(repayments),
  fraudSignal: one(fraudSignals, {
    fields: [customers.customerId],
    references: [fraudSignals.customerId],
  }),
  aiFeatures: one(aiCustomerFeatures, {
    fields: [customers.customerId],
    references: [aiCustomerFeatures.customerId],
  }),
}));

export const branchesRelations = relations(branches, ({ many }) => ({
  customers: many(customers),
  officers: many(officers),
  loans: many(loans),
  dailyPerformance: many(dailyBranchPerformance),
  monthlyPerformance: many(monthlyBranchSummary),
}));

export const officersRelations = relations(officers, ({ one, many }) => ({
  branch: one(branches, {
    fields: [officers.branchId],
    references: [branches.branchId],
  }),
  loans: many(loans),
  performance: many(officerPerformance),
}));

export const loansRelations = relations(loans, ({ one, many }) => ({
  customer: one(customers, {
    fields: [loans.customerId],
    references: [customers.customerId],
  }),
  branch: one(branches, {
    fields: [loans.branchId],
    references: [branches.branchId],
  }),
  officer: one(officers, {
    fields: [loans.officerId],
    references: [officers.officerId],
  }),
  repayments: many(repayments),
}));

export const repaymentsRelations = relations(repayments, ({ one }) => ({
  loan: one(loans, {
    fields: [repayments.loanId],
    references: [loans.loanId],
  }),
  customer: one(customers, {
    fields: [repayments.customerId],
    references: [customers.customerId],
  }),
  branch: one(branches, {
    fields: [repayments.branchId],
    references: [branches.branchId],
  }),
}));

// Insert schemas
export const insertCustomerSchema = createInsertSchema(customers);
export const insertBranchSchema = createInsertSchema(branches);
export const insertOfficerSchema = createInsertSchema(officers);
export const insertLoanSchema = createInsertSchema(loans);
export const insertRepaymentSchema = createInsertSchema(repayments);
export const insertDailyBranchPerformanceSchema = createInsertSchema(dailyBranchPerformance).omit({ id: true });
export const insertMonthlyBranchSummarySchema = createInsertSchema(monthlyBranchSummary).omit({ id: true });
export const insertOfficerPerformanceSchema = createInsertSchema(officerPerformance).omit({ id: true });
export const insertFraudSignalSchema = createInsertSchema(fraudSignals);
export const insertAiCustomerFeaturesSchema = createInsertSchema(aiCustomerFeatures);
export const insertMlModelSchema = createInsertSchema(mlModels).omit({ id: true, trainedAt: true });

// Types
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Branch = typeof branches.$inferSelect;
export type InsertBranch = z.infer<typeof insertBranchSchema>;
export type Officer = typeof officers.$inferSelect;
export type InsertOfficer = z.infer<typeof insertOfficerSchema>;
export type Loan = typeof loans.$inferSelect;
export type InsertLoan = z.infer<typeof insertLoanSchema>;
export type Repayment = typeof repayments.$inferSelect;
export type InsertRepayment = z.infer<typeof insertRepaymentSchema>;
export type DailyBranchPerformance = typeof dailyBranchPerformance.$inferSelect;
export type InsertDailyBranchPerformance = z.infer<typeof insertDailyBranchPerformanceSchema>;
export type MonthlyBranchSummary = typeof monthlyBranchSummary.$inferSelect;
export type InsertMonthlyBranchSummary = z.infer<typeof insertMonthlyBranchSummarySchema>;
export type OfficerPerformance = typeof officerPerformance.$inferSelect;
export type InsertOfficerPerformance = z.infer<typeof insertOfficerPerformanceSchema>;
export type FraudSignal = typeof fraudSignals.$inferSelect;
export type InsertFraudSignal = z.infer<typeof insertFraudSignalSchema>;
export type AiCustomerFeatures = typeof aiCustomerFeatures.$inferSelect;
export type InsertAiCustomerFeatures = z.infer<typeof insertAiCustomerFeaturesSchema>;
export type MlModel = typeof mlModels.$inferSelect;
export type InsertMlModel = z.infer<typeof insertMlModelSchema>;
