const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
require("dotenv").config();

const productRoutes = require("./routes/productRoutes");
const receiptRoutes = require("./routes/receiptRoutes");
const authRoutes = require("./routes/authRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true
}));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/products", productRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/upload", uploadRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Saleem E-Commerce API is running" });
});

// Auto-seed admin user on startup
async function seedAdmin() {
  try {
    const User = require("./models/User");
    const bcrypt = require("bcryptjs");

    const adminExists = await User.findOne({ role: "admin" });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      await User.create({
        name: "Admin",
        email: process.env.ADMIN_EMAIL,
        password: hashedPassword,
        role: "admin"
      });
      console.log(`✅ Admin account created: ${process.env.ADMIN_EMAIL}`);
    } else {
      console.log(`✅ Admin account: ${adminExists.email}`);
    }
  } catch (error) {
    console.error("❌ Error seeding admin:", error.message);
  }
}

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await seedAdmin();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📦 API: http://localhost:${PORT}/api`);
  });
});

module.exports = app;