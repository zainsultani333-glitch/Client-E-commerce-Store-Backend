const express = require("express");
const Product = require("../models/Product");
const cloudinary = require("../config/cloudinary");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// Get all products (Public)
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single product by ID (Public)
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add product (Admin only)
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description, price, quantity, category, sizes, colors, images, cloudinaryIds } = req.body;

    if (!name || price === undefined || quantity === undefined) {
      return res.status(400).json({ message: "Name, price and quantity are required" });
    }

    const product = await Product.create({ name, description, price, quantity, category, sizes, colors, images, cloudinaryIds });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update product (Admin only)
router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const existing = await Product.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Product not found" });

    // Find removed images and delete them from Cloudinary
    if (req.body.cloudinaryIds && Array.isArray(existing.cloudinaryIds)) {
      const removedIds = existing.cloudinaryIds.filter(id => !req.body.cloudinaryIds.includes(id));
      for (const id of removedIds) {
        try {
          await cloudinary.uploader.destroy(`saleem-garments/${id}`);
        } catch (e) {
          console.warn("Could not delete old Cloudinary image:", e.message);
        }
      }
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete product (Admin only) — also deletes image from Cloudinary
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Delete from Cloudinary if images exist
    if (product.cloudinaryIds && product.cloudinaryIds.length > 0) {
      for (const id of product.cloudinaryIds) {
        try {
          await cloudinary.uploader.destroy(`saleem-garments/${id}`);
          console.log(`🗑️ Deleted Cloudinary image: ${id}`);
        } catch (e) {
          console.warn("Could not delete Cloudinary image:", e.message);
        }
      }
    }

    await product.deleteOne();
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;