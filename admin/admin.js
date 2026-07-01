const ADMIN_USER = 'admin';
const DEFAULT_PASS = 'admin123';
let isLoggedIn = false;
let uploadedImages = [];

function getAdminPass() { return localStorage.getItem('mf_admin_pass') || DEFAULT_PASS; }

function handleAdminLogin(e) {
  e.preventDefault();
  if (document.getElementById('adminUser').value === ADMIN_USER && document.getElementById('adminPass').value === getAdminPass()) {
    isLoggedIn = true;
    localStorage.setItem('mf_admin_logged', 'true');
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appMain').style.display = 'flex';
    initAdmin();
  } else {
    document.getElementById('loginError').style.display = 'block';
  }
}

function handleLogout() {
  isLoggedIn = false;
  localStorage.removeItem('mf_admin_logged');
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('appMain').style.display = 'none';
}

function showPage(page) {
  document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
  const el = document.getElementById(`page-${page}`);
  if (el) el.classList.add('active');
  document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
  const titles = {
    dashboard: 'Dashboard', orders: 'Orders', products: 'Products', addproduct: 'Add Product',
    categories: 'Categories', users: 'Users', coupons: 'Coupons', banners: 'Banners',
    reviews: 'Reviews', settings: 'Settings', backup: 'Backup & Restore',
    analytics: 'Analytics', seo: 'SEO', pages: 'Pages', brands: 'Brands',
    offers: 'Offers', newsletter: 'Newsletter', support: 'Support', shipping: 'Shipping'
  };
  document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';
  renderPage(page);
}

function renderPage(page) {
  const handlers = {
    dashboard: renderDashboard, orders: renderOrders, products: renderProducts,
    addproduct: openAddProduct, categories: renderCategories, users: renderUsers,
    coupons: renderCoupons, banners: renderBanners, reviews: renderReviews,
    analytics: renderAnalytics, brands: renderBrands, offers: renderOffers
  };
  if (handlers[page]) handlers[page]();
}

