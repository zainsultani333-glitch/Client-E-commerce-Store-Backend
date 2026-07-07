const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    default: ""
  },
  phone: {
    type: String,
    default: ""
  },
  address: {
    type: String,
    default: ""
  },
  paymentMethod: {
    type: String,
    default: "Cash on Delivery"
  },
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
      },
      name: { type: String, required: true },
      category: { type: String, default: "" },
      quantity: { type: Number, required: true, min: 1 },
      price: { type: Number, required: true }
    }
  ],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "processing", "shipped", "completed", "cancelled"],
    default: "pending"
  }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);