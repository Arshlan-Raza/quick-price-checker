import mongoose from "mongoose";
import scrapeBigBasket from "./bigBasketScraper.js";
import scrapeBlinkit from "./blinkitScraper.js";
import scrapeZepto from "./zeptoScraper.js";
import scrapeSwiggy from "./swiggyScraper.js";
import connectDB from "../confiq/db.js";
import Product from "../models/Product.js";

async function startScraping() {
  try {
    await connectDB();
    console.log("MongoDB connected successfully");

    await Product.deleteMany({});
    console.log("Database cleared before scraping");

    const results = await Promise.allSettled([
      scrapeSwiggy(),
      scrapeZepto(),
      scrapeBlinkit(),
      scrapeBigBasket()
    ]);

    results.forEach((result, i) => {
      if (result.status === "rejected") {
        console.error(`❌ Scraper ${i + 1} failed:`, result.reason);
      }
    });

  } catch (error) {
    console.error("❌ Fatal error during setup:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  }
}

startScraping();
