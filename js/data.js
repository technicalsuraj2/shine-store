const firebaseConfig = {
  apiKey: "AIzaSyDuU-yf7Pywzv5QtmkIPuJOSfJedmZalgo",
  authDomain: "mithila-fashionss.firebaseapp.com",
  databaseURL: "https://mithila-fashionss-default-rtdb.firebaseio.com",
  projectId: "mithila-fashionss",
  storageBucket: "mithila-fashionss.firebasestorage.app",
  messagingSenderId: "528021252981",
  appId: "1:528021252981:web:9a14b98e2423e9b3cd813c"
};

let fb = null;
try {
  firebase.initializeApp(firebaseConfig);
  fb = firebase.database();
} catch(e) {
  console.warn('Firebase init failed:', e.message);
}

function fbRef(path) { return fb ? fb.ref(path) : null; }

function objToArray(obj) {
  return obj ? Object.keys(obj).map(k => ({ ...obj[k], _key: k })) : [];
}

function arrayToObj(arr) {
  const obj = {};
  if (!arr) return obj;
  arr.forEach(item => {
    const key = item._key || item.id;
    if (key) { obj[key] = { ...item }; delete obj[key]._key; }
  });
  return obj;
}

const DataStore = {
  _cache: { products: [], orders: [], users: [], categories: [], coupons: [], banners: [], reviews: [] },
  _callbacks: {},

  init() {
    const sessionKeys = ['mf_cart', 'mf_wishlist', 'mf_current_user', 'mf_admin_pass', 'mf_admin_logged', 'mf_coupon_text', 'mf_slide_time', 'mf_slide_autoplay'];
    sessionKeys.forEach(k => { if (!localStorage.getItem(k)) { if (k === 'mf_cart') localStorage.setItem(k, '[]'); else if (k === 'mf_wishlist') localStorage.setItem(k, '[]'); } });

    if (!fb) {
      this._loadLocal();
      return;
    }

    this._listen('products', (data) => {
      this._cache.products = data;
      this._saveLocal('mf_products', data);
      if (data.length === 0) this.seedProducts();
      this._notify('products');
    });
    this._listen('orders', (data) => {
      this._cache.orders = data;
      this._saveLocal('mf_orders', data);
      this._notify('orders');
    });
    this._listen('users', (data) => {
      this._cache.users = data;
      this._saveLocal('mf_users', data);
      if (data.length === 0) this.seedUsers();
      this._notify('users');
    });
    this._listen('categories', (data) => {
      this._cache.categories = data;
      this._saveLocal('mf_categories', data);
      if (data.length === 0) this.seedCategories();
      this._notify('categories');
    });
    this._listen('coupons', (data) => {
      this._cache.coupons = data;
      this._saveLocal('mf_coupons', data);
      if (data.length === 0) this.seedCoupons();
      this._notify('coupons');
    });
    this._listen('banners', (data) => {
      this._cache.banners = data;
      this._saveLocal('mf_banners', data);
      if (data.length === 0) this.seedBanners();
      this._notify('banners');
    });
    this._listen('reviews', (data) => {
      this._cache.reviews = data;
      this._saveLocal('mf_reviews', data);
      this._notify('reviews');
    });
  },

  _listen(key, callback) {
    const path = fbRef(key);
    if (!path) return;
    path.on('value', snapshot => {
      callback(objToArray(snapshot.val()));
    });
    this._listeners[key] = path;
  },

  _offAll() {
    Object.keys(this._listeners).forEach(k => {
      if (this._listeners[k]) this._listeners[k].off();
    });
    this._listeners = {};
  },

  _saveLocal(key, arr) {
    try { localStorage.setItem(key, JSON.stringify(arr)); } catch(e) {}
  },

  _loadLocal() {
    ['products','orders','users','categories','coupons','banners','reviews'].forEach(key => {
      try {
        const data = JSON.parse(localStorage.getItem('mf_' + key)) || [];
        this._cache[key] = data;
        if (data.length === 0 && this['seed' + key.charAt(0).toUpperCase() + key.slice(1)]) {
          this['seed' + key.charAt(0).toUpperCase() + key.slice(1)]();
        }
      } catch(e) { this._cache[key] = []; }
    });
  },

  _fbSet(key, arr) {
    const path = fbRef(key);
    if (path) { path.set(arrayToObj(arr)); }
    this._cache[key] = arr;
    this._saveLocal('mf_' + key, arr);
  },

  on(key, cb) {
    if (!this._callbacks[key]) this._callbacks[key] = [];
    this._callbacks[key].push(cb);
  },

  off(key, cb) {
    if (!this._callbacks[key]) return;
    this._callbacks[key] = this._callbacks[key].filter(f => f !== cb);
  },

  _notify(key) {
    if (this._callbacks[key]) this._callbacks[key].forEach(fn => fn(this._cache[key]));
  },

  getProducts() { return this._cache.products; },
  saveProducts(arr) { this._fbSet('products', arr); },
  getProduct(id) { return this._cache.products.find(p => p.id == id); },

  addProduct(p) {
    p.id = Date.now();
    const arr = [...this._cache.products, p];
    this._fbSet('products', arr);
    return p;
  },

  updateProduct(id, data) {
    const arr = this._cache.products.map(p => p.id == id ? { ...p, ...data } : p);
    this._fbSet('products', arr);
    return arr.find(p => p.id == id);
  },

  deleteProduct(id) {
    this._fbSet('products', this._cache.products.filter(p => p.id != id));
  },

  getCategories() { return this._cache.categories; },
  saveCategories(arr) { this._fbSet('categories', arr); },

  getOrders() { return this._cache.orders; },
  saveOrders(arr) { this._fbSet('orders', arr); },
  getOrder(id) { return this._cache.orders.find(o => o.id === id); },

  addOrder(order) {
    order.id = 'ORD-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
    order.date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    order.status = 'Pending';
    const arr = [order, ...this._cache.orders];
    this._fbSet('orders', arr);
    return order;
  },

  updateOrderStatus(id, status) {
    const arr = this._cache.orders.map(o => o.id === id ? { ...o, status } : o);
    this._fbSet('orders', arr);
    return arr.find(o => o.id === id);
  },

  getUsers() { return this._cache.users; },
  saveUsers(arr) { this._fbSet('users', arr); },

  registerUser(u) {
    if (this._cache.users.find(x => x.email === u.email)) return { error: 'Email already registered' };
    if (this._cache.users.find(x => x.phone === u.phone)) return { error: 'Phone already registered' };
    u.id = 'USR-' + Date.now().toString(36).toUpperCase();
    u.createdAt = new Date().toISOString();
    u.address = u.address || '';
    u.city = u.city || '';
    u.pincode = u.pincode || '';
    u.avatar = u.avatar || '';
    const arr = [...this._cache.users, u];
    this._fbSet('users', arr);
    return { success: true, user: { id: u.id, name: u.name, email: u.email, phone: u.phone, address: u.address, city: u.city, pincode: u.pincode, avatar: u.avatar } };
  },

  loginUser(email, password) {
    const u = this._cache.users.find(x => x.email === email && x.password === password);
    if (!u) return { error: 'Invalid email or password' };
    return { success: true, user: { id: u.id, name: u.name, email: u.email, phone: u.phone, address: u.address, city: u.city, pincode: u.pincode, avatar: u.avatar } };
  },

  updateUser(id, data) {
    const arr = this._cache.users.map(u => u.id === id ? { ...u, ...data } : u);
    this._fbSet('users', arr);
    return arr.find(u => u.id === id);
  },

  getCoupons() { return this._cache.coupons; },
  saveCoupons(arr) { this._fbSet('coupons', arr); },

  getCart() { try { return JSON.parse(localStorage.getItem('mf_cart')) || []; } catch(e) { return []; } },
  saveCart(c) { localStorage.setItem('mf_cart', JSON.stringify(c)); },
  getWishlist() { try { return JSON.parse(localStorage.getItem('mf_wishlist')) || []; } catch(e) { return []; } },
  saveWishlist(w) { localStorage.setItem('mf_wishlist', JSON.stringify(w)); },

  getBanners() { return this._cache.banners; },
  saveBanners(arr) { this._fbSet('banners', arr); },

  getReviews(productId) {
    return this._cache.reviews.filter(r => r.productId == productId);
  },

  getAllReviews() {
    return this._cache.reviews;
  },

  addReview(r) {
    r.id = Date.now();
    r.date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const arr = [...this._cache.reviews, r];
    this._fbSet('reviews', arr);
    return r;
  },

  deleteReview(id) {
    this._fbSet('reviews', this._cache.reviews.filter(r => r.id !== id));
  },

  applyCoupon(code, cartTotal) {
    const c = this._cache.coupons.find(x => x.code === code.toUpperCase() && x.active);
    if (!c) return { error: 'Invalid coupon code' };
    if (c.uses >= c.maxUses) return { error: 'Coupon usage limit reached' };
    if (cartTotal < c.minOrder) return { error: `Minimum order ₹${c.minOrder} required` };
    let discount = c.type === 'percent' ? (cartTotal * c.discount / 100) : c.discount;
    if (c.maxDiscount && discount > c.maxDiscount) discount = c.maxDiscount;
    if (discount > cartTotal) discount = cartTotal;
    c.uses += 1;
    this.saveCoupons(this._cache.coupons);
    return { success: true, discount, code: c.code };
  },

  exportData() {
    return {
      products: this.getProducts(), orders: this.getOrders(), users: this.getUsers(),
      categories: this.getCategories(), coupons: this.getCoupons(),
      reviews: this._cache.reviews, wishlist: this.getWishlist(), banners: this.getBanners(),
      exportedAt: new Date().toISOString()
    };
  },

  importData(data) {
    if (!data || !data.products) return { error: 'Invalid backup file' };
    try {
      this.saveProducts(data.products || []);
      this.saveOrders(data.orders || []);
      this.saveUsers(data.users || []);
      this.saveCategories(data.categories || []);
      this.saveCoupons(data.coupons || []);
      this._fbSet('reviews', data.reviews || []);
      localStorage.setItem('mf_wishlist', JSON.stringify(data.wishlist || []));
      return { success: true };
    } catch(e) { return { error: e.message }; }
  },

  clearAllData() {
    ['products','orders','users','categories','coupons','reviews','banners'].forEach(key => {
      const path = fbRef(key);
      if (path) path.remove();
    });
    ['mf_products','mf_orders','mf_users','mf_categories','mf_coupons','mf_reviews','mf_wishlist','mf_cart','mf_banners','mf_data_version','mf_admin_pass','mf_current_user','mf_slide_time','mf_slide_autoplay','mf_coupon_text'].forEach(k => localStorage.removeItem(k));
    this._cache = { products: [], orders: [], users: [], categories: [], coupons: [], banners: [], reviews: [] };
    this._offAll();
    this.init();
  },

  getStats() {
    const orders = this._cache.orders;
    const users = this._cache.users;
    const products = this._cache.products;
    const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    return { totalOrders: orders.length, totalRevenue, totalUsers: users.length, totalProducts: products.length, pendingOrders };
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
      { id: 4, name: 'Stiletto Heels Gold', brand: 'LOUIS VUITTON', category: 'Footwear', price: 18999, original: 28000, rating: 4.8, reviews: 312, badge: 'Premium', images: ['https://picsum.photos/seed/heels/400/500','https://picsum.photos/seed/heels-2/400/500'], description: 'Premium stiletto heels with crystal embellishments.', sizes: ['6','7','8','9'], colors: ['Gold','Silver','Black'], inStock: true },
      { id: 5, name: 'Diamond Pendant Set', brand: 'TIFFANY', category: 'Jewellery', price: 125000, original: 159000, rating: 4.9, reviews: 89, badge: 'Luxe', images: ['https://picsum.photos/seed/pendant/400/500','https://picsum.photos/seed/pendant-2/400/500'], description: '18K gold diamond pendant with matching earrings.', sizes: ['One Size'], colors: ['Gold','White'], inStock: true },
      { id: 6, name: 'Floral Midi Dress', brand: 'H&M', category: 'Women Western', price: 8999, original: 12999, rating: 4.6, reviews: 567, badge: 'Sale', images: ['https://picsum.photos/seed/midi-dress/400/500','https://picsum.photos/seed/midi-dress-2/400/500'], description: 'Floral printed midi dress with belt. Lightweight and comfortable.', sizes: ['XS','S','M','L'], colors: ['Blue','Pink','Yellow'], inStock: true },
      { id: 7, name: 'Gold Plated Bracelet', brand: 'PANDORA', category: 'Accessories', price: 12999, original: 17999, rating: 4.7, reviews: 298, badge: 'Popular', images: ['https://picsum.photos/seed/bracelet/400/500','https://picsum.photos/seed/bracelet-2/400/500'], description: 'Gold plated charm bracelet with adjustable chain.', sizes: ['One Size'], colors: ['Gold','Rose Gold'], inStock: true },
      { id: 8, name: 'Embroidered Kurta Set', brand: 'MANGO', category: 'Kurta Sets', price: 6999, original: 9999, rating: 4.5, reviews: 678, badge: 'Value', images: ['https://picsum.photos/seed/kurta/400/500','https://picsum.photos/seed/kurta-2/400/500'], description: 'Hand embroidered kurta with churidar and dupatta set.', sizes: ['S','M','L','XL','XXL'], colors: ['White','Blue','Green'], inStock: true },
      { id: 9, name: 'Denim Jacket', brand: 'LEVI\'S', category: 'Men', price: 4999, original: 7999, rating: 4.6, reviews: 890, badge: 'Trending', images: ['https://picsum.photos/seed/denim-jacket/400/500','https://picsum.photos/seed/jacket-2/400/500'], description: 'Classic denim jacket with button closure and chest pockets.', sizes: ['S','M','L','XL','XXL'], colors: ['Blue','Black','Grey'], inStock: true },
      { id: 10, name: 'Designer Saree', brand: 'SIXTEEEN', category: 'Sarees', price: 15999, original: 25000, rating: 4.8, reviews: 456, badge: 'New', images: ['https://picsum.photos/seed/saree/400/500','https://picsum.photos/seed/saree-2/400/500'], description: 'Banarasi silk saree with zari border and heavy pallu.', sizes: ['Free Size'], colors: ['Red','Green','Blue'], inStock: true },
    ];
    this.saveProducts(prods);
  },

  seedOrders() { this.saveOrders([]); },

  seedUsers() {
    this.saveUsers([
      { id: 'USR-001', name: 'Admin User', email: 'admin@mithila.store', phone: '9999999999', password: 'admin123', address: '', city: '', pincode: '', avatar: '', createdAt: '2026-01-01' },
    ]);
  },

  seedCoupons() {
    this.saveCoupons([
      { id: 1, code: 'WELCOME50', discount: 50, type: 'flat', minOrder: 999, uses: 0, maxUses: 100, active: true, maxDiscount: 0 },
      { id: 2, code: 'FASHION20', discount: 20, type: 'percent', minOrder: 2999, uses: 0, maxUses: 200, active: true, maxDiscount: 2000 },
      { id: 3, code: 'FESTIVE100', discount: 100, type: 'flat', minOrder: 5000, uses: 0, maxUses: 50, active: true, maxDiscount: 0 },
      { id: 4, code: 'NEWUSER', discount: 30, type: 'percent', minOrder: 0, uses: 0, maxUses: 500, active: true, maxDiscount: 1500 },
    ]);
  }
};

DataStore.init();
