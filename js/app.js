// ===== STATE =====
let state = {
  user: JSON.parse(localStorage.getItem('shine_user')) || null,
  cart: JSON.parse(localStorage.getItem('shine_cart')) || [],
  currentPage: 'home'
};

// ===== PRODUCTS =====
const products = [
  { id: 1, name: 'Diamond Eternity Ring', category: 'Rings', price: 49999, original: 69999, rating: 4.8, reviews: 234, badge: 'Best Seller', image: '💍', bg: '#fce4ec' },
  { id: 2, name: 'Gold Heart Pendant', category: 'Necklace', price: 24999, original: 34999, rating: 4.7, reviews: 189, badge: 'Trending', image: '📿', bg: '#fff3e0' },
  { id: 3, name: 'Pearl Drop Earrings', category: 'Earrings', price: 15999, original: 22999, rating: 4.9, reviews: 312, badge: 'Top Rated', image: '💎', bg: '#e8f5e9' },
  { id: 4, name: 'Platinum Bracelet', category: 'Bracelets', price: 35999, original: 45999, rating: 4.6, reviews: 156, badge: 'New', image: '📿', bg: '#f3e5f5' },
  { id: 5, name: 'Rose Gold Watch', category: 'Watches', price: 29999, original: 39999, rating: 4.8, reviews: 278, badge: 'Sale', image: '⌚', bg: '#e0f7fa' },
  { id: 6, name: 'Sapphire Pendant Set', category: 'Necklace', price: 44999, original: 59999, rating: 4.9, reviews: 145, badge: 'Premium', image: '💎', bg: '#e1f5fe' },
  { id: 7, name: 'Gold Hoop Earrings', category: 'Earrings', price: 8999, original: 12999, rating: 4.5, reviews: 423, badge: 'Popular', image: '🔘', bg: '#fff8e1' },
  { id: 8, name: 'Diamond Nose Pin', category: 'Rings', price: 12999, original: 17999, rating: 4.7, reviews: 198, badge: 'Trending', image: '✨', bg: '#fbe9e7' },
];

// ===== UTILITY =====
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

