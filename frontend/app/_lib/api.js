import axios from 'axios';

const API_BASE_URL = 'http://localhost:5087/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('authChange'));
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async register(email, password, fullName, isSeller) {
    const response = await api.post('/auth/register', {
      email,
      password,
      fullName,
      isSeller,
    });
    return response.data;
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isLoggedIn() {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('token');
  },
};

export const chatbotService = {
  async ask(prompt) {
    const response = await api.post('/chatbot/ask', { prompt });
    return response.data;
  },
};

export const categoryService = {
  async getAll() {
    try {
      const response = await api.get('/categories');
      return response.data;
    } catch (error) {
      console.warn('Backend API disconnected:', error.message);
      return [];
    }
  },

  async getTree() {
    try {
      const response = await api.get('/categories/tree');
      return response.data;
    } catch (error) {
      console.warn('Backend API disconnected:', error.message);
      return [];
    }
  },

  async getById(id) {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  async create(categoryData) {
    const response = await api.post('/categories', categoryData);
    return response.data;
  },

  async update(id, categoryData) {
    const response = await api.put(`/categories/${id}`, categoryData);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};

export const productService = {
  async getProducts(params = {}) {
    try {
      const response = await api.get('/products', { params });
      return response.data;
    } catch (error) {
      console.warn('Backend API disconnected:', error.message);
      return { products: [], page: 1, pageSize: 12, totalItems: 0, totalPages: 1 };
    }
  },

  async getProductById(id) {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  async createProduct(productData) {
    const response = await api.post('/products', productData);
    return response.data;
  },

  async deleteProduct(id) {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
};


export const cartService = {
  async getMyCart() {
    try {
      const response = await api.get('/carts');
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) throw error;
      console.warn('Backend API disconnected:', error.message);
      return [];
    }
  },

  async addItem(productSkuId, quantity = 1) {
    const response = await api.post('/carts', { productSkuId, quantity });
    return response.data;
  },

  async updateQuantity(itemId, quantity) {
    const response = await api.put('/carts/' + itemId, { quantity });
    return response.data;
  },

  async removeItem(itemId) {
    const response = await api.delete('/carts/' + itemId);
    return response.data;
  },
};

export const orderService = {
  async checkout(addressId, paymentMethod = 'COD', voucherCode = null) {
    const response = await api.post('/orders/checkout', { addressId, paymentMethod, voucherCode });
    return response.data;
  },

  async getMyOrders() {
    try {
      const response = await api.get('/orders');
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) throw error;
      console.warn('Backend API disconnected:', error.message);
      return [];
    }
  },

  async getOrder(id) {
    const response = await api.get('/orders/' + id);
    return response.data;
  },

  async cancelSubOrder(subOrderId) {
    const response = await api.post('/orders/' + subOrderId + '/cancel');
    return response.data;
  },

  async updateSubOrderStatus(subOrderId, newStatus, note = null) {
    const response = await api.post(`/orders/${subOrderId}/status`, { newStatus, note });
    return response.data;
  },
};

export const paymentService = {
  async createVnPayUrl(orderId) {
    const response = await api.post('/payments/create-vnpay-url', { orderId });
    return response.data;
  },

  async processVnPayReturn(queryString) {
    const response = await api.get('/payments/vnpay-return' + queryString);
    return response.data;
  },

  async getPaymentByOrder(orderId) {
    const response = await api.get('/payments/order/' + orderId);
    return response.data;
  },
};

export const sellerService = {
  async register(shopName, description, logoUrl) {
    const response = await api.post('/sellers/register', { shopName, description, logoUrl });
    return response.data;
  },

  async getMyShop() {
    const response = await api.get('/sellers/my-shop');
    return response.data;
  },

  async updateMyShop(shopData) {
    const response = await api.put('/sellers/my-shop', shopData);
    return response.data;
  },

  async getDashboardStats() {
    const response = await api.get('/sellers/dashboard-stats');
    return response.data;
  },

  async getSellerOrders() {
    const response = await api.get('/sellers/orders');
    return response.data;
  },

  async getWallet() {
    const response = await api.get('/sellers/wallet');
    return response.data;
  },

  async createWithdrawal(withdrawalData) {
    const response = await api.post('/sellers/withdraw', withdrawalData);
    return response.data;
  },

  // Admin
  async getAllSellers(status) {
    const response = await api.get('/sellers', { params: { status } });
    return response.data;
  },

  async approveSeller(id) {
    const response = await api.post(`/sellers/${id}/approve`);
    return response.data;
  },

  async rejectSeller(id, reason) {
    const response = await api.post(`/sellers/${id}/reject`, { reason });
    return response.data;
  },

  async getAllWithdrawals() {
    const response = await api.get('/sellers/withdrawals');
    return response.data;
  },

  async processWithdrawal(id, isApproved, note) {
    const response = await api.post(`/sellers/withdrawals/${id}/process`, { isApproved, note });
    return response.data;
  },
};

export const adminUserService = {
  async getUsers(search = '') {
    try {
      const response = await api.get('/admin/users', { params: { search } });
      return response.data;
    } catch (error) {
      console.warn('Backend API disconnected:', error.message);
      return [];
    }
  },

  async toggleLock(id) {
    const response = await api.post(`/admin/users/${id}/toggle-lock`);
    return response.data;
  },

  async assignRole(id, roleName) {
    const response = await api.post(`/admin/users/${id}/assign-role`, { roleName });
    return response.data;
  },
};

export const adminDashboardService = {
  async getStats() {
    try {
      const response = await api.get('/admin/dashboard/stats');
      return response.data;
    } catch (error) {
      console.warn('Backend API disconnected:', error.message);
      return null;
    }
  },
};

export const adminOrderService = {
  async getAllOrders(search = '') {
    const response = await api.get('/admin/orders', {
      params: { search }
    });
    return response.data;
  },

  async cancelOrder(subOrderId, note) {
    const response = await api.post(`/orders/${subOrderId}/status`, {
      newStatus: 'Cancelled',
      note
    });
    return response.data;
  },
};

export const voucherService = {
  async getActiveVouchers() {
    const response = await api.get('/vouchers');
    return response.data;
  },

  async applyVoucher(code, orderAmount) {
    const response = await api.post('/vouchers/apply', { code, orderAmount });
    return response.data;
  },

  async createVoucher(voucherData) {
    const response = await api.post('/vouchers', voucherData);
    return response.data;
  },

  async deleteVoucher(id) {
    const response = await api.delete(`/vouchers/${id}`);
    return response.data;
  },
};

export const productReviewService = {
  async getProductReviews(productId) {
    const response = await api.get(`/ProductReviews/product/${productId}`);
    return response.data;
  },

  async createReview(productId, subOrderId, rating, comment) {
    const response = await api.post('/ProductReviews', { productId, subOrderId, rating, comment });
    return response.data;
  },
};

export const addressService = {
  async getMyAddresses() {
    const response = await api.get('/addresses');
    return response.data;
  },

  async getAddressById(id) {
    const response = await api.get(`/addresses/${id}`);
    return response.data;
  },

  async createAddress(addressData) {
    const response = await api.post('/addresses', addressData);
    return response.data;
  },

  async updateAddress(id, addressData) {
    const response = await api.put(`/addresses/${id}`, addressData);
    return response.data;
  },

  async deleteAddress(id) {
    const response = await api.delete(`/addresses/${id}`);
    return response.data;
  },
};

export default api;

