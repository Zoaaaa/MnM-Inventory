const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Base API client for making HTTP requests
 */
class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  getToken() {
    return localStorage.getItem('mnm_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    // Remove Content-Type for FormData (file uploads)
    if (options.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(data.message || 'Something went wrong', response.status, data);
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Network error. Please check your connection.', 0);
    }
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, body) {
    if (body instanceof FormData) {
      return this.request(endpoint, { method: 'POST', body });
    }
    return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) });
  }

  put(endpoint, body) {
    if (body instanceof FormData) {
      return this.request(endpoint, { method: 'PUT', body });
    }
    return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) });
  }

  patch(endpoint, body) {
    return this.request(endpoint, { method: 'PATCH', body: JSON.stringify(body) });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

const api = new ApiClient(API_URL);

// Auth API
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/password', data),
};

// Categories API
export const categoriesApi = {
  getAll: (includeInactive = false) =>
    api.get(`/categories${includeInactive ? '?include_inactive=true' : ''}`),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Products API
export const productsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/products${query ? `?${query}` : ''}`);
  },
  getBySlug: (slug) => api.get(`/products/${slug}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  updateStock: (id, stock) => api.patch(`/products/${id}/stock`, { stock }),
  delete: (id) => api.delete(`/products/${id}`),
  getLowStock: () => api.get('/products/admin/low-stock'),
  getStats: () => api.get('/products/admin/stats'),
  import: (formData) => api.post('/products/import', formData),
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/products/upload-image', formData);
  },
};

// Featured Items API
export const featuredApi = {
  getAll: () => api.get('/featured'),
  adminGetAll: () => api.get('/featured/admin'),
  create: (data) => api.post('/featured', data),
  update: (id, data) => api.put(`/featured/${id}`, data),
  reorder: (order) => api.put('/featured/reorder', { order }),
  delete: (id) => api.delete(`/featured/${id}`),
};

// Config API
export const configApi = {
  getMessenger: () => api.get('/config/messenger'),
};

export { ApiError };
export default api;