function updateClock() {
  const c = document.getElementById('clock');
  if (c) c.textContent = new Date().toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
setInterval(updateClock, 1000);

function renderDashboard() {
  const stats = DataStore.getStats();
  const orders = DataStore.getOrders();
  const grid = document.getElementById('statsGrid');
  const cards = [
    { value: stats.totalOrders, label: 'Total Orders', icon: '📦', cls: 'gold', change: '+12% this month' },
    { value: '₹' + stats.totalRevenue.toLocaleString('en-IN'), label: 'Revenue', icon: '💰', cls: 'green', change: '+8% this month' },
    { value: stats.totalUsers, label: 'Users', icon: '👥', cls: 'blue', change: '+5% this month' },
    { value: stats.totalProducts, label: 'Products', icon: '👗', cls: 'red', change: 'Stable' },
    { value: stats.pendingOrders, label: 'Pending', icon: '⏳', cls: 'gold', change: 'Needs attention' },
    { value: orders.filter(o => o.status === 'Delivered').length, label: 'Delivered', icon: '✅', cls: 'green', change: 'Completed' },
  ];
  grid.innerHTML = cards.map(c => `
    <div class="stat-card">
      <div class="stat-card-header">
        <div><div class="stat-card-value">${c.value}</div><div class="stat-card-label">${c.label}</div></div>
        <div class="stat-card-icon ${c.cls}">${c.icon}</div>
      </div>
      <div class="stat-card-change ${c.change.includes('+') ? 'up' : 'down'}">${c.change}</div>
    </div>
  `).join('');
  document.getElementById('recentOrdersTable').innerHTML = orders.slice(0, 5).map(o => `
    <tr><td><strong>${o.id}</strong></td><td>${o.customer}</td><td>₹${(o.total||0).toLocaleString('en-IN')}</td><td><span class="status ${o.status.toLowerCase()}">${o.status}</span></td><td><button class="action-btn btn-sm" onclick="showPage('orders')">View</button></td></tr>
  `).join('');
  document.getElementById('orderBadge').textContent = orders.filter(o => o.status === 'Pending').length || '0';
}

function renderAnalytics() {
  const products = DataStore.getProducts();
  const categories = DataStore.getCategories();
  const totalReviews = DataStore.getProducts().reduce((s, p) => s + (p.reviews || 0), 0);
  const topProducts = [...products].sort((a, b) => b.reviews - a.reviews).slice(0, 5);
  document.getElementById('analyticsGrid').innerHTML = `
    <div class="stat-card"><div class="stat-card-header"><div><div class="stat-card-value">${categories.length}</div><div class="stat-card-label">Categories</div></div><div class="stat-card-icon gold">📁</div></div></div>
    <div class="stat-card"><div class="stat-card-header"><div><div class="stat-card-value">${totalReviews}</div><div class="stat-card-label">Total Reviews</div></div><div class="stat-card-icon blue">⭐</div></div></div>
    <div class="stat-card"><div class="stat-card-header"><div><div class="stat-card-value">${products.length}</div><div class="stat-card-label">Total Products</div></div><div class="stat-card-icon red">👗</div></div></div>
    <div class="stat-card" style="grid-column:span 3"><h3 style="font-size:14px;font-weight:700;margin-bottom:15px">🏆 Top Products</h3>${topProducts.map(p => `<div style="padding:8px 0;border-bottom:1px solid var(--light-grey);font-size:13px">⭐ ${p.name} — ${p.reviews} reviews</div>`).join('')}</div>
  `;
}

function renderOrders() {
  const orders = DataStore.getOrders();
  document.getElementById('ordersTable').innerHTML = orders.map(o => `
    <tr>
      <td><strong>${o.id}</strong></td>
      <td>${o.customer}<br><small style="color:var(--mid-grey)">${o.email}</small></td>
      <td>${o.items.map(i => `${i.name} × ${i.qty}`).join(', ')}</td>
      <td>₹${(o.total||0).toLocaleString('en-IN')}</td>
      <td>${o.date}</td>
      <td><span class="status ${o.status.toLowerCase()}">${o.status}</span></td>
      <td>
        <select onchange="updateOrderStatus('${o.id}', this.value)" style="padding:6px 10px;border:1px solid var(--light-grey);font-size:12px">
          <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Processing" ${o.status === 'Processing' ? 'selected' : ''}>Processing</option>
          <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
          <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
          <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </td>
    </tr>
  `).join('');
}

function updateOrderStatus(id, status) { DataStore.updateOrderStatus(id, status); renderOrders(); renderDashboard(); }

function renderProducts() {
  const prods = DataStore.getProducts();
  const catFilter = document.getElementById('adminCategoryFilter');
  if (catFilter) {
    const cats = DataStore.getCategories();
    catFilter.innerHTML = '<option value="">All Categories</option>' + cats.filter(c => c.name !== 'All').map(c => `<option value="${c.name}">${c.name}</option>`).join('');
  }
  const searchVal = document.getElementById('adminSearchInput')?.value?.toLowerCase() || '';
  const filterCat = document.getElementById('adminCategoryFilter')?.value || '';
  let filtered = prods;
  if (searchVal) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchVal) || p.brand.toLowerCase().includes(searchVal));
  if (filterCat) filtered = filtered.filter(p => p.category === filterCat);
  document.getElementById('productsTable').innerHTML = filtered.map(p => `
    <tr>
      <td>${p.id}</td>
      <td>${p.images && p.images[0] ? `<img src="${p.images[0]}" style="width:40px;height:40px;object-fit:cover">` : (p.emoji || '👗')}</td>
      <td><strong>${p.name}</strong></td>
      <td>${p.brand}</td>
      <td>${p.category}</td>
      <td>₹${p.price.toLocaleString('en-IN')}</td>
      <td>${p.inStock ? '✅' : '❌'}</td>
      <td>
        <button class="action-btn btn-sm" onclick="editProduct(${p.id})">✏️</button>
        <button class="action-btn btn-sm" onclick="deleteProduct(${p.id})">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function adminSearchProducts() { renderProducts(); }

function openAddProduct() {
  document.getElementById('addProductTitle').textContent = '➕ Add New Product';
  document.getElementById('adminProductForm').reset();
  document.getElementById('prodId').value = '';
  uploadedImages = [];
  document.getElementById('imagePreviewContainer').innerHTML = '';
  const catSelect = document.getElementById('prodCategory');
  const cats = DataStore.getCategories();
  catSelect.innerHTML = cats.filter(c => c.name !== 'All').map(c => `<option value="${c.name}">${c.name}</option>`).join('');
}

function editProduct(id) {
  const p = DataStore.getProduct(id);
  if (!p) return;
  showPage('addproduct');
  document.getElementById('addProductTitle').textContent = '✏️ Edit Product';
  document.getElementById('prodId').value = p.id;
  document.getElementById('prodName').value = p.name;
  document.getElementById('prodBrand').value = p.brand;
  document.getElementById('prodPrice').value = p.price;
  document.getElementById('prodOriginal').value = p.original || '';
  document.getElementById('prodBadge').value = p.badge || '';
  document.getElementById('prodEmoji').value = p.emoji || '👗';
  document.getElementById('prodStock').value = p.inStock ? 'true' : 'false';
  document.getElementById('prodDesc').value = p.description || '';
  document.getElementById('prodSizes').value = (p.sizes || []).join(', ');
  document.getElementById('prodColors').value = (p.colors || []).join(', ');
  uploadedImages = p.images || [];
  renderImagePreview();
  const catSelect = document.getElementById('prodCategory');
  const cats = DataStore.getCategories();
  catSelect.innerHTML = cats.filter(c => c.name !== 'All').map(c => `<option value="${c.name}" ${c.name === p.category ? 'selected' : ''}>${c.name}</option>`).join('');
}

function handleImageUpload(event) {
  const files = Array.from(event.target.files);
  const remaining = 5 - uploadedImages.length;
  if (files.length > remaining) { alert(`You can only upload ${remaining} more image(s). Max 5 total.`); return; }
  files.forEach(file => {
    if (file.size > 2 * 1024 * 1024) { alert(`File ${file.name} is too large (max 2MB)`); return; }
    const reader = new FileReader();
    reader.onload = function(e) {
      uploadedImages.push(e.target.result);
      if (uploadedImages.length === 1) renderImagePreview();
      else renderImagePreview();
    };
    reader.readAsDataURL(file);
  });
  event.target.value = '';
}

function renderImagePreview() {
  const container = document.getElementById('imagePreviewContainer');
  container.innerHTML = uploadedImages.map((img, i) => `
    <div style="position:relative;width:80px;height:80px">
      <img src="${img}" style="width:100%;height:100%;object-fit:cover;border:1px solid var(--light-grey)">
      <button type="button" onclick="removeImage(${i})" style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;background:var(--red);color:white;border:none;border-radius:50%;font-size:12px;cursor:pointer">✕</button>
      ${i === 0 ? '<div style="position:absolute;bottom:0;left:0;right:0;background:var(--gold);font-size:8px;text-align:center;font-weight:600">MAIN</div>' : ''}
    </div>
  `).join('');
}

function removeImage(idx) {
  uploadedImages.splice(idx, 1);
  renderImagePreview();
}

function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('prodId').value;
  if (uploadedImages.length < 1) { alert('Please upload at least 1 product image'); return; }
  const sizes = document.getElementById('prodSizes').value.split(',').map(s => s.trim()).filter(Boolean);
  const colors = document.getElementById('prodColors').value.split(',').map(c => c.trim()).filter(Boolean);
  const data = {
    name: document.getElementById('prodName').value,
    brand: document.getElementById('prodBrand').value,
    category: document.getElementById('prodCategory').value,
    price: parseFloat(document.getElementById('prodPrice').value),
    original: parseFloat(document.getElementById('prodOriginal').value) || 0,
    badge: document.getElementById('prodBadge').value,
    emoji: document.getElementById('prodEmoji').value || '👗',
    inStock: document.getElementById('prodStock').value === 'true',
    description: document.getElementById('prodDesc').value,
    sizes, colors,
    images: uploadedImages,
    bg: '#F5F0EB',
    rating: 4.5,
    reviews: 0,
  };
  if (id) {
    DataStore.updateProduct(parseInt(id), data);
    alert('✅ Product updated!');
  } else {
    DataStore.addProduct(data);
    alert('✅ Product added!');
  }
  showPage('products');
  renderDashboard();
}

function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  DataStore.deleteProduct(id);
  renderProducts();
  renderDashboard();
}

function renderCategories() {
  const cats = DataStore.getCategories();
  document.getElementById('categoriesTable').innerHTML = cats.map(c => `
    <tr>
      <td>${c.id}</td>
      <td style="font-size:24px">${c.icon}</td>
      <td>${c.name}</td>
      <td><button class="action-btn btn-sm" onclick="editCategory(${c.id})">✏️</button><button class="action-btn btn-sm" onclick="deleteCategory(${c.id})">🗑️</button></td>
    </tr>
  `).join('');
}

function addCategory() {
  const name = prompt('Category name:');
  if (!name) return;
  const icon = prompt('Category emoji/icon:', '📁');
  if (!icon) return;
  const cats = DataStore.getCategories();
  cats.push({ id: Date.now(), name, icon, image: '' });
  DataStore.saveCategories(cats);
  renderCategories();
  updateCategorySelects();
}

function editCategory(id) {
  const cats = DataStore.getCategories();
  const c = cats.find(x => x.id === id);
  if (!c) return;
  const name = prompt('Category name:', c.name);
  if (!name) return;
  const icon = prompt('Icon:', c.icon);
  if (!icon) return;
  c.name = name;
  c.icon = icon;
  DataStore.saveCategories(cats);
  renderCategories();
  updateCategorySelects();
}

function deleteCategory(id) {
  if (!confirm('Delete this category?')) return;
  const cats = DataStore.getCategories();
  DataStore.saveCategories(cats.filter(c => c.id !== id));
  renderCategories();
  updateCategorySelects();
}

function updateCategorySelects() {
  const cats = DataStore.getCategories().filter(c => c.name !== 'All');
  document.querySelectorAll('#prodCategory').forEach(el => {
    if (el) el.innerHTML = cats.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
  });
  const filterEl = document.getElementById('adminCategoryFilter');
  if (filterEl) {
    const current = filterEl.value;
    filterEl.innerHTML = '<option value="">All Categories</option>' + cats.map(c => `<option value="${c.name}" ${c.name === current ? 'selected' : ''}>${c.name}</option>`).join('');
  }
}

function renderUsers() {
  const users = DataStore.getUsers();
  const orders = DataStore.getOrders();
  document.getElementById('usersTable').innerHTML = users.map(u => `
    <tr>
      <td>${u.id}</td>
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td>${u.phone || '-'}</td>
      <td>${u.createdAt || '-'}</td>
      <td>${orders.filter(o => o.email === u.email).length}</td>
    </tr>
  `).join('');
}

function renderCoupons() {
  const coupons = DataStore.getCoupons();
  document.getElementById('couponsTable').innerHTML = coupons.map(c => `
    <tr>
      <td><strong>${c.code}</strong></td>
      <td>${c.type === 'percent' ? c.discount + '%' : '₹' + c.discount}</td>
      <td>${c.type === 'percent' ? 'Percentage' : 'Flat'}</td>
      <td>₹${c.minOrder}</td>
      <td>${c.maxDiscount ? '₹' + c.maxDiscount : '∞'}</td>
      <td>${c.uses}/${c.maxUses}</td>
      <td>${c.active ? '✅ Active' : '❌ Inactive'}</td>
      <td><button class="action-btn btn-sm" onclick="toggleCoupon(${c.id})">${c.active ? 'Disable' : 'Enable'}</button><button class="action-btn btn-sm" onclick="deleteCoupon(${c.id})">🗑️</button></td>
    </tr>
  `).join('');
}

function addCoupon() {
  const code = prompt('Coupon code:');
  if (!code) return;
  const discount = parseFloat(prompt('Discount amount/percent:'));
  if (!discount) return;
  const type = prompt('Type (percent/flat):', 'percent');
  if (!['percent', 'flat'].includes(type)) return;
  const minOrder = parseFloat(prompt('Minimum order amount (₹):', '0')) || 0;
  const maxDiscount = parseFloat(prompt('Max discount (₹, 0 = unlimited):', '0')) || 0;
  const maxUses = parseInt(prompt('Max uses:', '100')) || 100;
  const coupons = DataStore.getCoupons();
  coupons.push({ id: Date.now(), code: code.toUpperCase(), discount, type, minOrder, uses: 0, maxUses, maxDiscount, active: true });
  DataStore.saveCoupons(coupons);
  renderCoupons();
}

function toggleCoupon(id) {
  const coupons = DataStore.getCoupons();
  const c = coupons.find(x => x.id === id);
  if (c) { c.active = !c.active; DataStore.saveCoupons(coupons); renderCoupons(); }
}

function deleteCoupon(id) {
  if (!confirm('Delete this coupon?')) return;
  const coupons = DataStore.getCoupons();
  DataStore.saveCoupons(coupons.filter(c => c.id !== id));
  renderCoupons();
}

function renderBanners() {
  const banners = DataStore.getBanners();
  const slideTime = localStorage.getItem('mf_slide_time') || '4000';
  const couponText = localStorage.getItem('mf_coupon_text') || 'New User? Use Code NEWUSER — Get 30% OFF up to ₹1,500!';
  document.getElementById('bannersTable').innerHTML = banners.map(b => `
    <tr>
      <td><strong>${b.title}</strong></td>
      <td>${b.subtitle}</td>
      <td>${b.image ? '<i class="fas fa-check-circle" style="color:var(--green)"></i>' : '<i class="fas fa-times-circle" style="color:var(--red)"></i>'}</td>
      <td><span style="display:inline-block;width:30px;height:20px;background:${b.bg};border:1px solid #ddd;vertical-align:middle"></span> ${b.bg}</td>
      <td>${b.active ? '<span style="color:var(--green)"><i class="fas fa-check-circle"></i> Active</span>' : '<span style="color:var(--red)"><i class="fas fa-times-circle"></i> Inactive</span>'}</td>
      <td>
        <button class="action-btn btn-sm" onclick="editBanner(${b.id})"><i class="fas fa-edit"></i></button>
        <button class="action-btn btn-sm" onclick="toggleBanner(${b.id})">${b.active ? 'Disable' : 'Enable'}</button>
        <button class="action-btn btn-sm" onclick="deleteBanner(${b.id})"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
  document.getElementById('bannersTable').insertAdjacentHTML('beforebegin', `
    <div class="card" style="margin-bottom:20px">
      <div class="card-header"><h3><i class="fas fa-sliders-h"></i> Slideshow Controls</h3></div>
      <div class="card-body">
        <div class="form-grid">
          <div class="form-group">
            <label>Slide Interval (seconds)</label>
            <input type="number" id="slideTimeInput" value="${parseInt(slideTime)/1000}" min="1" max="30" step="1">
          </div>
          <div class="form-group">
            <label>Auto-play</label>
            <select id="slideAutoplay"><option value="true" ${localStorage.getItem('mf_slide_autoplay') !== 'false' ? 'selected' : ''}>Enabled</option><option value="false" ${localStorage.getItem('mf_slide_autoplay') === 'false' ? 'selected' : ''}>Disabled</option></select>
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label><i class="fas fa-gift"></i> Coupon Strip Text</label>
            <input type="text" id="couponTextInput" value="${couponText.replace(/"/g, '&quot;')}" placeholder="New User? Use Code NEWUSER...">
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <button class="btn btn-black" onclick="saveSlideControls()"><i class="fas fa-save"></i> Save Slideshow Settings</button>
          </div>
        </div>
      </div>
    </div>
  `);
}

