# 🪔 Sri Kanniyamman Oil Mill — Deployment Guide

## Project Structure

```
sri-kanniyamman-oil-mill/
├── frontend/
│   ├── index.html          ← Main website
│   ├── css/style.css       ← All styles
│   └── js/app.js           ← Cart, orders, UI logic
├── backend/
│   ├── server.js           ← Express + MongoDB + Nodemailer
│   ├── package.json
│   └── .env.example        ← Environment variables template
├── render.yaml             ← Render.com deploy config
├── .gitignore
└── DEPLOY.md               ← This file
```

---

## STEP 1 — MongoDB Atlas Setup

1. Go to https://cloud.mongodb.com and create a free account
2. Create a new **Cluster** (free M0 tier)
3. Create a **Database User** with username & password
4. In **Network Access** → Add IP Address → `0.0.0.0/0` (allow all)
5. Click **Connect** → **Drivers** → copy the connection string
   - It looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`
   - Change `myFirstDatabase` to `kanniyamman_oil`

---

## STEP 2 — Gmail App Password Setup

1. Enable **2-Step Verification** on your Gmail account
2. Go to: https://myaccount.google.com/apppasswords
3. Select **App: Mail**, **Device: Other** → type `Nodemailer`
4. Copy the 16-character app password (format: `xxxx xxxx xxxx xxxx`)
5. This is your `EMAIL_PASS` in the `.env` file

---

## STEP 3 — Local Development

```bash
# Clone / navigate to project
cd sri-kanniyamman-oil-mill/backend

# Install dependencies
npm install

# Copy env template and fill in your values
cp .env.example .env
# Edit .env with your MongoDB URI, Gmail credentials

# Start development server
npm run dev

# Open frontend in browser
# Just open frontend/index.html in your browser
# Or use Live Server extension in VS Code
```

---

## STEP 4 — Deploy to Render.com

### 4a. Push to GitHub

```bash
cd sri-kanniyamman-oil-mill
git init
git add .
git commit -m "Initial commit - Sri Kanniyamman Oil Mill"
git remote add origin https://github.com/YOUR_USERNAME/kanniyamman-oil-mill.git
git push -u origin main
```

### 4b. Deploy Backend on Render

1. Go to https://render.com → **New** → **Web Service**
2. Connect your GitHub repo
3. Set:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
4. Add **Environment Variables** in Render dashboard:
   ```
   MONGO_URI        = mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/kanniyamman_oil
   EMAIL_USER       = yourgmail@gmail.com
   EMAIL_PASS       = xxxx xxxx xxxx xxxx
   SELLER_EMAIL     = kanniyammanoilscompraj@gmail.com
   PORT             = 5000
   ```
5. Click **Create Web Service**
6. Copy the backend URL (e.g., `https://sri-kanniyamman-backend.onrender.com`)

### 4c. Update Frontend with Backend URL

Edit `frontend/js/app.js` line 8:
```js
: 'https://sri-kanniyamman-backend.onrender.com'  // ← your actual backend URL
```

Commit and push the change.

### 4d. Deploy Frontend on Render

1. Go to Render → **New** → **Static Site**
2. Connect same GitHub repo
3. Set:
   - **Root Directory**: `frontend`
   - **Publish Directory**: `.`
   - **Build Command**: (leave empty)
4. Click **Create Static Site**
5. Copy the frontend URL → add it as `FRONTEND_URL` env var on the backend service

---

## STEP 5 — Test the Full Flow

1. Open the frontend URL
2. Add products to cart
3. Fill in checkout form with real details
4. "Pay" via UPI to `848944768`
5. Check the payment confirmation box
6. Click **I Have Paid – Place Order**
7. ✅ Check seller email for notification
8. ✅ Check customer email for confirmation
9. ✅ Verify order in MongoDB Atlas → Collections → `orders`

---

## API Endpoints

| Method | URL           | Description         |
|--------|---------------|---------------------|
| GET    | /api/health   | Health check        |
| GET    | /api/orders   | List all orders     |
| POST   | /api/orders   | Place a new order   |

### POST /api/orders — Request Body

```json
{
  "customerName": "Raj Kumar",
  "mobile": "9876543210",
  "email": "raj@email.com",
  "address": "12 Main Street, Anna Nagar",
  "city": "Chennai",
  "pincode": "600040",
  "products": [
    { "name": "Groundnut Oil", "qty": 2, "price": 200, "subtotal": 400 }
  ],
  "totalAmount": 400,
  "paymentStatus": "Paid (UPI - Unverified)"
}
```

---

## MongoDB Collections

**Collection name:** `orders`

Each document stores:
- `orderId` — Auto-generated (e.g., SKO-ABC123-XY89)
- `customerName`, `mobile`, `email`
- `address`, `city`, `pincode`
- `products[]` — Array of ordered items
- `totalAmount`
- `paymentStatus`
- `orderDate`
- `createdAt`, `updatedAt` (auto timestamps)

---

## Features Summary

✅ Responsive warm-toned UI (mobile + desktop)
✅ Product catalog with quantity selector
✅ Cart with localStorage persistence
✅ Checkout form with validation
✅ UPI payment instruction before order
✅ MongoDB order storage
✅ Seller email notification (Nodemailer)
✅ Customer confirmation email
✅ Auto-generated Order IDs
✅ Render.com deployment ready
✅ Google Maps embedded in Contact section

---

## Troubleshooting

**Email not sending?**
- Make sure 2FA is enabled on Gmail
- Use App Password, not regular password
- Check spam folder for test emails

**MongoDB not connecting?**
- Whitelist `0.0.0.0/0` in Atlas Network Access
- Double-check URI format and password

**CORS errors?**
- Update `FRONTEND_URL` env var on Render backend
- Redeploy backend after updating

**Render "Service Unavailable"?**
- Free tier spins down after 15 min inactivity
- First request takes ~30 sec to wake up
- Consider upgrading to paid plan for production
