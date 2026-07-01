let currentUser = JSON.parse(localStorage.getItem('mf_current_user')) || null;
let activeCategory = 'All';
let cartItems = DataStore.getCart();
let wishlistItems = DataStore.getWishlist();
let currentSlide = 0;
let slideInterval;

function $(s) { return document.querySelector(s); }
function $$(s) { return document.querySelectorAll(s); }

function formatPrice(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

function playSuccessSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.4);
    });
  } catch(e) {}
}

function showToast(msg, type = 'gold') {
  const old = $('.toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${type === 'gold' ? '<i class="fas fa-star"></i>' : '<i class="fas fa-exclamation-circle"></i>'}</span> ${msg}`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

function navigate(page) {
  if (page === 'home') window.scrollTo({ top: 0, behavior: 'smooth' });
}

function bnavigate(page) {
  const items = $$('.bn-item');
  items.forEach(i => i.classList.remove('active'));
  if (page === 'home') {
    items[0].classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    activeCategory = 'All';
    renderCategories();
    renderProducts($('#searchInput')?.value || '');
  } else if (page === 'categories') {
    items[1].classList.add('active');
    document.getElementById('categoriesBar')?.scrollIntoView({ behavior: 'smooth' });
  }
}

function handleMobileSearch(val) {
  const input = $('#searchInput');
  if (input) input.value = val;
  handleSearch(val);
}

function toggleMobileNav() {
  const nav = $('#navActions');
  const hamburger = $('#hamburgerBtn');
  const backdrop = $('#navBackdrop');
  if (!nav) return;
  const isOpen = nav.classList.toggle('open');
  hamburger.innerHTML = isOpen ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
  if (backdrop) backdrop.classList.toggle('open', isOpen);
}

function closeMobileNav() {
  const nav = $('#navActions');
  const hamburger = $('#hamburgerBtn');
  const backdrop = $('#navBackdrop');
  if (nav) nav.classList.remove('open');
  if (hamburger) hamburger.innerHTML = '<i class="fas fa-bars"></i>';
  if (backdrop) backdrop.classList.remove('open');
}

function toggleMobileSearch() {
  const search = $('.nav-search');
  if (search) search.classList.toggle('open');
}

function updateCouponStrip() {
  const strip = document.getElementById('couponStrip');
  if (strip) {
    const text = localStorage.getItem('mf_coupon_text');
    if (text) strip.innerHTML = '<span><i class="fas fa-gift"></i> ' + text + '</span>';
  }
}

function renderBanners() {
  const container = $('#sliderContainer');
  const dots = $('#sliderDots');
  if (!container) return;
  const banners = DataStore.getBanners().filter(b => b.active);
  if (banners.length === 0) return;
  container.innerHTML = banners.map((b, i) => `
    <div class="slide" style="background:${b.bg};display:${i === 0 ? 'flex' : 'none'}">
      <div class="slide-content">
        <h2>${b.title}</h2>
        <p>${b.subtitle}</p>
        ${b.link ? '<a href="'+b.link+'" class="slide-btn">Shop Now →</a>' : ''}
      </div>
      ${b.image ? `<img src="${b.image}" alt="${b.title}" class="slide-img">` : `<div class="slide-emoji"><i class="fas fa-gem"></i></div>`}
    </div>
  `).join('');
  dots.innerHTML = banners.map((_, i) => `<span class="dot ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></span>`).join('');
  currentSlide = 0;
  startSlideShow();
}

function getSlideTime() {
  return parseInt(localStorage.getItem('mf_slide_time')) || 4000;
}

function getSlideAutoplay() {
  return localStorage.getItem('mf_slide_autoplay') !== 'false';
}

function startSlideShow() {
  if (slideInterval) clearInterval(slideInterval);
  if (getSlideAutoplay()) {
    slideInterval = setInterval(() => slideBanner(1), getSlideTime());
  }
}

function slideBanner(dir) {
  const slides = $$('.slide');
  const dots = $$('.dot');
  if (slides.length === 0) return;
  slides[currentSlide].style.display = 'none';
  dots[currentSlide]?.classList.remove('active');
  currentSlide = (currentSlide + dir + slides.length) % slides.length;
  slides[currentSlide].style.display = 'flex';
  dots[currentSlide]?.classList.add('active');
  startSlideShow();
}

function goToSlide(n) {
  const slides = $$('.slide');
  const dots = $$('.dot');
  if (slides.length === 0) return;
  slides[currentSlide].style.display = 'none';
  dots[currentSlide]?.classList.remove('active');
  currentSlide = n;
  slides[currentSlide].style.display = 'flex';
  dots[currentSlide]?.classList.add('active');
  startSlideShow();
}

function renderCategories() {
  const bar = $('#categoriesBar');
  if (!bar) return;
  const cats = DataStore.getCategories();
  bar.innerHTML = cats.map(c => `
    <button class="cat-circle ${c.name === activeCategory ? 'active' : ''}" onclick="filterCategory('${c.name}')">
      <span class="cat-circle-icon">${c.image ? `<img src="${c.image}" alt="${c.name}" class="cat-circle-img">` : `<i class="fas fa-folder"></i>`}</span>
      <span class="cat-circle-label">${c.name}</span>
    </button>
  `).join('');
}

function filterCategory(cat) {
  activeCategory = cat;
  renderCategories();
  renderProducts($('#searchInput')?.value || '');
}

function renderProducts(search) {
  const grid = $('#productsGrid');
  if (!grid) return;
  let prods = DataStore.getProducts();
  if (activeCategory !== 'All') prods = prods.filter(p => p.category === activeCategory);
  if (search) {
    const q = search.toLowerCase();
    prods = prods.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }
  if (prods.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:80px 20px;color:var(--mid-grey)"><div style="font-size:60px;margin-bottom:20px"><i class="fas fa-box-open"></i></div><h3>No products found</h3></div>';
    return;
  }
  grid.innerHTML = prods.map((p, i) => `
    <div class="product-card" style="animation-delay:${i * 0.04}s" onclick="openQuickView(${p.id})">
      ${p.badge ? `<div class="product-badge ${p.badge === 'Sale' ? 'sale' : p.badge === 'Luxe' ? 'gold' : ''}">${p.badge}</div>` : ''}
      <button class="product-wishlist ${wishlistItems.includes(p.id) ? 'active' : ''}" onclick="event.stopPropagation();toggleWishlist(${p.id})">${wishlistItems.includes(p.id) ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>'}</button>
      <div class="product-img-wrap">
        ${p.images && p.images[0] ? `<img src="${p.images[0]}" alt="${p.name}" class="product-img">` : `<div class="product-main-img"><i class="fas fa-tshirt"></i></div>`}
        <button class="product-add" onclick="event.stopPropagation();addToCart(${p.id})">+</button>
      </div>
      <div class="product-info">
        <div class="product-brand">${p.brand}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-rating"><i class="fas fa-star" style="color:var(--gold)"></i> ${p.rating} <span>(${p.reviews})</span></div>
        <div class="product-price">${formatPrice(p.price)} ${p.original ? `<s>${formatPrice(p.original)}</s>` : ''}</div>
        ${p.original && p.original > p.price ? `<div class="product-off">${Math.round((1 - p.price/p.original) * 100)}% OFF</div>` : ''}
      </div>
    </div>
  `).join('');
}

function handleSearch(val) {
  renderProducts(val);
  if (val) activeCategory = 'All';
  renderCategories();
}

function openQuickView(id) {
  const p = DataStore.getProduct(id);
  if (!p) return;
  const container = $('#qvContent');
  const inWishlist = wishlistItems.includes(p.id);
  const inCart = cartItems.find(i => i.id === p.id);

  let galleryHtml = '';
  if (p.images && p.images.length > 0) {
    galleryHtml = `<div class="qv-gallery">${p.images.map((img, i) => `<img src="${img}" alt="${p.name}" class="qv-img" onclick="currentQvImg=${i};updateQvGallery()">`).join('')}</div>`;
    galleryHtml += `<div class="qv-main-img"><img src="${p.images[0]}" id="qvMainImage" alt="${p.name}"></div>`;
  } else {
    galleryHtml = `<div class="qv-main-img" style="background:${p.bg || '#f5f5f5'}"><div class="qv-emoji"><i class="fas fa-tshirt"></i></div></div>`;
  }

  const similar = DataStore.getProducts().filter(x => x.category === p.category && x.id !== p.id).slice(0, 8);
  const reviews = DataStore.getReviews(p.id);

  container.innerHTML = `
    <div class="qv-layout">
      <div class="qv-left">${galleryHtml}</div>
      <div class="qv-right">
        <div class="qv-brand">${p.brand}</div>
        <h2 class="qv-name">${p.name}</h2>
        <div class="qv-rating"><i class="fas fa-star" style="color:var(--gold)"></i> ${p.rating} <span>(${p.reviews} reviews)</span></div>
        <div class="qv-price-row">
          <span class="qv-price">${formatPrice(p.price)}</span>
          ${p.original ? `<span class="qv-original"><s>${formatPrice(p.original)}</s></span>` : ''}
          ${p.original && p.original > p.price ? `<span class="qv-off">${Math.round((1 - p.price/p.original) * 100)}% OFF</span>` : ''}
        </div>
        ${p.description ? `<p class="qv-desc">${p.description}</p>` : ''}
        ${p.sizes ? `<div class="qv-section"><h4>Size</h4><div class="qv-sizes">${p.sizes.map(s => `<button class="qv-size-btn" onclick="$$('.qv-size-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active')">${s}</button>`).join('')}</div></div>` : ''}
        ${p.colors ? `<div class="qv-section"><h4>Color</h4><div class="qv-colors">${p.colors.map(c => `<button class="qv-color-btn" style="background:${c.toLowerCase()}" onclick="$$('.qv-color-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active')" title="${c}"></button>`).join('')}</div></div>` : ''}
        <div class="qv-actions">
          <button class="qv-btn qv-cart" onclick="addToCart(${p.id});closeQuickView()">${inCart ? '<i class="fas fa-check"></i> Added to Cart' : 'Add to Cart'}</button>
          <button class="qv-btn qv-wishlist ${inWishlist ? 'active' : ''}" onclick="toggleWishlist(${p.id})">${inWishlist ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>'} Wishlist</button>
        </div>
        <div class="qv-section"><h4>Delivery</h4><p style="font-size:13px;color:var(--mid-grey)">Free delivery on orders above ₹5,000 • COD available</p></div>
      </div>
    </div>
    <div class="qv-section" style="margin-top:30px">
      <h4>Reviews (${reviews.length})</h4>
      ${reviews.length === 0 ? '<p style="font-size:13px;color:var(--mid-grey)">No reviews yet. Be the first to review!</p>' : reviews.slice(0, 5).map(r => `
        <div class="review-item"><strong>${r.name}</strong> <span style="color:var(--gold)">${'<i class=\"fas fa-star\"></i>'.repeat(r.rating)}</span><p>${r.comment}</p><small style="color:var(--mid-grey)">${r.date}</small></div>
      `).join('')}
      <button class="qv-btn qv-outline" style="margin-top:10px" onclick="showReviewForm(${p.id})"><i class="fas fa-pen"></i> Write a Review</button>
    </div>
    ${similar.length > 0 ? `
    <div class="qv-section" style="margin-top:30px">
      <h4>Similar Products</h4>
      <div class="similar-grid">${similar.map(x => `
        <div class="similar-card" onclick="openQuickView(${x.id})">
          <div class="similar-img">${x.images && x.images[0] ? `<img src="${x.images[0]}" alt="${x.name}">` : '<i class="fas fa-tshirt"></i>'}</div>
          <div class="similar-name">${x.name}</div>
          <div class="similar-price">${formatPrice(x.price)}</div>
        </div>
      `).join('')}</div>
    </div>` : ''}
  `;
  currentQvImg = 0;
  window._qvProductId = p.id;
  $('#quickViewOverlay').classList.add('open');
  $('#quickViewModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

let currentQvImg = 0;

function updateQvGallery() {
  const main = document.getElementById('qvMainImage');
  if (main && window._qvProductId) {
    const p = DataStore.getProduct(window._qvProductId);
    if (p && p.images && p.images[currentQvImg]) {
      main.src = p.images[currentQvImg];
    }
  }
}

function closeQuickView() {
  $('#quickViewOverlay').classList.remove('open');
  $('#quickViewModal').classList.remove('open');
  document.body.style.overflow = '';
}

function showReviewForm(productId) {
  if (!currentUser) { showToast('Please sign in to review', 'error'); openAuth(); return; }
  const name = prompt('Your name:', currentUser.name);
  if (!name) return;
  const rating = prompt('Rating (1-5):', '5');
  if (!rating || rating < 1 || rating > 5) return;
  const comment = prompt('Your review:');
  if (!comment) return;
  DataStore.addReview({ productId, name, rating: parseInt(rating), comment });
  showToast('Review submitted! <i class="fas fa-star"></i>', 'gold');
  openQuickView(productId);
}

function addToCart(id) {
  const existing = cartItems.find(i => i.id === id);
  if (existing) existing.qty += 1;
  else cartItems.push({ id, qty: 1 });
  saveCart();
  updateCartUI();
  const p = DataStore.getProduct(id);
  showToast(`${p ? p.name : 'Product'} added to bag`, 'gold');
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

function saveCart() { DataStore.saveCart(cartItems); }

function getCartTotal() {
  return cartItems.reduce((s, i) => { const p = DataStore.getProduct(i.id); return s + (p ? p.price * i.qty : 0); }, 0);
}

function updateCartUI() {
  const count = cartItems.reduce((s, i) => s + i.qty, 0);
  const badge = $('#cartBadge');
  if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; }
  const cc = $('#cartCount');
  if (cc) cc.textContent = count;
  const bnBadge = $('#bnCartBadge');
  if (bnBadge) bnBadge.textContent = count;
}

function toggleCart() {
  closeMobileNav();
  const isOpen = $('#cartDrawer').classList.toggle('open');
  $('#cartOverlay').classList.toggle('open');
  document.getElementById('bottomNav').style.display = isOpen ? 'none' : '';
  renderCartDrawer();
}

function renderCartDrawer() {
  const container = $('#cartItems');
  const totalEl = $('#cartTotal');
  if (!container) return;
  if (cartItems.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--mid-grey)"><div style="font-size:50px;margin-bottom:15px"><i class="fas fa-shopping-bag"></i></div><p>Your bag is empty</p></div>';
    if (totalEl) totalEl.textContent = '₹0';
    return;
  }
  container.innerHTML = cartItems.map(i => {
    const p = DataStore.getProduct(i.id);
    if (!p) return '';
    return `<div class="cart-d-item">
      <div class="cart-d-item-img">${p.images && p.images[0] ? `<img src="${p.images[0]}" alt="${p.name}">` : '<i class="fas fa-tshirt"></i>'}</div>
      <div class="cart-d-item-info"><h4>${p.name}</h4><div class="item-price">${formatPrice(p.price)}</div><div class="cart-d-qty"><button onclick="updateQty(${p.id}, -1)">−</button><span>${i.qty}</span><button onclick="updateQty(${p.id}, 1)">+</button></div></div>
      <button class="cart-d-item-remove" onclick="removeFromCart(${p.id})"><i class="fas fa-times"></i></button>
    </div>`;
  }).join('');
  if (totalEl) totalEl.textContent = formatPrice(getCartTotal());
}

function goToCheckout() {
  if (cartItems.length === 0) { showToast('Your bag is empty!', 'error'); return; }
  if (!currentUser) { showToast('Please sign in first!', 'error'); openAuth(); return; }
  toggleCart();
  window.location.href = 'checkout.html';
}

function toggleWishlist(id) {
  const idx = wishlistItems.indexOf(id);
  if (idx > -1) wishlistItems.splice(idx, 1);
  else wishlistItems.push(id);
  DataStore.saveWishlist(wishlistItems);
  renderProducts($('#searchInput')?.value || '');
}

function showWishlist() {
  closeMobileNav();
  renderProducts();
  activeCategory = 'All';
  renderCategories();
  const ids = wishlistItems;
  const grid = $('#productsGrid');
  if (!grid) return;
  if (wishlistItems.length === 0 || ids.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:80px 20px;color:var(--mid-grey)"><div style="font-size:80px;margin-bottom:20px;color:#ddd"><i class="far fa-heart"></i></div><h3 style="font-size:22px;margin-bottom:8px">Wishlist Empty</h3><p style="font-size:14px;margin-bottom:25px">Apne pasandida products ko wishlist mein save karein</p><button class="submit-btn" style="width:auto;padding:14px 40px;display:inline-block" onclick="bnavigate(\'home\')"><i class="fas fa-shopping-bag"></i> Start Shopping</button></div>';
    return;
  }
  const prods = ids.map(id => DataStore.getProduct(id)).filter(Boolean);
  if (prods.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:80px 20px;color:var(--mid-grey)"><div style="font-size:80px;margin-bottom:20px;color:#ddd"><i class="far fa-heart"></i></div><h3 style="font-size:22px;margin-bottom:8px">Wishlist Empty</h3><p style="font-size:14px;margin-bottom:25px">Apne pasandida products ko wishlist mein save karein</p><button class="submit-btn" style="width:auto;padding:14px 40px;display:inline-block" onclick="bnavigate(\'home\')"><i class="fas fa-shopping-bag"></i> Start Shopping</button></div>';
    return;
  }
  grid.innerHTML = prods.map((p, i) => `
    <div class="product-card" onclick="openQuickView(${p.id})" style="animation-delay:${i*0.04}s">
      ${p.badge ? `<div class="product-badge">${p.badge}</div>` : ''}
      <button class="product-wishlist active" onclick="event.stopPropagation();toggleWishlist(${p.id})"><i class="fas fa-heart"></i></button>
      <div class="product-img-wrap">${p.images && p.images[0] ? `<img src="${p.images[0]}" class="product-img">` : `<div class="product-main-img"><i class="fas fa-tshirt"></i></div>`}
        <button class="product-add" onclick="event.stopPropagation();addToCart(${p.id})">+</button>
      </div>
      <div class="product-info"><div class="product-brand">${p.brand}</div><div class="product-name">${p.name}</div><div class="product-price">${formatPrice(p.price)}</div></div>
    </div>
  `).join('');
  showToast(`<i class="fas fa-heart"></i> ${prods.length} wishlist items`, 'gold');
}

function openAuth() { closeMobileNav(); $('#authOverlay').classList.add('open'); }
function closeAuth() { $('#authOverlay').classList.remove('open'); }

function switchAuth(tab) {
  const login = $('#loginForm'), register = $('#registerForm'), tL = $('#tabLogin'), tR = $('#tabRegister');
  if (tab === 'login') { login.style.display = 'block'; register.style.display = 'none'; tL.classList.add('active'); tR.classList.remove('active'); }
  else { login.style.display = 'none'; register.style.display = 'block'; tR.classList.add('active'); tL.classList.remove('active'); }
}

function handleLogin(e) {
  e.preventDefault();
  const email = $('#loginEmail').value, pass = $('#loginPass').value;
  const result = DataStore.loginUser(email, pass);
  if (result.error) { showToast(result.error, 'error'); return; }
  currentUser = result.user;
  localStorage.setItem('mf_current_user', JSON.stringify(currentUser));
  closeAuth();
  updateUserUI();
  showToast(`Welcome back, ${currentUser.name}!`, 'gold');
}

function handleRegister(e) {
  e.preventDefault();
  const name = $('#regName').value, email = $('#regEmail').value, phone = $('#regPhone').value, pass = $('#regPass').value;
  if (pass.length < 4) { showToast('Password too short', 'error'); return; }
  const result = DataStore.registerUser({ name, email, phone, password: pass });
  if (result.error) { showToast(result.error, 'error'); return; }
  currentUser = result.user;
  localStorage.setItem('mf_current_user', JSON.stringify(currentUser));
  closeAuth();
  updateUserUI();
  showToast(`Welcome, ${name}!`, 'gold');
}

function logout() {
  currentUser = null;
  localStorage.removeItem('mf_current_user');
  updateUserUI();
  showToast('Signed out', 'gold');
}

function updateUserUI() {
  const btn = $('#authBtn');
  if (!btn) return;
  if (currentUser) { btn.textContent = 'Sign Out'; btn.onclick = logout; }
  else { btn.textContent = 'Sign In'; btn.onclick = openAuth; }
}

window.addEventListener('scroll', () => $('#navbar').classList.toggle('scrolled', window.scrollY > 50));

DataStore.on('products', () => renderProducts($('#searchInput')?.value || ''));
DataStore.on('banners', () => { renderBanners(); startSlideShow(); });
DataStore.on('categories', () => renderCategories());
DataStore.on('orders', () => { if (typeof renderCartDrawer === 'function') renderCartDrawer(); });

document.addEventListener('DOMContentLoaded', () => {
  updateUserUI();
  updateCouponStrip();
  renderBanners();
  renderCategories();
  renderProducts();
  updateCartUI();
  renderCartDrawer();
  if (localStorage.getItem('mf_view_wishlist') === 'true') {
    localStorage.removeItem('mf_view_wishlist');
    setTimeout(() => showWishlist(), 500);
  }
});
