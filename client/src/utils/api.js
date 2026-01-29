import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Products
export const getProducts = (params) => api.get('/products', { params });
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Items (from MongoDB items collection)
export const getItems = (params) => api.get('/items', { params });
export const getItem = (id) => api.get(`/items/${id}`);
export const createItem = (data) => api.post('/items', data);
export const updateItem = (id, data) => api.put(`/items/${id}`, data);
export const deleteItem = (id) => api.delete(`/items/${id}`);
export const getItemStats = () => api.get('/items/stats/summary');

// Categories
export const getCategories = () => api.get('/categories');

// Orders
export const createOrder = (data) => api.post('/orders', data);
export const getOrders = () => api.get('/orders');

// Auth
export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (data) => api.post('/auth/register', data);

// Platform Management
export const getPlatformConfigs = () => api.get('/platforms/configs');
export const getPlatformStats = () => api.get('/platforms/stats');
export const updatePlatformConfig = (platform, data) => 
  api.put(`/platforms/configs/${platform}`, data);
export const connectPlatform = (platform, credentials) => 
  api.post(`/platforms/configs/${platform}/connect`, { credentials });
export const disconnectPlatform = (platform) => 
  api.post(`/platforms/configs/${platform}/disconnect`);

// Listings
export const createListing = (data) => api.post('/platforms/listings/create', data);
export const createMultiPlatformListing = (data) => 
  api.post('/platforms/listings/create-multi', data);
export const updateListing = (listingId, data) => 
  api.put(`/platforms/listings/${listingId}`, data);
export const getProductListings = (productId) => 
  api.get(`/platforms/listings/product/${productId}`);
export const getActiveListings = (params) => 
  api.get('/platforms/listings/active', { params });
export const markListingAsSold = (listingId, saleData) => 
  api.post(`/platforms/listings/${listingId}/sold`, saleData);

// Sync
export const syncProduct = (productId, changes) => 
  api.post(`/platforms/sync/product/${productId}`, changes);
export const getSyncLogs = (params) => 
  api.get('/platforms/sync/logs', { params });

// Notifications
export const getNotifications = (params) => 
  api.get('/platforms/notifications', { params });
export const markNotificationAsRead = (notificationId) => 
  api.put(`/platforms/notifications/${notificationId}/read`);
export const approveThirdPartyAction = (notificationId) => 
  api.post(`/platforms/notifications/${notificationId}/approve`);
export const getPendingApprovals = () => 
  api.get('/platforms/notifications/pending-approvals');

export default api;