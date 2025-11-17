import type { Express, Request, Response } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertCustomerSchema, insertFraudSignalSchema } from "@shared/schema";

export async function registerRoutes(app: Express) {
  // Dashboard metrics
  app.get("/api/dashboard/metrics", async (req: Request, res: Response) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error: any) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Customer endpoints
  app.get("/api/customers/search", async (req: Request, res: Response) => {
    try {
      const query = (req.query.q as string || "").trim();
      if (query.length < 3) {
        return res.json([]);
      }
      const customers = await storage.searchCustomers(query);
      
      // Enrich with AI features and fraud signals
      const enrichedCustomers = await Promise.all(
        customers.map(async (customer) => {
          const aiFeatures = await storage.getAiFeatures(customer.customerId);
          const loans = await storage.getLoansForCustomer(customer.customerId);
          
          return {
            ...customer,
            riskScore: aiFeatures?.riskScore0100 || 0,
            defaultProb: aiFeatures?.defaultProb || 0,
            churnProb: aiFeatures?.churnProb || 0,
            recommendedLimit: aiFeatures?.recommendedLimitKsh || 0,
            totalLoans: loans.length,
            activeLoans: loans.filter(l => l.loanStatus === 'Active').length,
            fraudFlags: [] as string[],
          };
        })
      );
      
      res.json(enrichedCustomers);
    } catch (error: any) {
      console.error("Error searching customers:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/customers/:customerId", async (req: Request, res: Response) => {
    try {
      const { customerId } = req.params;
      const customer = await storage.getCustomer(customerId);
      
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      
      const aiFeatures = await storage.getAiFeatures(customerId);
      const loans = await storage.getLoansForCustomer(customerId);
      
      const enrichedCustomer = {
        ...customer,
        riskScore: aiFeatures?.riskScore0100 || 0,
        defaultProb: aiFeatures?.defaultProb || 0,
        churnProb: aiFeatures?.churnProb || 0,
        recommendedLimit: aiFeatures?.recommendedLimitKsh || 0,
        totalLoans: loans.length,
        activeLoans: loans.filter(l => l.loanStatus === 'Active').length,
        fraudFlags: [] as string[],
      };
      
      res.json(enrichedCustomer);
    } catch (error: any) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Branch endpoints
  app.get("/api/branches/list", async (req: Request, res: Response) => {
    try {
      const branches = await storage.listBranches();
      res.json(branches);
    } catch (error: any) {
      console.error("Error fetching branches:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/branches/performance", async (req: Request, res: Response) => {
    try {
      const branchId = req.query.branchId as string || "all";
      const timeRange = req.query.timeRange as string || "daily";
      
      const performance = await storage.getBranchPerformance(branchId, timeRange);
      res.json(performance);
    } catch (error: any) {
      console.error("Error fetching branch performance:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Regional analytics
  app.get("/api/analytics/regional", async (req: Request, res: Response) => {
    try {
      const metrics = await storage.getRegionalMetrics();
      res.json(metrics);
    } catch (error: any) {
      console.error("Error fetching regional metrics:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Fraud detection endpoints
  app.get("/api/fraud/cases", async (req: Request, res: Response) => {
    try {
      const riskFilter = (req.query.riskFilter as string) || "all";
      const validFilters = ["all", "high", "medium", "low"];
      
      if (!validFilters.includes(riskFilter)) {
        return res.status(400).json({ error: "Invalid risk filter. Must be one of: all, high, medium, low" });
      }
      
      const cases = await storage.getFraudCases(riskFilter !== "all" ? riskFilter : undefined);
      res.json(cases);
    } catch (error: any) {
      console.error("Error fetching fraud cases:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // AI Insights endpoints
  app.get("/api/insights/recent", async (req: Request, res: Response) => {
    try {
      // Mock recent insights for now
      const insights = [
        {
          id: "1",
          agentType: "analysis",
          query: "What are the top performing regions?",
          response: "Based on collection rate and disbursement volume, the top performing regions are: Central (95.2% collection rate), Western (92.8%), and Nairobi (91.5%). Central region shows the highest consistency with low PAR rates across all branches.",
          confidence: 0.92,
          timestamp: new Date().toISOString(),
        },
        {
          id: "2",
          agentType: "fraud",
          query: "Explain the fraud detection for customer C12345",
          response: "Customer C12345 was flagged due to multiple indicators: 1) National ID mismatch detected in verification, 2) Shared phone number with 3 other accounts, 3) Distance anomaly (location data inconsistent with stated branch), 4) Unusual repayment pattern. The XGBoost model assigned 87% fraud probability based on these signals combined with historical patterns.",
          confidence: 0.87,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
      ];
      res.json(insights);
    } catch (error: any) {
      console.error("Error fetching insights:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/insights/query", async (req: Request, res: Response) => {
    try {
      const { agentType, query } = req.body;
      
      if (!query || typeof query !== "string" || query.trim().length === 0) {
        return res.status(400).json({ error: "Query must be a non-empty string" });
      }
      
      const validAgentTypes = ["analysis", "fraud", "forecast", "messaging"];
      if (!agentType || !validAgentTypes.includes(agentType)) {
        return res.status(400).json({ error: "Invalid agent type. Must be one of: analysis, fraud, forecast, messaging" });
      }
      
      const groqApiKey = process.env.GROQ_API_KEY;
      
      let aiResponse = "";
      let confidence = 0.85;
      
      if (groqApiKey) {
        try {
          // Call Groq API for AI-powered insights
          const systemPrompts = {
            analysis: "You are an expert microfinance data analyst specializing in operational intelligence for Kechita Microfinance Group in Kenya. Analyze data patterns, trends, and provide actionable insights.",
            fraud: "You are a fraud detection expert for microfinance operations. Explain fraud patterns, ML model decisions, and provide risk assessments based on the data.",
            forecast: "You are a financial forecasting expert for microfinance operations. Predict future performance, identify trends, and provide strategic recommendations.",
            messaging: "You are a CEO advisor for Kechita Microfinance Group. Generate concise, actionable executive summaries and strategic insights for leadership.",
          };
          
          const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${groqApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [
                {
                  role: "system",
                  content: systemPrompts[agentType as keyof typeof systemPrompts],
                },
                {
                  role: "user",
                  content: query,
                },
              ],
              temperature: 0.7,
              max_tokens: 1000,
            }),
          });
          
          if (groqResponse.ok) {
            const data = await groqResponse.json();
            aiResponse = data.choices?.[0]?.message?.content || "[Error: Invalid response from Groq API]";
            confidence = aiResponse.includes("[Error:") ? 0.5 : 0.92;
          } else {
            throw new Error(`Groq API error: ${groqResponse.statusText}`);
          }
        } catch (apiError: any) {
          console.error("Groq API error:", apiError);
          // Fall back to mock response
          aiResponse = `[Using mock response due to API error] This is an AI-powered analysis from the ${agentType} agent. Based on your query: "${query}", I would analyze the operational data and provide strategic insights specific to Kechita Microfinance Group's operations across Kenya.`;
        }
      } else {
        // No API key - use mock response
        aiResponse = `This is a mock response from the ${agentType} agent. To enable real AI-powered insights, please configure your GROQ_API_KEY. Query: "${query}"`;
      }
      
      const response = {
        id: Date.now().toString(),
        agentType,
        query,
        response: aiResponse,
        confidence,
        timestamp: new Date().toISOString(),
      };
      
      res.json(response);
    } catch (error: any) {
      console.error("Error processing insight query:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // CSV Upload endpoints
  app.post("/api/upload/analyze", async (req: Request, res: Response) => {
    try {
      // Mock file analysis
      const result = {
        fileName: "sample_data.csv",
        detectedType: "Customer Data",
        rowCount: 1250,
        confidence: 95,
        targetTable: "customers",
        preview: [
          { customer_id: "C001", first_name: "John", last_name: "Doe", age: 35 },
          { customer_id: "C002", first_name: "Jane", last_name: "Smith", age: 28 },
          { customer_id: "C003", first_name: "Peter", last_name: "Johnson", age: 42 },
        ],
      };
      
      res.json(result);
    } catch (error: any) {
      console.error("Error analyzing file:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/upload/import", async (req: Request, res: Response) => {
    try {
      // Mock successful import
      res.json({ success: true, message: "Data imported successfully" });
    } catch (error: any) {
      console.error("Error importing file:", error);
      res.status(500).json({ error: error.message });
    }
  });

  return createServer(app);
}
