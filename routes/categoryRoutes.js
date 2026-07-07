const express = require("express");
const Category = require("../models/Category");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// Get all categories (Public or Admin depending on requirement, let's make it public so frontend can show them)
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create a category
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = await Category.create({ name, description });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update a category
router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    category.name = name || category.name;
    category.description = description !== undefined ? description : category.description;

    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete a category
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await category.deleteOne();
    res.json({ message: "Category removed" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
