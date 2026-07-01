// ===== ADMIN AUTH =====
const ADMIN_USER = 'admin';
const DEFAULT_PASS = 'admin123';
let isLoggedIn = false;

function getAdminPass() {
  return localStorage.getItem('pf_admin_pass') || DEFAULT_PASS;
}

function handleAdminLogin(e) {
  e.preventDefault();
  const u = document.getElementById('adminUser').value;
  const p = document.getElementById('adminPass').value;
  if (u === ADMIN_USER && p === getAdminPass()) {
    isLoggedIn = true;
    localStorage.setItem('pf_admin_logged', 'true');
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appMain').style.display = 'flex';
    initAdmin();
  } else {
    document.getElementById('loginError').style.display = 'block';
  }
}

function handleLogout() {
  isLoggedIn = false;
  localStorage.removeItem('pf_admin_logged');
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('appMain').style.display = 'none';
}

// ===== ROUTING =====
function showPage(page) {
  document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');
  document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
  const titles = { dashboard: 'Dashboard', orders: 'Orders', products: 'Products', categories: 'Categories', users: 'Users', coupons: 'Coupons', settings: 'Settings' };
  document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';
  renderPage(page);
}

function renderPage(page) {
  switch(page) {
    case 'dashboard': renderDashboard(); break;
    case 'orders': renderOrders(); break;
    case 'products': renderProducts(); break;
    case 'categories': renderCategories(); break;
    case 'users': renderUsers(); break;
    case 'coupons': renderCoupons(); break;
  }
}

