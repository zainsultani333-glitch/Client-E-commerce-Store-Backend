const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "saleem-garments",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 800, height: 800, crop: "limit", quality: "auto" }],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Upload image (Admin only)
router.post("/", authMiddleware, adminMiddleware, upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }
    res.json({
      url: req.file.path,
      cloudinaryId: req.file.filename,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete image (Admin only)
router.delete("/:cloudinaryId", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const publicId = `saleem-garments/${req.params.cloudinaryId}`;
    await cloudinary.uploader.destroy(publicId);
    res.json({ message: "Image deleted from Cloudinary" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
