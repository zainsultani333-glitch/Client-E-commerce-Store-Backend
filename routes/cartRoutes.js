const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const authMiddleware = require("../middleware/authMiddleware");

// 1. Get user's cart
router.get("/", authMiddleware, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id }).populate("items.product");
    
    if (!cart) {
      cart = await Cart.create({ userId: req.user.id, items: [] });
    }
    
    // Filter out items where the product no longer exists in DB (was deleted)
    const initialLength = cart.items.length;
    cart.items = cart.items.filter(item => item.product != null);
    
    if (cart.items.length !== initialLength) {
      await cart.save();
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Sync full cart (frontend sends the current state, backend overwrites)
router.post("/sync", authMiddleware, async (req, res) => {
  try {
    const { items } = req.body; 
    // Expecting items: [{ productId, qty, size, color }]

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      cart = new Cart({ userId: req.user.id, items: [] });
    }

    // Map frontend structure to backend schema
    cart.items = items.map(item => ({
      product: item.productId,
      qty: item.qty,
      size: item.size || "",
      color: item.color || ""
    }));

    await cart.save();
    
    // Populate before returning
    await cart.populate("items.product");
    
    // Safety filter
    cart.items = cart.items.filter(item => item.product != null);

    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
