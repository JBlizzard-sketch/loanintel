import { storage } from "../storage";
import type {
  InsertCustomer,
  InsertBranch,
  InsertOfficer,
  InsertLoan,
  InsertRepayment,
  InsertDailyBranchPerformance,
  InsertMonthlyBranchSummary,
  InsertOfficerPerformance,
  InsertFraudSignal,
  InsertAiCustomerFeatures,
} from "@shared/schema";

export async function initializeSampleData() {
  console.log("Initializing sample data...");

  // Create sample branches
  const branches: InsertBranch[] = [
    {
      branchId: "BR001",
      branchName: "Nairobi Central",
      region: "Nairobi",
      urbanRural: "Urban",
      staffCount: 12,
      avgTargetTier: "A",
      latitude: "-1.286389",
      longitude: "36.817223",
    },
    {
      branchId: "BR002",
      branchName: "Mombasa Road",
      region: "Nairobi",
      urbanRural: "Urban",
      staffCount: 10,
      avgTargetTier: "A",
      latitude: "-1.300000",
      longitude: "36.850000",
    },
    {
      branchId: "BR003",
      branchName: "Kisumu Main",
      region: "Western",
      urbanRural: "Urban",
      staffCount: 8,
      avgTargetTier: "B",
      latitude: "-0.091702",
      longitude: "34.767956",
    },
    {
      branchId: "BR004",
      branchName: "Eldoret Hub",
      region: "Rift Valley",
      urbanRural: "Urban",
      staffCount: 9,
      avgTargetTier: "B",
      latitude: "0.514277",
      longitude: "35.269779",
    },
    {
      branchId: "BR005",
      branchName: "Nakuru Plaza",
      region: "Central",
      urbanRural: "Urban",
      staffCount: 7,
      avgTargetTier: "B",
      latitude: "-0.303099",
      longitude: "36.080026",
    },
  ];

  await storage.bulkInsertBranches(branches);
  console.log(`Inserted ${branches.length} branches`);

  // Create sample officers
  const officers: InsertOfficer[] = [
    { officerId: "OFF001", name: "James Mwangi", branchId: "BR001", role: "Loan Officer" },
    { officerId: "OFF002", name: "Grace Wanjiru", branchId: "BR001", role: "Branch Manager" },
    { officerId: "OFF003", name: "Peter Omondi", branchId: "BR002", role: "Loan Officer" },
    { officerId: "OFF004", name: "Mary Akinyi", branchId: "BR003", role: "Loan Officer" },
    { officerId: "OFF005", name: "David Kipchoge", branchId: "BR004", role: "Loan Officer" },
  ];

  await storage.bulkInsertOfficers(officers);
  console.log(`Inserted ${officers.length} officers`);

  // Create sample customers
  const customers: InsertCustomer[] = [];
  for (let i = 1; i <= 100; i++) {
    const customerId = `C${String(i).padStart(5, "0")}`;
    const branchId = branches[i % branches.length].branchId;
    const region = branches[i % branches.length].region;
    
    customers.push({
      customerId,
      firstName: `FirstName${i}`,
      lastName: `LastName${i}`,
      gender: i % 2 === 0 ? "M" : "F",
      birthYear: 1970 + (i % 30),
      age: 25 + (i % 30),
      nationalId: `NID${String(i).padStart(8, "0")}`,
      primaryBranch: branchId,
      region,
      businessType: ["Retail", "Services", "Agriculture", "Manufacturing"][i % 4],
      monthlyIncomeBand: ["0-10K", "10K-25K", "25K-50K", "50K+"][i % 4],
      historicalCycles: Math.floor(Math.random() * 10) + 1,
      avgWeeklyCash: String(1000 + Math.random() * 9000),
      fraudFlagInitial: i % 10 === 0 ? 1 : 0,
    });
  }

  await storage.bulkInsertCustomers(customers);
  console.log(`Inserted ${customers.length} customers`);

  // Create sample loans
  const loans: InsertLoan[] = [];
  for (let i = 0; i < customers.length * 2; i++) {
    const customer = customers[i % customers.length];
    const loanId = `L${String(i + 1).padStart(6, "0")}`;
    const officerId = officers[i % officers.length].officerId;
    const amount = (5000 + Math.random() * 45000).toFixed(2);
    const tenorWeeks = [4, 8, 12, 16][i % 4];
    const dailyInstallment = (parseFloat(amount) / (tenorWeeks * 7)).toFixed(2);
    
    const disbursementDate = new Date(2024, 0, 1 + (i % 300));
    const dueDate = new Date(disbursementDate);
    dueDate.setDate(dueDate.getDate() + tenorWeeks * 7);
    
    loans.push({
      loanId,
      customerId: customer.customerId,
      branchId: customer.primaryBranch,
      officerId,
      disbursementDate: disbursementDate.toISOString().split("T")[0],
      dueDate: dueDate.toISOString().split("T")[0],
      amount,
      tenorWeeks,
      dailyInstallment,
      missRate: Math.random() * 0.3,
      rescheduled: i % 20 === 0 ? 1 : 0,
      defaultFlag: i % 30 === 0 ? 1 : 0,
      loanStatus: i % 5 === 0 ? "completed" : "active",
    });
  }

  await storage.bulkInsertLoans(loans);
  console.log(`Inserted ${loans.length} loans`);

  // Create sample daily branch performance
  const dailyPerformance: InsertDailyBranchPerformance[] = [];
  const startDate = new Date(2024, 0, 1);
  const endDate = new Date(2024, 10, 1);
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    for (const branch of branches) {
      const dailyTarget = 50000 + Math.random() * 50000;
      const collected = dailyTarget * (0.7 + Math.random() * 0.25);
      const disbursed = 100000 + Math.random() * 200000;
      const dailyDues = dailyTarget;
      const arrears = Math.random() * 20000;
      
      dailyPerformance.push({
        date: d.toISOString().split("T")[0],
        branchId: branch.branchId,
        region: branch.region,
        recruitedToday: Math.floor(Math.random() * 5),
        disbursedAmountKsh: disbursed.toFixed(2),
        dailyDuesKsh: dailyDues.toFixed(2),
        collectedKsh: collected.toFixed(2),
        missedCalls: Math.floor(Math.random() * 10),
        arrearsNewKsh: arrears.toFixed(2),
        parPercent: (arrears / disbursed) * 100,
        dailyTargetKsh: dailyTarget.toFixed(2),
      });
    }
  }

  // Insert in batches
  const batchSize = 500;
  for (let i = 0; i < dailyPerformance.length; i += batchSize) {
    const batch = dailyPerformance.slice(i, i + batchSize);
    await storage.bulkInsertDailyPerformance(batch);
    console.log(`Inserted daily performance batch ${i / batchSize + 1}/${Math.ceil(dailyPerformance.length / batchSize)}`);
  }

  // Create AI customer features
  const aiFeatures: InsertAiCustomerFeatures[] = customers.map((customer, i) => {
    const riskScore = Math.random() * 100;
    
    return {
      customerId: customer.customerId,
      primaryBranch: customer.primaryBranch,
      avgWeeklyCash: customer.avgWeeklyCash,
      historicalCycles: customer.historicalCycles,
      riskScore0100: riskScore,
      defaultProb: riskScore / 100,
      churnProb: Math.random() * 0.3,
      recommendedLimitKsh: String(Math.floor(10000 + (100 - riskScore) * 500)),
    };
  });

  await storage.bulkInsertAiFeatures(aiFeatures);
  console.log(`Inserted ${aiFeatures.length} AI customer features`);

  // Create fraud signals for high-risk customers
  const fraudSignals: InsertFraudSignal[] = customers
    .filter((_, i) => i % 10 === 0)
    .map((customer) => ({
      customerId: customer.customerId,
      nationalIdMismatch: Math.random() > 0.5 ? 1 : 0,
      sharedPhoneNumber: Math.random() > 0.5 ? 1 : 0,
      distanceAnomaly: Math.random() > 0.5 ? 1 : 0,
      suspiciousRepaymentPattern: Math.random() > 0.5 ? 1 : 0,
      syntheticCustomerScore: Math.random() * 100,
    }));

  await storage.bulkInsertFraudSignals(fraudSignals);
  console.log(`Inserted ${fraudSignals.length} fraud signals`);

  console.log("Sample data initialization complete!");
}
