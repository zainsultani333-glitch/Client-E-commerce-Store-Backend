const express = require("express");
const router = express.Router();
const { sendContactEmail } = require("../config/mailer");
const ContactMessage = require("../models/ContactMessage");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// @route   POST /api/contact
// @desc    Submit a contact form message
// @access  Public
router.post("/", async (req, res) => {
  try {
    const { firstName, lastName, email, subject, message } = req.body;

    if (!firstName || !email || !message) {
      return res.status(400).json({ message: "First name, email, and message are required." });
    }

    // Save to Database
    await ContactMessage.create({
      firstName,
      lastName: lastName || "",
      email,
      subject: subject || "General Inquiry",
      message,
    });

    // Send Email
    await sendContactEmail({
      firstName,
      lastName: lastName || "",
      email,
      subject: subject || "General Inquiry",
      message,
    });

    res.status(200).json({ message: "Your message has been sent successfully!" });
  } catch (error) {
    console.error("Error sending contact email:", error);
    res.status(500).json({ message: "Failed to send message. Please try again later." });
  }
});

// @route   GET /api/contact
// @desc    Get all contact messages
// @access  Private/Admin
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

// @route   PUT /api/contact/:id/read
// @desc    Mark a message as read
// @access  Private/Admin
router.put("/:id/read", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const message = await ContactMessage.findById(req.params.id);
    if (message) {
      message.status = "read";
      await message.save();
      res.json(message);
    } else {
      res.status(404).json({ message: "Message not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to update message" });
  }
});

// @route   DELETE /api/contact/:id
// @desc    Delete a message
// @access  Private/Admin
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const message = await ContactMessage.findById(req.params.id);
    if (message) {
      await message.deleteOne();
      res.json({ message: "Message removed" });
    } else {
      res.status(404).json({ message: "Message not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to delete message" });
  }
});

module.exports = router;
