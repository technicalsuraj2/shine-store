const DataStore = {
  init() {
    if (!localStorage.getItem('mf_products')) this.seedProducts();
    if (!localStorage.getItem('mf_orders')) this.seedOrders();
    if (!localStorage.getItem('mf_users')) this.seedUsers();
    if (!localStorage.getItem('mf_categories')) this.seedCategories();
    if (!localStorage.getItem('mf_coupons')) this.seedCoupons();
    if (!localStorage.getItem('mf_reviews')) localStorage.setItem('mf_reviews', '[]');
    if (!localStorage.getItem('mf_cart')) localStorage.setItem('mf_cart', '[]');
    if (!localStorage.getItem('mf_wishlist')) localStorage.setItem('mf_wishlist', '[]');
    if (!localStorage.getItem('mf_banners')) this.seedBanners();
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
      { id: 1, name: 'All', icon: 'All', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=100&h=100&fit=crop' },
      { id: 2, name: 'Women Ethnic', icon: 'Ethnic', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=100&h=100&fit=crop' },
      { id: 3, name: 'Women Western', icon: 'Western', image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=100&h=100&fit=crop' },
      { id: 4, name: 'Men', icon: 'Men', image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=100&h=100&fit=crop' },
      { id: 5, name: 'Girls', icon: 'Girls', image: 'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=100&h=100&fit=crop' },
      { id: 6, name: 'Boys', icon: 'Boys', image: 'https://images.unsplash.com/photo-1503917988258-f87a78e3c995?w=100&h=100&fit=crop' },
      { id: 7, name: 'Bags', icon: 'Bags', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=100&h=100&fit=crop' },
      { id: 8, name: 'Footwear', icon: 'Shoes', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=100&h=100&fit=crop' },
      { id: 9, name: 'Jeans', icon: 'Jeans', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=100&h=100&fit=crop' },
      { id: 10, name: 'Kurta Sets', icon: 'Kurta', image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e1?w=100&h=100&fit=crop' },
      { id: 11, name: 'Sarees', icon: 'Saree', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=100&h=100&fit=crop' },
      { id: 12, name: 'Accessories', icon: 'Accessories', image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=100&h=100&fit=crop' },
      { id: 13, name: 'Jewellery', icon: 'Jewellery', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=100&h=100&fit=crop' },
      { id: 14, name: 'Beauty', icon: 'Beauty', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=100&h=100&fit=crop' },
      { id: 15, name: 'Home Decor', icon: 'Home', image: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=100&h=100&fit=crop' },
      { id: 16, name: 'Kids Wear', icon: 'Kids', image: 'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=100&h=100&fit=crop' },
      { id: 17, name: 'Winter Wear', icon: 'Winter', image: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=100&h=100&fit=crop' },
      { id: 18, name: 'Sports', icon: 'Sports', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop' },
      { id: 19, name: 'Watches', icon: 'Watches', image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=100&h=100&fit=crop' },
      { id: 20, name: 'Luxe', icon: 'Luxe', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=100&h=100&fit=crop' },
      { id: 21, name: 'Electronics', icon: 'Electronics', image: 'https://images.unsplash.com/photo-1491933382434-500287f6b523?w=100&h=100&fit=crop' },
      { id: 22, name: 'Gifts', icon: 'Gifts', image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=100&h=100&fit=crop' },
    ];
    this.saveCategories(cats);
  },

  seedProducts() {
    const prods = [
      { id: 1, name: 'Silk Evening Gown', brand: 'VERA MODA', category: 'Women Western', price: 24999, original: 34999, rating: 4.8, reviews: 234, badge: 'New Season', images: ['https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=500&h=600&fit=crop','https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&h=600&fit=crop'], description: 'Premium silk evening gown with elegant fall. Perfect for parties and weddings.', sizes: ['S','M','L','XL'], colors: ['Red','Black','Gold'], inStock: true },
      { id: 2, name: 'Designer Lehenga Set', brand: 'MANGO', category: 'Women Ethnic', price: 45999, original: 65000, rating: 4.9, reviews: 189, badge: 'Best Seller', images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&h=600&fit=crop','https://images.unsplash.com/photo-1583391733956-6c78276477e1?w=500&h=600&fit=crop'], description: 'Beautiful designer lehenga with heavy embroidery and gota patti work.', sizes: ['M','L','XL'], colors: ['Red','Pink','Orange'], inStock: true },
      { id: 3, name: 'Leather Shoulder Bag', brand: 'ZARA', category: 'Bags', price: 15999, original: 22500, rating: 4.7, reviews: 445, badge: 'Trending', images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&h=600&fit=crop','https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&h=600&fit=crop'], description: 'Genuine leather shoulder bag with gold-plated hardware.', sizes: ['One Size'], colors: ['Brown','Black','Tan'], inStock: true },
      { id: 4, name: 'Stiletto Heels Gold', brand: 'LOUIS VUITTON', category: 'Footwear', price: 18999, original: 28000, rating: 4.8, reviews: 312, badge: 'Premium', images: ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&h=600&fit=crop','https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&h=600&fit=crop'], description: 'Premium stiletto heels with crystal embellishments.', sizes: ['6','7','8','9'], colors: ['Gold','Silver','Black'], inStock: true },
      { id: 5, name: 'Diamond Pendant Set', brand: 'TIFFANY', category: 'Jewellery', price: 125000, original: 159000, rating: 4.9, reviews: 89, badge: 'Luxe', images: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&h=600&fit=crop','https://images.unsplash.com/photo-1515562141589-7e84135f0c7c?w=500&h=600&fit=crop'], description: '18K gold diamond pendant with matching earrings.', sizes: ['One Size'], colors: ['Gold','White'], inStock: true },
      { id: 6, name: 'Floral Midi Dress', brand: 'H&M', category: 'Women Western', price: 8999, original: 12999, rating: 4.6, reviews: 567, badge: 'Sale', images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&h=600&fit=crop','https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&h=600&fit=crop'], description: 'Floral printed midi dress with belt. Lightweight and comfortable.', sizes: ['XS','S','M','L'], colors: ['Blue','Pink','Yellow'], inStock: true },
      { id: 7, name: 'Gold Plated Bracelet', brand: 'PANDORA', category: 'Accessories', price: 12999, original: 17999, rating: 4.7, reviews: 298, badge: 'Popular', images: ['https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=500&h=600&fit=crop','https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&h=600&fit=crop'], description: 'Gold plated charm bracelet with adjustable chain.', sizes: ['One Size'], colors: ['Gold','Rose Gold'], inStock: true },
      { id: 8, name: 'Embroidered Kurta Set', brand: 'MANGO', category: 'Kurta Sets', price: 6999, original: 9999, rating: 4.5, reviews: 678, badge: 'Value', images: ['https://images.unsplash.com/photo-1583391733956-6c78276477e1?w=500&h=600&fit=crop','https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&h=600&fit=crop'], description: 'Hand embroidered kurta with churidar and dupatta set.', sizes: ['S','M','L','XL','XXL'], colors: ['White','Blue','Green'], inStock: true },
      { id: 9, name: 'Denim Jacket', brand: 'LEVI\'S', category: 'Men', price: 4999, original: 7999, rating: 4.6, reviews: 890, badge: 'Trending', images: ['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&h=600&fit=crop','https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=600&fit=crop'], description: 'Classic denim jacket with button closure and chest pockets.', sizes: ['S','M','L','XL','XXL'], colors: ['Blue','Black','Grey'], inStock: true },
      { id: 10, name: 'Designer Saree', brand: 'SIXTEEEN', category: 'Sarees', price: 15999, original: 25000, rating: 4.8, reviews: 456, badge: 'New', images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&h=600&fit=crop','https://images.unsplash.com/photo-1583391733956-6c78276477e1?w=500&h=600&fit=crop'], description: 'Banarasi silk saree with zari border and heavy pallu.', sizes: ['Free Size'], colors: ['Red','Green','Blue'], inStock: true },
    ];
    this.saveProducts(prods);
  },

  seedOrders() {
    const orders = [
      { id: 'ORD-MF001', customer: 'Priya Sharma', email: 'priya@email.com', items: [{ name: 'Silk Evening Gown', qty: 1, price: 24999 }], total: 24999, date: '28 Jun 2026', status: 'Delivered', address: '12 MG Road, Mumbai', phone: '9876543210', payment: 'COD' },
      { id: 'ORD-MF002', customer: 'Ananya Gupta', email: 'ananya@email.com', items: [{ name: 'Designer Lehenga Set', qty: 1, price: 45999 }], total: 45999, date: '29 Jun 2026', status: 'Shipped', address: '45 Lajpat Nagar, Delhi', phone: '9876543211', payment: 'COD' },
      { id: 'ORD-MF003', customer: 'Riya Patel', email: 'riya@email.com', items: [{ name: 'Leather Shoulder Bag', qty: 1, price: 15999 }], total: 15999, date: '30 Jun 2026', status: 'Processing', address: '78 Satellite Road, Ahmedabad', phone: '9876543212', payment: 'Online' },
    ];
    this.saveOrders(orders);
  },

  seedUsers() {
    const users = [
      { id: 'USR-001', name: 'Priya Sharma', email: 'priya@email.com', phone: '9876543210', password: 'user123', address: '12 MG Road', city: 'Mumbai', pincode: '400001', avatar: '', createdAt: '2026-01-15' },
      { id: 'USR-002', name: 'Ananya Gupta', email: 'ananya@email.com', phone: '9876543211', password: 'user123', address: '45 Lajpat Nagar', city: 'Delhi', pincode: '110001', avatar: '', createdAt: '2026-02-20' },
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
