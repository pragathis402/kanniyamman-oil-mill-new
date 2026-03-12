/* ═══════════════════════════════════════════
   SRI KANNIYAMMAN OIL MILL — FRONTEND JS
═══════════════════════════════════════════ */

// ──────────────────────────────────────────
//  CONFIG — change BACKEND_URL after deploy
// ──────────────────────────────────────────
const BACKEND_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'https://kanniyamman-backend.onrender.com';// Update after Render deploy

// ──────────────────────────────────────────
//  PRODUCTS DATA
// ──────────────────────────────────────────
const products = [
  {
    id: 'groundnut',
    name: 'Groundnut Oil',
    emoji: '🥜',
    price: 200,
    unit: 'litre',
    badge: 'Best Seller',
    desc: 'Rich in Vitamin E & antioxidants. Ideal for deep frying and everyday cooking.'
  },
  {
    id: 'coconut',
    name: 'Coconut Oil',
    emoji: '🥥',
    price: 450,
    unit: 'litre',
    badge: 'Premium',
    desc: 'Virgin cold-pressed coconut oil. Great for cooking, hair care, and skin care.'
  },
  {
    id: 'gingelly',
    name: 'Gingelly Oil',
    emoji: '🌾',
    price: 400,
    unit: 'litre',
    badge: 'Traditional',
    desc: 'Pure sesame oil loaded with sesamin and sesamolin. Perfect for pickles & curries.'
  }
];

// ──────────────────────────────────────────
//  CART
// ──────────────────────────────────────────
let cart = JSON.parse(localStorage.getItem('kanniyamman_cart') || '[]');

function saveCart() {
  localStorage.setItem('kanniyamman_cart', JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById('cartBadge').textContent = total;
}

function getCartItem(id) {
  return cart.find(i => i.id === id);
}

function addToCart(id) {
  const product = products.find(p => p.id === id);
  const qtyInput = document.getElementById(`qty-${id}`);
  const qty = parseInt(qtyInput.value) || 1;

  if (qty < 1) { alert('Please select at least 1 litre.'); return; }
  if (qty > 50) { alert('Maximum 50 litres per order.'); return; }

  const existing = getCartItem(id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id, name: product.name, price: product.price, qty, emoji: product.emoji });
  }

  saveCart();
  renderCart();
  renderCheckoutSummary();

  // Button feedback
  const btn = document.getElementById(`add-btn-${id}`);
  btn.textContent = '✅ Added!';
  btn.classList.add('added');
  setTimeout(() => {
    btn.innerHTML = `🛒 Add to Cart`;
    btn.classList.remove('added');
  }, 1800);
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  renderCart();
  renderCheckoutSummary();
}

function changeQty(id, delta) {
  const item = getCartItem(id);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart();
  renderCart();
  renderCheckoutSummary();
}

// ──────────────────────────────────────────
//  RENDER PRODUCTS
// ──────────────────────────────────────────
function renderProducts() {
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = products.map(p => `
    <div class="product-card reveal">
      <div class="product-image">
        <span>${p.emoji}</span>
        <span class="product-badge">${p.badge}</span>
      </div>
      <div class="product-info">
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.desc}</p>
        <div class="product-price">₹${p.price} <span>/ ${p.unit}</span></div>
        <div class="qty-control">
          <label>Qty (litres):</label>
          <div class="qty-wrap">
            <button class="qty-btn" onclick="changeProductQty('${p.id}', -1)">−</button>
            <input class="qty-input" type="number" id="qty-${p.id}" value="1" min="1" max="50" />
            <button class="qty-btn" onclick="changeProductQty('${p.id}', 1)">+</button>
          </div>
        </div>
        <button class="add-cart-btn" id="add-btn-${p.id}" onclick="addToCart('${p.id}')">
          🛒 Add to Cart
        </button>
      </div>
    </div>
  `).join('');
  observeReveal();
}

function changeProductQty(id, delta) {
  const input = document.getElementById(`qty-${id}`);
  let val = parseInt(input.value) + delta;
  val = Math.max(1, Math.min(50, val));
  input.value = val;
}

// ──────────────────────────────────────────
//  RENDER CART
// ──────────────────────────────────────────
function renderCart() {
  const container = document.getElementById('cartItems');
  const empty = document.getElementById('cartEmpty');
  const summary = document.getElementById('cartSummary');

  if (cart.length === 0) {
    container.innerHTML = '';
    empty.style.display = 'block';
    summary.style.display = 'none';
    return;
  }

  empty.style.display = 'none';
  summary.style.display = 'block';

  container.innerHTML = cart.map(item => `
    <div class="cart-item" id="cart-item-${item.id}">
      <div class="cart-item-icon">${item.emoji}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">₹${item.price} × ${item.qty} litre${item.qty > 1 ? 's' : ''}</div>
      </div>
      <div class="cart-item-qty">
        <button class="cart-qty-btn" onclick="changeQty('${item.id}', -1)">−</button>
        <strong style="min-width:24px;text-align:center;">${item.qty}</strong>
        <button class="cart-qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
      </div>
      <div class="cart-item-total">₹${item.price * item.qty}</div>
      <button class="remove-btn" onclick="removeFromCart('${item.id}')" title="Remove">✕</button>
    </div>
  `).join('');

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  document.getElementById('cartSubtotal').textContent = `₹${total}`;
  document.getElementById('cartTotal').textContent = `₹${total}`;
}

