const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true // One cart per user
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
      },
      qty: { type: Number, required: true, min: 1 },
      size: { type: String, default: "" },
      color: { type: String, default: "" }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Cart", cartSchema);
