
import mongoose from "mongoose";
import Category from "../models/Category.js";
import Product from "../models/Product.js";

// CREATE CATEGORY
const createCategory = async (req, res) => {
  try {
    const { name, slug, description, image, sortOrder, isActive } = req.body;

    if (!name?.trim() || !slug?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name and slug are required.",
      });
    }

    const category = await Category.create({
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description,
      image,
      sortOrder,
      isActive,
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully.",
      category,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Category slug already exists.",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Failed to create category.",
      error: error.message,
    });
  }
};

// GET ALL CATEGORIES
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories.",
      error: error.message,
    });
  }
};

// GET SINGLE CATEGORY BY ID OR SLUG
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = mongoose.isValidObjectId(id)
      ? { _id: id }
      : { slug: id.toLowerCase() };

    const category = await Category.findOne({
      ...query,
      isActive: true,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    return res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch category.",
      error: error.message,
    });
  }
};

// UPDATE CATEGORY
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID.",
      });
    }

    const allowedFields = [
      "name",
      "slug",
      "description",
      "image",
      "sortOrder",
      "isActive",
    ];

    const data = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        data[field] = req.body[field];
      }
    });

    if (data.name !== undefined) {
      if (!data.name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Category name cannot be empty.",
        });
      }

      data.name = data.name.trim();
    }

    if (data.slug !== undefined) {
      if (!data.slug.trim()) {
        return res.status(400).json({
          success: false,
          message: "Category slug cannot be empty.",
        });
      }

      data.slug = data.slug.trim().toLowerCase();
    }

    const category = await Category.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category updated successfully.",
      category,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Category slug already exists.",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Failed to update category.",
      error: error.message,
    });
  }
};

// DELETE CATEGORY
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID.",
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    // Do not delete a category that still has products
    const hasProducts = await Product.exists({
      category: category._id,
    });

    if (hasProducts) {
      return res.status(409).json({
        success: false,
        message:
          "This category has products. Move or delete those products before deleting the category.",
      });
    }

    await Category.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete category.",
      error: error.message,
    });
  }
};

// EXPORT CONTROLLER FUNCTIONS
export {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
