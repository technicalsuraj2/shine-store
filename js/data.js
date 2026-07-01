const DataStore = {
  init() {
    const version = '2.0';
    if (localStorage.getItem('mf_data_version') !== version) {
      this.seedProducts();
      this.seedOrders();
      this.seedUsers();
      this.seedCategories();
      this.seedCoupons();
      this.seedBanners();
      localStorage.setItem('mf_data_version', version);
    }
    if (!localStorage.getItem('mf_reviews')) localStorage.setItem('mf_reviews', '[]');
    if (!localStorage.getItem('mf_cart')) localStorage.setItem('mf_cart', '[]');
    if (!localStorage.getItem('mf_wishlist')) localStorage.setItem('mf_wishlist', '[]');
  },

  getProducts() { return JSON.parse(localStorage.getItem('mf_products')) || []; },
  saveProducts(p) { localStorage.setItem('mf_products', JSON.stringify(p)); },
  getProduct(id) { const prods = this.getProducts(); return prods.find(p => p.id === id); },

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

  getCategories() { return JSON.parse(localStorage.getItem('mf_categories')) || []; },
  saveCategories(c) { localStorage.setItem('mf_categories', JSON.stringify(c)); },

  getOrders() { return JSON.parse(localStorage.getItem('mf_orders')) || []; },
  saveOrders(o) { localStorage.setItem('mf_orders', JSON.stringify(o)); },
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

  getUsers() { return JSON.parse(localStorage.getItem('mf_users')) || []; },
  saveUsers(u) { localStorage.setItem('mf_users', JSON.stringify(u)); },

  registerUser(u) {
    const users = this.getUsers();
    if (users.find(x => x.email === u.email)) return { error: 'Email already registered' };
    if (users.find(x => x.phone === u.phone)) return { error: 'Phone already registered' };
    u.id = 'USR-' + Date.now().toString(36).toUpperCase();
    u.createdAt = new Date().toISOString();
    u.address = u.address || '';
    u.city = u.city || '';
    u.pincode = u.pincode || '';
    u.avatar = u.avatar || '';
    users.push(u);
    this.saveUsers(users);
    return { success: true, user: { id: u.id, name: u.name, email: u.email, phone: u.phone, address: u.address, city: u.city, pincode: u.pincode, avatar: u.avatar } };
  },

  loginUser(email, password) {
    const users = this.getUsers();
    const u = users.find(x => x.email === email && x.password === password);
    if (!u) return { error: 'Invalid email or password' };
    return { success: true, user: { id: u.id, name: u.name, email: u.email, phone: u.phone, address: u.address, city: u.city, pincode: u.pincode, avatar: u.avatar } };
  },

  updateUser(id, data) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx > -1) { Object.assign(users[idx], data); this.saveUsers(users); return users[idx]; }
    return null;
  },

  getCoupons() { return JSON.parse(localStorage.getItem('mf_coupons')) || []; },
  saveCoupons(c) { localStorage.setItem('mf_coupons', JSON.stringify(c)); },

  getCart() { return JSON.parse(localStorage.getItem('mf_cart')) || []; },
  saveCart(c) { localStorage.setItem('mf_cart', JSON.stringify(c)); },
  getWishlist() { return JSON.parse(localStorage.getItem('mf_wishlist')) || []; },
  saveWishlist(w) { localStorage.setItem('mf_wishlist', JSON.stringify(w)); },

  getBanners() { return JSON.parse(localStorage.getItem('mf_banners')) || []; },
  saveBanners(b) { localStorage.setItem('mf_banners', JSON.stringify(b)); },

  getReviews(productId) {
    const all = JSON.parse(localStorage.getItem('mf_reviews')) || [];
    return all.filter(r => r.productId === productId);
  },
  addReview(r) {
    const all = JSON.parse(localStorage.getItem('mf_reviews')) || [];
    r.id = Date.now();
    r.date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    all.push(r);
    localStorage.setItem('mf_reviews', JSON.stringify(all));
    return r;
  },

  applyCoupon(code, cartTotal) {
    const coupons = this.getCoupons();
    const c = coupons.find(x => x.code === code.toUpperCase() && x.active);
    if (!c) return { error: 'Invalid coupon code' };
    if (c.uses >= c.maxUses) return { error: 'Coupon usage limit reached' };
    if (cartTotal < c.minOrder) return { error: `Minimum order ₹${c.minOrder} required` };
    let discount = c.type === 'percent' ? (cartTotal * c.discount / 100) : c.discount;
    if (c.maxDiscount && discount > c.maxDiscount) discount = c.maxDiscount;
    if (discount > cartTotal) discount = cartTotal;
    c.uses += 1;
    this.saveCoupons(coupons);
    return { success: true, discount, code: c.code };
  },

  exportData() {
    return {
      products: this.getProducts(),
      orders: this.getOrders(),
      users: this.getUsers(),
      categories: this.getCategories(),
      coupons: this.getCoupons(),
      reviews: JSON.parse(localStorage.getItem('mf_reviews') || '[]'),
      wishlist: JSON.parse(localStorage.getItem('mf_wishlist') || '[]'),
      banners: this.getBanners(),
      exportedAt: new Date().toISOString()
    };
  },

  importData(data) {
    if (!data || !data.products) return { error: 'Invalid backup file' };
    try {
      this.saveProducts(data.products);
      this.saveOrders(data.orders || []);
      this.saveUsers(data.users || []);
      this.saveCategories(data.categories || []);
      this.saveCoupons(data.coupons || []);
      localStorage.setItem('mf_reviews', JSON.stringify(data.reviews || []));
      localStorage.setItem('mf_wishlist', JSON.stringify(data.wishlist || []));
      localStorage.setItem('mf_banners', JSON.stringify(data.banners || []));
      return { success: true };
    } catch(e) {
      return { error: e.message };
    }
  },

  clearAllData() {
    ['mf_products','mf_orders','mf_users','mf_categories','mf_coupons','mf_reviews','mf_wishlist','mf_cart','mf_banners'].forEach(k => localStorage.removeItem(k));
    this.init();
  },

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

  seedBanners() {
    const banners = [
      { id: 1, image: '', title: 'Summer Sale', subtitle: 'Up to 50% Off', link: '#', bg: '#FF6B6B', active: true },
      { id: 2, image: '', title: 'New Collection', subtitle: 'Fresh Styles Arrived', link: '#', bg: '#4ECDC4', active: true },
      { id: 3, image: '', title: 'Festival Offer', subtitle: 'Use Code: FESTIVE20', link: '#', bg: '#FFE66D', active: true },
    ];
    this.saveBanners(banners);
  },

  seedCategories() {
    const cats = [
      { id: 1, name: 'All', icon: 'All', image: 'https://picsum.photos/seed/all-cat/100/100' },
      { id: 2, name: 'Women Ethnic', icon: 'Ethnic', image: 'https://picsum.photos/seed/women-ethnic/100/100' },
      { id: 3, name: 'Women Western', icon: 'Western', image: 'https://picsum.photos/seed/women-western/100/100' },
      { id: 4, name: 'Men', icon: 'Men', image: 'https://picsum.photos/seed/men/100/100' },
      { id: 5, name: 'Girls', icon: 'Girls', image: 'https://picsum.photos/seed/girls/100/100' },
      { id: 6, name: 'Boys', icon: 'Boys', image: 'https://picsum.photos/seed/boys/100/100' },
      { id: 7, name: 'Bags', icon: 'Bags', image: 'https://picsum.photos/seed/bags/100/100' },
      { id: 8, name: 'Footwear', icon: 'Shoes', image: 'https://picsum.photos/seed/footwear/100/100' },
      { id: 9, name: 'Jeans', icon: 'Jeans', image: 'https://picsum.photos/seed/jeans/100/100' },
      { id: 10, name: 'Kurta Sets', icon: 'Kurta', image: 'https://picsum.photos/seed/kurta/100/100' },
      { id: 11, name: 'Sarees', icon: 'Saree', image: 'https://picsum.photos/seed/sarees/100/100' },
      { id: 12, name: 'Accessories', icon: 'Accessories', image: 'https://picsum.photos/seed/accessories/100/100' },
      { id: 13, name: 'Jewellery', icon: 'Jewellery', image: 'https://picsum.photos/seed/jewellery/100/100' },
      { id: 14, name: 'Beauty', icon: 'Beauty', image: 'https://picsum.photos/seed/beauty/100/100' },
      { id: 15, name: 'Home Decor', icon: 'Home', image: 'https://picsum.photos/seed/home-decor/100/100' },
      { id: 16, name: 'Kids Wear', icon: 'Kids', image: 'https://picsum.photos/seed/kids-wear/100/100' },
      { id: 17, name: 'Winter Wear', icon: 'Winter', image: 'https://picsum.photos/seed/winter-wear/100/100' },
      { id: 18, name: 'Sports', icon: 'Sports', image: 'https://picsum.photos/seed/sports/100/100' },
      { id: 19, name: 'Watches', icon: 'Watches', image: 'https://picsum.photos/seed/watches/100/100' },
      { id: 20, name: 'Luxe', icon: 'Luxe', image: 'https://picsum.photos/seed/luxe/100/100' },
      { id: 21, name: 'Electronics', icon: 'Electronics', image: 'https://picsum.photos/seed/electronics/100/100' },
      { id: 22, name: 'Gifts', icon: 'Gifts', image: 'https://picsum.photos/seed/gifts/100/100' },
    ];
    this.saveCategories(cats);
  },

  seedProducts() {
    const prods = [
      { id: 1, name: 'Silk Evening Gown', brand: 'VERA MODA', category: 'Women Western', price: 24999, original: 34999, rating: 4.8, reviews: 234, badge: 'New Season', images: ['https://picsum.photos/seed/silk-gown/400/500','https://picsum.photos/seed/silk-gown-2/400/500'], description: 'Premium silk evening gown with elegant fall. Perfect for parties and weddings.', sizes: ['S','M','L','XL'], colors: ['Red','Black','Gold'], inStock: true },
      { id: 2, name: 'Designer Lehenga Set', brand: 'MANGO', category: 'Women Ethnic', price: 45999, original: 65000, rating: 4.9, reviews: 189, badge: 'Best Seller', images: ['https://picsum.photos/seed/lehenga/400/500','https://picsum.photos/seed/lehenga-2/400/500'], description: 'Beautiful designer lehenga with heavy embroidery and gota patti work.', sizes: ['M','L','XL'], colors: ['Red','Pink','Orange'], inStock: true },
      { id: 3, name: 'Leather Shoulder Bag', brand: 'ZARA', category: 'Bags', price: 15999, original: 22500, rating: 4.7, reviews: 445, badge: 'Trending', images: ['https://picsum.photos/seed/shoulder-bag/400/500','https://picsum.photos/seed/bag-2/400/500'], description: 'Genuine leather shoulder bag with gold-plated hardware.', sizes: ['One Size'], colors: ['Brown','Black','Tan'], inStock: true },
    ];
    this.saveProducts(prods);
  },

  seedOrders() {
    this.saveOrders([]);
  },

  seedUsers() {
    const users = [
      { id: 'USR-001', name: 'Admin User', email: 'admin@mithila.store', phone: '9999999999', password: 'admin123', address: '', city: '', pincode: '', avatar: '', createdAt: '2026-01-01' },
    ];
    this.saveUsers(users);
  },

  seedCoupons() {
    const coupons = [
      { id: 1, code: 'WELCOME50', discount: 50, type: 'flat', minOrder: 999, uses: 0, maxUses: 100, active: true, maxDiscount: 0 },
      { id: 2, code: 'FASHION20', discount: 20, type: 'percent', minOrder: 2999, uses: 0, maxUses: 200, active: true, maxDiscount: 2000 },
      { id: 3, code: 'FESTIVE100', discount: 100, type: 'flat', minOrder: 5000, uses: 0, maxUses: 50, active: true, maxDiscount: 0 },
      { id: 4, code: 'NEWUSER', discount: 30, type: 'percent', minOrder: 0, uses: 0, maxUses: 500, active: true, maxDiscount: 1500 },
    ];
    this.saveCoupons(coupons);
  }
};

DataStore.init();
