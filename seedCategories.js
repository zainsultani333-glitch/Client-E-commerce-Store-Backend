const mongoose = require("mongoose");
require("dotenv").config();
const Category = require("./models/Category");
const connectDB = require("./config/db");

const seedCategories = async () => {
  try {
    await connectDB();
    const categories = ["Shirts", "Hoodies", "Shorts", "Trousers"];
    for (const name of categories) {
      const exists = await Category.findOne({ name });
      if (!exists) {
        await Category.create({ name, description: `High quality ${name.toLowerCase()} for all.` });
        console.log(`Created category: ${name}`);
      } else {
        console.log(`Category already exists: ${name}`);
      }
    }
    console.log("Seeding complete.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding categories:", error);
    process.exit(1);
  }
};

seedCategories();
