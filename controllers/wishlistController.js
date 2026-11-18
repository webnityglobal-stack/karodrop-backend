
import mongoose from "mongoose";
import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";

// GET: Get logged-in user's wishlist
const getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({
      user: req.user.id,
    }).populate("products");

    if (!wishlist) {
      return res.status(200).json({
        success: true,
        message: "Wishlist fetched successfully.",
        wishlist: [],
        totalItems: 0,
      });
    }

    const products = wishlist.products.filter(Boolean);

    return res.status(200).json({
      success: true,
      message: "Wishlist fetched successfully.",
      wishlist: products,
      totalItems: products.length,
    });
  } catch (error) {
    console.error("Get Wishlist Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch wishlist.",
    });
  }
};

// POST: Add product to wishlist
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId || !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "A valid productId is required.",
      });
    }

    const product = await Product.findOne({
      _id: productId,
      isActive: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or inactive.",
      });
    }

    let wishlist = await Wishlist.findOne({
      user: req.user.id,
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user.id,
        products: [product._id],
      });
    } else {
      const alreadyExists = wishlist.products.some(
        (id) => id.toString() === product._id.toString()
      );

      if (alreadyExists) {
        return res.status(409).json({
          success: false,
          message: "Product is already in your wishlist.",
        });
      }

      wishlist.products.push(product._id);
      await wishlist.save();
    }

    await wishlist.populate("products");

    const products = wishlist.products.filter(Boolean);

    return res.status(201).json({
      success: true,
      message: "Product added to wishlist successfully.",
      wishlist: products,
      totalItems: products.length,
    });
  } catch (error) {
    console.error("Add Wishlist Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to add product to wishlist.",
    });
  }
};

// POST: Toggle product in wishlist
// If product exists, remove it; otherwise, add it.
const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId || !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "A valid productId is required.",
      });
    }

    const product = await Product.findOne({
      _id: productId,
      isActive: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or inactive.",
      });
    }

    let wishlist = await Wishlist.findOne({
      user: req.user.id,
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user.id,
        products: [product._id],
      });

      return res.status(200).json({
        success: true,
        action: "added",
        isWishlisted: true,
        message: "Product added to wishlist.",
      });
    }

    const alreadyExists = wishlist.products.some(
      (id) => id.toString() === product._id.toString()
    );

    if (alreadyExists) {
      wishlist.products = wishlist.products.filter(
        (id) => id.toString() !== product._id.toString()
      );

      await wishlist.save();

      return res.status(200).json({
        success: true,
        action: "removed",
        isWishlisted: false,
        message: "Product removed from wishlist.",
      });
    }

    wishlist.products.push(product._id);
    await wishlist.save();

    return res.status(200).json({
      success: true,
      action: "added",
      isWishlisted: true,
      message: "Product added to wishlist.",
    });
  } catch (error) {
    console.error("Toggle Wishlist Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to toggle wishlist.",
    });
  }
};

// DELETE: Remove one product from wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "A valid productId is required.",
      });
    }

    const wishlist = await Wishlist.findOne({
      user: req.user.id,
    });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found.",
      });
    }

    const exists = wishlist.products.some(
      (id) => id.toString() === productId
    );

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "Product is not in your wishlist.",
      });
    }

    wishlist.products = wishlist.products.filter(
      (id) => id.toString() !== productId
    );

    await wishlist.save();
    await wishlist.populate("products");

    const products = wishlist.products.filter(Boolean);

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist successfully.",
      wishlist: products,
      totalItems: products.length,
    });
  } catch (error) {
    console.error("Remove Wishlist Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to remove product from wishlist.",
    });
  }
};

// DELETE: Clear entire wishlist
const clearWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({
      user: req.user.id,
    });

    if (!wishlist) {
      return res.status(200).json({
        success: true,
        message: "Wishlist is already empty.",
        wishlist: [],
        totalItems: 0,
      });
    }

    wishlist.products = [];
    await wishlist.save();

    return res.status(200).json({
      success: true,
      message: "Wishlist cleared successfully.",
      wishlist: [],
      totalItems: 0,
    });
  } catch (error) {
    console.error("Clear Wishlist Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to clear wishlist.",
    });
  }
};

export {
  getWishlist,
  addToWishlist,
  toggleWishlist,
  removeFromWishlist,
  clearWishlist,
};
