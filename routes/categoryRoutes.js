
import express from "express";

import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";

import {
  authenticate,
  authorizeAdmin,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public: view categories
router.get("/", getCategories);
router.get("/:id", getCategoryById);

// Admin only: manage categories
router.post("/", authenticate, authorizeAdmin, createCategory);
router.put("/:id", authenticate, authorizeAdmin, updateCategory);
router.delete("/:id", authenticate, authorizeAdmin, deleteCategory);

export default router;
