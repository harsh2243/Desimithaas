import axios from 'axios'

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  changePassword: (passwords) => api.put('/auth/change-password', passwords),
}

// Products API
export const productsAPI = {
  getProducts: (params) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  getFeaturedProducts: () => api.get('/products/featured/list'),
  searchProducts: (query) => api.get(`/products/search?q=${query}`),
}

// Cart API
export const cartAPI = {
  getCart: () => api.get('/users/cart'),
  addToCart: (productId, quantity) => api.post('/users/cart/add', { productId, quantity }),
  updateCartItem: (productId, quantity) => api.put('/users/cart/update', { productId, quantity }),
  removeFromCart: (productId) => api.delete(`/users/cart/remove/${productId}`),
  clearCart: () => api.delete('/users/cart/clear'),
}

// User API (for authenticated user operations)
export const userAPI = {
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  getOrders: (params) => api.get('/orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id) => api.put(`/orders/${id}/cancel`),
}

// Orders API
export const ordersAPI = {
  createOrder: (orderData) => api.post('/orders', orderData),
  getOrders: (params) => api.get('/orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id) => api.put(`/orders/${id}/cancel`),
}

// Payments API
export const paymentsAPI = {
  createRazorpayOrder: (amount, currency, receipt, notes) => 
    api.post('/payments/create-razorpay-order', { amount, currency, receipt, notes }),
  verifyRazorpayPayment: (paymentData) => 
    api.post('/payments/verify-razorpay-payment', paymentData),
}

// Admin API
export const adminAPI = {
  // Dashboard
  getDashboard: () => api.get('/admin/dashboard'),
  getDashboardStats: () => api.get('/admin/dashboard'),
  getQuickActions: () => api.get('/admin/quick-actions'),
  
  // Analytics
  getAnalyticsData: (params) => api.get('/admin/analytics', { params }),
  
  // Products
  getAllProducts: (params) => api.get('/admin/products', { params }),
  createProduct: (productData) => api.post('/admin/products', productData),
  updateProduct: (id, productData) => api.put(`/admin/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  
  // Orders
  getAllOrders: (params) => api.get('/admin/orders', { params }),
  updateOrderStatus: (id, status) => api.put(`/admin/orders/${id}/status`, { orderStatus: status }),
  
  // Users
  getAllUsers: (params) => api.get('/admin/users', { params }),
  createUser: (userData) => api.post('/admin/users', userData),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  toggleUserStatus: (id) => api.put(`/admin/users/${id}/toggle-status`),
  
  // Settings
  getProfile: () => api.get('/admin/profile'),
  updateProfile: (profileData) => api.put('/admin/profile', profileData),
  updatePassword: (passwordData) => api.put('/admin/password', passwordData),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (settingsData) => api.put('/admin/settings', settingsData),
  updateStoreSettings: (storeData) => api.put('/admin/settings/store', storeData),
  updateNotificationSettings: (notificationData) => api.put('/admin/settings/notifications', notificationData),
}

// Coupons API
export const couponsAPI = {
  validateCoupon: (code) => api.post('/coupons/validate', { code }),
  applyCoupon: (code) => api.post('/coupons/apply', { code }),
}

export default api
