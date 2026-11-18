
import mongoose from "mongoose";
import Address from "../models/Address.js";

// POST: Add a new address
const createAddress = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      pincode,
      country,
      addressType,
      isDefault,
    } = req.body;

    if (
      !fullName ||
      !phone ||
      !addressLine1 ||
      !city ||
      !state ||
      !pincode
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required address fields.",
      });
    }

    const existingCount = await Address.countDocuments({
      user: req.user.id,
    });

    const makeDefault = Boolean(isDefault) || existingCount === 0;

    if (makeDefault) {
      await Address.updateMany(
        { user: req.user.id },
        { $set: { isDefault: false } }
      );
    }

    const address = await Address.create({
      user: req.user.id,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      pincode,
      country,
      addressType,
      isDefault: makeDefault,
    });

    return res.status(201).json({
      success: true,
      message: "Address added successfully.",
      address,
    });
  } catch (error) {
    console.error("Create Address Error:", error.message);

    return res.status(error.name === "ValidationError" ? 400 : 500).json({
      success: false,
      message:
        error.name === "ValidationError"
          ? error.message
          : "Failed to add address.",
    });
  }
};

// GET: Get all addresses belonging to the logged-in user
const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({
      user: req.user.id,
    }).sort({ isDefault: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Addresses fetched successfully.",
      addresses,
      totalItems: addresses.length,
    });
  } catch (error) {
    console.error("Get Addresses Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch addresses.",
    });
  }
};

// GET: Get one address belonging to the logged-in user
const getAddressById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid address ID is required.",
      });
    }

    const address = await Address.findOne({
      _id: id,
      user: req.user.id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Address fetched successfully.",
      address,
    });
  } catch (error) {
    console.error("Get Address Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch address.",
    });
  }
};

// PUT: Update an address belonging to the logged-in user
const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid address ID is required.",
      });
    }

    const address = await Address.findOne({
      _id: id,
      user: req.user.id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    const allowedFields = [
      "fullName",
      "phone",
      "addressLine1",
      "addressLine2",
      "landmark",
      "city",
      "state",
      "pincode",
      "country",
      "addressType",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        address[field] = req.body[field];
      }
    }

    if (req.body.isDefault === true) {
      await Address.updateMany(
        { user: req.user.id, _id: { $ne: id } },
        { $set: { isDefault: false } }
      );

      address.isDefault = true;
    } else if (req.body.isDefault === false && address.isDefault) {
      // Do not leave the user without a default if another address exists.
      const anotherAddress = await Address.findOne({
        user: req.user.id,
        _id: { $ne: id },
      });

      if (anotherAddress) {
        return res.status(400).json({
          success: false,
          message: "Set another address as default before unsetting this one.",
        });
      }

      address.isDefault = true;
    }

    await address.save();

    return res.status(200).json({
      success: true,
      message: "Address updated successfully.",
      address,
    });
  } catch (error) {
    console.error("Update Address Error:", error.message);

    return res.status(error.name === "ValidationError" ? 400 : 500).json({
      success: false,
      message:
        error.name === "ValidationError"
          ? error.message
          : "Failed to update address.",
    });
  }
};

// DELETE: Delete an address belonging to the logged-in user
const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid address ID is required.",
      });
    }

    const address = await Address.findOne({
      _id: id,
      user: req.user.id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    const wasDefault = address.isDefault;

    await address.deleteOne();

    // If the default address was deleted, promote another saved address.
    if (wasDefault) {
      const nextAddress = await Address.findOne({
        user: req.user.id,
      }).sort({ createdAt: -1 });

      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Address Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to delete address.",
    });
  }
};

// PATCH: Set an address as default
const setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid address ID is required.",
      });
    }

    const address = await Address.findOne({
      _id: id,
      user: req.user.id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    await Address.updateMany(
      { user: req.user.id },
      { $set: { isDefault: false } }
    );

    address.isDefault = true;
    await address.save();

    return res.status(200).json({
      success: true,
      message: "Default address updated successfully.",
      address,
    });
  } catch (error) {
    console.error("Set Default Address Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to set default address.",
    });
  }
};

export {
  createAddress,
  getAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
