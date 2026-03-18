// ═══════════════════════════════════════════
//  SRI KANNIYAMMAN OIL MILL — BACKEND SERVER
//  Node.js + Express + MongoDB + Nodemailer
// ═══════════════════════════════════════════

require('dotenv').config();

const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const nodemailer = require('nodemailer');
const path       = require('path');
const multer     = require("multer");
const app        = express();
const PORT       = process.env.PORT || 5000;

// ── Multer (Screenshot Upload) ──────────────
const upload = multer({ dest: "uploads/" });

// ── Middleware ──────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Serve frontend static files (for combined deploy)
app.use(express.static(path.join(__dirname, '../frontend')));

// ── MongoDB Connection ──────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kanniyamman_oil';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// ── Mongoose Schema ─────────────────────────
const productItemSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  qty:      { type: Number, required: true, min: 1 },
  price:    { type: Number, required: true },
  subtotal: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema({
  orderId:       { type: String, unique: true },
  customerName:  { type: String, required: true, trim: true },
  mobile:        { type: String, required: true, trim: true },
  email:         { type: String, required: true, trim: true, lowercase: true },
  address:       { type: String, required: true, trim: true },
  city:          { type: String, required: true, trim: true },
  pincode:       { type: String, required: true, trim: true },
  products:      [productItemSchema],
  totalAmount:   { type: Number, required: true },
  paymentStatus: { type: String, default: 'Paid (UPI - Unverified)' },
  orderDate:     { type: Date,   default: Date.now }
}, { timestamps: true });

// Auto-generate Order ID
orderSchema.pre('save', function(next) {
  if (!this.orderId) {
    const ts   = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.orderId = `SKO-${ts}-${rand}`;
  }
  next();
});

const Order = mongoose.model('Order', orderSchema, 'orders');

// ── Nodemailer Transporter ──────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,   // your gmail
    pass: process.env.EMAIL_PASS    // gmail App Password
  }
});

transporter.verify((error) => {
  if (error) {
    console.error("❌ Gmail Auth Failed:", error.message);
  } else {
    console.log("✅ Gmail ready to send emails!");
  }
});

