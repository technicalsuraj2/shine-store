// ===== STATE =====
let currentUser = JSON.parse(localStorage.getItem('pf_current_user')) || null;
let activeCategory = 'All';
let cartItems = DataStore.getCart();
let wishlistItems = DataStore.getWishlist();

// ===== UTILITY =====
function $(s) { return document.querySelector(s); }
function $$(s) { return document.querySelectorAll(s); }

function formatPrice(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

function showToast(msg, type = 'gold') {
  const old = $('.toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${type === 'gold' ? '✨' : '❌'}</span> ${msg}`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ===== NAVIGATION =====
function navigate(page) {
  if (page === 'home') window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== CATEGORIES =====
function renderCategories() {
  const bar = $('#categoriesBar');
  if (!bar) return;
  const cats = DataStore.getCategories();
  bar.innerHTML = cats.map(c =>
    `<button class="cat-btn ${c.name === activeCategory ? 'active' : ''}" onclick="filterCategory('${c.name}')">${c.icon} ${c.name}</button>`
  ).join('');
}

function filterCategory(cat) {
  activeCategory = cat;
  renderCategories();
  renderProducts();
}

// ===== PRODUCTS =====
function renderProducts(search) {
  const grid = $('#productsGrid');
  if (!grid) return;
  let prods = DataStore.getProducts();
  if (activeCategory !== 'All') prods = prods.filter(p => p.category === activeCategory);
  if (search) {
    const q = search.toLowerCase();
    prods = prods.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
  }
  grid.innerHTML = prods.map((p, i) => `
    <div class="product-card" style="animation-delay:${i * 0.06}s">
      ${p.badge ? `<div class="product-badge ${p.badge === 'Sale' ? 'sale' : p.badge === 'Luxe' ? 'gold' : ''}">${p.badge}</div>` : ''}
      <button class="product-wishlist ${wishlistItems.includes(p.id) ? 'active' : ''}" onclick="toggleWishlist(${p.id});event.stopPropagation()">${wishlistItems.includes(p.id) ? '❤️' : '🤍'}</button>
      <div class="product-img-wrap" style="background:${p.bg}">
        <div class="emoji-bg">${p.emoji}</div>
        <div class="product-main-img">${p.emoji}</div>
        <button class="product-add" onclick="addToCart(${p.id});event.stopPropagation()">+</button>
      </div>
      <div class="product-info" onclick="quickView(${p.id})">
        <div class="product-brand">${p.brand}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-rating">⭐ ${p.rating} <span>(${p.reviews})</span></div>
        <div class="product-price">${formatPrice(p.price)} <s>${formatPrice(p.original)}</s></div>
      </div>
    </div>
  `).join('');
}

function handleSearch(val) {
  renderProducts(val);
}

function quickView(id) {
  const p = DataStore.getProduct(id);
  if (!p) return;
  showToast(`${p.name} — ${formatPrice(p.price)}`, 'gold');
}

// ===== CART =====
function addToCart(id) {
  const existing = cartItems.find(i => i.id === id);
  if (existing) existing.qty += 1;
  else cartItems.push({ id, qty: 1 });
  saveCart();
  updateCartUI();
  const p = DataStore.getProduct(id);
  showToast(`${p.name} added to bag`, 'gold');
}

function removeFromCart(id) {
  cartItems = cartItems.filter(i => i.id !== id);
  saveCart();
  updateCartUI();
  renderCartDrawer();
}

function updateQty(id, delta) {
  const item = cartItems.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cartItems = cartItems.filter(i => i.id !== id);
  saveCart();
  updateCartUI();
  renderCartDrawer();
}

function saveCart() {
  DataStore.saveCart(cartItems);
}

function getCartTotal() {
  return cartItems.reduce((s, i) => {
    const p = DataStore.getProduct(i.id);
    return s + (p ? p.price * i.qty : 0);
  }, 0);
}

function updateCartUI() {
  const count = cartItems.reduce((s, i) => s + i.qty, 0);
  const badge = $('#cartBadge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
  const cc = $('#cartCount');
  if (cc) cc.textContent = count;
}

function toggleCart() {
  $('#cartDrawer').classList.toggle('open');
  $('#cartOverlay').classList.toggle('open');
  renderCartDrawer();
}

function renderCartDrawer() {
  const container = $('#cartItems');
  const totalEl = $('#cartTotal');
  if (!container) return;

  if (cartItems.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--mid-grey)"><div style="font-size:50px;margin-bottom:15px">🛍️</div><p>Your bag is empty</p></div>';
    if (totalEl) totalEl.textContent = '₹0';
    return;
  }

  container.innerHTML = cartItems.map(i => {
    const p = DataStore.getProduct(i.id);
    if (!p) return '';
    return `
      <div class="cart-d-item">
        <div class="cart-d-item-img" style="background:${p.bg}">${p.emoji}</div>
        <div class="cart-d-item-info">
          <h4>${p.name}</h4>
          <div class="item-price">${formatPrice(p.price)}</div>
          <div class="cart-d-qty">
            <button onclick="updateQty(${p.id}, -1)">−</button>
            <span>${i.qty}</span>
            <button onclick="updateQty(${p.id}, 1)">+</button>
          </div>
        </div>
        <button class="cart-d-item-remove" onclick="removeFromCart(${p.id})">✕</button>
      </div>
    `;
  }).join('');

  if (totalEl) totalEl.textContent = formatPrice(getCartTotal());
}

function goToCheckout() {
  if (cartItems.length === 0) { showToast('Your bag is empty!', 'error'); return; }
  if (!currentUser) { showToast('Please sign in first!', 'error'); openAuth(); return; }
  toggleCart();
  window.location.href = 'checkout.html';
}

// ===== WISHLIST =====
function toggleWishlist(id) {
  const idx = wishlistItems.indexOf(id);
  if (idx > -1) wishlistItems.splice(idx, 1);
  else wishlistItems.push(id);
  DataStore.saveWishlist(wishlistItems);
  renderProducts($('#searchInput')?.value || '');
}

function showWishlist() {
  if (wishlistItems.length === 0) { showToast('Your wishlist is empty', 'error'); return; }
  const prods = wishlistItems.map(id => DataStore.getProduct(id)).filter(Boolean);
  const names = prods.map(p => p.name).join(', ');
  showToast(`❤️ ${prods.length} items in wishlist`, 'gold');
}

// ===== AUTH =====
function openAuth() { $('#authOverlay').classList.add('open'); }
function closeAuth() { $('#authOverlay').classList.remove('open'); }

function switchAuth(tab) {
  const login = $('#loginForm');
  const register = $('#registerForm');
  const tL = $('#tabLogin');
  const tR = $('#tabRegister');
  if (tab === 'login') {
    login.style.display = 'block';
    register.style.display = 'none';
    tL.classList.add('active');
    tR.classList.remove('active');
  } else {
    login.style.display = 'none';
    register.style.display = 'block';
    tR.classList.add('active');
    tL.classList.remove('active');
  }
}

function handleLogin(e) {
  e.preventDefault();
  const email = $('#loginEmail').value;
  const pass = $('#loginPass').value;
  const result = DataStore.loginUser(email, pass);
  if (result.error) { showToast(result.error, 'error'); return; }
  currentUser = result.user;
  localStorage.setItem('pf_current_user', JSON.stringify(currentUser));
  closeAuth();
  updateUserUI();
  showToast(`Welcome back, ${currentUser.name}! ✨`, 'gold');
}

function handleRegister(e) {
  e.preventDefault();
  const name = $('#regName').value;
  const email = $('#regEmail').value;
  const phone = $('#regPhone').value;
  const pass = $('#regPass').value;
  if (pass.length < 4) { showToast('Password too short', 'error'); return; }
  const result = DataStore.registerUser({ name, email, phone, password: pass });
  if (result.error) { showToast(result.error, 'error'); return; }
  currentUser = result.user;
  localStorage.setItem('pf_current_user', JSON.stringify(currentUser));
  closeAuth();
  updateUserUI();
  showToast(`Welcome, ${name}! 🎉`, 'gold');
}

function logout() {
  currentUser = null;
  localStorage.removeItem('pf_current_user');
  updateUserUI();
  showToast('Signed out', 'gold');
}

function updateUserUI() {
  const btn = $('#authBtn');
  if (!btn) return;
  if (currentUser) {
    btn.textContent = `👋 ${currentUser.name.split(' ')[0]}`;
    btn.onclick = logout;
  } else {
    btn.textContent = 'Sign In';
    btn.onclick = openAuth;
  }
}

// ===== NEWSLETTER =====
function subscribeNews() {
  const email = $('#newsEmail')?.value;
  if (!email) { showToast('Enter your email', 'error'); return; }
  showToast('Subscribed! Welcome to SHINE ✨', 'gold');
  $('#newsEmail').value = '';
}

// ===== NAVBAR SCROLL =====
window.addEventListener('scroll', () => {
  $('#navbar').classList.toggle('scrolled', window.scrollY > 50);
});

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  updateUserUI();
  renderCategories();
  renderProducts();
  updateCartUI();
  renderCartDrawer();
});
