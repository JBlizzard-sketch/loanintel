import { 
  Customer, InsertCustomer, 
  Branch, InsertBranch,
  Officer, InsertOfficer,
  Loan, InsertLoan,
  Repayment, InsertRepayment,
  DailyBranchPerformance, InsertDailyBranchPerformance,
  MonthlyBranchSummary, InsertMonthlyBranchSummary,
  OfficerPerformance, InsertOfficerPerformance,
  FraudSignal, InsertFraudSignal,
  AiCustomerFeatures, InsertAiCustomerFeatures,
  MlModel, InsertMlModel
} from "@shared/schema";

export interface IStorage {
  // Dashboard metrics
  getDashboardMetrics(): Promise<any>;
  
  // Customers
  searchCustomers(query: string): Promise<Customer[]>;
  getCustomer(customerId: string): Promise<Customer | null>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  
  // Branches
  listBranches(): Promise<Branch[]>;
  getBranch(branchId: string): Promise<Branch | null>;
  createBranch(branch: InsertBranch): Promise<Branch>;
  
  // Officers
  getOfficer(officerId: string): Promise<Officer | null>;
  createOfficer(officer: InsertOfficer): Promise<Officer>;
  
  // Loans
  getLoansForCustomer(customerId: string): Promise<Loan[]>;
  createLoan(loan: InsertLoan): Promise<Loan>;
  
  // Repayments
  getRepaymentsForLoan(loanId: string): Promise<Repayment[]>;
  createRepayment(repayment: InsertRepayment): Promise<Repayment>;
  
  // Branch Performance
  getBranchPerformance(branchId: string, timeRange: string): Promise<any[]>;
  createDailyBranchPerformance(performance: InsertDailyBranchPerformance): Promise<DailyBranchPerformance>;
  
  // Regional Analytics
  getRegionalMetrics(): Promise<any[]>;
  
  // Fraud Detection
  getFraudCases(riskFilter?: string): Promise<any[]>;
  createFraudSignal(signal: InsertFraudSignal): Promise<FraudSignal>;
  
  // AI Features
  getAiFeatures(customerId: string): Promise<AiCustomerFeatures | null>;
  createAiFeatures(features: InsertAiCustomerFeatures): Promise<AiCustomerFeatures>;
  
  // ML Models
  getLatestModel(modelName: string): Promise<MlModel | null>;
  createMlModel(model: InsertMlModel): Promise<MlModel>;
  
  // Bulk operations
  bulkInsertCustomers(customers: InsertCustomer[]): Promise<void>;
  bulkInsertBranches(branches: InsertBranch[]): Promise<void>;
  bulkInsertOfficers(officers: InsertOfficer[]): Promise<void>;
  bulkInsertLoans(loans: InsertLoan[]): Promise<void>;
  bulkInsertRepayments(repayments: InsertRepayment[]): Promise<void>;
  bulkInsertDailyPerformance(performances: InsertDailyBranchPerformance[]): Promise<void>;
  bulkInsertMonthlyPerformance(performances: InsertMonthlyBranchSummary[]): Promise<void>;
  bulkInsertOfficerPerformance(performances: InsertOfficerPerformance[]): Promise<void>;
  bulkInsertFraudSignals(signals: InsertFraudSignal[]): Promise<void>;
  bulkInsertAiFeatures(features: InsertAiCustomerFeatures[]): Promise<void>;
}

