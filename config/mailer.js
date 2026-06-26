const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send order notification email to admin
 */
async function sendOrderEmail(receipt) {
  const itemsHtml = receipt.products
    .map(
      (p) =>
        `<tr>
          <td style="padding:10px 16px;border-bottom:1px solid #2a2a2a;">${p.name}${p.category ? ` <span style="color:#c9a84c;font-size:11px;">(${p.category})</span>` : ""}</td>
          <td style="padding:10px 16px;border-bottom:1px solid #2a2a2a;text-align:center;">${p.quantity}</td>
          <td style="padding:10px 16px;border-bottom:1px solid #2a2a2a;text-align:right;">Rs. ${p.price.toLocaleString()}</td>
          <td style="padding:10px 16px;border-bottom:1px solid #2a2a2a;text-align:right;font-weight:bold;color:#c9a84c;">Rs. ${(p.price * p.quantity).toLocaleString()}</td>
        </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>New Order</title></head>
<body style="margin:0;padding:0;background:#0d0d0f;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#141417,#1e1e24);border:1px solid rgba(201,168,76,0.3);border-radius:16px;overflow:hidden;margin-bottom:24px;">
      <div style="background:linear-gradient(90deg,#c9a84c,#e8c96e,#c9a84c);height:4px;"></div>
      <div style="padding:28px 32px;text-align:center;">
        <div style="width:52px;height:52px;background:linear-gradient(135deg,#c9a84c,#e8c96e);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#0d0d0f;margin-bottom:12px;">S</div>
        <h1 style="margin:0;color:#f5f5f0;font-size:20px;">🛒 New Order Received!</h1>
        <p style="margin:6px 0 0;color:#a8a89e;font-size:13px;">Saleem's Garments — Admin Notification</p>
      </div>
    </div>

    <!-- Customer Info -->
    <div style="background:#141417;border:1px solid #222;border-radius:12px;padding:24px;margin-bottom:16px;">
      <h2 style="margin:0 0 16px;color:#c9a84c;font-size:14px;text-transform:uppercase;letter-spacing:1px;">📋 Customer Details</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#a8a89e;font-size:13px;width:120px;">Name</td><td style="padding:6px 0;color:#f5f5f0;font-weight:600;">${receipt.customerName}</td></tr>
        <tr><td style="padding:6px 0;color:#a8a89e;font-size:13px;">Phone</td><td style="padding:6px 0;color:#f5f5f0;font-weight:600;">${receipt.phone || "—"}</td></tr>
        <tr><td style="padding:6px 0;color:#a8a89e;font-size:13px;">Email</td><td style="padding:6px 0;color:#f5f5f0;">${receipt.customerEmail || "—"}</td></tr>
        <tr><td style="padding:6px 0;color:#a8a89e;font-size:13px;">Address</td><td style="padding:6px 0;color:#f5f5f0;">${receipt.address || "—"}</td></tr>
        <tr><td style="padding:6px 0;color:#a8a89e;font-size:13px;">Payment</td><td style="padding:6px 0;"><span style="background:rgba(34,197,94,0.15);color:#4ade80;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;">💵 ${receipt.paymentMethod || "Cash on Delivery"}</span></td></tr>
      </table>
    </div>

    <!-- Order Items -->
    <div style="background:#141417;border:1px solid #222;border-radius:12px;overflow:hidden;margin-bottom:16px;">
      <div style="padding:16px 20px;border-bottom:1px solid #222;">
        <h2 style="margin:0;color:#c9a84c;font-size:14px;text-transform:uppercase;letter-spacing:1px;">🧾 Order Items</h2>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#1a1a1f;">
            <th style="padding:10px 16px;text-align:left;color:#65655e;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Product</th>
            <th style="padding:10px 16px;text-align:center;color:#65655e;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Qty</th>
            <th style="padding:10px 16px;text-align:right;color:#65655e;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Unit Price</th>
            <th style="padding:10px 16px;text-align:right;color:#65655e;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Subtotal</th>
          </tr>
        </thead>
        <tbody style="color:#f5f5f0;font-size:14px;">
          ${itemsHtml}
        </tbody>
      </table>
      <div style="padding:16px 20px;background:#1a1a1f;display:flex;justify-content:space-between;align-items:center;">
        <span style="color:#a8a89e;font-size:13px;">${receipt.products.length} item${receipt.products.length !== 1 ? "s" : ""} · ${receipt.products.reduce((s, i) => s + i.quantity, 0)} pieces</span>
        <div style="text-align:right;">
          <span style="color:#a8a89e;font-size:13px;">Grand Total: </span>
          <span style="color:#c9a84c;font-size:22px;font-weight:900;">Rs. ${receipt.totalAmount.toLocaleString()}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:16px;">
      <p style="color:#65655e;font-size:12px;margin:0;">
        Order Date: ${new Date(receipt.createdAt).toLocaleString("en-PK", { dateStyle: "long", timeStyle: "short" })}
        <br>Receipt ID: #${String(receipt._id).slice(-8).toUpperCase()}
      </p>
      <p style="color:#65655e;font-size:11px;margin:8px 0 0;">Saleem's Garments Admin Panel — zainsultani333@gmail.com</p>
    </div>

  </div>
</body>
</html>`;

  const mailOptions = {
    from: `"Saleem's Garments 🛍️" <${process.env.EMAIL_USER}>`,
    to: process.env.NOTIFY_EMAIL,
    subject: `🛒 New Order — ${receipt.customerName} | Rs. ${receipt.totalAmount.toLocaleString()}`,
    html,
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Send contact form submission email to admin
 */
async function sendContactEmail(contactData) {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>New Contact Message</title></head>
<body style="margin:0;padding:0;background:#0d0d0f;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#141417,#1e1e24);border:1px solid rgba(201,168,76,0.3);border-radius:16px;overflow:hidden;margin-bottom:24px;">
      <div style="background:linear-gradient(90deg,#c9a84c,#e8c96e,#c9a84c);height:4px;"></div>
      <div style="padding:28px 32px;text-align:center;">
        <div style="width:52px;height:52px;background:linear-gradient(135deg,#c9a84c,#e8c96e);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#0d0d0f;margin-bottom:12px;">✉️</div>
        <h1 style="margin:0;color:#f5f5f0;font-size:20px;">New Contact Message!</h1>
        <p style="margin:6px 0 0;color:#a8a89e;font-size:13px;">Saleem's Garments — Admin Notification</p>
      </div>
    </div>

    <!-- Customer Info -->
    <div style="background:#141417;border:1px solid #222;border-radius:12px;padding:24px;margin-bottom:16px;">
      <h2 style="margin:0 0 16px;color:#c9a84c;font-size:14px;text-transform:uppercase;letter-spacing:1px;">👤 Sender Details</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#a8a89e;font-size:13px;width:120px;">Name</td><td style="padding:6px 0;color:#f5f5f0;font-weight:600;">${contactData.firstName} ${contactData.lastName}</td></tr>
        <tr><td style="padding:6px 0;color:#a8a89e;font-size:13px;">Email</td><td style="padding:6px 0;color:#f5f5f0;">${contactData.email}</td></tr>
        <tr><td style="padding:6px 0;color:#a8a89e;font-size:13px;">Subject</td><td style="padding:6px 0;color:#f5f5f0;font-weight:600;">${contactData.subject}</td></tr>
      </table>
    </div>

    <!-- Message -->
    <div style="background:#141417;border:1px solid #222;border-radius:12px;padding:24px;margin-bottom:16px;">
      <h2 style="margin:0 0 16px;color:#c9a84c;font-size:14px;text-transform:uppercase;letter-spacing:1px;">📝 Message</h2>
      <p style="color:#f5f5f0;font-size:14px;line-height:1.6;margin:0;white-space:pre-wrap;">${contactData.message}</p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:16px;">
      <p style="color:#65655e;font-size:12px;margin:0;">
        Received: ${new Date().toLocaleString("en-PK", { dateStyle: "long", timeStyle: "short" })}
      </p>
      <p style="color:#65655e;font-size:11px;margin:8px 0 0;">Saleem's Garments Admin Panel</p>
    </div>

  </div>
</body>
</html>`;

  const mailOptions = {
    from: `"Saleem's Garments 🛍️" <${process.env.EMAIL_USER}>`,
    to: process.env.NOTIFY_EMAIL,
    subject: `✉️ New Contact: ${contactData.subject} — ${contactData.firstName} ${contactData.lastName}`,
    html,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendOrderEmail, sendContactEmail };