// ──────────────────────────────────────────
//  CHECKOUT SUMMARY
// ──────────────────────────────────────────
function renderCheckoutSummary() {
  const container = document.getElementById('checkoutItems');
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  if (cart.length === 0) {
    container.innerHTML = '<p style="color:var(--text-light);font-size:14px;">No items in cart</p>';
    document.getElementById('checkoutTotal').textContent = '₹0';
    document.getElementById('confirmAmount').textContent = '₹0';
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="checkout-item">
      <div>
        <div class="checkout-item-name">${item.emoji} ${item.name}</div>
        <div style="font-size:12px;color:var(--text-light);">₹${item.price} × ${item.qty} litre${item.qty > 1 ? 's' : ''}</div>
      </div>
      <strong>₹${item.price * item.qty}</strong>
    </div>
  `).join('');

  document.getElementById('checkoutTotal').textContent = `₹${total}`;
  document.getElementById('confirmAmount').textContent = `₹${total}`;
}

// ──────────────────────────────────────────
//  SCROLL TO CHECKOUT
// ──────────────────────────────────────────
function scrollToCheckout() {
  document.getElementById('checkout').scrollIntoView({ behavior: 'smooth' });
}

// ──────────────────────────────────────────
//  SUBMIT ORDER
// ──────────────────────────────────────────
async function submitOrder(e) {
  e.preventDefault();

  if (cart.length === 0) {
    alert('Your cart is empty. Please add products before placing an order.');
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
    return;
  }

  const paymentConfirm = document.getElementById('paymentConfirm').checked;
  if (!paymentConfirm) {
    alert('Please confirm that you have made the payment before placing the order.');
    return;
  }

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const orderData = {
    customerName: document.getElementById('custName').value.trim(),
    mobile: document.getElementById('custPhone').value.trim(),
    email: document.getElementById('custEmail').value.trim(),
    address: document.getElementById('custAddress').value.trim(),
    city: document.getElementById('custCity').value.trim(),
    pincode: document.getElementById('custPin').value.trim(),
    products: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price, subtotal: i.price * i.qty })),
    totalAmount: total,
    paymentStatus: 'Paid (UPI - Unverified)',
    orderDate: new Date().toISOString()
  };

  // Show loading
  document.getElementById('loadingOverlay').style.display = 'flex';
  document.getElementById('placeOrderBtn').disabled = true;

  try {
    const response = await fetch(`${BACKEND_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();

    if (response.ok) {
      // Clear cart
      cart = [];
      saveCart();
      renderCart();
      renderCheckoutSummary();
      document.getElementById('orderForm').reset();

      // Show success
      document.getElementById('loadingOverlay').style.display = 'none';
      if (result.orderId) {
        document.getElementById('orderIdDisplay').textContent = `Order ID: ${result.orderId}`;
      }
      document.getElementById('successModal').style.display = 'flex';
    } else {
      throw new Error(result.message || 'Order failed');
    }
  } catch (err) {
    document.getElementById('loadingOverlay').style.display = 'none';
    document.getElementById('placeOrderBtn').disabled = false;
    alert(`Failed to place order: ${err.message}\n\nPlease try again or contact us at 84896 44768`);
    console.error(err);
  }
}

// ──────────────────────────────────────────
//  MODAL
// ──────────────────────────────────────────
function closeModal() {
  document.getElementById('successModal').style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ──────────────────────────────────────────
//  NAV SCROLL & HAMBURGER
// ──────────────────────────────────────────
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  nav.classList.toggle('scrolled', window.scrollY > 40);
});

function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}
function closeMenu() {
  document.getElementById('navLinks').classList.remove('open');
}

// ──────────────────────────────────────────
//  SCROLL REVEAL
// ──────────────────────────────────────────
function observeReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

// ──────────────────────────────────────────
//  INIT
// ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  renderCart();
  renderCheckoutSummary();
  updateCartBadge();
  observeReveal();

  // Reveal all sections on load
  document.querySelectorAll(
    '.products-section, .cart-section, .checkout-section, .about-section, .contact-section'
  ).forEach(el => el.classList.add('reveal'));
  observeReveal();
});
