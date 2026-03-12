const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

// ── MongoDB Connection (reuse across calls) ──
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGO_URI);
  isConnected = true;
}

// ── Schema ───────────────────────────────────
const productItemSchema = new mongoose.Schema({
  name:     String,
  qty:      Number,
  price:    Number,
  subtotal: Number
});

const orderSchema = new mongoose.Schema({
  orderId:       { type: String, unique: true },
  customerName:  { type: String, required: true },
  mobile:        { type: String, required: true },
  email:         { type: String, required: true },
  address:       { type: String, required: true },
  city:          { type: String, required: true },
  pincode:       { type: String, required: true },
  products:      [productItemSchema],
  totalAmount:   { type: Number, required: true },
  paymentStatus: { type: String, default: 'Paid (UPI - Unverified)' },
  orderDate:     { type: Date, default: Date.now }
}, { timestamps: true });

orderSchema.pre('save', function(next) {
  if (!this.orderId) {
    const ts   = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.orderId = `SKO-${ts}-${rand}`;
  }
  next();
});

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema, 'orders');

// ── Nodemailer ───────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

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
  <div style="font-family:Georgia,serif;max-width:640px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(61,28,2,0.12);">
    <div style="background:linear-gradient(135deg,#3D1C02,#2D5A30);padding:32px;text-align:center;">
      <div style="font-size:40px;margin-bottom:8px;">🪔</div>
      <h1 style="color:white;font-size:24px;margin:0 0 6px;">New Order Received!</h1>
      <p style="color:#E4A820;margin:0;font-size:14px;">Sri Kanniyamman Oil Mill</p>
    </div>
    <div style="background:#FFF9EC;padding:16px 32px;border-bottom:2px solid #F5D78E;text-align:center;">
      <p style="margin:0;font-size:13px;color:#8B5E3C;">Order ID</p>
      <p style="margin:4px 0 0;font-size:22px;font-weight:900;color:#C9860A;">${order.orderId}</p>
    </div>
    <div style="padding:28px 32px;">
      <h2 style="color:#3D1C02;font-size:18px;margin:0 0 20px;">👤 Customer Details</h2>
      <table style="width:100%;font-size:14px;">
        <tr><td style="padding:8px 0;color:#8B5E3C;width:140px;"><strong>Name:</strong></td><td>${order.customerName}</td></tr>
        <tr><td style="padding:8px 0;color:#8B5E3C;"><strong>Mobile:</strong></td><td>${order.mobile}</td></tr>
        <tr><td style="padding:8px 0;color:#8B5E3C;"><strong>Email:</strong></td><td>${order.email}</td></tr>
        <tr><td style="padding:8px 0;color:#8B5E3C;vertical-align:top;"><strong>Address:</strong></td><td>${order.address}, ${order.city} – ${order.pincode}</td></tr>
      </table>
    </div>
    <div style="padding:0 32px 28px;">
      <h2 style="color:#3D1C02;font-size:18px;margin:0 0 20px;">🛒 Ordered Products</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#FFF9EC;">
            <th style="padding:12px 10px;border:1px solid #e0c89e;text-align:left;">Product</th>
            <th style="padding:12px 10px;border:1px solid #e0c89e;">Qty</th>
            <th style="padding:12px 10px;border:1px solid #e0c89e;text-align:right;">Rate</th>
            <th style="padding:12px 10px;border:1px solid #e0c89e;text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>${productRows}</tbody>
      </table>
      <div style="margin-top:16px;padding:16px;background:#FFF9EC;border-radius:8px;border:2px solid #F5D78E;display:flex;justify-content:space-between;">
        <span style="font-size:16px;color:#3D1C02;font-weight:700;">Total Amount</span>
        <span style="font-size:24px;color:#C9860A;font-weight:900;">₹${order.totalAmount}</span>
      </div>
    </div>
    <div style="background:#F5E8C8;padding:16px 32px;text-align:center;">
      <p style="margin:0;font-size:13px;color:#6B3A1F;">📅 ${new Date(order.orderDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
    </div>
  </div>`;

  await transporter.sendMail({
    from: `"Sri Kanniyamman Oil Mill Orders" <${process.env.EMAIL_USER}>`,
    to: process.env.SELLER_EMAIL || 'kanniyammanoilscompraj@gmail.com',
    subject: `🛒 New Order ${order.orderId} — ₹${order.totalAmount} — ${order.customerName}`,
    html
  });
}

async function sendCustomerConfirmation(order) {
  const productList = order.products.map(p => `• ${p.name} × ${p.qty} litre — ₹${p.subtotal}`).join('\n');

  const html = `
  <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#3D1C02,#2D5A30);padding:32px;text-align:center;">
      <div style="font-size:40px;">🎉</div>
      <h1 style="color:white;font-size:22px;margin:8px 0 6px;">Order Confirmed!</h1>
      <p style="color:#E4A820;margin:0;font-size:13px;">Sri Kanniyamman Oil Mill</p>
    </div>
    <div style="padding:32px;">
      <p style="color:#1E0E00;font-size:16px;">Dear <strong>${order.customerName}</strong>,</p>
      <p style="color:#4A2C10;font-size:15px;line-height:1.7;">Thank you for ordering from <strong>Sri Kanniyamman Oil Mill</strong>! Your order has been received.</p>
      <div style="background:#FFF9EC;border:2px solid #F5D78E;border-radius:10px;padding:20px;margin:20px 0;">
        <p style="margin:0 0 10px;font-weight:700;color:#3D1C02;">Order ID: <span style="color:#C9860A;">${order.orderId}</span></p>
        <pre style="font-family:inherit;font-size:14px;color:#4A2C10;margin:0 0 16px;">${productList}</pre>
        <p style="margin:0;font-size:18px;font-weight:800;color:#C9860A;">Total: ₹${order.totalAmount}</p>
      </div>
      <p style="color:#4A2C10;font-size:14px;">Our team will contact you at <strong>${order.mobile}</strong> for delivery. For queries: <strong>84896 44768</strong></p>
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
}

// ── Main Handler ─────────────────────────────
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Database connection failed' });
  }

  // GET all orders
  if (req.method === 'GET') {
    try {
      const orders = await Order.find().sort({ createdAt: -1 }).limit(100);
      return res.status(200).json({ success: true, count: orders.length, orders });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // POST new order
  if (req.method === 'POST') {
    try {
      const {
        customerName, mobile, email, address, city, pincode,
        products: orderedProducts, totalAmount, paymentStatus, orderDate
      } = req.body;

      // Validation
      if (!customerName || !mobile || !email || !address || !city || !pincode) {
        return res.status(400).json({ success: false, message: 'All customer details are required.' });
      }
      if (!orderedProducts || orderedProducts.length === 0) {
        return res.status(400).json({ success: false, message: 'Order must have at least one product.' });
      }
      if (!/^[0-9]{10}$/.test(mobile)) {
        return res.status(400).json({ success: false, message: 'Invalid mobile number.' });
      }
      if (!/^[0-9]{6}$/.test(pincode)) {
        return res.status(400).json({ success: false, message: 'Invalid pincode.' });
      }

      const order = new Order({
        customerName, mobile, email, address, city, pincode,
        products: orderedProducts, totalAmount,
        paymentStatus: paymentStatus || 'Paid (UPI - Unverified)',
        orderDate: orderDate ? new Date(orderDate) : new Date()
      });

      await order.save();
      console.log(`📦 Order saved: ${order.orderId}`);

      // Send emails (non-blocking)
      Promise.allSettled([
        sendSellerNotification(order),
        sendCustomerConfirmation(order)
      ]).then(results => {
        results.forEach((r, i) => {
          if (r.status === 'rejected') {
            console.error(`Email ${i === 0 ? 'seller' : 'customer'} failed:`, r.reason?.message);
          } else {
            console.log(`✅ Email ${i === 0 ? 'seller' : 'customer'} sent`);
          }
        });
      });

      return res.status(201).json({
        success: true,
        message: 'Order placed successfully!',
        orderId: order.orderId
      });

    } catch (err) {
      console.error('Order error:', err);
      return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
};
