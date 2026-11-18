
import express from "express";

import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../controllers/cartController.js";

import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All cart routes require a valid login token
router.use(authenticate);

// GET logged-in user's cart
router.get("/", getCart);

// ADD product to cart
router.post("/items", addToCart);

// UPDATE product quantity
router.patch("/items/:productId", updateCartItem);

// REMOVE one product
router.delete("/items/:productId", removeCartItem);

// CLEAR entire cart
router.delete("/", clearCart);

export default router;