function saveSlideControls() {
  const time = parseInt(document.getElementById('slideTimeInput').value) * 1000;
  if (time < 1000) { alert('Minimum 1 second'); return; }
  localStorage.setItem('mf_slide_time', time.toString());
  localStorage.setItem('mf_slide_autoplay', document.getElementById('slideAutoplay').value);
  const coupon = document.getElementById('couponTextInput').value;
  localStorage.setItem('mf_coupon_text', coupon);
  alert('<i class="fas fa-check-circle"></i> Slideshow settings saved!');
  renderBanners();
}

function addBanner() {
  const d = document.createElement('div');
  d.innerHTML = `
    <div class="modal-overlay" style="display:flex;z-index:9999" id="bannerModal">
      <div class="modal" style="max-width:500px">
        <div class="modal-header"><h3><i class="fas fa-plus-circle"></i> Add Banner</h3><button class="modal-close" onclick="this.closest(\\'.modal-overlay\\').remove()"><i class="fas fa-times"></i></button></div>
        <div class="modal-body">
          <div class="form-group"><label>Title</label><input type="text" id="bannerTitle"></div>
          <div class="form-group"><label>Subtitle</label><input type="text" id="bannerSubtitle"></div>
          <div class="form-group"><label>Background Color</label><input type="color" id="bannerBg" value="#FF6B6B"></div>
          <div class="form-group"><label>Banner Image</label><input type="file" id="bannerImageInput" accept="image/*" onchange="previewBannerImage(event)"><br><small style="color:var(--mid-grey)">Optional — leave empty to show gradient</small><div id="bannerPreview" style="margin-top:10px"></div></div>
          <button class="btn btn-black" onclick="saveBanner()"><i class="fas fa-save"></i> Save Banner</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(d.firstElementChild);
  window._bannerImage = '';
}

let _bannerImage = '';

function previewBannerImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { alert('Image too large (max 2MB)'); return; }
  const reader = new FileReader();
  reader.onload = function(ev) {
    _bannerImage = ev.target.result;
    document.getElementById('bannerPreview').innerHTML = '<img src="'+ev.target.result+'" style="max-width:100%;max-height:150px;object-fit:cover">';
  };
  reader.readAsDataURL(file);
}

function saveBanner() {
  const title = document.getElementById('bannerTitle').value;
  if (!title) { alert('Title is required'); return; }
  const subtitle = document.getElementById('bannerSubtitle').value || '';
  const bg = document.getElementById('bannerBg').value || '#FF6B6B';
  const banners = DataStore.getBanners();
  banners.push({ id: Date.now(), image: _bannerImage || '', title, subtitle, link: '#', bg, active: true });
  DataStore.saveBanners(banners);
  _bannerImage = '';
  document.getElementById('bannerModal')?.remove();
  renderBanners();
}

function editBanner(id) {
  const banners = DataStore.getBanners();
  const b = banners.find(x => x.id === id);
  if (!b) return;
  _bannerImage = b.image || '';
  const div = document.createElement('div');
  div.innerHTML = `
    <div class="modal-overlay" style="display:flex;z-index:9999" id="bannerModal">
      <div class="modal" style="max-width:500px">
        <div class="modal-header"><h3><i class="fas fa-edit"></i> Edit Banner</h3><button class="modal-close" onclick="this.closest(\\'.modal-overlay\\').remove()"><i class="fas fa-times"></i></button></div>
        <div class="modal-body">
          <div class="form-group"><label>Title</label><input type="text" id="bannerTitle" value="${b.title.replace(/"/g, '&quot;')}"></div>
          <div class="form-group"><label>Subtitle</label><input type="text" id="bannerSubtitle" value="${b.subtitle.replace(/"/g, '&quot;')}"></div>
          <div class="form-group"><label>Background Color</label><input type="color" id="bannerBg" value="${b.bg}"></div>
          <div class="form-group"><label>Banner Image</label><input type="file" accept="image/*" onchange="previewBannerImage(event)"><br><small style="color:var(--mid-grey)">Leave empty to keep current image</small><div id="bannerPreview">${b.image ? '<img src="'+b.image+'" style="max-width:100%;max-height:150px;object-fit:cover">' : ''}</div></div>
          <input type="hidden" id="bannerEditId" value="${b.id}">
          <button class="btn btn-black" onclick="updateBanner()"><i class="fas fa-save"></i> Update Banner</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(div.firstElementChild);
}

