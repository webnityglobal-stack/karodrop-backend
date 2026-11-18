
import express from "express";

import {
  createAddress,
  getAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../controllers/addressController.js";

import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All address routes require customer authentication.
router.use(authenticate);

router.post("/", createAddress);
router.get("/", getAddresses);
router.get("/:id", getAddressById);
router.put("/:id", updateAddress);
router.delete("/:id", deleteAddress);
router.patch("/:id/default", setDefaultAddress);

export default router;