function showToast(msg, type = 'success') {
  const existing = $('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span> ${msg}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function formatPrice(n) {
  return '₹' + n.toLocaleString('en-IN');
}

function generateOrderNo() {
  return 'SHINE' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
}

// ===== NAVIGATION =====
function navigate(page) {
  state.currentPage = page;
  $$('.page').forEach(p => p.style.display = 'none');
  const el = $(`#page-${page}`);
  if (el) {
    el.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  render();
  updateActiveNav();
}

function updateActiveNav() {
  $$('.nav-links a').forEach(a => {
    a.style.color = a.dataset.page === state.currentPage ? 'var(--primary)' : '';
  });
}

// ===== RENDER =====
function render() {
  renderProducts();
  renderCartBadge();
  renderCartItems();
  renderCartSummary();
  renderUserUI();
  renderCheckoutSummary();
}

function renderProducts() {
  const grid = $('#products-grid');
  if (!grid) return;
  grid.innerHTML = products.map((p, i) => `
    <div class="product-card" style="animation-delay:${i * 0.08}s">
      ${p.badge ? `<div class="product-badge">${p.badge}</div>` : ''}
      <button class="product-wishlist" onclick="event.stopPropagation()">🤍</button>
      <div style="height:300px;display:flex;align-items:center;justify-content:center;font-size:100px;background:${p.bg}">
        ${p.image}
      </div>
      <div class="product-info">
        <div class="product-category">${p.category}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-rating">⭐ ${p.rating} <span>(${p.reviews} reviews)</span></div>
        <div class="product-price-row">
          <div class="product-price">
            ${formatPrice(p.price)}
            <span class="original">${formatPrice(p.original)}</span>
          </div>
          <button class="add-to-cart-btn" onclick="addToCart(${p.id})">Add to Cart</button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderCartBadge() {
  const badge = $('.cart-badge');
  if (badge) {
    const count = state.cart.reduce((sum, i) => sum + i.qty, 0);
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

function renderCartItems() {
  const container = $('#cart-items');
  if (!container) return;
  if (state.cart.length === 0) {
    container.innerHTML = `
      <div class="empty-cart">
        <div class="empty-icon">🛒</div>
        <p>Your cart is empty</p>
        <p style="font-size:14px;margin-top:8px">Start shopping to add items!</p>
        <button class="hero-btn" style="margin-top:20px" onclick="navigate('home')">Shop Now</button>
      </div>
    `;
    return;
  }
  container.innerHTML = state.cart.map((item, i) => {
    const p = products.find(x => x.id === item.id);
    return `
      <div class="cart-item" style="animation-delay:${i * 0.1}s">
        <div style="width:100px;height:100px;display:flex;align-items:center;justify-content:center;font-size:40px;border-radius:12px;background:${p.bg}">${p.image}</div>
        <div class="cart-item-info">
          <h4>${p.name}</h4>
          <p>${formatPrice(p.price)}</p>
        </div>
        <div class="cart-qty">
          <button onclick="updateQty(${item.id}, -1)">−</button>
          <span>${item.qty}</span>
          <button onclick="updateQty(${item.id}, 1)">+</button>
        </div>
        <div class="cart-item-total">${formatPrice(p.price * item.qty)}</div>
        <button class="cart-item-remove" onclick="removeFromCart(${item.id})">✕</button>
      </div>
    `;
  }).join('');
}

function renderCartSummary() {
  const container = $('#cart-summary');
  if (!container || state.cart.length === 0) {
    if (container) container.innerHTML = '';
    return;
  }
  const subtotal = state.cart.reduce((sum, i) => sum + (products.find(p => p.id === i.id)?.price || 0) * i.qty, 0);
  const shipping = subtotal > 50000 ? 0 : 499;
  const total = subtotal + shipping;
  container.innerHTML = `
    <h3>Order Summary</h3>
    <div class="cart-summary-row">
      <span>Subtotal (${state.cart.reduce((s,i) => s + i.qty, 0)} items)</span>
      <span>${formatPrice(subtotal)}</span>
    </div>
    <div class="cart-summary-row">
      <span>Shipping</span>
      <span>${shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
    </div>
    <div class="cart-summary-row">
      <span>Discount</span>
      <span style="color:#4caf50">-${formatPrice(Math.round(subtotal * 0.15))}</span>
    </div>
    <div class="cart-summary-row total">
      <span>Total</span>
      <span>${formatPrice(total)}</span>
    </div>
    <button class="checkout-btn" onclick="navigate('checkout')">Proceed to Checkout</button>
  `;
}

function renderUserUI() {
  const container = $('#user-area');
  if (!container) return;
  if (state.user) {
    container.innerHTML = `
      <span class="user-name">👋 ${state.user.name}</span>
      <button class="auth-btn" onclick="logout()">Logout</button>
    `;
  } else {
    container.innerHTML = `<button class="auth-btn" onclick="navigate('login')">Login</button>`;
  }
}

function renderCheckoutSummary() {
  const container = $('#checkout-summary');
  if (!container || state.cart.length === 0) return;
  const subtotal = state.cart.reduce((sum, i) => sum + (products.find(p => p.id === i.id)?.price || 0) * i.qty, 0);
  const total = subtotal + (subtotal > 50000 ? 0 : 499);
  container.innerHTML = state.cart.map(i => {
    const p = products.find(x => x.id === i.id);
    return `<div class="mini-row"><span>${p.name} × ${i.qty}</span><span>${formatPrice(p.price * i.qty)}</span></div>`;
  }).join('') + `
    <div class="mini-row" style="border-top:1px solid #ddd;padding-top:10px;margin-top:8px"><span>Shipping</span><span>${subtotal > 50000 ? 'FREE' : formatPrice(499)}</span></div>
    <div class="mini-row total-mini"><span>Total</span><span>${formatPrice(total)}</span></div>
  `;
}

// ===== CART ACTIONS =====
function addToCart(id) {
  const existing = state.cart.find(i => i.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    state.cart.push({ id, qty: 1 });
  }
  saveCart();
  render();
  showToast(`${products.find(p => p.id === id).name} added to cart!`);
}

function updateQty(id, delta) {
  const item = state.cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    state.cart = state.cart.filter(i => i.id !== id);
  }
  saveCart();
  render();
}

function removeFromCart(id) {
  state.cart = state.cart.filter(i => i.id !== id);
  saveCart();
  render();
  showToast('Item removed from cart');
}

function saveCart() {
  localStorage.setItem('shine_cart', JSON.stringify(state.cart));
}

// ===== AUTH =====
function handleLogin(e) {
  e.preventDefault();
  const email = $('#login-email').value;
  const password = $('#login-password').value;
  if (!email || !password) {
    showToast('Please fill all fields', 'error');
    return;
  }
  const stored = localStorage.getItem('shine_user');
  if (stored) {
    const u = JSON.parse(stored);
    if (u.email === email && u.password === password) {
      state.user = { name: u.name, email: u.email };
      localStorage.setItem('shine_user', JSON.stringify(state.user));
      showToast(`Welcome back, ${u.name}! 🎉`);
      navigate('home');
      return;
    }
    showToast('Invalid email or password', 'error');
    return;
  }
  showToast('No account found. Please register.', 'error');
}

function handleRegister(e) {
  e.preventDefault();
  const name = $('#reg-name').value;
  const email = $('#reg-email').value;
  const phone = $('#reg-phone').value;
  const password = $('#reg-password').value;
  const confirm = $('#reg-confirm').value;
  if (!name || !email || !phone || !password || !confirm) {
    showToast('Please fill all fields', 'error');
    return;
  }
  if (password !== confirm) {
    showToast('Passwords do not match', 'error');
    return;
  }
  if (password.length < 6) {
    showToast('Password must be at least 6 characters', 'error');
    return;
  }
  const fullUser = { name, email, phone, password };
  localStorage.setItem('shine_user', JSON.stringify(fullUser));
  state.user = { name, email };
  localStorage.setItem('shine_user', JSON.stringify(state.user));
  showToast(`Welcome, ${name}! 🎉 Account created successfully!`);
  navigate('home');
}

function logout() {
  state.user = null;
  localStorage.removeItem('shine_user');
  showToast('Logged out successfully');
  navigate('home');
}

// ===== CHECKOUT =====
let selectedDelivery = 'standard';

function selectDelivery(type) {
  selectedDelivery = type;
  $$('.delivery-option').forEach(el => el.classList.remove('selected'));
  const el = $(`.delivery-option[data-type="${type}"]`);
  if (el) el.classList.add('selected');
}

function handlePlaceOrder(e) {
  e.preventDefault();
  if (!state.user) {
    showToast('Please login first!', 'error');
    navigate('login');
    return;
  }
  if (state.cart.length === 0) {
    showToast('Your cart is empty!', 'error');
    navigate('home');
    return;
  }
  const fullName = $('#checkout-name').value;
  const address = $('#checkout-address').value;
  const city = $('#checkout-city').value;
  const pincode = $('#checkout-pincode').value;
  const phone = $('#checkout-phone').value;
  if (!fullName || !address || !city || !pincode || !phone) {
    showToast('Please fill all address fields', 'error');
    return;
  }
  const order = {
    orderNo: generateOrderNo(),
    items: [...state.cart],
    total: state.cart.reduce((sum, i) => sum + (products.find(p => p.id === i.id)?.price || 0) * i.qty, 0),
    address: { fullName, address, city, pincode, phone },
    delivery: selectedDelivery,
    date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    estimated: new Date(Date.now() + 5 * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  };
  localStorage.setItem('shine_last_order', JSON.stringify(order));
  state.cart = [];
  saveCart();
  renderOrderConfirmation(order);
  navigate('confirmation');
  showToast('🎉 Order placed successfully!');
}

function renderOrderConfirmation(order) {
  const container = $('#confirmation-content');
  if (!container) return;
  const subtotal = order.total;
  const shipping = subtotal > 50000 ? 0 : 499;
  container.innerHTML = `
    <div class="confetti">🎉</div>
    <div class="check-icon">✓</div>
    <h2>Order Placed! 🎉</h2>
    <p>Thank you for shopping with Shine ✨</p>
    <div class="order-number">${order.orderNo}</div>
    <div class="confirm-details">
      <div><strong>📅 Order Date</strong> ${order.date}</div>
      <div><strong>🚚 Delivery By</strong> ${order.estimated}</div>
      <div><strong>📍 Delivery To</strong> ${order.address.fullName}, ${order.address.address}, ${order.address.city} - ${order.address.pincode}</div>
      <div><strong>📞 Phone</strong> ${order.address.phone}</div>
      <div><strong>💳 Total</strong> ${formatPrice(subtotal + shipping)}</div>
    </div>
    <p style="color:#999;font-size:13px">A confirmation email has been sent to ${state.user?.email || 'your email'}</p>
    <button class="hero-btn" onclick="navigate('home')" style="margin-top:20px">Continue Shopping</button>
  `;
}

// ===== LOAD LAST ORDER =====
function loadLastOrder() {
  const data = localStorage.getItem('shine_last_order');
  if (data) {
    try {
      renderOrderConfirmation(JSON.parse(data));
    } catch(e) {}
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  render();
  loadLastOrder();
  if (state.cart.length === 0 && state.currentPage === 'cart') {
    renderCartItems();
  }
});