// ── Email: Seller Notification ──────────────
async function sendSellerNotification(order) {
  const productRows = order.products.map(p =>
    `<tr>
      <td style="padding:10px;border:1px solid #e0c89e;">${p.name}</td>
      <td style="padding:10px;border:1px solid #e0c89e;text-align:center;">${p.qty} litre${p.qty > 1 ? 's' : ''}</td>
      <td style="padding:10px;border:1px solid #e0c89e;text-align:right;">₹${p.price}/L</td>
      <td style="padding:10px;border:1px solid #e0c89e;text-align:right;font-weight:bold;">₹${p.subtotal}</td>
    </tr>`
  ).join('');

  const html = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="UTF-8"/></head>
  <body style="font-family:'Georgia',serif;background:#FDF6EC;margin:0;padding:20px;">
    <div style="max-width:640px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(61,28,2,0.12);">
      
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#3D1C02,#2D5A30);padding:32px;text-align:center;">
        <div style="font-size:40px;margin-bottom:8px;">🪔</div>
        <h1 style="color:white;font-size:24px;margin:0 0 6px;">New Order Received!</h1>
        <p style="color:#E4A820;margin:0;font-size:14px;letter-spacing:0.1em;text-transform:uppercase;">Sri Kanniyamman Oil Mill</p>
      </div>

      <!-- Order ID -->
      <div style="background:#FFF9EC;padding:16px 32px;border-bottom:2px solid #F5D78E;text-align:center;">
        <p style="margin:0;font-size:13px;color:#8B5E3C;">Order ID</p>
        <p style="margin:4px 0 0;font-size:22px;font-weight:900;color:#C9860A;letter-spacing:0.06em;">${order.orderId}</p>
      </div>

      <!-- Customer Details -->
      <div style="padding:28px 32px;">
        <h2 style="color:#3D1C02;font-size:18px;margin:0 0 20px;padding-bottom:10px;border-bottom:2px solid #F5E8C8;">
          👤 Customer Details
        </h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr>
            <td style="padding:8px 0;color:#8B5E3C;width:160px;"><strong>Name:</strong></td>
            <td style="padding:8px 0;color:#1E0E00;">${order.customerName}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#8B5E3C;"><strong>Mobile:</strong></td>
            <td style="padding:8px 0;color:#1E0E00;">${order.mobile}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#8B5E3C;"><strong>Email:</strong></td>
            <td style="padding:8px 0;color:#1E0E00;">${order.email}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#8B5E3C;vertical-align:top;"><strong>Address:</strong></td>
            <td style="padding:8px 0;color:#1E0E00;">${order.address}, ${order.city} – ${order.pincode}</td>
          </tr>
        </table>
      </div>

      <!-- Order Items -->
      <div style="padding:0 32px 28px;">
        <h2 style="color:#3D1C02;font-size:18px;margin:0 0 20px;padding-bottom:10px;border-bottom:2px solid #F5E8C8;">
          🛒 Ordered Products
        </h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#FFF9EC;">
              <th style="padding:12px 10px;border:1px solid #e0c89e;text-align:left;color:#6B3A1F;">Product</th>
              <th style="padding:12px 10px;border:1px solid #e0c89e;color:#6B3A1F;">Qty</th>
              <th style="padding:12px 10px;border:1px solid #e0c89e;color:#6B3A1F;text-align:right;">Rate</th>
              <th style="padding:12px 10px;border:1px solid #e0c89e;color:#6B3A1F;text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>${productRows}</tbody>
        </table>

        <!-- Total -->
        <div style="margin-top:16px;padding:16px;background:#FFF9EC;border-radius:8px;border:2px solid #F5D78E;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:16px;color:#3D1C02;font-weight:700;">Total Amount</span>
          <span style="font-size:24px;color:#C9860A;font-weight:900;">₹${order.totalAmount}</span>
        </div>
      </div>

      <!-- Payment Status -->
      <div style="padding:0 32px 28px;">
        <div style="background:#F0FFF0;border:2px solid #4E8F52;border-radius:8px;padding:16px;text-align:center;">
          <span style="font-size:20px;">✅</span>
          <p style="margin:4px 0 0;color:#2D5A30;font-weight:700;">Payment Status: ${order.paymentStatus}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#4E8F52;">Please verify UPI payment before dispatching.</p>
        </div>
      </div>

      <!-- Order Date -->
      <div style="background:#F5E8C8;padding:16px 32px;text-align:center;">
        <p style="margin:0;font-size:13px;color:#6B3A1F;">
          📅 Order placed on: <strong>${new Date(order.orderDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</strong>
        </p>
      </div>

    </div>
  </body>
  </html>`;

  const mailOptions = {
    from: `"Sri Kanniyamman Oil Mill Orders" <${process.env.EMAIL_USER}>`,
    to: [process.env.EMAIL_USER, process.env.SELLER_EMAIL || 'kanniyammanoilscompraj@gmail.com', order.email],
    subject: `🛒 New Order ${order.orderId} — ₹${order.totalAmount} — ${order.customerName}`,
    html
  };

  await transporter.sendMail(mailOptions);
  console.log(`✅ Seller notification sent to EMAIL_USER, SELLER & BUYER for order ${order.orderId}`);
}

// ── Email: Customer Confirmation ────────────
async function sendCustomerConfirmation(order) {
  const productList = order.products
    .map(p => `• ${p.name} × ${p.qty} litre — ₹${p.subtotal}`)
    .join('\n');

  const html = `
  <div style="font-family:'Georgia',serif;max-width:560px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(61,28,2,0.1);">
    <div style="background:linear-gradient(135deg,#3D1C02,#2D5A30);padding:32px;text-align:center;">
      <div style="font-size:40px;margin-bottom:8px;">🎉</div>
      <h1 style="color:white;font-size:22px;margin:0 0 6px;">Order Confirmed!</h1>
      <p style="color:#E4A820;margin:0;font-size:13px;">Sri Kanniyamman Oil Mill</p>
    </div>
    <div style="padding:32px;">
      <p style="color:#1E0E00;font-size:16px;">Dear <strong>${order.customerName}</strong>,</p>
      <p style="color:#4A2C10;font-size:15px;line-height:1.7;">
        Thank you for ordering from <strong>Sri Kanniyamman Oil Mill</strong>! 
        Your order has been received and we will process it shortly.
      </p>
      <div style="background:#FFF9EC;border:2px solid #F5D78E;border-radius:10px;padding:20px;margin:20px 0;">
        <p style="margin:0 0 10px;font-weight:700;color:#3D1C02;">Order ID: <span style="color:#C9860A;">${order.orderId}</span></p>
        <p style="margin:0 0 12px;font-size:13px;color:#8B5E3C;">Items ordered:</p>
        <pre style="font-family:inherit;font-size:14px;color:#4A2C10;margin:0 0 16px;">${productList}</pre>
        <p style="margin:0;font-size:18px;font-weight:800;color:#C9860A;">Total: ₹${order.totalAmount}</p>
      </div>
      <p style="color:#4A2C10;font-size:14px;line-height:1.7;">
        Our team will contact you at <strong>${order.mobile}</strong> for delivery confirmation.
        For any queries, reach us at <strong>84896 44768</strong>.
      </p>
    </div>
    <div style="background:#F5E8C8;padding:16px 32px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#6B3A1F;">Pure Traditional Wood Pressed Oils | Krishnagiri</p>
    </div>
  </div>`;

  await transporter.sendMail({
    from: `"Sri Kanniyamman Oil Mill" <${process.env.EMAIL_USER}>`,
    to: order.email,
    subject: `✅ Order Confirmed: ${order.orderId} — Sri Kanniyamman Oil Mill`,
    html
  });
  console.log(`✅ Customer confirmation sent to ${order.email}`);
}

// ── Email: Screenshot to Seller + Admin ─────
async function sendScreenshotEmail(order, file) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: [process.env.EMAIL_USER, process.env.SELLER_EMAIL, order.email],
    subject: `📸 UPI Payment Screenshot — Order ${order.orderId} — ${order.customerName}`,
    html: `
      <h3>📸 UPI Payment Screenshot</h3>
      <p><b>Order ID:</b> ${order.orderId}</p>
      <p><b>Name:</b> ${order.customerName}</p>
      <p><b>Phone:</b> ${order.mobile}</p>
      <p><b>Email:</b> ${order.email}</p>
      <p><b>Address:</b> ${order.address}, ${order.city} – ${order.pincode}</p>
      <p><b>Total:</b> ₹${order.totalAmount}</p>
      <p style="color:orange;"><b>⚠️ Please verify this UPI screenshot before dispatching the order.</b></p>
    `,
    attachments: [{ filename: file.originalname, path: file.path }]
  });
  console.log(`✅ Screenshot email sent for order ${order.orderId}`);
}

// ── API ROUTES ──────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Sri Kanniyamman Oil Mill API is running', timestamp: new Date() });
});

// GET all orders (admin)
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ POST — Place order + send ALL 3 emails (order confirmation + screenshot)
app.post('/api/orders', upload.single('screenshot'), async (req, res) => {
  try {
    console.log("📦 Order route HIT");
    console.log("📎 File received:", req.file ? req.file.originalname : "❌ No file");

    const {
      customerName, mobile, email, address, city, pincode,
      products: orderedProducts, totalAmount, paymentStatus, orderDate
    } = req.body;

    // Basic validation
    if (!customerName || !mobile || !email || !address || !city || !pincode) {
      return res.status(400).json({ success: false, message: 'All customer details are required.' });
    }
    if (!orderedProducts || orderedProducts.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one product.' });
    }
    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid total amount.' });
    }
    if (!/^[0-9]{10}$/.test(mobile)) {
      return res.status(400).json({ success: false, message: 'Invalid mobile number.' });
    }
    if (!/^[0-9]{6}$/.test(pincode)) {
      return res.status(400).json({ success: false, message: 'Invalid pincode.' });
    }

    // ✅ Parse products (sent as JSON string via FormData)
    const products = typeof orderedProducts === 'string'
      ? JSON.parse(orderedProducts)
      : orderedProducts;

    // Save to DB
    const order = new Order({
      customerName, mobile, email, address, city, pincode,
      products, totalAmount,
      paymentStatus: paymentStatus || 'Paid (UPI - Unverified)',
      orderDate: orderDate ? new Date(orderDate) : new Date()
    });

    await order.save();
    console.log(`📦 New order saved: ${order.orderId}`);

    // ✅ Send ALL 3 emails together (non-blocking)
    Promise.allSettled([
      sendSellerNotification(order),               // → seller email: order details
      sendCustomerConfirmation(order),             // → customer email: confirmation
      req.file ? sendScreenshotEmail(order, req.file) : Promise.resolve()  // → both emails: screenshot
    ]).then(results => {
      const labels = ['Seller notification', 'Customer confirmation', 'Screenshot email'];
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.error(`❌ ${labels[i]} failed:`, r.reason?.message);
        }
      });
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      orderId: order.orderId
    });

  } catch (err) {
    console.error('Order error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: Object.values(err.errors).map(e => e.message).join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// Catch-all: serve frontend
// Catch-all: API only (frontend hosted separately on Netlify)
app.get('*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// ── Start Server ────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🪔 Sri Kanniyamman Oil Mill Server`);
  console.log(`🚀 Running on port ${PORT}`);
  console.log(`📦 MongoDB: ${MONGO_URI.replace(/\/\/.*@/, '//***@')}`);
  console.log(`─────────────────────────────────\n`);
});
