
import mongoose from "mongoose";
import Product from "../models/Product.js";
import Category from "../models/Category.js";

// Allowed product fields
const allowedFields = [
  "name",
  "slug",
  "sku",
  "description",
  "shortDescription",
  "images",
  "image",
  "price",
  "compareAtPrice",
  "stock",
  "available",
  "isFeatured",
  "isNewProduct",
  "isBestSeller",
  "isActive",
  "rating",
  "reviewCount",
  "colors",
  "sizes",
  "printingOptions",
  "highlights",
  "productionTime",
  "deliveryTime",
];

// Format product response for frontend
const formatProduct = (product) => {
  const item = product?.toObject
    ? product.toObject()
    : { ...product };

  item.title = item.title || item.name;

  item.category =
    item.category && typeof item.category === "object"
      ? item.category.slug
      : item.category;

  item.image = item.image || item.images?.[0] || "";

  item.discountPercentage =
    item.compareAtPrice > item.price && item.compareAtPrice > 0
      ? Math.round(
          ((item.compareAtPrice - item.price) /
            item.compareAtPrice) *
            100
        )
      : 0;

  item.savings = Math.max(
    0,
    (item.compareAtPrice || 0) - (item.price || 0)
  );

  return item;
};

// Resolve category using MongoDB ID or slug
const resolveCategory = async (categoryValue) => {
  if (!categoryValue) return null;

  if (mongoose.isValidObjectId(categoryValue)) {
    return Category.findById(categoryValue);
  }

  return Category.findOne({
    slug: String(categoryValue).toLowerCase().trim(),
  });
};

// Pick allowed fields from request body
const pickProductFields = (body) => {
  const data = {};

  allowedFields.forEach((field) => {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  });

  return data;
};

// CREATE PRODUCT
const createProduct = async (req, res) => {
  try {
    const data = pickProductFields(req.body);

    if (
      !data.name ||
      !data.slug ||
      !data.sku ||
      data.price === undefined ||
      data.compareAtPrice === undefined ||
      !req.body.category
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, slug, SKU, category, price and compareAtPrice are required.",
      });
    }

    const category = await resolveCategory(req.body.category);

    if (!category || !category.isActive) {
      return res.status(400).json({
        success: false,
        message: "Valid active category not found.",
      });
    }

    data.category = category._id;

    if (data.stock !== undefined) {
      data.available = data.stock > 0;
    }

    const product = await Product.create(data);

    const savedProduct = await Product.findById(product._id)
      .populate("category", "name slug");

    return res.status(201).json({
      success: true,
      message: "Product created successfully.",
      product: formatProduct(savedProduct),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Product slug or SKU already exists.",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Failed to create product.",
      error: error.message,
    });
  }
};

// GET ALL PRODUCTS WITH SEARCH, FILTER AND PAGINATION
const getProducts = async (req, res) => {
  try {
    const page = Math.max(
      1,
      parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 12)
    );

    const filter = { isActive: true };

    // Category filter
    if (req.query.category && req.query.category !== "all") {
      const category = await resolveCategory(req.query.category);

      if (!category || !category.isActive) {
        return res.status(200).json({
          success: true,
          products: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        });
      }

      filter.category = category._id;
    }

    // Search by name, description or SKU
    if (req.query.search?.trim()) {
      const search = req.query.search.trim().slice(0, 100);
      const escapedSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      const regex = new RegExp(escapedSearch, "i");

      filter.$or = [
        { name: regex },
        { description: regex },
        { sku: regex },
      ];
    }

    // Filters from URL query parameters
    if (req.query.isFeatured === "true") {
      filter.isFeatured = true;
    }

    if (req.query.isNewProduct === "true") {
      filter.isNewProduct = true;
    }

    if (req.query.isBestSeller === "true") {
      filter.isBestSeller = true;
    }

    // Filters from dedicated routes
    const productFilter = req.productFilter || {};

    if (productFilter.isFeatured) {
      filter.isFeatured = true;
    }

    if (productFilter.isNewProduct) {
      filter.isNewProduct = true;
    }

    if (productFilter.isBestSeller) {
      filter.isBestSeller = true;
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      products: products.map(formatProduct),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products.",
      error: error.message,
    });
  }
};

// GET SINGLE PRODUCT BY SLUG OR ID
const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const query = mongoose.isValidObjectId(slug)
      ? { _id: slug, isActive: true }
      : { slug: slug.toLowerCase(), isActive: true };

    const product = await Product.findOne(query)
      .populate("category", "name slug");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      product: formatProduct(product),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product.",
      error: error.message,
    });
  }
};

// UPDATE PRODUCT
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const data = pickProductFields(req.body);

    if (req.body.category !== undefined) {
      const category = await resolveCategory(req.body.category);

      if (!category || !category.isActive) {
        return res.status(400).json({
          success: false,
          message: "Valid active category not found.",
        });
      }

      data.category = category._id;
    }

    if (data.stock !== undefined) {
      data.available = data.stock > 0;
    }

    const product = await Product.findByIdAndUpdate(
      id,
      data,
      {
        new: true,
        runValidators: true,
      }
    ).populate("category", "name slug");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      product: formatProduct(product),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Product slug or SKU already exists.",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Failed to update product.",
      error: error.message,
    });
  }
};

// DELETE PRODUCT
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete product.",
      error: error.message,
    });
  }
};

// EXPORT ALL CONTROLLER FUNCTIONS AT THE END
export {
  createProduct,
  getProducts,
  getProductBySlug,
  updateProduct,
  deleteProduct,
};
