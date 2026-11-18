
import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// Populate products and calculate cart totals
const formatCart = (cart) => {
  const items = cart.items
    .filter((item) => item.product)
    .map((item) => {
      const product = item.product;
      const quantity = item.quantity;
      const price = product.price;

      return {
        product: {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          image: product.image || product.images?.[0] || "",
          images: product.images || [],
          stock: product.stock,
          available: product.available,
        },
        quantity,
        lineTotal: price * quantity,
      };
    });

  const subtotal = items.reduce(
    (total, item) => total + item.lineTotal,
    0
  );

  const totalItems = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return {
    _id: cart._id,
    user: cart.user,
    items,
    totalItems,
    subtotal,
    updatedAt: cart.updatedAt,
  };
};

// Populate a cart before returning it
const getPopulatedCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({
      user: userId,
      items: [],
    });
  }

  await cart.populate({
    path: "items.product",
    select:
      "name slug price compareAtPrice image images stock available isActive",
  });

  return cart;
};

// GET MY CART
const getCart = async (req, res) => {
  try {
    const cart = await getPopulatedCart(req.user.id);

    return res.status(200).json({
      success: true,
      cart: formatCart(cart),
    });
  } catch (error) {
    console.error("Get Cart Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch cart.",
    });
  }
};

// ADD PRODUCT TO CART
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "A valid productId is required.",
      });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer.",
      });
    }

    const product = await Product.findOne({
      _id: productId,
      isActive: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    if (product.available === false || product.stock < 1) {
      return res.status(400).json({
        success: false,
        message: "Product is currently out of stock.",
      });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = new Cart({
        user: req.user.id,
        items: [],
      });
    }

    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    const newQuantity = existingItem
      ? existingItem.quantity + quantity
      : quantity;

    if (newQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} units are available.`,
      });
    }

    if (existingItem) {
      existingItem.quantity = newQuantity;
    } else {
      cart.items.push({
        product: product._id,
        quantity,
      });
    }

    await cart.save();
    await cart.populate({
      path: "items.product",
      select:
        "name slug price compareAtPrice image images stock available isActive",
    });

    return res.status(200).json({
      success: true,
      message: "Product added to cart successfully.",
      cart: formatCart(cart),
    });
  } catch (error) {
    console.error("Add To Cart Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to add product to cart.",
    });
  }
};

// UPDATE CART ITEM QUANTITY
const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer.",
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

    if (
      product.available === false ||
      quantity > product.stock
    ) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity is unavailable. Current stock: ${product.stock}.`,
      });
    }

    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found.",
      });
    }

    const item = cart.items.find(
      (entry) => entry.product.toString() === productId
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Product is not in your cart.",
      });
    }

    item.quantity = quantity;

    await cart.save();
    await cart.populate({
      path: "items.product",
      select:
        "name slug price compareAtPrice image images stock available isActive",
    });

    return res.status(200).json({
      success: true,
      message: "Cart quantity updated successfully.",
      cart: formatCart(cart),
    });
  } catch (error) {
    console.error("Update Cart Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update cart item.",
    });
  }
};

// REMOVE ONE PRODUCT FROM CART
const removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found.",
      });
    }

    const originalLength = cart.items.length;

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    if (cart.items.length === originalLength) {
      return res.status(404).json({
        success: false,
        message: "Product is not in your cart.",
      });
    }

    await cart.save();
    await cart.populate({
      path: "items.product",
      select:
        "name slug price compareAtPrice image images stock available isActive",
    });

    return res.status(200).json({
      success: true,
      message: "Product removed from cart.",
      cart: formatCart(cart),
    });
  } catch (error) {
    console.error("Remove Cart Item Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to remove cart item.",
    });
  }
};

// CLEAR ENTIRE CART
const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(200).json({
        success: true,
        message: "Cart is already empty.",
        cart: {
          items: [],
          totalItems: 0,
          subtotal: 0,
        },
      });
    }

    cart.items = [];
    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully.",
      cart: formatCart(cart),
    });
  } catch (error) {
    console.error("Clear Cart Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to clear cart.",
    });
  }
};

// EXPORT ALL CONTROLLER FUNCTIONS
export {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
