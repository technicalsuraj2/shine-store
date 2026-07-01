// ============================================
// SHARED DATA LAYER - Products, Orders, Users
// ============================================

const DataStore = {
  init() {
    if (!localStorage.getItem('pf_products')) this.seedProducts();
    if (!localStorage.getItem('pf_orders')) this.seedOrders();
    if (!localStorage.getItem('pf_users')) this.seedUsers();
    if (!localStorage.getItem('pf_categories')) this.seedCategories();
    if (!localStorage.getItem('pf_coupons')) this.seedCoupons();
    if (!localStorage.getItem('pf_reviews')) localStorage.setItem('pf_reviews', '[]');
    if (!localStorage.getItem('pf_cart')) localStorage.setItem('pf_cart', '[]');
    if (!localStorage.getItem('pf_wishlist')) localStorage.setItem('pf_wishlist', '[]');
  },

  // ----- PRODUCTS -----
  getProducts() { return JSON.parse(localStorage.getItem('pf_products')); },
  saveProducts(p) { localStorage.setItem('pf_products', JSON.stringify(p)); },
  getProduct(id) { return this.getProducts().find(p => p.id === id); },

  addProduct(p) {
    const prods = this.getProducts();
    p.id = Date.now();
    prods.push(p);
    this.saveProducts(prods);
    return p;
  },

  updateProduct(id, data) {
    const prods = this.getProducts();
    const idx = prods.findIndex(p => p.id === id);
    if (idx > -1) { Object.assign(prods[idx], data); this.saveProducts(prods); return prods[idx]; }
    return null;
  },

  deleteProduct(id) {
    let prods = this.getProducts();
    prods = prods.filter(p => p.id !== id);
    this.saveProducts(prods);
  },

  // ----- CATEGORIES -----
  getCategories() { return JSON.parse(localStorage.getItem('pf_categories')); },
  saveCategories(c) { localStorage.setItem('pf_categories', JSON.stringify(c)); },

  // ----- ORDERS -----
  getOrders() { return JSON.parse(localStorage.getItem('pf_orders')); },
  saveOrders(o) { localStorage.setItem('pf_orders', JSON.stringify(o)); },
  getOrder(id) { return this.getOrders().find(o => o.id === id); },

  addOrder(order) {
    const orders = this.getOrders();
    order.id = 'ORD-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
    order.date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    order.status = 'Pending';
    orders.unshift(order);
    this.saveOrders(orders);
    return order;
  },

  updateOrderStatus(id, status) {
    const orders = this.getOrders();
    const o = orders.find(x => x.id === id);
    if (o) { o.status = status; this.saveOrders(orders); }
    return o;
  },

  // ----- USERS -----
  getUsers() { return JSON.parse(localStorage.getItem('pf_users')); },
  saveUsers(u) { localStorage.setItem('pf_users', JSON.stringify(u)); },

  registerUser(u) {
    const users = this.getUsers();
    if (users.find(x => x.email === u.email)) return { error: 'Email already registered' };
    if (users.find(x => x.phone === u.phone)) return { error: 'Phone already registered' };
    u.id = 'USR-' + Date.now().toString(36).toUpperCase();
    u.password = u.password;
    u.createdAt = new Date().toISOString();
    users.push(u);
    this.saveUsers(users);
    return { success: true, user: { id: u.id, name: u.name, email: u.email, phone: u.phone } };
  },

  loginUser(email, password) {
    const users = this.getUsers();
    const u = users.find(x => x.email === email && x.password === password);
    if (!u) return { error: 'Invalid email or password' };
    return { success: true, user: { id: u.id, name: u.name, email: u.email, phone: u.phone } };
  },

  // ----- COUPONS -----
  getCoupons() { return JSON.parse(localStorage.getItem('pf_coupons')); },
  saveCoupons(c) { localStorage.setItem('pf_coupons', JSON.stringify(c)); },

  // ----- CART -----
  getCart() { return JSON.parse(localStorage.getItem('pf_cart')); },
  saveCart(c) { localStorage.setItem('pf_cart', JSON.stringify(c)); },
  getWishlist() { return JSON.parse(localStorage.getItem('pf_wishlist')); },
  saveWishlist(w) { localStorage.setItem('pf_wishlist', JSON.stringify(w)); },

  // ----- STATS -----
  getStats() {
    const orders = this.getOrders();
    const users = this.getUsers();
    const products = this.getProducts();
    const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    return {
      totalOrders: orders.length,
      totalRevenue,
      totalUsers: users.length,
      totalProducts: products.length,
      pendingOrders
    };
  },

  // ----- SEED DATA -----
  seedCategories() {
    const cats = [
      { id: 1, name: 'All', icon: '👗' },
      { id: 2, name: 'Western Wear', icon: '👚' },
      { id: 3, name: 'Ethnic Wear', icon: '🥻' },
      { id: 4, name: 'Footwear', icon: '👠' },
      { id: 5, name: 'Accessories', icon: '👜' },
      { id: 6, name: 'Beauty', icon: '💄' },
      { id: 7, name: 'Luxe', icon: '💎' },
    ];
    this.saveCategories(cats);
  },

  seedProducts() {
    const prods = [
      { id: 1, name: 'Silk Evening Gown', brand: 'VERA MODA', category: 'Western Wear', price: 24999, original: 34999, rating: 4.8, reviews: 234, badge: 'New Season', emoji: '👗', bg: '#F5F0EB', inStock: true },
      { id: 2, name: 'Designer Lehenga Set', brand: 'MANGO', category: 'Ethnic Wear', price: 45999, original: 65000, rating: 4.9, reviews: 189, badge: 'Best Seller', emoji: '🥻', bg: '#F0E6D8', inStock: true },
      { id: 3, name: 'Leather Shoulder Bag', brand: 'ZARA', category: 'Accessories', price: 15999, original: 22500, rating: 4.7, reviews: 445, badge: 'Trending', emoji: '👜', bg: '#EBE5E0', inStock: true },
      { id: 4, name: 'Stiletto Heels Gold', brand: 'LOUIS VUITTON', category: 'Footwear', price: 18999, original: 28000, rating: 4.8, reviews: 312, badge: 'Premium', emoji: '👠', bg: '#F5E6E0', inStock: true },
      { id: 5, name: 'Diamond Pendant Set', brand: 'TIFFANY', category: 'Luxe', price: 125000, original: 159000, rating: 4.9, reviews: 89, badge: 'Luxe', emoji: '💎', bg: '#E8E0F0', inStock: true },
      { id: 6, name: 'Floral Midi Dress', brand: 'H&M', category: 'Western Wear', price: 8999, original: 12999, rating: 4.6, reviews: 567, badge: 'Sale', emoji: '👗', bg: '#E8F0E8', inStock: true },
      { id: 7, name: 'Gold Plated Bracelet', brand: 'PANDORA', category: 'Accessories', price: 12999, original: 17999, rating: 4.7, reviews: 298, badge: 'Popular', emoji: '📿', bg: '#F5F0D8', inStock: true },
      { id: 8, name: 'Embroidered Kurta Set', brand: 'MANGO', category: 'Ethnic Wear', price: 6999, original: 9999, rating: 4.5, reviews: 678, badge: 'Value', emoji: '🥻', bg: '#F0E8E8', inStock: true },
    ];
    this.saveProducts(prods);
  },

  seedOrders() {
    const orders = [
      { id: 'ORD-SH2026001', customer: 'Priya Sharma', email: 'priya@email.com', items: [{ name: 'Silk Evening Gown', qty: 1, price: 24999 }], total: 24999, date: '28 Jun 2026', status: 'Delivered', address: '12 MG Road, Mumbai' },
      { id: 'ORD-SH2026002', customer: 'Ananya Gupta', email: 'ananya@email.com', items: [{ name: 'Designer Lehenga Set', qty: 1, price: 45999 }], total: 45999, date: '29 Jun 2026', status: 'Shipped', address: '45 Lajpat Nagar, Delhi' },
      { id: 'ORD-SH2026003', customer: 'Riya Patel', email: 'riya@email.com', items: [{ name: 'Leather Shoulder Bag', qty: 1, price: 15999 }], total: 15999, date: '30 Jun 2026', status: 'Processing', address: '78 Satellite Road, Ahmedabad' },
      { id: 'ORD-SH2026004', customer: 'Neha Singh', email: 'neha@email.com', items: [{ name: 'Stiletto Heels Gold', qty: 1, price: 18999 }, { name: 'Gold Plated Bracelet', qty: 1, price: 12999 }], total: 31998, date: '30 Jun 2026', status: 'Pending', address: '33 Park Street, Kolkata' },
    ];
    this.saveOrders(orders);
  },

  seedUsers() {
    const users = [
      { id: 'USR-001', name: 'Priya Sharma', email: 'priya@email.com', phone: '9876543210', password: 'user123', createdAt: '2026-01-15' },
      { id: 'USR-002', name: 'Ananya Gupta', email: 'ananya@email.com', phone: '9876543211', password: 'user123', createdAt: '2026-02-20' },
    ];
    this.saveUsers(users);
  },

  seedCoupons() {
    const coupons = [
      { id: 1, code: 'WELCOME50', discount: 50, type: 'flat', minOrder: 999, uses: 0, maxUses: 100, active: true },
      { id: 2, code: 'FASHION20', discount: 20, type: 'percent', minOrder: 2999, uses: 0, maxUses: 200, active: true },
      { id: 3, code: 'PREMIUM', discount: 500, type: 'flat', minOrder: 9999, uses: 0, maxUses: 50, active: true },
    ];
    this.saveCoupons(coupons);
  }
};

DataStore.init();
