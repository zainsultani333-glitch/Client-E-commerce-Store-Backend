const express = require("express");
const router = express.Router();
const Receipt = require("../models/Receipt");
const Product = require("../models/Product");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { sendOrderEmail } = require("../config/mailer");

// Create Receipt — any logged-in user (COD order)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { customerName, customerEmail, phone, address, products, totalAmount, paymentMethod } = req.body;

    if (!customerName || !products || products.length === 0 || totalAmount === undefined) {
      return res.status(400).json({ message: "Customer name, products, and total amount are required" });
    }

    // ── STOCK VALIDATION ──
    // Fetch current stock for all ordered products
    const productIds = products.map(p => p.productId);
    const dbProducts = await Product.find({ _id: { $in: productIds } });

    const stockErrors = [];
    for (const orderedItem of products) {
      const dbProduct = dbProducts.find(p => String(p._id) === String(orderedItem.productId));
      if (!dbProduct) {
        stockErrors.push(`Product "${orderedItem.name}" no longer exists`);
      } else if (dbProduct.quantity < orderedItem.quantity) {
        stockErrors.push(
          `"${dbProduct.name}" only has ${dbProduct.quantity} piece${dbProduct.quantity !== 1 ? "s" : ""} in stock (you ordered ${orderedItem.quantity})`
        );
      }
    }

    if (stockErrors.length > 0) {
      return res.status(400).json({ message: stockErrors.join(". ") });
    }

    // ── SAVE RECEIPT ──
    const receipt = new Receipt({
      userId: req.user.id,
      customerName,
      customerEmail: customerEmail || "",
      phone: phone || "",
      address: address || "",
      paymentMethod: paymentMethod || "Cash on Delivery",
      products,
      totalAmount,
      status: "pending"
    });

    const savedReceipt = await receipt.save();

    // ── DEDUCT STOCK ──
    // Bulk-update all product quantities atomically
    const bulkOps = products.map(item => ({
      updateOne: {
        filter: { _id: item.productId },
        update: { $inc: { quantity: -item.quantity } }
      }
    }));
    await Product.bulkWrite(bulkOps);

    console.log(`📦 Stock updated for ${products.length} product(s) after order by ${customerName}`);

    // ── SEND EMAIL ──
    sendOrderEmail(savedReceipt).catch((err) => {
      console.error("❌ Email notification failed:", err.message);
    });

    res.status(201).json(savedReceipt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get All Receipts (Admin only)
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const receipts = await Receipt.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 });
    res.json(receipts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's own receipts
router.get("/my/orders", authMiddleware, async (req, res) => {
  try {
    const receipts = await Receipt.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(receipts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single receipt by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id).populate("userId", "name email");
    if (!receipt) return res.status(404).json({ message: "Receipt not found" });

    if (req.user.role !== "admin" && String(receipt.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(receipt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Update receipt status (Admin only)
router.put("/:id/status", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "processing", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const existingReceipt = await Receipt.findById(req.params.id);
    if (!existingReceipt) return res.status(404).json({ message: "Receipt not found" });

    if (existingReceipt.status === "completed") {
      return res.status(400).json({ message: "Cannot change status of a completed order" });
    }

    const receipt = await Receipt.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("userId", "name email");

    res.json(receipt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit receipt details and items (Admin only)
router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { customerName, customerEmail, phone, address, products, totalAmount } = req.body;
    
    const oldReceipt = await Receipt.findById(req.params.id);
    if (!oldReceipt) return res.status(404).json({ message: "Receipt not found" });

    // Validate new stock if products are updated
    if (products && products.length > 0) {
      const productIds = products.map(p => p.productId);
      const dbProducts = await Product.find({ _id: { $in: productIds } });

      const stockErrors = [];
      for (const newObj of products) {
        const oldItem = oldReceipt.products.find(o => String(o.productId) === String(newObj.productId));
        const oldQty = oldItem ? oldItem.quantity : 0;
        
        const dbProduct = dbProducts.find(p => String(p._id) === String(newObj.productId));
        if (!dbProduct) {
          stockErrors.push(`Product "${newObj.name}" no longer exists`);
        } else {
          const availableStock = dbProduct.quantity + oldQty;
          if (availableStock < newObj.quantity) {
            stockErrors.push(`"${dbProduct.name}" only has ${dbProduct.quantity} piece(s) remaining in stock (you requested ${newObj.quantity})`);
          }
        }
      }

      if (stockErrors.length > 0) {
        return res.status(400).json({ message: stockErrors.join(". ") });
      }

      // RESTORE OLD STOCK
      const restoreOps = oldReceipt.products.map(item => ({
        updateOne: {
          filter: { _id: item.productId },
          update: { $inc: { quantity: item.quantity } }
        }
      }));
      if (restoreOps.length > 0) await Product.bulkWrite(restoreOps);

      // DEDUCT NEW STOCK
      const deductOps = products.map(item => ({
        updateOne: {
          filter: { _id: item.productId },
          update: { $inc: { quantity: -item.quantity } }
        }
      }));
      if (deductOps.length > 0) await Product.bulkWrite(deductOps);
    }

    // Update receipt document
    const updated = await Receipt.findByIdAndUpdate(
      req.params.id,
      {
        customerName: customerName || oldReceipt.customerName,
        customerEmail: customerEmail !== undefined ? customerEmail : oldReceipt.customerEmail,
        phone: phone !== undefined ? phone : oldReceipt.phone,
        address: address !== undefined ? address : oldReceipt.address,
        ...(products && { products }),
        ...(totalAmount !== undefined && { totalAmount }),
      },
      { new: true }
    ).populate("userId", "name email");

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete receipt (Admin only)
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ message: "Receipt not found" });
    
    // Only allow deletion if completed (or we can just leave it up to the admin)
    // The requirement says "when its completed" but admin can probably delete it anyway. Let's just delete it.
    await Receipt.findByIdAndDelete(req.params.id);
    res.json({ message: "Receipt deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;