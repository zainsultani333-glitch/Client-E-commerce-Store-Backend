const express = require("express");
const router = express.Router();
const { sendContactEmail } = require("../config/mailer");

router.post("/", async (req, res) => {
  try {
    const { firstName, lastName, email, subject, message } = req.body;

    if (!firstName || !email || !message) {
      return res.status(400).json({ message: "First name, email, and message are required." });
    }

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

module.exports = router;
