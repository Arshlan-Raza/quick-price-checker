import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import Product from "./src/models/Product.js";
import connectDB from "./src/confiq/db.js";
import commonProducts from "./src/utils/commonProducts.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const PLACEHOLDER_IMAGE = process.env.PLACEHOLDER_IMAGE || "/placeholder.svg";

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
connectDB()
  .then(() => console.log("MongoDB Connection Established"))
  .catch((err) => console.error("MongoDB Connection Failed:", err));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "API is running" });
});

// Get all products
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});


// Get products by source
app.get("/api/products/source/:source", async (req, res) => {
    try {
      const { source } = req.params;
      const products = await Product.find({
        source: { $regex: new RegExp(`^${source}$`, 'i') }
      });
      res.json(products);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch products by source" });
    }
  });
  
  // Get products by category
  app.get("/api/products/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const products = await Product.find({
        category: { $regex: new RegExp(`^${category}$`, 'i') }
      });
      res.json(products);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch products by category" });
    }
  });  

// Grouped products with originalName + commonName
app.get("/api/grouped-products", async (req, res) => {
  try {
    const products = await Product.find();

    const grouped = commonProducts
      .map(({ key, matchKeywords, description }) => {
        const matchedItems = products.filter((p) =>
          matchKeywords.some((keyword) =>
            p.name?.toLowerCase().includes(keyword.toLowerCase())
          )
        );

        if (matchedItems.length === 0) return null;

        const categories = Array.from(
          new Set(matchedItems.map((item) => item.category || "General"))
        );

        return {
          key,
          commonName: key,
          name: matchedItems[0]?.name || key.charAt(0).toUpperCase() + key.slice(1),
          description: description || `Products related to ${key}`,
          category: categories.length === 1 ? categories[0] : categories,
          prices: matchedItems.map((item) => ({
            originalName: item.name,
            platform: item.source || "Unknown",
            price: item.price || 0,
            available: item.stock !== "Out of Stock",
            deliveryTime: "10 mins",
            image: item.image || PLACEHOLDER_IMAGE,
          })),
        };
      })
      .filter(Boolean);

    res.json(grouped);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate grouped products" });
  }
});

// Delete all products
app.delete("/api/products", async (req, res) => {
  try {
    await Product.deleteMany({});
    res.json({ message: "All products deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete products" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
