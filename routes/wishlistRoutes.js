import express from "express";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  toggleWishlist,
} from "../controllers/wishlistController.js";

import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/", getWishlist);

// Toggle: add if absent, remove if present
router.post("/toggle", toggleWishlist);

// Explicit add route remains available
router.post("/", addToWishlist);

router.delete("/", clearWishlist);
router.delete("/:productId", removeFromWishlist);

export default router;