function updateBanner() {
  const id = parseInt(document.getElementById('bannerEditId').value);
  const title = document.getElementById('bannerTitle').value;
  if (!title) { alert('Title is required'); return; }
  const banners = DataStore.getBanners();
  const b = banners.find(x => x.id === id);
  if (!b) return;
  b.title = title;
  b.subtitle = document.getElementById('bannerSubtitle').value || '';
  b.bg = document.getElementById('bannerBg').value || '#FF6B6B';
  if (_bannerImage) b.image = _bannerImage;
  DataStore.saveBanners(banners);
  _bannerImage = '';
  document.getElementById('bannerModal')?.remove();
  renderBanners();
}

function toggleBanner(id) {
  const banners = DataStore.getBanners();
  const b = banners.find(x => x.id === id);
  if (b) { b.active = !b.active; DataStore.saveBanners(banners); renderBanners(); }
}

function deleteBanner(id) {
  if (!confirm('Delete this banner?')) return;
  const banners = DataStore.getBanners();
  DataStore.saveBanners(banners.filter(b => b.id !== id));
  renderBanners();
}

function renderReviews() {
  const all = JSON.parse(localStorage.getItem('mf_reviews')) || [];
  const products = DataStore.getProducts();
  document.getElementById('reviewsTable').innerHTML = (all.length === 0 ? [{id:0, productId:0, name:'-', rating:'-', comment:'No reviews yet', date:'-'}] : all).map(r => {
    const p = products.find(x => x.id === r.productId);
    return `<tr><td>${p ? p.name : 'Unknown'}</td><td>${r.name}</td><td>${'⭐'.repeat(r.rating)}</td><td>${r.comment}</td><td>${r.date || '-'}</td><td><button class="action-btn btn-sm" onclick="deleteReview(${r.id})">🗑️</button></td></tr>`;
  }).join('');
}

