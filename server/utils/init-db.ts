import { initializeSampleData } from "./data-loader";
import { db } from "../db";
import { customers } from "@shared/schema";

async function main() {
  try {
    console.log("Checking if database needs initialization...");
    
    // Check if data already exists
    const existingCustomers = await db.select().from(customers).limit(1);
    
    if (existingCustomers.length === 0) {
      console.log("Database is empty. Initializing with sample data...");
      await initializeSampleData();
      console.log("Database initialization complete!");
    } else {
      console.log("Database already contains data. Skipping initialization.");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
}

main();
