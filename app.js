
import dotenv from "dotenv";
import express from "express";
import cors from "cors";

import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "KaroDrop Backend API is running 🚀",
  });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Product routes
app.use("/api/products", productRoutes);

// Category routes
app.use("/api/categories", categoryRoutes);

// Cart routes
app.use("/api/cart", cartRoutes);

// Wishlist routes
app.use("/api/wishlist", wishlistRoutes);

// Address routes
app.use("/api/addresses", addressRoutes);

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found.",
  });
});

export default app;