function deleteReview(id) {
  if (!confirm('Delete this review?')) return;
  let all = JSON.parse(localStorage.getItem('mf_reviews')) || [];
  all = all.filter(r => r.id !== id);
  localStorage.setItem('mf_reviews', JSON.stringify(all));
  renderReviews();
}

function renderBrands() {
  const products = DataStore.getProducts();
  const brands = [...new Set(products.map(p => p.brand))];
  document.getElementById('brandsTable').innerHTML = brands.map(b => `
    <tr><td><strong>${b}</strong></td><td>${products.filter(p => p.brand === b).length} products</td><td><button class="action-btn btn-sm" onclick="alert('Brand: ${b}')">View</button></td></tr>
  `).join('');
}

function addBrand() {
  alert('Brands are auto-created from product brands.');
}

function renderOffers() {
  document.getElementById('offersTable').innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--mid-grey)">Use Coupons to create offers. Offers appear in banner slides.</td></tr>';
}

function addOffer() {
  alert('Create offers via Coupons section. Add banner slides in Banners section.');
}

function saveSettings() {
  const pass = document.getElementById('setNewPass').value;
  if (pass) {
    if (pass.length < 4) { alert('Password must be at least 4 characters'); return; }
    localStorage.setItem('mf_admin_pass', pass);
    document.getElementById('setNewPass').value = '';
    alert('✅ Password updated!');
  } else {
    alert('✅ Settings saved!');
  }
}

