
import express from "express";

import {
  createProduct,
  getProducts,
  getProductBySlug,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

import {
  authenticate,
  authorizeAdmin,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public: view products
router.get("/", getProducts);
router.get("/featured", (req, res, next) => {
  req.productFilter = { isFeatured: true };
  next();
}, getProducts);

router.get("/new", (req, res, next) => {
  req.productFilter = { isNewProduct: true };
  next();
}, getProducts);

router.get("/best-sellers", (req, res, next) => {
  req.productFilter = { isBestSeller: true };
  next();
}, getProducts);

// Admin only: manage products
router.post("/", authenticate, authorizeAdmin, createProduct);
router.put("/:id", authenticate, authorizeAdmin, updateProduct);
router.delete("/:id", authenticate, authorizeAdmin, deleteProduct);

// Keep dynamic route last
router.get("/:slug", getProductBySlug);

export default router;
