require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
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
app.use(
  "/api/auth",
  require("./routes/authRoutes")
);
console.log("Auth routes registered successfully");

console.log("Auth routes registered: /api/auth");

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found.",
  });
});

module.exports = app;