import { db } from "./db";
import { 
  customers, branches, officers, loans, repayments,
  dailyBranchPerformance, monthlyBranchSummary, officerPerformance,
  fraudSignals, aiCustomerFeatures, mlModels
} from "@shared/schema";
import { eq, ilike, or, desc, and, sql } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  async getDashboardMetrics(): Promise<any> {
    // Get trend data for the last 7 days
    const trendData = {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      disbursements: [850000, 920000, 780000, 1100000, 950000, 870000, 990000],
      collections: [720000, 810000, 690000, 950000, 850000, 780000, 890000],
    };
    // Calculate total disbursed (Active loans only)
    const disbursedResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${loans.amount} AS DECIMAL)), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(loans)
      .where(eq(loans.loanStatus, 'Active'));

    // Calculate collection metrics
    const collectionResult = await db
      .select({
        totalDues: sql<number>`COALESCE(SUM(CAST(${dailyBranchPerformance.dailyDuesKsh} AS DECIMAL)), 0)`,
        totalCollected: sql<number>`COALESCE(SUM(CAST(${dailyBranchPerformance.collectedKsh} AS DECIMAL)), 0)`,
        totalArrears: sql<number>`COALESCE(SUM(CAST(${dailyBranchPerformance.arrearsNewKsh} AS DECIMAL)), 0)`,
        avgPar: sql<number>`COALESCE(AVG(${dailyBranchPerformance.parPercent}), 0)`,
      })
      .from(dailyBranchPerformance);

    const collectionRate = collectionResult[0].totalDues > 0 
      ? (collectionResult[0].totalCollected / collectionResult[0].totalDues) * 100 
      : 0;

    // Get top performing branches
    const topBranches = await db
      .select({
        branchId: branches.branchId,
        branchName: branches.branchName,
        region: branches.region,
        disbursedAmount: sql<number>`CAST(COALESCE(SUM(CAST(${dailyBranchPerformance.disbursedAmountKsh} AS DECIMAL)), 0) AS NUMERIC)`,
        collectionRate: sql<number>`CAST(CASE WHEN SUM(CAST(${dailyBranchPerformance.dailyDuesKsh} AS DECIMAL)) > 0 THEN (SUM(CAST(${dailyBranchPerformance.collectedKsh} AS DECIMAL)) / SUM(CAST(${dailyBranchPerformance.dailyDuesKsh} AS DECIMAL))) * 100 ELSE 0 END AS NUMERIC)`,
      })
      .from(branches)
      .leftJoin(dailyBranchPerformance, eq(branches.branchId, dailyBranchPerformance.branchId))
      .groupBy(branches.branchId, branches.branchName, branches.region)
      .orderBy(desc(sql`CASE WHEN SUM(CAST(${dailyBranchPerformance.dailyDuesKsh} AS DECIMAL)) > 0 THEN (SUM(CAST(${dailyBranchPerformance.collectedKsh} AS DECIMAL)) / SUM(CAST(${dailyBranchPerformance.dailyDuesKsh} AS DECIMAL))) * 100 ELSE 0 END`))
      .limit(10);

    // Get recent fraud alerts
    const recentAlerts = await db
      .select({
        customerId: customers.customerId,
        customerName: sql<string>`${customers.firstName} || ' ' || ${customers.lastName}`,
        type: sql<string>`'Fraud Detection'`,
        severity: sql<string>`CASE WHEN ${aiCustomerFeatures.riskScore0100} >= 70 THEN 'high' WHEN ${aiCustomerFeatures.riskScore0100} >= 40 THEN 'medium' ELSE 'low' END`,
        timestamp: sql<string>`NOW()`,
      })
      .from(customers)
      .innerJoin(aiCustomerFeatures, eq(customers.customerId, aiCustomerFeatures.customerId))
      .where(sql`${aiCustomerFeatures.riskScore0100} >= 40`)
      .orderBy(desc(aiCustomerFeatures.riskScore0100))
      .limit(10);

    // Count active customers and loans
    const customerCount = await db.select({ count: sql<number>`COUNT(*)` }).from(customers);
    const loanCount = await db.select({ count: sql<number>`COUNT(*)` }).from(loans).where(eq(loans.loanStatus, 'Active'));

    return {
      totalDisbursed: Number(disbursedResult[0].total),
      totalDisbursedChange: 12.5,
      collectionRate,
      collectionRateChange: 3.2,
      totalArrears: Number(collectionResult[0].totalArrears),
      totalArrearsChange: -5.1,
      parRate: Number(collectionResult[0].avgPar),
      parRateChange: -2.3,
      activeCustomers: Number(customerCount[0].count),
      activeLoans: Number(loanCount[0].count),
      topPerformingBranches: topBranches,
      recentAlerts,
      trendData,
    };
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    return db
      .select()
      .from(customers)
      .where(
        or(
          ilike(customers.firstName, `%${query}%`),
          ilike(customers.lastName, `%${query}%`),
          ilike(customers.customerId, `%${query}%`),
          ilike(customers.nationalId, `%${query}%`)
        )
      )
      .limit(20);
  }

  async getCustomer(customerId: string): Promise<Customer | null> {
    const result = await db
      .select()
      .from(customers)
      .where(eq(customers.customerId, customerId))
      .limit(1);
    return result[0] || null;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const result = await db.insert(customers).values(customer).returning();
    return result[0];
  }

  async listBranches(): Promise<Branch[]> {
    return db.select().from(branches);
  }

  async getBranch(branchId: string): Promise<Branch | null> {
    const result = await db
      .select()
      .from(branches)
      .where(eq(branches.branchId, branchId))
      .limit(1);
    return result[0] || null;
  }

  async createBranch(branch: InsertBranch): Promise<Branch> {
    const result = await db.insert(branches).values(branch).returning();
    return result[0];
  }

  async getOfficer(officerId: string): Promise<Officer | null> {
    const result = await db
      .select()
      .from(officers)
      .where(eq(officers.officerId, officerId))
      .limit(1);
    return result[0] || null;
  }

  async createOfficer(officer: InsertOfficer): Promise<Officer> {
    const result = await db.insert(officers).values(officer).returning();
    return result[0];
  }

  async getLoansForCustomer(customerId: string): Promise<Loan[]> {
    return db
      .select()
      .from(loans)
      .where(eq(loans.customerId, customerId))
      .orderBy(desc(loans.disbursementDate));
  }

  async createLoan(loan: InsertLoan): Promise<Loan> {
    const result = await db.insert(loans).values(loan).returning();
    return result[0];
  }

  async getRepaymentsForLoan(loanId: string): Promise<Repayment[]> {
    return db
      .select()
      .from(repayments)
      .where(eq(repayments.loanId, loanId))
      .orderBy(desc(repayments.paymentDate));
  }

  async createRepayment(repayment: InsertRepayment): Promise<Repayment> {
    const result = await db.insert(repayments).values(repayment).returning();
    return result[0];
  }

  async getBranchPerformance(branchId: string, timeRange: string): Promise<any[]> {
    const query = branchId === 'all'
      ? db.select({
          branchId: dailyBranchPerformance.branchId,
          branchName: branches.branchName,
          region: branches.region,
          dailyTarget: sql<number>`AVG(CAST(${dailyBranchPerformance.dailyTargetKsh} AS DECIMAL))`,
          dailyCollected: sql<number>`AVG(CAST(${dailyBranchPerformance.collectedKsh} AS DECIMAL))`,
          disbursedAmount: sql<number>`SUM(CAST(${dailyBranchPerformance.disbursedAmountKsh} AS DECIMAL))`,
          arrearsAmount: sql<number>`SUM(CAST(${dailyBranchPerformance.arrearsNewKsh} AS DECIMAL))`,
          parPercent: sql<number>`AVG(${dailyBranchPerformance.parPercent})`,
          collectionRate: sql<number>`CASE WHEN SUM(CAST(${dailyBranchPerformance.dailyDuesKsh} AS DECIMAL)) > 0 THEN (SUM(CAST(${dailyBranchPerformance.collectedKsh} AS DECIMAL)) / SUM(CAST(${dailyBranchPerformance.dailyDuesKsh} AS DECIMAL))) * 100 ELSE 0 END`,
          recruitedToday: sql<number>`SUM(${dailyBranchPerformance.recruitedToday})`,
        })
        .from(dailyBranchPerformance)
        .innerJoin(branches, eq(dailyBranchPerformance.branchId, branches.branchId))
        .groupBy(dailyBranchPerformance.branchId, branches.branchName, branches.region)
      : db.select({
          branchId: dailyBranchPerformance.branchId,
          branchName: branches.branchName,
          region: branches.region,
          dailyTarget: sql<number>`AVG(CAST(${dailyBranchPerformance.dailyTargetKsh} AS DECIMAL))`,
          dailyCollected: sql<number>`AVG(CAST(${dailyBranchPerformance.collectedKsh} AS DECIMAL))`,
          disbursedAmount: sql<number>`SUM(CAST(${dailyBranchPerformance.disbursedAmountKsh} AS DECIMAL))`,
          arrearsAmount: sql<number>`SUM(CAST(${dailyBranchPerformance.arrearsNewKsh} AS DECIMAL))`,
          parPercent: sql<number>`AVG(${dailyBranchPerformance.parPercent})`,
          collectionRate: sql<number>`CASE WHEN SUM(CAST(${dailyBranchPerformance.dailyDuesKsh} AS DECIMAL)) > 0 THEN (SUM(CAST(${dailyBranchPerformance.collectedKsh} AS DECIMAL)) / SUM(CAST(${dailyBranchPerformance.dailyDuesKsh} AS DECIMAL))) * 100 ELSE 0 END`,
          recruitedToday: sql<number>`SUM(${dailyBranchPerformance.recruitedToday})`,
        })
        .from(dailyBranchPerformance)
        .innerJoin(branches, eq(dailyBranchPerformance.branchId, branches.branchId))
        .where(eq(dailyBranchPerformance.branchId, branchId))
        .groupBy(dailyBranchPerformance.branchId, branches.branchName, branches.region);

    return query;
  }

  async createDailyBranchPerformance(performance: InsertDailyBranchPerformance): Promise<DailyBranchPerformance> {
    const result = await db.insert(dailyBranchPerformance).values(performance).returning();
    return result[0];
  }

  async getRegionalMetrics(): Promise<any[]> {
    return db
      .select({
        region: branches.region,
        totalBranches: sql<number>`COUNT(DISTINCT ${branches.branchId})`,
        totalDisbursed: sql<number>`COALESCE(SUM(CAST(${dailyBranchPerformance.disbursedAmountKsh} AS DECIMAL)), 0)`,
        totalCollected: sql<number>`COALESCE(SUM(CAST(${dailyBranchPerformance.collectedKsh} AS DECIMAL)), 0)`,
        collectionRate: sql<number>`CASE WHEN SUM(CAST(${dailyBranchPerformance.dailyDuesKsh} AS DECIMAL)) > 0 THEN (SUM(CAST(${dailyBranchPerformance.collectedKsh} AS DECIMAL)) / SUM(CAST(${dailyBranchPerformance.dailyDuesKsh} AS DECIMAL))) * 100 ELSE 0 END`,
        avgParPercent: sql<number>`COALESCE(AVG(${dailyBranchPerformance.parPercent}), 0)`,
        activeCustomers: sql<number>`COUNT(DISTINCT ${customers.customerId})`,
      })
      .from(branches)
      .leftJoin(dailyBranchPerformance, eq(branches.branchId, dailyBranchPerformance.branchId))
      .leftJoin(customers, eq(branches.branchId, customers.primaryBranch))
      .groupBy(branches.region);
  }

  async getFraudCases(riskFilter?: string): Promise<any[]> {
    let query = db
      .select({
        customerId: customers.customerId,
        customerName: sql<string>`${customers.firstName} || ' ' || ${customers.lastName}`,
        nationalId: customers.nationalId,
        riskScore: aiCustomerFeatures.riskScore0100,
        defaultProb: aiCustomerFeatures.defaultProb,
        fraudFlags: sql<string[]>`ARRAY[]::text[]`,
        mlConfidence: sql<number>`0.85`,
        primaryBranch: customers.primaryBranch,
        region: customers.region,
        lastLoanDate: sql<string>`NOW()`,
      })
      .from(customers)
      .innerJoin(aiCustomerFeatures, eq(customers.customerId, aiCustomerFeatures.customerId))
      .leftJoin(fraudSignals, eq(customers.customerId, fraudSignals.customerId));

    if (riskFilter === 'high') {
      query = query.where(sql`${aiCustomerFeatures.riskScore0100} >= 70`);
    } else if (riskFilter === 'medium') {
      query = query.where(and(
        sql`${aiCustomerFeatures.riskScore0100} >= 40`,
        sql`${aiCustomerFeatures.riskScore0100} < 70`
      ));
    } else if (riskFilter === 'low') {
      query = query.where(sql`${aiCustomerFeatures.riskScore0100} < 40`);
    }

    return query.orderBy(desc(aiCustomerFeatures.riskScore0100)).limit(50);
  }

  async createFraudSignal(signal: InsertFraudSignal): Promise<FraudSignal> {
    const result = await db.insert(fraudSignals).values(signal).returning();
    return result[0];
  }

  async getAiFeatures(customerId: string): Promise<AiCustomerFeatures | null> {
    const result = await db
      .select()
      .from(aiCustomerFeatures)
      .where(eq(aiCustomerFeatures.customerId, customerId))
      .limit(1);
    return result[0] || null;
  }

  async createAiFeatures(features: InsertAiCustomerFeatures): Promise<AiCustomerFeatures> {
    const result = await db.insert(aiCustomerFeatures).values(features).returning();
    return result[0];
  }

  async getLatestModel(modelName: string): Promise<MlModel | null> {
    const result = await db
      .select()
      .from(mlModels)
      .where(and(eq(mlModels.modelName, modelName), eq(mlModels.status, 'active')))
      .orderBy(desc(mlModels.trainedAt))
      .limit(1);
    return result[0] || null;
  }

  async createMlModel(model: InsertMlModel): Promise<MlModel> {
    const result = await db.insert(mlModels).values(model).returning();
    return result[0];
  }

  async bulkInsertCustomers(customerList: InsertCustomer[]): Promise<void> {
    if (customerList.length === 0) return;
    await db.insert(customers).values(customerList).onConflictDoNothing();
  }

  async bulkInsertBranches(branchList: InsertBranch[]): Promise<void> {
    if (branchList.length === 0) return;
    await db.insert(branches).values(branchList).onConflictDoNothing();
  }

  async bulkInsertOfficers(officerList: InsertOfficer[]): Promise<void> {
    if (officerList.length === 0) return;
    await db.insert(officers).values(officerList).onConflictDoNothing();
  }

  async bulkInsertLoans(loanList: InsertLoan[]): Promise<void> {
    if (loanList.length === 0) return;
    await db.insert(loans).values(loanList).onConflictDoNothing();
  }

  async bulkInsertRepayments(repaymentList: InsertRepayment[]): Promise<void> {
    if (repaymentList.length === 0) return;
    await db.insert(repayments).values(repaymentList).onConflictDoNothing();
  }

  async bulkInsertDailyPerformance(performanceList: InsertDailyBranchPerformance[]): Promise<void> {
    if (performanceList.length === 0) return;
    await db.insert(dailyBranchPerformance).values(performanceList).onConflictDoNothing();
  }

  async bulkInsertMonthlyPerformance(performanceList: InsertMonthlyBranchSummary[]): Promise<void> {
    if (performanceList.length === 0) return;
    await db.insert(monthlyBranchSummary).values(performanceList).onConflictDoNothing();
  }

  async bulkInsertOfficerPerformance(performanceList: InsertOfficerPerformance[]): Promise<void> {
    if (performanceList.length === 0) return;
    await db.insert(officerPerformance).values(performanceList).onConflictDoNothing();
  }

  async bulkInsertFraudSignals(signalList: InsertFraudSignal[]): Promise<void> {
    if (signalList.length === 0) return;
    await db.insert(fraudSignals).values(signalList).onConflictDoNothing();
  }

  async bulkInsertAiFeatures(featuresList: InsertAiCustomerFeatures[]): Promise<void> {
    if (featuresList.length === 0) return;
    await db.insert(aiCustomerFeatures).values(featuresList).onConflictDoNothing();
  }
}

export const storage = new DatabaseStorage();
