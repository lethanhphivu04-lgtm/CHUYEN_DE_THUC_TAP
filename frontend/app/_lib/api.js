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

export default api;
