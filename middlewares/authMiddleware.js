
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check that the user still exists in the database
    const user = await User.findById(decoded.id).select("role");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists. Please log in again.",
      });
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
    };

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token. Please log in again.",
      });
    }

    console.error("Authentication Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Authentication failed.",
    });
  }
};

// Allow only admin users
const authorizeAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin permission required.",
    });
  }

  next();
};

export { authenticate, authorizeAdmin };
