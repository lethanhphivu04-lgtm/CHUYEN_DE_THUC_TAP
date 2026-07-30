import axios from 'axios';

const API_BASE_URL = 'http://localhost:5087/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
if (typeof window !== 'undefined') {
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
}

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

export const categoryService = {
  async getAll() {
    const response = await api.get('/categories');
    return response.data;
  },

  async getTree() {
    const response = await api.get('/categories/tree');
    return response.data;
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
    const response = await api.get('/products', { params });
    return response.data;
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
    const response = await api.get('/carts');
    return response.data;
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
  async checkout(addressId, paymentMethod = 'COD') {
    const response = await api.post('/orders/checkout', { addressId, paymentMethod });
    return response.data;
  },

  async getMyOrders() {
    const response = await api.get('/orders');
    return response.data;
  },

  async getOrder(id) {
    const response = await api.get('/orders/' + id);
    return response.data;
  },

  async cancelSubOrder(subOrderId) {
    const response = await api.post('/orders/' + subOrderId + '/cancel');
    return response.data;
  },
};
export default api;

