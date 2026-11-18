
import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    fullName: {
      type: String,
      required: [true, "Full name is required."],
      trim: true,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required."],
      trim: true,
      match: [/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number."],
    },

    addressLine1: {
      type: String,
      required: [true, "House number and street are required."],
      trim: true,
    },

    addressLine2: {
      type: String,
      trim: true,
      default: "",
    },

    landmark: {
      type: String,
      trim: true,
      default: "",
    },

    city: {
      type: String,
      required: [true, "City is required."],
      trim: true,
    },

    state: {
      type: String,
      required: [true, "State is required."],
      trim: true,
    },

    pincode: {
      type: String,
      required: [true, "PIN code is required."],
      trim: true,
      match: [/^[1-9][0-9]{5}$/, "Enter a valid 6-digit Indian PIN code."],
    },

    country: {
      type: String,
      default: "India",
      trim: true,
    },

    addressType: {
      type: String,
      enum: ["Home", "Work", "Other"],
      default: "Home",
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Address = mongoose.model("Address", addressSchema);

export default Address;