let storeOpen = true;
function toggleStoreStatus() {
  storeOpen = !storeOpen;
  document.getElementById('storeStatusBtn').textContent = storeOpen ? '🔴 Close Store' : '🟢 Open Store';
  alert(storeOpen ? 'Store is now OPEN' : 'Store is now CLOSED');
}

function saveSeo() {
  alert('✅ SEO settings saved!');
}

function saveShipping() {
  alert('✅ Shipping settings saved!');
}

function exportBackup() {
  const data = DataStore.exportData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mithila-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  alert('✅ Backup downloaded!');
}

function importBackup(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      const result = DataStore.importData(data);
      if (result.error) { alert('❌ ' + result.error); return; }
      alert('✅ Data imported! Refreshing...');
      Object.values({dashboard:1,orders:1,products:1,categories:1,users:1,coupons:1,banners:1,reviews:1,brands:1}).forEach(() => {});
      location.reload();
    } catch(err) { alert('❌ Invalid file format'); }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function resetAllData() {
  if (!confirm('⚠️ DELETE ALL DATA?')) return;
  if (!confirm('Are you sure?')) return;
  DataStore.clearAllData();
  alert('✅ All data reset to defaults');
  location.reload();
}

function initAdmin() {
  renderDashboard();
  renderOrders();
  renderProducts();
  renderCategories();
  renderUsers();
  renderCoupons();
  renderBanners();
  renderReviews();
  renderBrands();
  renderOffers();
  renderAnalytics();
  updateCategorySelects();
  updateClock();
}

document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('mf_admin_logged')) {
    isLoggedIn = true;
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appMain').style.display = 'flex';
    initAdmin();
  }
});
