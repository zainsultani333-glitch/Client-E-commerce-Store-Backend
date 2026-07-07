const express = require("express");
const router = express.Router();
const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");
const authMiddleware = require("../middleware/authMiddleware");

// @route   GET /api/wishlist
// @desc    Get user's wishlist
// @access  Private
router.get("/", authMiddleware, async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ userId: req.user.id }).populate("products");
    
    if (!wishlist) {
      wishlist = await Wishlist.create({ userId: req.user.id, products: [] });
    }
    
    res.json(wishlist.products);
  } catch (error) {
    console.error("Fetch wishlist error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route   POST /api/wishlist/toggle
// @desc    Add or remove a product from wishlist
// @access  Private
router.post("/toggle", authMiddleware, async (req, res) => {
  try {
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    let wishlist = await Wishlist.findOne({ userId: req.user.id });
    
    if (!wishlist) {
      wishlist = await Wishlist.create({ userId: req.user.id, products: [productId] });
      await wishlist.populate("products");
      return res.json(wishlist.products);
    }
    
    const productIndex = wishlist.products.indexOf(productId);
    
    if (productIndex > -1) {
      // Remove if exists
      wishlist.products.splice(productIndex, 1);
    } else {
      // Add if doesn't exist
      wishlist.products.push(productId);
    }
    
    await wishlist.save();
    await wishlist.populate("products");
    
    res.json(wishlist.products);
  } catch (error) {
    console.error("Toggle wishlist error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