// ===== CLOCK =====
function updateClock() {
  const c = document.getElementById('clock');
  if (c) c.textContent = new Date().toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
setInterval(updateClock, 1000);

// ===== DASHBOARD =====
function renderDashboard() {
  const stats = DataStore.getStats();
  const grid = document.getElementById('statsGrid');
  const cards = [
    { value: stats.totalOrders, label: 'Total Orders', icon: '📦', cls: 'gold', change: '+12% this month' },
    { value: '₹' + stats.totalRevenue.toLocaleString('en-IN'), label: 'Revenue', icon: '💰', cls: 'green', change: '+8% this month' },
    { value: stats.totalUsers, label: 'Registered Users', icon: '👥', cls: 'blue', change: '+5% this month' },
    { value: stats.totalProducts, label: 'Products', icon: '👗', cls: 'red', change: 'Stable' },
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

  const orders = DataStore.getOrders().slice(0, 5);
  document.getElementById('recentOrdersTable').innerHTML = orders.map(o => `
    <tr>
      <td><strong>${o.id}</strong></td>
      <td>${o.customer}</td>
      <td>₹${(o.total || 0).toLocaleString('en-IN')}</td>
      <td><span class="status ${o.status.toLowerCase()}">${o.status}</span></td>
      <td><button class="action-btn btn-sm" onclick="showPage('orders')">View</button></td>
    </tr>
  `).join('');

  const pendingCount = orders.filter(o => o.status === 'Pending').length;
  document.getElementById('orderBadge').textContent = pendingCount || '0';
}

// ===== ORDERS =====
function renderOrders() {
  const orders = DataStore.getOrders();
  document.getElementById('ordersTable').innerHTML = orders.map(o => `
    <tr>
      <td><strong>${o.id}</strong></td>
      <td>${o.customer}<br><small style="color:var(--mid-grey)">${o.email}</small></td>
      <td>${o.items.map(i => `${i.name} × ${i.qty}`).join(', ')}</td>
      <td>₹${(o.total || 0).toLocaleString('en-IN')}</td>
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

function updateOrderStatus(id, status) {
  DataStore.updateOrderStatus(id, status);
  renderOrders();
  renderDashboard();
}

// ===== PRODUCTS =====
function renderProducts() {
  const prods = DataStore.getProducts();
  document.getElementById('productsTable').innerHTML = prods.map(p => `
    <tr>
      <td>${p.id}</td>
      <td><strong>${p.name}</strong></td>
      <td>${p.brand}</td>
      <td>${p.category}</td>
      <td>₹${p.price.toLocaleString('en-IN')}</td>
      <td>${p.inStock ? '✅ In Stock' : '❌ Out'}</td>
      <td>
        <button class="action-btn btn-sm" onclick="editProduct(${p.id})">✏️</button>
        <button class="action-btn btn-sm" onclick="deleteProduct(${p.id})">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function openProductModal() {
  document.getElementById('productModalTitle').textContent = 'Add Product';
  document.getElementById('productForm').reset();
  document.getElementById('prodId').value = '';
  const catSelect = document.getElementById('prodCategory');
  const cats = DataStore.getCategories();
  catSelect.innerHTML = cats.filter(c => c.name !== 'All').map(c => `<option value="${c.name}">${c.name}</option>`).join('');
  document.getElementById('productModal').classList.add('open');
}

function closeProductModal() {
  document.getElementById('productModal').classList.remove('open');
}

function editProduct(id) {
  const p = DataStore.getProduct(id);
  if (!p) return;
  document.getElementById('productModalTitle').textContent = 'Edit Product';
  document.getElementById('prodId').value = p.id;
  document.getElementById('prodName').value = p.name;
  document.getElementById('prodBrand').value = p.brand;
  document.getElementById('prodPrice').value = p.price;
  document.getElementById('prodOriginal').value = p.original;
  document.getElementById('prodBadge').value = p.badge || '';
  document.getElementById('prodEmoji').value = p.emoji || '👗';
  document.getElementById('prodStock').value = p.inStock ? 'true' : 'false';
  const catSelect = document.getElementById('prodCategory');
  const cats = DataStore.getCategories();
  catSelect.innerHTML = cats.filter(c => c.name !== 'All').map(c => `<option value="${c.name}" ${c.name === p.category ? 'selected' : ''}>${c.name}</option>`).join('');
  document.getElementById('productModal').classList.add('open');
}

function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('prodId').value;
  const data = {
    name: document.getElementById('prodName').value,
    brand: document.getElementById('prodBrand').value,
    category: document.getElementById('prodCategory').value,
    price: parseFloat(document.getElementById('prodPrice').value),
    original: parseFloat(document.getElementById('prodOriginal').value) || 0,
    badge: document.getElementById('prodBadge').value,
    emoji: document.getElementById('prodEmoji').value || '👗',
    inStock: document.getElementById('prodStock').value === 'true',
    bg: '#F5F0EB',
    rating: 4.5,
    reviews: 0,
  };

  if (id) {
    DataStore.updateProduct(parseInt(id), data);
  } else {
    DataStore.addProduct(data);
  }

  closeProductModal();
  renderProducts();
  renderDashboard();
}

function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  DataStore.deleteProduct(id);
  renderProducts();
  renderDashboard();
}

// ===== CATEGORIES =====
function renderCategories() {
  const cats = DataStore.getCategories();
  document.getElementById('categoriesTable').innerHTML = cats.map(c => `
    <tr><td>${c.id}</td><td style="font-size:24px">${c.icon}</td><td>${c.name}</td></tr>
  `).join('');
}

// ===== USERS =====
function renderUsers() {
  const users = DataStore.getUsers();
  document.getElementById('usersTable').innerHTML = users.map(u => `
    <tr>
      <td>${u.id}</td>
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td>${u.phone || '-'}</td>
      <td>${u.createdAt || '-'}</td>
    </tr>
  `).join('');
}

// ===== COUPONS =====
function renderCoupons() {
  const coupons = DataStore.getCoupons();
  document.getElementById('couponsTable').innerHTML = coupons.map(c => `
    <tr>
      <td><strong>${c.code}</strong></td>
      <td>${c.type === 'percent' ? c.discount + '%' : '₹' + c.discount}</td>
      <td>${c.type === 'percent' ? 'Percentage' : 'Flat'}</td>
      <td>₹${c.minOrder}</td>
      <td>${c.uses}/${c.maxUses}</td>
      <td>${c.active ? '✅ Active' : '❌ Inactive'}</td>
      <td><button class="action-btn btn-sm" onclick="toggleCoupon(${c.id})">${c.active ? 'Disable' : 'Enable'}</button></td>
    </tr>
  `).join('');
}

function toggleCoupon(id) {
  const coupons = DataStore.getCoupons();
  const c = coupons.find(x => x.id === id);
  if (c) { c.active = !c.active; DataStore.saveCoupons(coupons); renderCoupons(); }
}

function addCoupon() {
  const code = prompt('Coupon code:');
  if (!code) return;
  const discount = prompt('Discount amount/number:');
  if (!discount) return;
  const type = confirm('OK = Percentage, Cancel = Flat') ? 'percent' : 'flat';
  const coupons = DataStore.getCoupons();
  coupons.push({
    id: Date.now(), code: code.toUpperCase(), discount: parseFloat(discount),
    type, minOrder: 0, uses: 0, maxUses: 100, active: true
  });
  DataStore.saveCoupons(coupons);
  renderCoupons();
}

// ===== SETTINGS =====
function saveSettings() {
  const pass = document.getElementById('setNewPass').value;
  if (pass) {
    if (pass.length < 4) {
      alert('Password must be at least 4 characters');
      return;
    }
    localStorage.setItem('pf_admin_pass', pass);
    document.getElementById('setNewPass').value = '';
    alert('✅ Admin password updated successfully!');
  } else {
    alert('Settings saved!');
  }
}

// ===== BACKUP & RESTORE =====
function exportBackup() {
  const data = DataStore.exportData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `shine-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  alert('✅ Backup downloaded successfully!');
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
      alert('✅ Data imported successfully! Refreshing...');
      renderDashboard();
      renderOrders();
      renderProducts();
      renderCategories();
      renderUsers();
      renderCoupons();
    } catch(err) {
      alert('❌ Invalid file format');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function resetAllData() {
  if (!confirm('⚠️ This will DELETE ALL store data (products, orders, users, coupons). Are you sure?')) return;
  if (!confirm('Last chance! All data will be lost. Proceed?')) return;
  DataStore.clearAllData();
  alert('✅ All data reset to defaults. Refreshing...');
  renderDashboard();
  renderOrders();
  renderProducts();
  renderCategories();
  renderUsers();
  renderCoupons();
}

// ===== INIT =====
function initAdmin() {
  renderDashboard();
  renderOrders();
  renderProducts();
  renderCategories();
  renderUsers();
  renderCoupons();
  updateClock();
}

// Auto-login if already logged in via localStorage
document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('pf_admin_logged')) {
    isLoggedIn = true;
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appMain').style.display = 'flex';
    initAdmin();
  }
});
